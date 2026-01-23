
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { LogChunk, ChatMessage, SearchIndex, ProcessingStats, CodeFile, SourceLocation, CodeFlowStep, DebugSolution, KnowledgeFile, AdvancedAnalysis } from "../types";

export class GeminiService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private prepareContext(rankedChunks: LogChunk[], history: ChatMessage[], sourceFiles: CodeFile[], knowledgeFiles: KnowledgeFile[], maxContextTokens: number = 25000): string {
    let currentTokens = 0;
    const finalContext: string[] = [];

    if (knowledgeFiles.length > 0) {
      finalContext.push("### INTERNAL KNOWLEDGE BASE & RUNBOOKS");
      for (const kf of knowledgeFiles) {
        const estimated = (kf.content.length / 4);
        if (currentTokens + estimated < maxContextTokens * 0.20) {
          finalContext.push(`DOCUMENT: ${kf.name} (Type: ${kf.type})\nCONTENT: ${kf.content}\n---`);
          currentTokens += estimated;
        }
      }
    }

    finalContext.push("\n### RELEVANT LOG SEGMENTS");
    for (const chunk of rankedChunks) {
      const estimated = (chunk.content.length / 4);
      if (currentTokens + estimated < maxContextTokens * 0.6) {
        finalContext.push(`SEGMENT ID: ${chunk.id}\n${chunk.content}\n---`);
        currentTokens += estimated;
      } else {
        break;
      }
    }

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
      finalContext.push("\n### SOURCE CODE CONTEXT (SEMANTIC MATCH)");
      for (const [filePath, lines] of relevantLocations.entries()) {
        const file = sourceFiles.find(f => f.path.toLowerCase().endsWith(filePath.toLowerCase()) || filePath.toLowerCase().endsWith(f.path.toLowerCase()));
        if (file) {
          const fileLines = file.content.split('\n');
          const sortedLines = Array.from(lines).sort((a, b) => a - b);
          let lastEnd = -1;

          sortedLines.forEach(lineNum => {
            const start = Math.max(0, lineNum - 15);
            const end = Math.min(fileLines.length, lineNum + 15);
            
            if (start > lastEnd) {
              const snippet = fileLines.slice(start, end).join('\n');
              const estimated = (snippet.length / 4);
              if (currentTokens + estimated < maxContextTokens) {
                finalContext.push(`FILE: ${file.path} (Lines ${start + 1}-${end})\n\`\`\`${file.language}\n${snippet}\n\`\`\``);
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
        yield { type: 'text', data: "Engine Error: The search index has not been compiled or was corrupted during restoration. Please re-ingest the log file to rebuild the forensic map." };
        return;
    }
    
    const rankedChunks = this.findRelevantChunks(chunks, index, query);
    const context = this.prepareContext(rankedChunks, history, sourceFiles, knowledgeFiles);

    yield { type: 'sources', data: rankedChunks.map(c => c.id) };

    const systemInstruction = `
      ROLE: You are the CloudLog AI Diagnostic Engine.
      TASK: Perform Deep Forensic Analysis including Pattern Detection, Correlation, Performance profiling, Security scanning, and Environment profiling.

      DIAGNOSTIC MANDATE:
      1. PATTERN DETECTION: Identify recurring error clusters.
      2. CORRELATION ANALYSIS: Link temporally related failures.
      3. PERFORMANCE BOTTLENECKS: Highlight latency spikes.
      4. SECURITY SCAN: Flag SQLi, XSS, or Auth bypass patterns.
      5. ENVIRONMENT DETECTION: Identify if the error is environment-specific (OS, Runtime, Region, Host).
      6. DEPENDENCY CHECK: Flag library version mismatches or outdated packages if detectable.

      OUTPUT FORMAT:
      Your text response should be technical Markdown. Use diagrams where possible.
      At the END, include structured JSON blocks for the UI:

      [ADVANCED_START]
      {
        "patterns": [{"signature": "...", "count": 5, "example": "...", "severity": "ERROR", "trend": "increasing"}],
        "correlations": [{"sourceEvent": "DB Connect", "triggeredEvent": "API Timeout", "timeDeltaMs": 150, "confidence": 0.9, "causalLink": "..."}],
        "bottlenecks": [{"operation": "Query User", "p95LatencyMs": 1200, "count": 45, "impact": "CRITICAL"}],
        "securityInsights": [{"type": "Auth Anomaly", "description": "...", "severity": "HIGH", "remediation": "..."}],
        "memoryInsights": ["..."],
        "environmentProfile": { "os": "...", "runtime": "...", "region": "...", "env": "...", "detectedAnomalies": ["..."] },
        "dependencyAnomalies": [{ "library": "...", "currentVersion": "...", "suspectedIssue": "...", "remediation": "..." }]
      }
      [ADVANCED_END]

      [DEBUG_START]
      [{
        "id": "sol-1", 
        "strategy": "...", 
        "confidence": 0.95, 
        "rootCause": "...", 
        "fixes": [{"title": "...", "filePath": "...", "originalCode": "...", "suggestedCode": "...", "explanation": "..."}], 
        "bestPractices": ["..."],
        "reproSteps": ["Step 1...", "Step 2..."],
        "unitTests": [{"title": "Reproduction Test", "code": "...", "language": "javascript"}],
        "preventionStrategy": "Detailed explanation on how to prevent this in the future..."
      }]
      [DEBUG_END]

      [ANALYSIS_START]
      [{"file": "...", "line": 123, "method": "...", "description": "..."}]
      [ANALYSIS_END]
    `;

    const userPrompt = `
      CONTEXT:
      ${context}
      
      QUERY:
      ${query}
    `;

    let accumulatedText = "";
    const isPro = modelId.includes('pro');
    const stream = this.callGeminiStream(modelId, systemInstruction, userPrompt, retries, isPro);
    
    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        accumulatedText += chunk.data;
        
        if (accumulatedText.includes('[ADVANCED_START]') && accumulatedText.includes('[ADVANCED_END]')) {
           const startIdx = accumulatedText.indexOf('[ADVANCED_START]') + '[ADVANCED_START]'.length;
           const endIdx = accumulatedText.indexOf('[ADVANCED_END]');
           try {
             const data = JSON.parse(accumulatedText.substring(startIdx, endIdx).trim());
             yield { type: 'advanced_analysis', data };
             accumulatedText = accumulatedText.split('[ADVANCED_START]')[0];
             yield { type: 'text_replace', data: accumulatedText };
           } catch (e) {}
        }

        if (accumulatedText.includes('[ANALYSIS_START]') && accumulatedText.includes('[ANALYSIS_END]')) {
           const startIdx = accumulatedText.indexOf('[ANALYSIS_START]') + '[ANALYSIS_START]'.length;
           const endIdx = accumulatedText.indexOf('[ANALYSIS_END]');
           try {
             const analysisSteps = JSON.parse(accumulatedText.substring(startIdx, endIdx).trim());
             yield { type: 'analysis', data: analysisSteps };
             accumulatedText = accumulatedText.split('[ANALYSIS_START]')[0];
             yield { type: 'text_replace', data: accumulatedText };
           } catch (e) {}
        }

        if (accumulatedText.includes('[DEBUG_START]') && accumulatedText.includes('[DEBUG_END]')) {
           const startIdx = accumulatedText.indexOf('[DEBUG_START]') + '[DEBUG_START]'.length;
           const endIdx = accumulatedText.indexOf('[DEBUG_END]');
           try {
             const debugSolutions = JSON.parse(accumulatedText.substring(startIdx, endIdx).trim());
             yield { type: 'debug_solutions', data: debugSolutions };
             accumulatedText = accumulatedText.split('[DEBUG_START]')[0];
             yield { type: 'text_replace', data: accumulatedText };
           } catch (e) {}
        }

        if (!accumulatedText.includes('[ANALYSIS_START]') && !accumulatedText.includes('[DEBUG_START]') && !accumulatedText.includes('[ADVANCED_START]')) {
          yield chunk;
        }
      } else {
        yield chunk;
      }
    }
  }

  async getDiscoveryPrompts(stats: ProcessingStats, sampleChunks: LogChunk[]): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Analyze this log file's metadata and suggest 4 high-impact investigative questions.
      Focus on Pattern Detection, Correlation, Performance, Security, and Memory.
      FILE: ${stats.fileName}
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
      return ["Perform a pattern analysis", "Analyze performance correlations", "Check for security threats", "Identify memory leaks"];
    }
  }

  private findRelevantChunks(chunks: LogChunk[], index: SearchIndex, query: string, topK: number = 7): LogChunk[] {
    const queryTerms = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
    const scores = new Map<string, number>();

    queryTerms.forEach(term => {
      const matchingDocIds = index.invertedIndex.get(term);
      if (matchingDocIds) {
        const weight = index.termWeights.get(term) || 1.0;
        matchingDocIds.forEach(id => scores.set(id, (scores.get(id) || 0) + weight));
      }
    });

    const rankedIds = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).slice(0, topK).map(e => e[0]);
    return rankedIds.map(id => chunks.find(c => c.id === id)!).filter(Boolean);
  }

  private async *callGeminiStream(model: string, system: string, user: string, retries: number, useSearch: boolean): AsyncGenerator<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await ai.models.generateContentStream({
          model,
          contents: user,
          config: { systemInstruction: system, temperature: 0.1, tools: useSearch ? [{googleSearch: {}}] : undefined }
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
