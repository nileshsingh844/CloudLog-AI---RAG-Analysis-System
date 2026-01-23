
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { LogChunk, ChatMessage, SearchIndex, ProcessingStats, CodeFile, SourceLocation, CodeFlowStep, DebugSolution, KnowledgeFile, AdvancedAnalysis, Severity, StructuredAnalysis, LogSignature, TemporalChain, CacheEntry, PatternLibraryEntry } from "../types";
import { getFastHash } from "../utils/logParser";

export class GeminiService {
  private readonly MAX_WINDOW = 128000;
  private readonly SYSTEM_PROMPT_RESERVE = 2000;
  private readonly OUTPUT_BUFFER_RESERVE = 4000;
  private readonly SAFETY_MARGIN = 2000;
  private readonly USABLE_TOKENS = this.MAX_WINDOW - this.SYSTEM_PROMPT_RESERVE - this.OUTPUT_BUFFER_RESERVE - this.SAFETY_MARGIN;

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parseResilientJson(text: string | undefined): any {
    if (!text) return null;
    const trimmed = text.trim();
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      const cleaned = trimmed.replace(/^```json\s*|```\s*$/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch (innerE) {
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        let start = -1;
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) start = firstBrace;
        else if (firstBracket !== -1) start = firstBracket;
        if (start !== -1) {
          const lastBrace = cleaned.lastIndexOf('}');
          const lastBracket = cleaned.lastIndexOf(']');
          const end = Math.max(lastBrace, lastBracket);
          if (end > start) {
            try { return JSON.parse(cleaned.substring(start, end + 1)); }
            catch (finalE) { throw finalE; }
          }
        }
        throw innerE;
      }
    }
  }

  private compressChunkContent(content: string): string {
    const lines = content.split('\n');
    if (lines.length <= 10) return content;
    const optimizedLines = lines.map(line => {
      return line.replace(/^\[\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\]\s+/, '')
                 .replace(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3}\s+/, '')
                 .substring(0, 1000);
    });
    const uniqueLines: string[] = [];
    let lastLine = '';
    let repeatCount = 0;
    for (const line of optimizedLines) {
      const normalized = line.trim().toLowerCase().replace(/\d/g, '#');
      if (normalized === lastLine) {
        repeatCount++;
      } else {
        if (repeatCount > 0) uniqueLines.push(`[... repeated ${repeatCount} times ...]`);
        uniqueLines.push(line);
        lastLine = normalized;
        repeatCount = 0;
      }
    }
    return uniqueLines.join('\n');
  }

  async extractUniqueSignatures(
    chunks: LogChunk[], 
    patternLibrary: Record<string, PatternLibraryEntry> = {}
  ): Promise<{ signatures: LogSignature[], temporalChains: TemporalChain[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Efficiency v7.2: Separate novel chunks from those already in library
    const novelChunks = chunks.filter(c => !patternLibrary[c.signature]);
    
    // If we have many known patterns, we only deep analyze a sample of novel ones
    const discoveryContext = (novelChunks.length > 0 ? novelChunks : chunks)
      .sort((a, b) => (b.entries.filter(e => e.severity === Severity.ERROR || e.severity === Severity.FATAL).length) - (a.entries.filter(e => e.severity === Severity.ERROR || e.severity === Severity.FATAL).length))
      .slice(0, 15)
      .map(c => `CHUNK_ID: ${c.id}\nSOURCE: ${Array.from(new Set(c.entries.map(e => e.sourceFile))).join(', ')}\nCONTENT:\n${c.content.substring(0, 1500)}`)
      .join('\n\n---\n\n');

    const prompt = `
      ROLE: CloudLog AI Forensic Engine.
      TASK: 
      1. Extract 5-8 unique error signatures.
      2. Identify 1-2 Temporal Causality Chains.
      OUTPUT: JSON object with 'signatures' and 'temporalChains'.
    `;

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `LOG SAMPLES:\n${discoveryContext}\n\n${prompt}`,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 1000 } 
        }
      });
      const data = this.parseResilientJson(result.text);
      if (data.temporalChains) {
        data.temporalChains.forEach((chain: any) => {
          chain.events.forEach((ev: any) => { ev.timestamp = new Date(ev.timestamp); });
        });
      }
      return { signatures: data.signatures || [], temporalChains: data.temporalChains || [] };
    } catch (e) {
      return { signatures: [], temporalChains: [] };
    }
  }

  private prepareOptimizedContext(rankedChunks: LogChunk[], history: ChatMessage[], sourceFiles: CodeFile[], knowledgeFiles: KnowledgeFile[], contextDepth: number): string {
    const dynamicBudget = (this.USABLE_TOKENS * (contextDepth / 100));
    let currentTokens = 0;
    const finalContext: string[] = [];

    if (knowledgeFiles.length > 0) {
      finalContext.push("### [SYSTEM CONTEXT] RUNBOOKS");
      for (const kf of knowledgeFiles) {
        const est = (kf.content.length / 4);
        if (currentTokens + est < dynamicBudget * 0.20) {
          finalContext.push(`DOC: ${kf.name}\nCONTENT:\n${kf.content}\n---`);
          currentTokens += est;
        }
      }
    }

    finalContext.push("\n### [FORENSIC CONTEXT] SEMANTIC SEGMENTS");
    for (const chunk of rankedChunks) {
      const compressed = this.compressChunkContent(chunk.content);
      const est = (compressed.length / 4);
      if (currentTokens + est < dynamicBudget * 0.80) {
        finalContext.push(`SEG_ID: ${chunk.id} | SOURCE: ${Array.from(new Set(chunk.entries.map(e => e.sourceFile))).join(', ')}\nLOGS:\n${compressed}\n---`);
        currentTokens += est;
      }
    }

    const relevantLocations = new Map<string, Set<number>>();
    rankedChunks.forEach(chunk => chunk.entries.forEach(entry => entry.metadata.sourceLocations?.forEach(loc => {
      if (!relevantLocations.has(loc.filePath)) relevantLocations.set(loc.filePath, new Set());
      relevantLocations.get(loc.filePath)!.add(loc.line);
    })));

    if (relevantLocations.size > 0 && sourceFiles.length > 0) {
      finalContext.push("\n### [LOGIC CONTEXT] SOURCE CODE");
      for (const [filePath, lines] of relevantLocations.entries()) {
        const file = sourceFiles.find(f => f.path.toLowerCase().endsWith(filePath.toLowerCase()));
        if (file) {
          const fileLines = file.content.split('\n');
          const sortedLines = Array.from(lines).sort((a, b) => a - b);
          let lastEnd = -1;
          sortedLines.forEach(lineNum => {
            const window = contextDepth > 50 ? 25 : 10;
            const start = Math.max(0, lineNum - window);
            const end = Math.min(fileLines.length, lineNum + window);
            if (start > lastEnd) {
              const snippet = fileLines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
              const est = (snippet.length / 4);
              if (currentTokens + est < dynamicBudget) {
                finalContext.push(`FILE: ${file.path}\n\`\`\`\n${snippet}\n\`\`\``);
                currentTokens += est;
                lastEnd = end;
              }
            }
          });
        }
      }
    }
    return finalContext.join('\n\n');
  }

  async *analyzeLogsStream(
    chunks: LogChunk[], 
    index: SearchIndex | null, 
    sourceFiles: CodeFile[], 
    knowledgeFiles: KnowledgeFile[], 
    query: string, 
    modelId: string, 
    contextDepth: number, 
    history: ChatMessage[] = [],
    cache: Record<string, CacheEntry> = {}
  ): AsyncGenerator<any> {
    if (!index) {
        yield { type: 'text', data: "Engine Error: Search index not compiled." };
        return;
    }

    // Efficiency v7.1: Cache Lookup
    const contextDepthStr = contextDepth.toString();
    const currentLogHash = getFastHash(chunks.map(c => c.contentHash).join(''));
    const queryHash = getFastHash(`${currentLogHash}:${query}:${contextDepthStr}:${modelId}`);
    
    if (cache[queryHash]) {
      const cached = cache[queryHash].result;
      yield { type: 'cache_hit', data: true };
      if (cached.sources) yield { type: 'sources', data: cached.sources };
      if (cached.fixValidation) yield { type: 'fix_validation', data: cached.fixValidation };
      yield { type: 'structured_report', data: cached.report };
      yield { type: 'text', data: "Retrieved analysis from local persistent cache (v7.1 Instant)." };
      return;
    }

    const isComplex = query.length > 50 || history.length > 2;
    const baseTopK = isComplex ? 20 : 8;
    const adjustedTopK = Math.floor(baseTopK * (contextDepth / 40));
    const candidates = this.findRelevantChunks(chunks, index, query, adjustedTopK * 2);
    const rankedChunks = this.rerankChunks(candidates, query, adjustedTopK);
    const context = this.prepareOptimizedContext(rankedChunks, history, sourceFiles, knowledgeFiles, contextDepth);
    
    const sources = rankedChunks.map(c => c.id);
    yield { type: 'sources', data: sources };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isPro = modelId.includes('pro');

    const systemInstruction = `
      ROLE: CloudLog AI Diagnostic Engine.
      TASK: Forensic audit.
      FORMAT: Return JSON containing 'report' (StructuredAnalysis) and optionally 'fixValidation'.
    `;

    try {
      const result = await ai.models.generateContent({
        model: modelId,
        contents: `CONTEXT:\n${context}\n\nQUERY:\n${query}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 1000 },
          tools: isPro ? [{googleSearch: {}}] : undefined
        }
      });
      const data = this.parseResilientJson(result.text);
      
      // Save to cache for efficiency
      yield { type: 'save_to_cache', data: { hash: queryHash, query, result: { ...data, sources } } };

      if (data.fixValidation) yield { type: 'fix_validation', data: data.fixValidation };
      yield { type: 'structured_report', data: data.report || data };
      yield { type: 'text', data: `Intelligence Engine processed context successfully.` };
    } catch (e: any) {
      const stream = this.callGeminiStream(modelId, systemInstruction, `CONTEXT:\n${context}\n\nQUERY:\n${query}`, 3, isPro);
      for await (const chunk of stream) yield chunk;
    }
  }

  private findRelevantChunks(chunks: LogChunk[], index: SearchIndex, query: string, topK: number = 8): LogChunk[] {
    const queryTerms = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
    const scores = new Map<string, number>();
    queryTerms.forEach(term => {
      const matchingDocIds = index.invertedIndex.get(term);
      if (matchingDocIds) {
        const weight = index.termWeights.get(term) || 1.0;
        matchingDocIds.forEach(id => {
          const current = scores.get(id) || 0;
          scores.set(id, current + weight + 2.0);
        });
      }
    });
    const rankedIds = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).slice(0, topK).map(e => e[0]);
    return rankedIds.map(id => chunks.find(c => c.id === id)!).filter(Boolean);
  }

  private rerankChunks(candidates: LogChunk[], query: string, topK: number): LogChunk[] {
    const queryLower = query.toLowerCase();
    const seenSignatures = new Set<string>();
    const scored = candidates.map(chunk => {
      let score = 0;
      const errorCount = chunk.entries.filter(e => e.severity === Severity.ERROR || e.severity === Severity.FATAL).length;
      score += errorCount * 10;
      score += Math.log10(chunk.occurrenceCount + 1) * 15;
      return { chunk, score };
    });
    const sorted = scored.sort((a, b) => b.score - a.score);
    const diverse: LogChunk[] = [];
    for (const item of sorted) {
      if (diverse.length >= topK) break;
      if (!seenSignatures.has(item.chunk.signature)) {
        diverse.push(item.chunk);
        seenSignatures.add(item.chunk.signature);
      }
    }
    return diverse;
  }

  private async *callGeminiStream(model: string, system: string, user: string, retries: number, useSearch: boolean): AsyncGenerator<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContentStream({
        model,
        contents: user,
        config: { systemInstruction: system, temperature: 0.1, thinkingConfig: { thinkingBudget: 1000 }, tools: useSearch ? [{googleSearch: {}}] : undefined }
      });
      for await (const chunk of response) {
        const c = chunk as GenerateContentResponse;
        if (c.text) yield { type: 'text', data: c.text };
      }
    } catch (error) { throw error; }
  }
}
