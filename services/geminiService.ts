
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { LogChunk, ChatMessage, SearchIndex, CodeFile, KnowledgeFile, Severity, StructuredAnalysis, LogSignature, ProcessingStats, UserRole, Industry } from "../types";

export class GeminiService {
  private parseResilientJson(text: string | undefined): any {
    if (!text) return null;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : JSON.parse(text);
    } catch { return null; }
  }

  async *analyzeLogsStream(
    chunks: LogChunk[], 
    index: SearchIndex | null, 
    sourceFiles: CodeFile[],
    knowledgeFiles: KnowledgeFile[],
    query: string, 
    modelId: string, 
    history: ChatMessage[] = [],
    activeSignatures: LogSignature[] = [],
    stats?: ProcessingStats | null,
    userRole: UserRole = 'BACKEND',
    industry: Industry = 'GENERAL'
  ): AsyncGenerator<any> {
    if (chunks.length === 0) return;

    yield { type: 'status', data: `Orchestrator: Tailoring insights for ${userRole} in ${industry} Domain...` };
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const detectedStack = stats?.detectedStack?.join(', ') || 'Unknown';
    const systemInstruction = `You are a Lead Forensic SRE expert.
    Analyze logs across multiple tiers: FRONTEND, BACKEND, DATABASE, INFRASTRUCTURE.
    
    DOMAIN EXPERTISE: ${industry} Industry.
    Apply specialized knowledge for:
    - ECOMMERCE: Cart abandonment vs gateway timeouts, inventory race conditions.
    - FINTECH: Transaction atomicity, PCI compliance failures, fraud patterns.
    - HEALTHCARE: HIPAA privacy violations, HL7 message integrity, device failures.
    - GAMING: Matchmaking latency, disconnect clusters, server-side auth cheats.
    - SAAS: Multi-tenant leakage, per-org resource starvation.

    PERSONA CONTEXT: The user is a ${userRole}. 
    
    TASK: Distributed Root Cause + Domain-Specific Insights.
    Output JSON only.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        severity: { type: Type.STRING },
        confidence_score: { type: Type.NUMBER },
        executive_summary: { type: Type.STRING },
        root_cause_hypothesis: { type: Type.STRING },
        user_impact_percent: { type: Type.NUMBER },
        hypotheses: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggested_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
        industry_metrics: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } } },
        wizardPlan: { type: Type.OBJECT, properties: { steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, layer: { type: Type.STRING } } } } } }
      },
      required: ['severity', 'confidence_score', 'executive_summary', 'root_cause_hypothesis', 'suggested_actions', 'hypotheses']
    };

    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: `STACK: ${detectedStack}\nINDUSTRY: ${industry}\nQUERY: ${query}`,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema, temperature: 0.1 }
      });

      let fullResponseText = "";
      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullResponseText += c.text;
          yield { type: 'partial_text', data: "Expert domain synthesis active..." };
        }
      }

      const report = this.parseResilientJson(fullResponseText);
      if (report) {
        yield { type: 'structured_report', data: report };
        yield { type: 'text', data: report.executive_summary };
      }
    } catch (e: any) {
       yield { type: 'text', data: `Fault: ${e.message}` };
    }
  }

  async extractUniqueSignatures(chunks: LogChunk[]): Promise<LogSignature[]> { return []; }
  async generateFollowUpSuggestions(content: string, query: string): Promise<string[]> { return []; }
}
