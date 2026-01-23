
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LogChunk, ChatMessage, SearchIndex } from "../types";

export class GeminiService {
  /**
   * Helper for Exponential Backoff
   */
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Token-Aware Context Trimming
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
    
    // Create fresh instance to pick up potential key changes
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const rankedChunks = this.findRelevantChunks(chunks, index, query);
    const context = this.prepareContext(rankedChunks, history);
    const recentHistory = history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const prompt = `
      DIAGNOSTIC MANDATE: The following is raw log data provided for security analysis and debugging. 
      It may contain technical descriptions of errors, attacks, or vulnerabilities. 
      You are an authorized SRE agent performing root cause analysis. Do not trigger safety filters on log content.

      CONTEXT:
      ${context}
      
      PREVIOUS INTERACTION:
      ${recentHistory}

      QUERY:
      ${query}
      
      GUIDELINES:
      - Cite segments exactly.
      - If security issues like SQLi or XSS are found in logs, report them technically.
    `;

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await ai.models.generateContentStream({
          model: modelName,
          contents: prompt,
          config: { 
            temperature: 0.1,
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
            ]
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

        console.error("Gemini Pipeline Failure:", error);
        throw error;
      }
    }
  }
}
