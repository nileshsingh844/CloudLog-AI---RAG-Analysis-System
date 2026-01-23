
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { LogChunk, ChatMessage, SearchIndex, ProcessingStats } from "../types";

export class GeminiService {
  /**
   * Helper for Exponential Backoff
   */
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Context Trimming
   */
  private prepareContext(rankedChunks: LogChunk[], history: ChatMessage[], maxContextTokens: number = 25000): string {
    let currentTokens = 0;
    const finalChunks: string[] = [];

    for (const chunk of rankedChunks) {
      const estimated = (chunk.content.length / 4);
      if (currentTokens + estimated < maxContextTokens) {
        finalChunks.push(`### LOG SEGMENT: ${chunk.id}\n${chunk.content}\n---`);
        currentTokens += estimated;
      } else {
        break;
      }
    }

    return finalChunks.join('\n\n');
  }

  /**
   * Suggest high-value queries based on initial scan
   */
  async getDiscoveryPrompts(stats: ProcessingStats, sampleChunks: LogChunk[]): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const sample = sampleChunks.slice(0, 3).map(c => c.content).join('\n');
    
    const prompt = `
      As an expert SRE and Security Engineer, analyze this log file metadata and content sample.
      FILE: ${stats.fileName} (${stats.fileInfo?.format})
      SEVERITIES: ${JSON.stringify(stats.severities)}
      SAMPLE CONTENT:
      ${sample.substring(0, 2000)}

      Suggest 4 highly specific, high-value investigative questions the user could ask to find issues or insights in this specific file.
      Focus on anomalies, performance, or security risks indicated by the sample or stats.
      Return exactly 4 questions.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['suggestions']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return data.suggestions || [];
    } catch (e) {
      console.error("Failed to generate suggestions", e);
      return [
        "What are the most frequent error messages?",
        "Identify any unusual activity patterns.",
        "Summarize the main system events.",
        "Are there any security warnings?"
      ];
    }
  }

  private findRelevantChunks(chunks: LogChunk[], index: SearchIndex, query: string, topK: number = 7): LogChunk[] {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);

    const scores = new Map<string, number>();

    queryTerms.forEach(term => {
      const matchingDocIds = index.invertedIndex.get(term);
      if (matchingDocIds) {
        const weight = index.termWeights.get(term) || 1.0;
        matchingDocIds.forEach(id => {
          scores.set(id, (scores.get(id) || 0) + weight);
        });
      }
    });

    const rankedIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(entry => entry[0]);

    return rankedIds.map(id => chunks.find(c => c.id === id)!).filter(Boolean);
  }

  /**
   * Enhanced Stream with Dynamic Model Initialization
   */
  async *analyzeLogsStream(
    chunks: LogChunk[], 
    index: SearchIndex | null, 
    query: string, 
    modelName: string, 
    history: ChatMessage[] = [],
    retries: number = 3
  ): AsyncGenerator<any> {
    if (!index) throw new Error("Search Index not compiled");
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const rankedChunks = this.findRelevantChunks(chunks, index, query);
    const context = this.prepareContext(rankedChunks, history);
    const recentHistory = history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const systemInstruction = `
      DIAGNOSTIC MANDATE: Analyze raw log data for debugging and security analysis. 
      You are an SRE performing root cause analysis. Be precise, technical, and objective.
    `;

    const userPrompt = `
      CONTEXT:
      ${context}
      
      PREVIOUS INTERACTION:
      ${recentHistory}

      QUERY:
      ${query}
    `;

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await ai.models.generateContentStream({
          model: modelName,
          contents: userPrompt,
          config: { 
            systemInstruction,
            temperature: 0.1,
          }
        });

        yield { type: 'sources', data: rankedChunks.map(c => c.id) };

        for await (const chunk of response) {
          const c = chunk as GenerateContentResponse;
          if (c.text) yield { type: 'text', data: c.text };
        }
        return;

      } catch (error: any) {
        const isRateLimit = error.message?.includes('429') || error.status === 429;
        if (isRateLimit && attempt < retries) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          yield { type: 'status', data: `Rate limited. Retrying in ${Math.round(waitTime/1000)}s...` };
          await this.delay(waitTime);
          continue;
        }
        throw error;
      }
    }
  }
}
