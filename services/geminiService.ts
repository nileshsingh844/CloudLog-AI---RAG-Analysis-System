
import { GoogleGenAI, Type } from "@google/genai";
import { LogChunk, ProcessingStats, UserRole, Industry, LogSignature, Severity } from "../types";

/**
 * ARCHITECTURE: API / Streaming Layer (TypeScript)
 * Optimized for low-latency synthesis and high-fidelity RAG.
 */

interface RetrievalResult {
  context: string;
  evidenceCount: number;
  retrievalConfidence: number;
}

interface ScoredNode {
  chunk: LogChunk;
  score: number;
  traceId: string | null;
  eventId: string | null;
  index: number;
  metadata: {
    signature?: string;
    severity?: Severity;
  };
}

export class GeminiService {
  // Configuration Constants
  private readonly SCORING = {
    SEMANTIC_MATCH: 35,
    SEVERITY: { FATAL: 120, CRITICAL: 90, ERROR: 70, WARN: 25 },
    ENTITY_MARKERS: { EVENT_ID: 30, TRACE_ID: 40, SPAN_ID: 30 },
    SIGNATURE_MATCH: 60,
    TRACE_CAUSALITY_BOOST: 250,
    TEMPORAL_NEIGHBOR_BOOST: 50,
    RARE_PATTERN_BOOST: 45
  };
  
  private readonly THRESHOLDS = {
    SIGNAL_BOOST_MIN: 130,
    TOP_K_RESULTS: 20, 
    RE_RANK_CANDIDATES: 40, 
    MAX_CONFIDENCE_CAP: 350,
    MIN_SCORE_THRESHOLD: 40
  };

  private readonly LIMITS = {
    MAX_CONTEXT_CHARS: 80000, 
    MAX_CHUNK_PREVIEW: 1500,
    THINKING_BUDGET_DEEP: 2000, 
    THINKING_BUDGET_FAST: 0 
  };
  
  private retrieveRankedContext(chunks: LogChunk[], query: string, signatures: LogSignature[]): RetrievalResult {
    if (!chunks || chunks.length === 0) return { context: '', evidenceCount: 0, retrievalConfidence: 0 };

    const queryLower = query.toLowerCase();
    const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 2);
    
    const scoredNodes: ScoredNode[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let score = 0;
      const content = chunk.content;
      const contentLower = content.toLowerCase();

      for (const token of queryTokens) {
        if (contentLower.includes(token)) score += this.SCORING.SEMANTIC_MATCH;
      }

      if (score === 0 && !content.includes('ERROR') && !content.includes('FATAL')) continue;

      if (content.includes('[FATAL]')) score += this.SCORING.SEVERITY.FATAL;
      else if (content.includes('[ERROR]')) score += this.SCORING.SEVERITY.ERROR;

      scoredNodes.push({ 
        chunk, 
        score, 
        index: i, 
        traceId: this.extractTraceId(content), 
        eventId: this.extractEventId(content),
        metadata: {} 
      });
    }

    const topK = scoredNodes
      .sort((a, b) => b.score - a.score)
      .slice(0, this.THRESHOLDS.TOP_K_RESULTS);
    
    if (topK.length === 0) return { context: '', evidenceCount: 0, retrievalConfidence: 0 };

    const retrievalConfidence = 85; 
    
    let totalChars = 0;
    const contextParts = topK.sort((a, b) => a.index - b.index).map(node => {
      const content = node.chunk.content.substring(0, this.LIMITS.MAX_CHUNK_PREVIEW);
      if (totalChars + content.length > this.LIMITS.MAX_CONTEXT_CHARS) return '';
      totalChars += content.length;
      return content;
    }).filter(Boolean);
    
    return { context: contextParts.join('\n---\n'), evidenceCount: contextParts.length, retrievalConfidence };
  }

  private extractTraceId(content: string): string | null {
    const match = content.match(/trace_[0-9a-zA-Z]{6,}/i);
    return match ? match[0] : null;
  }

  private extractEventId(content: string): string | null {
    const match = content.match(/EventID:\s*(\d+)/i);
    return match ? match[1] : null;
  }

  async *analyzeGlobalAuditStream(
    stats: ProcessingStats, 
    signatures: LogSignature[], 
    userRole: UserRole, 
    industry: Industry
  ): AsyncGenerator<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const signatureContext = signatures.slice(0, 30).map(s => 
      `[${s.severity}] ${s.pattern} (${s.count}x)`
    ).join('\n');

    const systemInstruction = `Lead SRE Auditor. High-speed summary mode. 
1. Immediate failure detection.
2. Direct suggestions.
Return Markdown + JSON block: { "suggestions": string[] }.`;

    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: `LOG_VOLUME: ${stats.totalEntries}\nSIGNATURES:\n${signatureContext}`,
        config: { 
          systemInstruction, 
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 0 } 
        }
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          yield { type: 'text', data: fullText.split('```json')[0] };
        }
      }

      try {
        const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.suggestions) yield { type: 'suggestions', data: parsed.suggestions };
        }
      } catch (e) {}
    } catch (e: any) {
      yield { type: 'text', data: `Audit Engine Timeout: ${e.message}` };
    }
  }

  async *analyzeLogsStream(
    chunks: LogChunk[], 
    query: string, 
    modelId: string, 
    stats: ProcessingStats | null,
    userRole: UserRole = 'BACKEND',
    industry: Industry = 'GENERAL',
    signatures: LogSignature[] = [],
    signal?: AbortSignal
  ): AsyncGenerator<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    yield { type: 'phase', data: 'PARSING' };
    const { context, evidenceCount } = this.retrieveRankedContext(chunks, query, signatures);
    
    yield { type: 'phase', data: 'SOLVING' };

    const systemInstruction = `Lead SRE Forensic. Return RAW JSON only. Important: Extract the 'evidence_sample' as the exact raw log line from the context that proves the failure.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        incident_report: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['CRITICAL', 'WARNING', 'INFO'] },
            status: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            user_impact_percent: { type: Type.NUMBER },
            affected_components: { type: Type.ARRAY, items: { type: Type.STRING } },
            root_cause_analysis: {
              type: Type.OBJECT,
              properties: {
                primary_failure: { type: Type.STRING },
                error_signature: { type: Type.STRING },
                mechanism: { type: Type.STRING },
                description: { type: Type.STRING },
                evidence_sample: { type: Type.STRING, description: 'The exact raw log line as absolute proof.' }
              }
            },
            remediation_plan: {
              type: Type.OBJECT,
              properties: {
                immediate_action: { type: Type.STRING },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          required: ['id', 'severity', 'root_cause_analysis', 'remediation_plan']
        }
      },
      required: ['incident_report']
    };

    try {
      const stream = await ai.models.generateContentStream({
        model: modelId,
        contents: `CONTEXT:\n${context}\nQUERY: ${query}`,
        config: { 
          systemInstruction, 
          responseMimeType: "application/json", 
          responseSchema, 
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: this.LIMITS.THINKING_BUDGET_DEEP } 
        }
      });

      let fullText = "";
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
        }
      }

      try {
        const parsed = JSON.parse(fullText || '{}');
        if (parsed.incident_report) yield { type: 'structured_report', data: parsed };
        else yield { type: 'text', data: fullText };
      } catch (err) {
        yield { type: 'text', data: fullText || "Fault." };
      }
    } catch (e: any) {
       yield { type: 'text', data: `Error: ${e.message}` };
    }
  }
}
