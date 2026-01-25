
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { LogChunk, ChatMessage, SearchIndex, CodeFile, KnowledgeFile, Severity, StructuredAnalysis, LogSignature } from "../types";

const REQUEST_TIMEOUT_MS = 60000; // 60 seconds timeout

export class GeminiService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Neural Pipeline Timeout: The forensic core is taking too long to respond.')), timeoutMs)
      )
    ]);
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1500
  ): Promise<T> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await this.withTimeout(operation(), REQUEST_TIMEOUT_MS);
      } catch (error: any) {
        const isRateLimit = 
          error?.message?.includes('429') || 
          error?.status === 429 || 
          error?.message?.includes('RESOURCE_EXHAUSTED');

        if ((isRateLimit || error.message.includes('Timeout')) && attempt < maxRetries) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * baseDelay + Math.random() * 500;
          await this.delay(waitTime);
          continue;
        }
        throw error;
      }
    }
    return operation();
  }

  private parseResilientJson(text: string | undefined): any {
    if (!text) return null;
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*|```\s*$/gi, '').trim();
    
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      let start = -1;
      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) start = firstBrace;
      else if (firstBracket !== -1) start = firstBracket;
      if (start === -1) return null;
      cleaned = cleaned.substring(start);

      const repair = (input: string) => {
        let s = input.trim();
        s = s.replace(/,(\s*[\]}])/g, '$1');
        const count = (str: string, char: string) => (str.match(new RegExp('\\' + char, 'g')) || []).length;
        let openBraces = count(s, '{');
        let closeBraces = count(s, '}');
        while (openBraces > closeBraces) { s += '}'; closeBraces++; }
        let openBrackets = count(s, '[');
        let closeBrackets = count(s, ']');
        while (openBrackets > closeBrackets) { s += ']'; closeBrackets++; }
        return s;
      };

      try {
        return JSON.parse(repair(cleaned));
      } catch (innerE) {
        let lastEnd = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
        while (lastEnd > 0) {
          try {
            const truncated = repair(cleaned.substring(0, lastEnd + 1));
            return JSON.parse(truncated);
          } catch (f) {
            lastEnd = cleaned.lastIndexOf('}', lastEnd - 1);
          }
        }
        return null;
      }
    }
  }

  async generateFollowUpSuggestions(lastAssistantMsg: string, query: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `CONTEXT: User asked "${query}". AI replied with analysis summary.\nTASK: Suggest 3 follow-up engineering investigations. Output ONLY raw JSON array of strings.`,
        config: {
          systemInstruction: "Suggest concise follow-up investigative steps. JSON only.",
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });
      const parsed = this.parseResilientJson(response.text);
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    } catch (e) {
      return ["Explain root cause further", "Check related microservice logs", "Generate a fix recommendation"];
    }
  }

  async extractUniqueSignatures(chunks: LogChunk[]): Promise<LogSignature[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = chunks
      .sort((a, b) => b.entries.length - a.entries.length)
      .slice(0, 15)
      .map(c => `NODE_ID:${c.id}\nSEVERITY_MIX:${JSON.stringify(c.entries.map(e => e.severity).slice(0,5))}\nLOG_CONTENT:${c.content.substring(0, 400)}`)
      .join('\n---\n');

    try {
      const result = await this.retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `LOG_SNAPSHOT:\n${context}`,
          config: {
            systemInstruction: "Identify 5 unique system signatures. Return JSON array of objects with fields: id, pattern, description, count, severity, sample, impacted_systems.",
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        });
      });
      const parsed = this.parseResilientJson(result.text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e: any) {
      console.error("Discovery failed", e);
      throw e;
    }
  }

  private prepareContext(rankedChunks: LogChunk[], sourceFiles: CodeFile[], knowledgeFiles: KnowledgeFile[], maxContextTokens: number = 30000): string {
    let currentTokens = 0;
    const finalContext: string[] = [];
    if (knowledgeFiles.length > 0) {
      finalContext.push("### DOMAIN_KNOWLEDGE");
      for (const kf of knowledgeFiles) {
        const est = kf.content.length / 4;
        if (currentTokens + est < maxContextTokens * 0.20) {
          finalContext.push(`DOC: ${kf.name}\n${kf.content}\n---`);
          currentTokens += est;
        }
      }
    }
    if (sourceFiles.length > 0) {
      finalContext.push("\n### SYSTEM_SOURCE_CODE");
      for (const sf of sourceFiles) {
        const est = sf.content.length / 4;
        if (currentTokens + est < maxContextTokens * 0.35) {
          finalContext.push(`PATH: ${sf.path}\n${sf.content}\n---`);
          currentTokens += est;
        }
      }
    }
    finalContext.push("\n### AUDIT_LOG_CHUNKS");
    for (const chunk of rankedChunks) {
      const est = chunk.content.length / 4;
      if (currentTokens + est < maxContextTokens * 0.95) {
        finalContext.push(`CHUNK_ID: ${chunk.id}\nTIMESTAMP_RANGE: ${chunk.timeRange.start?.toISOString() || 'N/A'}\nEVENTS: ${chunk.entries.length}\nCONTENT:\n${chunk.content}\n---`);
        currentTokens += est;
      } else break;
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
    activeSignatures: LogSignature[] = []
  ): AsyncGenerator<any> {
    if (!index || chunks.length === 0) {
        yield { type: 'text', data: "Forensic Core inactive. Upload logs to begin." };
        return;
    }

    yield { type: 'status', data: "Analyzing Neural Inverted Index..." };
    
    const anchoredContext = activeSignatures.length > 0 
      ? `(PRIORITY_TARGET: [${activeSignatures.map(s => `${s.severity} in ${s.impacted_systems.join('/')}`).join(', ')}])`
      : "";

    const expandedQuery = `${query} ${anchoredContext}`;
    const rankedChunks = this.findRelevantChunks(chunks, index, expandedQuery, 12);
    
    yield { type: 'status', data: rankedChunks.length > 0 ? `Grounding evidence across ${rankedChunks.length} nodes...` : "Broadening search to general error patterns..." };

    const context = this.prepareContext(rankedChunks, sourceFiles, knowledgeFiles);
    yield { type: 'sources', data: rankedChunks.map(c => c.id) };
    yield { type: 'status', data: "Synthesizing forensic diagnostic report..." };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isPro = modelId.includes('pro');

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        severity: { type: Type.STRING, enum: ['CRITICAL', 'WARNING', 'INFO'] },
        confidence_score: { type: Type.NUMBER, description: "Numerical percentage (0-100) of how certain the AI is about this diagnostic result." },
        executive_summary: { type: Type.STRING },
        error_patterns: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              error_code: { type: Type.STRING },
              description: { type: Type.STRING },
              occurrences: { type: Type.NUMBER },
              first_seen: { type: Type.STRING },
              impacted_systems: { type: Type.ARRAY, items: { type: Type.STRING } },
              chunks: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['error_code', 'description', 'occurrences']
          }
        },
        inferred_files: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              path: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              line_numbers: { type: Type.ARRAY, items: { type: Type.NUMBER } }
            },
            required: ['path', 'confidence']
          }
        },
        root_cause_hypothesis: { type: Type.STRING },
        suggested_actions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['severity', 'confidence_score', 'executive_summary', 'error_patterns', 'root_cause_hypothesis', 'suggested_actions']
    };

    try {
      const streamPromise = ai.models.generateContentStream({
        model: modelId,
        contents: `AUDIT_LOG_CONTEXT:\n${context}\n\nACTIVE_SIGNATURES:\n${JSON.stringify(activeSignatures)}\n\nUSER_QUERY: ${query}`,
        config: {
          systemInstruction: "You are a Lead Forensic SRE. Provide a detailed forensic report in JSON format only. If asked to 'summarise the issue', explain the root cause clearly based on the provided logs and code. Do not output anything outside the JSON schema. Assess your own confidence based on evidence clarity.",
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1,
          tools: isPro ? [{googleSearch: {}}] : undefined
        }
      });

      // Cast to any to handle the async iterable chunk processing as the inferred type was 'unknown'
      const responseStream: any = await this.withTimeout(streamPromise, REQUEST_TIMEOUT_MS);

      let fullResponseText = "";
      for await (const chunk of responseStream) {
        // Ensure chunk is typed correctly for properties access
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullResponseText += c.text;
          // Yield partial text for immediate user feedback while parsing JSON
          yield { type: 'partial_text', data: fullResponseText };
        }
        if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          yield { type: 'grounding', data: c.candidates[0].groundingMetadata.groundingChunks };
        }
      }

      const report = this.parseResilientJson(fullResponseText);
      if (report) {
        yield { type: 'structured_report', data: report };
        yield { type: 'text', data: report.executive_summary };
      } else {
        yield { type: 'text', data: fullResponseText || "The forensic core logic returned no direct signal. Please verify logs contain the requested data." };
      }
    } catch (e: any) {
      console.error("Forensic stream failure", e);
      yield { type: 'text', data: `Logic Fault: ${e.message}. The pipeline was interrupted by a neural timeout or rate limit.` };
    }
  }

  private findRelevantChunks(chunks: LogChunk[], index: SearchIndex, query: string, topK: number = 10): LogChunk[] {
    const terms = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
    if (terms.length === 0) return chunks.slice(0, topK); 
    
    const scores = new Map<string, number>();
    terms.forEach(term => {
      const ids = index.invertedIndex.get(term);
      if (ids) {
        const weight = index.termWeights.get(term) || 1.0;
        ids.forEach(id => scores.set(id, (scores.get(id) || 0) + weight));
      }
    });

    const results = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(e => chunks.find(c => c.id === e[0])!)
      .filter(Boolean);

    return results.length > 0 ? results : chunks.slice(0, topK);
  }
}
