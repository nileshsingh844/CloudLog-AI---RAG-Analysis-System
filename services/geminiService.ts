
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { LogChunk, ChatMessage, SearchIndex, ProcessingStats, CodeFile, SourceLocation, CodeFlowStep, DebugSolution, KnowledgeFile, AdvancedAnalysis, Severity } from "../types";

export class GeminiService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enhanced Context Preparation:
   * Builds a structured prompt containing relevant runbooks, prioritized log segments,
   * and semantic source code snippets.
   */
  private prepareContext(rankedChunks: LogChunk[], history: ChatMessage[], sourceFiles: CodeFile[], knowledgeFiles: KnowledgeFile[], maxContextTokens: number = 28000): string {
    let currentTokens = 0;
    const finalContext: string[] = [];

    // 1. Inject Knowledge Base (Runbooks/Docs)
    if (knowledgeFiles.length > 0) {
      finalContext.push("### [SYSTEM CONTEXT] INTERNAL KNOWLEDGE BASE & OPERATIONAL RUNBOOKS");
      for (const kf of knowledgeFiles) {
        const estimated = (kf.content.length / 4);
        if (currentTokens + estimated < maxContextTokens * 0.25) {
          finalContext.push(`DOCUMENT: ${kf.name}\nTYPE: ${kf.type}\nCONTENT:\n${kf.content}\n---`);
          currentTokens += estimated;
        }
      }
    }

    // 2. Inject Prioritized Log Segments (RAG Results)
    finalContext.push("\n### [FORENSIC CONTEXT] RANKED LOG SEGMENTS");
    for (const chunk of rankedChunks) {
      const estimated = (chunk.content.length / 4);
      if (currentTokens + estimated < maxContextTokens * 0.55) {
        finalContext.push(`SEGMENT_ID: ${chunk.id}\nTIMESTAMP_RANGE: ${chunk.entries[0]?.timestamp?.toISOString() || 'Unknown'} - ${chunk.entries[chunk.entries.length-1]?.timestamp?.toISOString() || 'Unknown'}\nLOG_DATA:\n${chunk.content}\n---`);
        currentTokens += estimated;
      } else {
        break;
      }
    }

    // 3. Extract and Inject Semantic Code Context
    const relevantLocations = new Map<string, Set<number>>();
    rankedChunks.forEach(chunk => {
      chunk.entries.forEach(entry => {
        entry.metadata.sourceLocations?.forEach(loc => {
          if (!relevantLocations.has(loc.filePath)) {
            relevantLocations.set(loc.filePath, new Set());
          }
          relevantLocations.get(loc.filePath)!.add(loc.line);
        });
      });
    });

    if (relevantLocations.size > 0 && sourceFiles.length > 0) {
      finalContext.push("\n### [LOGIC CONTEXT] SEMANTIC SOURCE CODE MAPPING");
      for (const [filePath, lines] of relevantLocations.entries()) {
        const file = sourceFiles.find(f => f.path.toLowerCase().endsWith(filePath.toLowerCase()) || filePath.toLowerCase().endsWith(f.path.toLowerCase()));
        if (file) {
          const fileLines = file.content.split('\n');
          const sortedLines = Array.from(lines).sort((a, b) => a - b);
          let lastEnd = -1;

          sortedLines.forEach(lineNum => {
            // Provide context window around the error line
            const start = Math.max(0, lineNum - 20);
            const end = Math.min(fileLines.length, lineNum + 20);
            
            if (start > lastEnd) {
              const snippet = fileLines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
              const estimated = (snippet.length / 4);
              if (currentTokens + estimated < maxContextTokens) {
                finalContext.push(`FILE: ${file.path} (Language: ${file.language})\n\`\`\`\n${snippet}\n\`\`\``);
                currentTokens += estimated;
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
    history: ChatMessage[] = [],
    retries: number = 3
  ): AsyncGenerator<any> {
    if (!index) {
        yield { type: 'text', data: "Engine Error: The search index has not been compiled. Please re-ingest logs." };
        return;
    }
    
    // Stage 1: Fast Retrieval (Top 30 candidates using TF-IDF)
    const candidates = this.findRelevantChunks(chunks, index, query, 30);
    
    // Stage 2: Heuristic Re-ranking (Refine to Top 8 for Gemini)
    const rankedChunks = this.rerankChunks(candidates, query, 8);
    
    const context = this.prepareContext(rankedChunks, history, sourceFiles, knowledgeFiles);

    yield { type: 'sources', data: rankedChunks.map(c => c.id) };

    const isTestGeneration = query.toLowerCase().includes('test') || query.toLowerCase().includes('reproduce');

    const systemInstruction = `
      ROLE: You are the CloudLog AI Diagnostic Engine, a world-class SRE and Forensic Engineer.
      TASK: Analyze forensic log streams and linked source code to identify root causes and provide remediation.

      DIAGNOSTIC MANDATE:
      1. CRITICAL ANALYSIS: Detect patterns, causal linkages, and performance bottlenecks.
      2. SECURITY AUDIT: Flag any anomalies indicating exploit attempts or PII leaks.
      3. CODE BRIDGING: Use the provided source code to explain EXACTLY what failed in the logic.
      4. TEST CASE GENERATION: ${isTestGeneration ? 'MANDATORY. You must provide unit tests (using relevant frameworks like Jest, Pytest, Go test) that reproduce the bug and verify the fix.' : 'Provide unit tests if a specific logic bug is identified.'}

      RESPONSE STRUCTURE:
      1. Executive Summary: High-level technical analysis.
      2. Forensic Evidence: Point to specific log segments.
      3. Logic Trace: Explain the failure flow through the code.
      4. Fix & Verification: Specific code patches and reproduction unit tests.

      STRICT JSON OUTPUTS (Append at the very end):
      Use [ADVANCED_START]...[ADVANCED_END] for the 'AdvancedAnalysis' object.
      Use [DEBUG_START]...[DEBUG_END] for the 'DebugSolution[]' array. Ensure 'unitTests' field is populated with reproduction code.
      Use [ANALYSIS_START]...[ANALYSIS_END] for the 'CodeFlowStep[]' array.
    `;

    const userPrompt = `
      FORENSIC CONTEXT:
      ${context}
      
      INVESTIGATION QUERY:
      ${query}

      Provide a deep-dive response including code-level fixes and reproduction unit tests.
    `;

    let accumulatedText = "";
    const isPro = modelId.includes('pro');
    const stream = this.callGeminiStream(modelId, systemInstruction, userPrompt, retries, isPro);
    
    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        accumulatedText += chunk.data;
        
        // Helper to extract and yield structured blocks from the stream
        const processBlock = (startTag: string, endTag: string, type: string) => {
          if (accumulatedText.includes(startTag) && accumulatedText.includes(endTag)) {
            const startIdx = accumulatedText.indexOf(startTag) + startTag.length;
            const endIdx = accumulatedText.indexOf(endTag);
            try {
              const content = accumulatedText.substring(startIdx, endIdx).trim();
              const data = JSON.parse(content);
              accumulatedText = accumulatedText.split(startTag)[0] + accumulatedText.split(endTag)[1];
              return { type, data };
            } catch (e) {
              console.error(`Failed to parse ${type} JSON`, e);
            }
          }
          return null;
        };

        const adv = processBlock('[ADVANCED_START]', '[ADVANCED_END]', 'advanced_analysis');
        if (adv) yield adv;

        const analysis = processBlock('[ANALYSIS_START]', '[ANALYSIS_END]', 'analysis');
        if (analysis) yield analysis;

        const debug = processBlock('[DEBUG_START]', '[DEBUG_END]', 'debug_solutions');
        if (debug) yield debug;

        // Clean up text for streaming display
        let displayText = accumulatedText;
        ['[ADVANCED_START]', '[ANALYSIS_START]', '[DEBUG_START]'].forEach(tag => {
          if (displayText.includes(tag)) {
            displayText = displayText.split(tag)[0];
          }
        });

        yield { type: 'text', data: displayText.replace(accumulatedText.slice(0, -chunk.data.length), '') };
      } else {
        yield chunk;
      }
    }
  }

  /**
   * Auto-Discovery:
   * Generates intelligent inquiry prompts based on log statistics.
   */
  async getDiscoveryPrompts(stats: ProcessingStats, sampleChunks: LogChunk[]): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Analyze this log file's diagnostic signature and suggest 4 high-impact forensic questions for an SRE.
      FILE: ${stats.fileName}
      SEVERITIES: ${JSON.stringify(stats.severities)}
      FORMAT: ${stats.fileInfo?.format}
      Return JSON: { "suggestions": ["..."] }
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
            required: ['suggestions']
          }
        }
      });
      return JSON.parse(response.text || '{}').suggestions || [];
    } catch (e) {
      return ["Explain the root cause of recent errors", "Audit for security vulnerabilities", "Generate reproduction unit tests", "Find performance bottlenecks"];
    }
  }

  /**
   * Stage 1: Search Retrieval:
   * TF-IDF style ranking for finding relevant log chunks.
   */
  private findRelevantChunks(chunks: LogChunk[], index: SearchIndex, query: string, topK: number = 8): LogChunk[] {
    const queryTerms = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
    const scores = new Map<string, number>();

    queryTerms.forEach(term => {
      const matchingDocIds = index.invertedIndex.get(term);
      if (matchingDocIds) {
        const weight = index.termWeights.get(term) || 1.0;
        matchingDocIds.forEach(id => {
          const current = scores.get(id) || 0;
          // Heavily weight chunks that contain multiple query terms
          scores.set(id, current + weight + 2.0);
        });
      }
    });

    const rankedIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(e => e[0]);
    
    return rankedIds.map(id => chunks.find(c => c.id === id)!).filter(Boolean);
  }

  /**
   * Stage 2: Heuristic Re-ranking:
   * Refines candidates based on diagnostic relevance (severity, stack traces, metadata).
   */
  private rerankChunks(candidates: LogChunk[], query: string, topK: number): LogChunk[] {
    const queryLower = query.toLowerCase();
    
    const scored = candidates.map(chunk => {
      let score = 0;
      
      // 1. Severity Focus: Error and Fatal logs are highly prioritized for diagnostic queries
      const errorCount = chunk.entries.filter(e => e.severity === Severity.ERROR || e.severity === Severity.FATAL).length;
      score += errorCount * 10;
      
      // 2. Structural Evidence: Chunks containing stack traces provide richer forensic data
      const stackCount = chunk.entries.filter(e => e.metadata.hasStackTrace).length;
      score += stackCount * 15;

      // 3. Keyword Match Density: Re-examine exact signature matches or filename mentions
      chunk.entries.forEach(entry => {
        // Boost if signature matches query keywords
        if (queryLower.includes(entry.metadata.signature.toLowerCase().substring(0, 20))) {
          score += 12;
        }

        // Boost if inferred source files for this entry are explicitly named in the query
        entry.metadata.sourceLocations?.forEach(loc => {
           const fileName = loc.filePath.split(/[/\\]/).pop()?.toLowerCase();
           if (fileName && queryLower.includes(fileName)) {
             score += 25;
           }
        });
      });

      // 4. Term Overlap Check (Simplified Jaccard-like boost)
      const chunkTerms = new Set(chunk.content.toLowerCase().split(/\s+/));
      const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 3);
      const overlap = queryTerms.filter(t => chunkTerms.has(t)).length;
      score += overlap * 5;

      return { chunk, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.chunk);
  }

  private async *callGeminiStream(model: string, system: string, user: string, retries: number, useSearch: boolean): AsyncGenerator<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await ai.models.generateContentStream({
          model,
          contents: user,
          config: { 
            systemInstruction: system, 
            temperature: 0.1, 
            tools: useSearch ? [{googleSearch: {}}] : undefined,
            topP: 0.95
          }
        });
        for await (const chunk of response) {
          const c = chunk as GenerateContentResponse;
          if (c.text) yield { type: 'text', data: c.text };
          const grounding = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (grounding) yield { type: 'grounding', data: grounding };
        }
        return;
      } catch (error: any) {
        if (error.message?.includes('429') && attempt < retries) {
          attempt++;
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }
        throw error;
      }
    }
  }
}
