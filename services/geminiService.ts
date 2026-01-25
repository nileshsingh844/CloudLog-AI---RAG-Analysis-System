
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { LogChunk, ChatMessage, SearchIndex, CodeFile, KnowledgeFile, Severity, StructuredAnalysis, LogSignature } from "../types";

export class GeminiService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1500
  ): Promise<T> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        const isRateLimit = 
          error?.message?.includes('429') || 
          error?.status === 429 || 
          error?.message?.includes('RESOURCE_EXHAUSTED');

        if (isRateLimit && attempt < maxRetries) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * baseDelay + Math.random() * 500;
          console.warn(`Gemini Rate Limit hit. Retrying in ${Math.round(waitTime)}ms...`);
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
      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
      } else if (firstBracket !== -1) {
        start = firstBracket;
      }

      if (start === -1) return null;
      cleaned = cleaned.substring(start);

      const repair = (input: string) => {
        let s = input.trim();
        if (s.endsWith(',') || s.match(/,\s*"\w*$/) || s.match(/:\s*"\w*$/)) {
          s = s.replace(/,\s*"\w*$/, '');
          s = s.replace(/:\s*"\w*$/, '');
          s = s.replace(/,$/, '');
        }
        const quotes = (s.match(/"/g) || []).length;
        if (quotes % 2 !== 0) s += '"';
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
        const repaired = repair(cleaned);
        return JSON.parse(repaired);
      } catch (innerE) {
        let lastEnd = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
        while (lastEnd > 0) {
          try {
            const truncated = repair(cleaned.substring(0, lastEnd + 1));
            // Fix: Use 'truncated' instead of out-of-scope 'repaired' variable
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
        contents: `USER_QUERY: ${query}\nAI_RESPONSE: ${lastAssistantMsg.substring(0, 1000)}`,
        config: {
          systemInstruction: "You are a senior SRE. Based on the analysis provided, suggest 3 highly technical and relevant follow-up questions to investigate the logs deeper. Output ONLY a JSON array of 3 strings. Do not use Markdown.",
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });
      const parsed = this.parseResilientJson(response.text);
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    } catch (e) {
      return ["Check memory usage in this period", "Show related errors from other nodes", "Generate a fix recommendation"];
    }
  }

  async extractUniqueSignatures(chunks: LogChunk[]): Promise<LogSignature[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = chunks
      .sort((a, b) => {
        const aE = a.entries.filter(e => e.severity === Severity.ERROR || e.severity === Severity.FATAL).length;
        const bE = b.entries.filter(e => e.severity === Severity.ERROR || e.severity === Severity.FATAL).length;
        return bE - aE;
      })
      .slice(0, 10) // Increased visibility
      .map(c => `ID:${c.id}\n${c.content.substring(0, 800)}`)
      .join('\n---\n');

    try {
      const result = await this.retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `LOGS_CONTEXT:\n${context}`,
          config: {
            systemInstruction: "Identify exactly 5 most critical unique error patterns. Respond with a valid JSON array of objects only. Fields: id, pattern, description, count, severity (FATAL/ERROR/WARN/INFO), sample, impacted_systems (array).",
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        });
      });
      
      const parsed = this.parseResilientJson(result.text);
      if (!parsed || !Array.isArray(parsed)) throw new Error("Invalid signature data");
      return parsed;
    } catch (e: any) {
      console.error("Pattern extraction failed", e);
      throw e;
    }
  }

  private prepareContext(rankedChunks: LogChunk[], history: ChatMessage[], sourceFiles: CodeFile[], knowledgeFiles: KnowledgeFile[], maxContextTokens: number = 40000): string {
    let currentTokens = 0;
    const finalContext: string[] = [];

    if (knowledgeFiles.length > 0) {
      finalContext.push("### DOMAIN_KNOWLEDGE");
      for (const kf of knowledgeFiles) {
        const est = kf.content.length / 4;
        if (currentTokens + est < maxContextTokens * 0.25) {
          finalContext.push(`DOC: ${kf.name}\n${kf.content}\n---`);
          currentTokens += est;
        }
      }
    }

    if (sourceFiles.length > 0) {
      finalContext.push("### SOURCE_CODE_CONTEXT");
      for (const sf of sourceFiles) {
        const est = sf.content.length / 4;
        if (currentTokens + est < maxContextTokens * 0.40) {
          finalContext.push(`FILE: ${sf.path}\n${sf.content}\n---`);
          currentTokens += est;
        }
      }
    }

    finalContext.push("\n### RAW_LOG_CHUNKS");
    for (const chunk of rankedChunks) {
      const est = chunk.content.length / 4;
      if (currentTokens + est < maxContextTokens * 0.90) {
        finalContext.push(`CHUNK_ID: ${chunk.id}\n${chunk.content}\n---`);
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
    history: ChatMessage[] = []
  ): AsyncGenerator<any> {
    if (!index) {
        yield { type: 'text', data: "Forensic Index not initialized. Please re-upload logs." };
        return;
    }

    yield { type: 'status', data: "Initializing Neural RAG Pipeline..." };
    
    const candidates = this.findRelevantChunks(chunks, index, query, 30);
    const rankedChunks = candidates.slice(0, 12);
    const context = this.prepareContext(rankedChunks, history, sourceFiles, knowledgeFiles);

    yield { type: 'sources', data: rankedChunks.map(c => c.id) };
    yield { type: 'status', data: "Consulting Logical Segments & Source Context..." };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isPro = modelId.includes('pro');

    if (isPro) {
      yield { type: 'status', data: "Activating Google Search for external error grounding..." };
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        severity: { type: Type.STRING, enum: ['CRITICAL', 'WARNING', 'INFO'] },
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
              // Fix: items 'Type' should be lowercase 'type'
              line_numbers: { type: Type.ARRAY, items: { type: Type.NUMBER } }
            },
            required: ['path', 'confidence']
          }
        },
        root_cause_hypothesis: { type: Type.STRING },
        suggested_actions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['severity', 'executive_summary', 'error_patterns', 'root_cause_hypothesis', 'suggested_actions']
    };

    try {
      const result = await this.retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model: modelId,
          contents: `AUDIT_CONTEXT:\n${context}\n\nUSER_QUERY: ${query}`,
          config: {
            systemInstruction: "You are a Lead Forensic SRE Auditor. You MUST output a valid JSON report following the provided schema. Do not output anything other than JSON.",
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.1,
            tools: isPro ? [{googleSearch: {}}] : undefined
          }
        });
      });

      const grounding = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (grounding) yield { type: 'grounding', data: grounding };

      const report = this.parseResilientJson(result.text);
      if (report) {
        yield { type: 'status', data: "Audit Synthesized Successfully." };
        yield { type: 'structured_report', data: report };
        yield { type: 'text', data: report.executive_summary };
      } else {
        throw new Error("Diagnostic synthesis returned malformed data.");
      }
    } catch (e: any) {
      console.error("Forensic analysis pipeline failed", e);
      yield { type: 'text', data: `Critical Analysis Error: ${e.message}. Please try again or switch model.` };
    }
  }

  private findRelevantChunks(chunks: LogChunk[], index: SearchIndex, query: string, topK: number = 10): LogChunk[] {
    const terms = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
    const scores = new Map<string, number>();

    terms.forEach(term => {
      const ids = index.invertedIndex.get(term);
      if (ids) {
        const weight = index.termWeights.get(term) || 1.0;
        ids.forEach(id => scores.set(id, (scores.get(id) || 0) + weight));
      }
    });

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(e => chunks.find(c => c.id === e[0])!)
      .filter(Boolean);
  }
}
