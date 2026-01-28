
import { getLogSignature, detectTechStack, detectIndustry } from './logParser';
import { TestResult, Severity, LogEntry } from '../types';
import { GeminiService } from '../services/geminiService';

/**
 * Executes the Comprehensive Forensic Pipeline Audit.
 * Validates the 4 Pillars of Log RAG: 
 * 1. Normalization (Signature Fidelity)
 * 2. Enrichment (Contextual Awareness)
 * 3. Atomic Chunking (Causal Integrity)
 * 4. Retrieval Precision (Recall)
 */
export async function runForensicPipelineSuite(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const gemini = new GeminiService();
  
  const addResult = (name: string, status: 'passed' | 'failed', message?: string, start?: number) => {
    results.push({ 
      id: Math.random().toString(36).substring(7), 
      name, 
      status, 
      message, 
      duration: start ? Date.now() - start : 0 
    });
  };

  // 1. Quality: PII Redaction & Normalization
  const cleaningStart = Date.now();
  try {
    const sensitiveLog = "2026-05-20T10:00:00Z [ERROR] User login failed: email=test-admin@company.com ip=192.168.1.1 token=sk_live_51Msz82";
    const sig = getLogSignature(sensitiveLog);
    
    // Explicit verification for all 3 tokens in the sample
    const emailRedacted = !sig.includes('test-admin');
    const tokenRedacted = !sig.includes('sk_live');
    const ipRedacted = sig.includes('IP_ADDR') && !sig.includes('192.168.1.1');
    
    if (emailRedacted && tokenRedacted && ipRedacted) {
      addResult("Quality: PII Redaction", "passed", "Identity tokens and sensitive keys successfully collapsed into logic signatures.", cleaningStart);
    } else {
      const failures = [];
      if (!emailRedacted) failures.push('Email leak');
      if (!tokenRedacted) failures.push('Token leak');
      if (!ipRedacted) failures.push('IP unmasked');
      addResult("Quality: PII Redaction", "failed", `Forensic signature contains unmasked identity tokens: ${failures.join(', ')}`, cleaningStart);
    }
  } catch (e: any) {
    addResult("Quality: PII Redaction", "failed", e.message, cleaningStart);
  }

  // 2. Quality: Industry & Stack Enrichment
  const metaStart = Date.now();
  try {
    const javaLog = "java.lang.NullPointerException at com.cloud.PaymentGateway.process(PaymentGateway.java:45)";
    const stack = detectTechStack(javaLog);
    const industry = detectIndustry("transaction_id=8829 swift_code=XYZ reconciliation failure");

    const stackMatch = stack.includes('Java (Spring Boot)');
    const industryMatch = industry === 'FINTECH';

    if (stackMatch && industryMatch) {
      addResult("Quality: Context Enrichment", "passed", "Neural fingerprints correctly identified JAVA stack and FINTECH domain logic.", metaStart);
    } else {
      addResult("Quality: Context Enrichment", "failed", `Detection mismatch. Stack: ${stack.join(', ')} (Expected Java), Industry: ${industry} (Expected FINTECH)`, metaStart);
    }
  } catch (e: any) {
    addResult("Quality: Context Enrichment", "failed", e.message, metaStart);
  }

  // 3. Quality: Atomic Chunking (Causal Integrity)
  const ingestionStart = Date.now();
  let testWorker: Worker | null = null;
  try {
    const workerRes = await fetch('/worker.js');
    if (!workerRes.ok) throw new Error("Worker source unreachable");
    const script = await workerRes.text();
    testWorker = new Worker(URL.createObjectURL(new Blob([script], { type: 'application/javascript' })));

    // Test for multiline stack trace preservation
    const multilineContent = "2026-05-15T10:00:00Z [FATAL] StackOverFlow\n  at com.cloud.App.loop(App.java:99)\n  at java.lang.Thread.run(Thread.java:12)";
    const logFile = new File([multilineContent], 'causal-integrity.log', { type: 'text/plain' });

    const payload = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Ingestion timed out")), 5000);
      testWorker!.onmessage = (e) => {
        if (e.data.type === 'READY') testWorker!.postMessage({ file: logFile });
        else if (e.data.type === 'COMPLETE') { clearTimeout(timeout); resolve(e.data.payload); }
      };
      testWorker!.postMessage({ type: 'INIT' });
    });

    const isGrouped = payload.logs[0].raw.includes('at com.cloud.App.loop');
    
    if (isGrouped && payload.logs[0].metadata.hasStackTrace) {
      addResult("Quality: Causal Integrity", "passed", "Semantic chunking preserved multiline stack traces as atomic logic nodes.", ingestionStart);
    } else {
      addResult("Quality: Causal Integrity", "failed", "Chunking fragmented the trace. Causal link broken.", ingestionStart);
    }
  } catch (e: any) {
    addResult("Quality: Causal Integrity", "failed", `Flow break: ${e.message}`, ingestionStart);
  } finally {
    testWorker?.terminate();
  }

  // 4. Quality: Weighted RAG Retrieval Precision
  const ragStart = Date.now();
  try {
    const mockChunks = [
      { id: '1', content: "[INFO] System booting normally" },
      { id: '2', content: "[FATAL] Root Cause: Buffer overflow in 'payment-router' caused by large payload" },
      { id: '3', content: "[DEBUG] Log rotation check complete" }
    ];
    const query = "Analyze buffer overflow in payment services";
    
    const relevant = (gemini as any).retrieveRelevantContext(mockChunks, query, []);
    const precise = relevant.includes('payment-router') && !relevant.includes('Log rotation');

    if (precise) {
      addResult("Quality: Retrieval Precision", "passed", "Weighted ranker successfully prioritized the 'Buffer overflow' needle.", ragStart);
    } else {
      addResult("Quality: Retrieval Precision", "failed", "Recall failed to isolate critical failure node from noise.", ragStart);
    }
  } catch (e: any) {
    addResult("Quality: Retrieval Precision", "failed", e.message, ragStart);
  }

  return results;
}
