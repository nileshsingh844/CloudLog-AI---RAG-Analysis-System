
import { GoogleGenAI, Type } from "@google/genai";
import { LogChunk, ProcessingStats, UserRole, Industry, LogSignature } from "../types";

/**
 * ARCHITECTURE: API / Streaming Layer (TypeScript)
 * Orchestrates high-fidelity forensic synthesis using multi-pass RAG ranking.
 * Optimized for low-latency streaming and reasoning transparency.
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
}

export class GeminiService {
  // Configuration Constants
  private readonly SCORING = {
    SEMANTIC_MATCH: 30,
    SEVERITY: { FATAL: 100, CRITICAL: 80, ERROR: 60, WARN: 20 },
    ENTITY_MARKERS: { EVENT_ID: 25, TRACE_ID: 35, SPAN_ID: 25 },
    SIGNATURE_MATCH: 50,
    TRACE_CAUSALITY_BOOST: 200,
    TEMPORAL_NEIGHBOR_BOOST: 40
  };
  
  private readonly THRESHOLDS = {
    SIGNAL_BOOST_MIN: 120,
    TOP_K_RESULTS: 25,
    RE_RANK_CANDIDATES: 100, // LATENCY OPTIMIZATION: Only re-rank top 100
    MAX_CONFIDENCE_CAP: 300,
    MIN_SCORE_THRESHOLD: 45
  };

  private readonly LIMITS = {
    MAX_CONTEXT_CHARS: 100000,
    MAX_CHUNK_PREVIEW: 1800,
    THINKING_BUDGET: 4000 // Tokens for forensic reasoning
  };
  
  private retrieveRankedContext(chunks: LogChunk[], query: string, signatures: LogSignature[]): RetrievalResult {
    if (!chunks || chunks.length === 0) return { context: '', evidenceCount: 0, retrievalConfidence: 0 };

    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
      .filter((token, index, arr) => arr.indexOf(token) === index);
    
    // Pass 1: Global Scoring
    const scoredNodes: ScoredNode[] = chunks.map((chunk, index) => {
      let score = 0;
      const content = chunk.content;
      const contentLower = content.toLowerCase();

      queryTokens.forEach(token => { if (contentLower.includes(token)) score += this.SCORING.SEMANTIC_MATCH; });

      if (content.includes('[FATAL]')) score += this.SCORING.SEVERITY.FATAL;
      else if (content.includes('[CRITICAL]')) score += this.SCORING.SEVERITY.CRITICAL;
      else if (content.includes('[ERROR]')) score += this.SCORING.SEVERITY.ERROR;
      else if (content.includes('[WARN]')) score += this.SCORING.SEVERITY.WARN;

      if (content.includes('EventID:')) score += this.SCORING.ENTITY_MARKERS.EVENT_ID;
      if (content.includes('trace_')) score += this.SCORING.ENTITY_MARKERS.TRACE_ID;
      if (content.includes('SpanID:')) score += this.SCORING.ENTITY_MARKERS.SPAN_ID;

      signatures.forEach(sig => { if (content.includes(sig.pattern)) score += this.SCORING.SIGNATURE_MATCH; });

      return { chunk, score, index, traceId: this.extractTraceId(content), eventId: this.extractEventId(content) };
    });

    // LATENCY OPTIMIZATION: Sort once and take a subset for expensive re-ranking
    const candidates = scoredNodes.sort((a, b) => b.score - a.score).slice(0, this.THRESHOLDS.RE_RANK_CANDIDATES);

    // Pass 2: Relational Re-Ranking (on subset)
    const highValueTraces = new Set(candidates.filter(n => n.score > this.THRESHOLDS.SIGNAL_BOOST_MIN && n.traceId).map(n => n.traceId));

    candidates.forEach((node) => {
      if (node.traceId && highValueTraces.has(node.traceId)) node.score += this.SCORING.TRACE_CAUSALITY_BOOST;
      const neighbor = scoredNodes[node.index - 1] || scoredNodes[node.index + 1];
      if (neighbor && neighbor.score > this.THRESHOLDS.SIGNAL_BOOST_MIN) node.score += this.SCORING.TEMPORAL_NEIGHBOR_BOOST;
    });

    const topK = candidates
      .filter(n => n.score >= this.THRESHOLDS.MIN_SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.THRESHOLDS.TOP_K_RESULTS);
    
    if (topK.length === 0) return { context: '', evidenceCount: 0, retrievalConfidence: 0 };

    const avgScore = topK.reduce((acc, curr) => acc + curr.score, 0) / topK.length;
    const retrievalConfidence = Math.min(100, Math.round((avgScore / this.THRESHOLDS.MAX_CONFIDENCE_CAP) * 100));
    
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

  async *analyzeInitialDiscoveryStream(stats: ProcessingStats, userRole: UserRole, industry: Industry): AsyncGenerator<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = `Senior SRE Discovery. { "greeting": string, "suggestions": string[] }. NO hallucination.`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `LOG_METRICS: ${JSON.stringify(stats)}. Role: ${userRole}.`,
        config: { systemInstruction, responseMimeType: "application/json", temperature: 0.1 }
      });
      const report = JSON.parse(response.text || '{}');
      yield { type: 'text', data: report.greeting || "Forensic node linked." };
      yield { type: 'suggestions', data: report.suggestions || [] };
    } catch (e) {
      yield { type: 'text', data: "Forensic logic online. Awaiting inquiry." };
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
    const { context, evidenceCount, retrievalConfidence } = this.retrieveRankedContext(chunks, query, signatures);
    
    yield { type: 'phase', data: 'SOLVING' };

    const systemInstruction = `Lead SRE Forensic. 
CRITICAL: Every claim must cite EventIDs/TraceIDs. Return RAW JSON.
Confidence: ${retrievalConfidence}%. Use thinking tokens to explain reasoning.`;

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
            analyst_persona: { type: Type.STRING },
            affected_components: { type: Type.ARRAY, items: { type: Type.STRING } },
            root_cause_analysis: {
              type: Type.OBJECT,
              properties: {
                primary_failure: { type: Type.STRING },
                error_signature: { type: Type.STRING },
                mechanism: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            },
            forensic_timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  event: { type: Type.STRING },
                  event_id: { type: Type.STRING },
                  trace_id: { type: Type.STRING },
                  details: { type: Type.STRING }
                }
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
          required: ['id', 'severity', 'status', 'confidence_score', 'user_impact_percent', 'root_cause_analysis', 'remediation_plan']
        }
      },
      required: ['incident_report']
    };

    try {
      if (signal?.aborted) return;
      
      const stream = await ai.models.generateContentStream({
        model: modelId,
        contents: `RETRIEVAL: Evidence=${evidenceCount}, Conf=${retrievalConfidence}%\n\nEVIDENCE:\n${context}\n\nUSER: ${query}`,
        config: { 
          systemInstruction, 
          responseMimeType: "application/json", 
          responseSchema, 
          temperature: 0.2,
          thinkingConfig: { thinkingBudget: this.LIMITS.THINKING_BUDGET } 
        }
      });

      let fullText = "";
      for await (const chunk of stream) {
        if (chunk.thinkingPath) {
          // Streaming thoughts to make the system feel active
          yield { type: 'text', data: `[Thinking] ${chunk.thinkingPath}` };
        }
        if (chunk.text) {
          fullText += chunk.text;
        }
      }

      try {
        const parsed = JSON.parse(fullText || '{}');
        if (parsed.incident_report) {
          yield { type: 'structured_report', data: parsed };
        } else {
          yield { type: 'text', data: fullText };
        }
      } catch (err) {
        yield { type: 'text', data: fullText || "Forensic stream logic fault." };
      }
    } catch (e: any) {
       yield { type: 'text', data: `RAG Retrieval Fault: ${e.message}` };
    }
  }
}
