
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { LogChunk, ChatMessage, SearchIndex, ProcessingStats, CodeFile, SourceLocation, CodeFlowStep, DebugSolution, KnowledgeFile } from "../types";

export class GeminiService {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private prepareContext(rankedChunks: LogChunk[], history: ChatMessage[], sourceFiles: CodeFile[], knowledgeFiles: KnowledgeFile[], maxContextTokens: number = 25000): string {
    let currentTokens = 0;
    const finalContext: string[] = [];

    // Add Knowledge Base Context (Runbooks/Internal Docs)
    if (knowledgeFiles.length > 0) {
      finalContext.push("### KNOWLEDGE BASE / INTERNAL RUNBOOKS");
      for (const kf of knowledgeFiles) {
        const estimated = (kf.content.length / 4);
        if (currentTokens + estimated < maxContextTokens * 0.2) {
          finalContext.push(`DOC: ${kf.name} (${kf.type})\n${kf.content}\n---`);
          currentTokens += estimated;
        }
      }
    }

    // Add Log Segments
    for (const chunk of rankedChunks) {
      const estimated = (chunk.content.length / 4);
      if (currentTokens + estimated < maxContextTokens * 0.6) {
        finalContext.push(`### LOG SEGMENT: ${chunk.id}\n${chunk.content}\n---`);
        currentTokens += estimated;
      } else {
        break;
      }
    }

    // Add Code Context if log entries point to specific files
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

    if (relevantLocations.size > 0) {
      finalContext.push("\n### RELATED SOURCE CODE SNIPPETS (CONTEXT WINDOWS)");
      for (const [filePath, lines] of relevantLocations.entries()) {
        const file = sourceFiles.find(f => f.path.endsWith(filePath) || filePath.endsWith(f.path));
        if (file) {
          const fileLines = file.content.split('\n');
          if (lines.size > 0) {
            Array.from(lines).sort((a, b) => a - b).forEach(lineNum => {
              const start = Math.max(0, lineNum - 30);
              const end = Math.min(fileLines.length, lineNum + 30);
              const snippet = fileLines.slice(start, end).join('\n');
              const estimated = (snippet.length / 4);
              if (currentTokens + estimated < maxContextTokens) {
                finalContext.push(`FILE: ${file.path} (Lines ${start + 1}-${end})\n\`\`\`${file.language}\n${snippet}\n\`\`\``);
                currentTokens += estimated;
              }
            });
          } else {
            const estimated = (file.content.length / 4);
            if (currentTokens + estimated < maxContextTokens) {
              finalContext.push(`FILE: ${file.path}\n\`\`\`${file.language}\n${file.content}\n\`\`\``);
              currentTokens += estimated;
            }
          }
        }
      }
    }

    return finalContext.join('\n\n');
  }

  async getDiscoveryPrompts(stats: ProcessingStats, sampleChunks: LogChunk[]): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const sample = sampleChunks.slice(0, 3).map(c => c.content).join('\n');
    
    const prompt = `
      As an expert SRE and Security Engineer, analyze this log file metadata and content sample.
      FILE: ${stats.fileName} (${stats.fileInfo?.format})
      SEVERITIES: ${JSON.stringify(stats.severities)}
      INFERRED SOURCE FILES: ${stats.inferredFiles.join(', ')}
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
    if (!index) throw new Error("Search Index not compiled");
    
    const rankedChunks = this.findRelevantChunks(chunks, index, query);
    const context = this.prepareContext(rankedChunks, history, sourceFiles, knowledgeFiles);
    const recentHistory = history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    yield { type: 'sources', data: rankedChunks.map(c => c.id) };

    const systemInstruction = `
      DIAGNOSTIC MANDATE: Analyze raw log data, internal runbooks, and source code for debugging and security analysis. 
      You are an expert developer and SRE performing root cause analysis.
      
      CORE CAPABILITIES:
      1. Pinpoint exact failure lines in stack traces.
      2. Trace code flow across files (Caller -> Callee chain).
      3. Use Google Search to find similar Stack Overflow issues or official library documentation if internal context is insufficient.
      4. Generate solution paths based on internal runbooks AND external best practices.
      5. Provide concrete code fix suggestions with before/after diff logic.

      OUTPUT FORMAT:
      Your response should be high-quality Markdown.
      
      At the END of your text, you MUST include a JSON block for structured debugging insights:
      [DEBUG_START]
      [
        {
          "id": "sol-1",
          "strategy": "Strategy name",
          "confidence": 0.95,
          "rootCause": "Explanation",
          "fixes": [
            {
              "title": "Fix title",
              "filePath": "path",
              "originalCode": "code",
              "suggestedCode": "code",
              "explanation": "why",
              "bestPractice": "check"
            }
          ],
          "bestPractices": ["Rule 1"]
        }
      ]
      [DEBUG_END]

      And a JSON block for the execution trace:
      [ANALYSIS_START]
      [...]
      [ANALYSIS_END]
    `;

    const userPrompt = `
      CONTEXT (LOGS + RELEVANT CODE + INTERNAL KNOWLEDGE):
      ${context}
      
      PREVIOUS INTERACTION:
      ${recentHistory}

      QUERY:
      ${query}
    `;

    if (modelId.startsWith('gemini')) {
      let accumulatedText = "";
      const isPro = modelId.includes('pro');
      const stream = this.callGeminiStream(modelId, systemInstruction, userPrompt, retries, isPro);
      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          accumulatedText += chunk.data;
          
          if (accumulatedText.includes('[ANALYSIS_START]') && accumulatedText.includes('[ANALYSIS_END]')) {
             const startIdx = accumulatedText.indexOf('[ANALYSIS_START]') + '[ANALYSIS_START]'.length;
             const endIdx = accumulatedText.indexOf('[ANALYSIS_END]');
             const jsonStr = accumulatedText.substring(startIdx, endIdx).trim();
             try {
               const analysisSteps = JSON.parse(jsonStr);
               yield { type: 'analysis', data: analysisSteps };
               accumulatedText = accumulatedText.substring(0, accumulatedText.indexOf('[ANALYSIS_START]'));
               yield { type: 'text_replace', data: accumulatedText };
             } catch (e) {}
          }

          if (accumulatedText.includes('[DEBUG_START]') && accumulatedText.includes('[DEBUG_END]')) {
             const startIdx = accumulatedText.indexOf('[DEBUG_START]') + '[DEBUG_START]'.length;
             const endIdx = accumulatedText.indexOf('[DEBUG_END]');
             const jsonStr = accumulatedText.substring(startIdx, endIdx).trim();
             try {
               const debugSolutions = JSON.parse(jsonStr);
               yield { type: 'debug_solutions', data: debugSolutions };
               accumulatedText = accumulatedText.substring(0, accumulatedText.indexOf('[DEBUG_START]'));
               yield { type: 'text_replace', data: accumulatedText };
             } catch (e) {}
          }

          if (!accumulatedText.includes('[ANALYSIS_START]') && !accumulatedText.includes('[DEBUG_START]')) {
            yield chunk;
          }
        } else if (chunk.type === 'grounding') {
          yield chunk;
        } else {
          yield chunk;
        }
      }
    }
  }

  private async *callGeminiStream(model: string, system: string, user: string, retries: number, useSearch: boolean): AsyncGenerator<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await ai.models.generateContentStream({
          model: model,
          contents: user,
          config: { 
            systemInstruction: system,
            temperature: 0.1,
            tools: useSearch ? [{googleSearch: {}}] : undefined
          }
        });

        for await (const chunk of response) {
          const c = chunk as GenerateContentResponse;
          if (c.text) yield { type: 'text', data: c.text };
          
          const grounding = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (grounding) {
            yield { type: 'grounding', data: grounding };
          }
        }
        return;
      } catch (error: any) {
        const isRateLimit = error.message?.includes('429') || error.status === 429;
        if (isRateLimit && attempt < retries) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          yield { type: 'status', data: `Rate limited. Retrying...` };
          await this.delay(waitTime);
          continue;
        }
        throw error;
      }
    }
  }
}
