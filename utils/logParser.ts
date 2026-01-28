
import { LogEntry, Severity, SearchIndex, LogChunk, FileInfo, TechLayer, Industry, TimeBucket } from '../types';

/**
 * Enhanced Industry Fingerprints
 */
const INDUSTRY_SIGNATURES: Record<Industry, string[]> = {
  ECOMMERCE: ['cart', 'payment', 'checkout', 'sku', 'order_id', 'stripe', 'paypal', 'inventory'],
  FINTECH: ['transaction', 'reconciliation', 'pci-dss', 'account_balance', 'kyc', 'fraud', 'swift', 'iban'],
  SAAS: ['tenant_id', 'subscription', 'quota_exceeded', 'multi-tenancy', 'billing_plan', 'org_id'],
  GAMING: ['player_id', 'matchmaking', 'latency', 'disconnect', 'game_server', 'cheat_detected', 'tick_rate'],
  HEALTHCARE: ['hipaa', 'patient_id', 'hl7', 'medical_device', 'ehr', 'phi_access', 'fhir'],
  GENERAL: []
};

const TECH_SIGNATURES: Record<string, { patterns: string[], layer: TechLayer }> = {
  'Node.js (Express/Nest)': { patterns: ['express', 'node_modules', 'GET /', 'POST /', 'morgan', 'body-parser', 'winston', 'bunyan'], layer: 'BACKEND' },
  'Python (Django/Flask)': { patterns: ['django.', 'wsgi', 'runserver', 'flask.', 'gunicorn', 'Traceback (most recent call last)'], layer: 'BACKEND' },
  'Java (Spring Boot)': { patterns: ['Spring Boot', 'hibernate', 'jpa', 'org.springframework', 'log4j', 'logback', 'java.lang.'], layer: 'BACKEND' },
  'Kubernetes': { patterns: ['kubelet', 'kube-proxy', 'pod/', 'replicaSet', 'ContainerCreating', 'CrashLoopBackOff'], layer: 'INFRASTRUCTURE' },
  'PostgreSQL': { patterns: ['ERROR:  ', 'LOG:  duration:', 'FATAL:  password authentication failed', 'VACUUM', 'PL/pgSQL'], layer: 'DATABASE' },
  'MySQL/MariaDB': { patterns: ['mysqld', 'Access denied for user', 'Slow query', 'InnoDB'], layer: 'DATABASE' },
  'MongoDB': { patterns: ['query executor error', 'connection pool', 'mongodb://', 'replica set'], layer: 'DATABASE' },
  'Redis': { patterns: ['RDB', 'AOF', 'eviction', 'redis-server', 'JedisConnectionException'], layer: 'DATABASE' },
  'Nginx/Apache': { patterns: ['nginx error', 'upstream timed out', 'AH00', 'client denied by server configuration'], layer: 'INFRASTRUCTURE' },
  'Android': { patterns: ['Logcat', 'ActivityManager', 'WindowManager', 'dalvikvm', 'art: '], layer: 'FRONTEND' },
  'React/Frontend': { patterns: ['ReactNativeJS', 'Window Error', 'Redux', 'Vue', 'Next.js'], layer: 'FRONTEND' },
};

export function detectIndustry(content: string): Industry {
  const sample = content.substring(0, 10000).toLowerCase();
  let bestMatch: Industry = 'GENERAL';
  let maxHits = 0;

  for (const [ind, patterns] of Object.entries(INDUSTRY_SIGNATURES)) {
    const hits = patterns.filter(p => sample.includes(p)).length;
    if (hits > maxHits) {
      maxHits = hits;
      bestMatch = ind as Industry;
    }
  }
  return bestMatch;
}

export function detectTechStack(content: string): string[] {
  const sample = content.substring(0, 10000);
  const detected: string[] = [];
  for (const [tech, config] of Object.entries(TECH_SIGNATURES)) {
    if (config.patterns.some(p => sample.includes(p))) {
      detected.push(tech);
    }
  }
  return detected;
}

/**
 * Standardized Forensic Normalizer
 * Used by both worker and test runner to ensure consistency
 */
export function getLogSignature(message: string): string {
  if (!message) return 'EMPTY';
  
  let sig = message;
  
  // 1. Precise IP Redaction (Preserving IP_ADDR token for quality audit)
  sig = sig.replace(/(?:\d{1,3}\.){3}\d{1,3}/g, 'IP_ADDR');
  
  // 2. Precise Email Redaction (Preserving EMAIL_ADDR token)
  sig = sig.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'EMAIL_ADDR');
  
  // 3. Robust Key-Value PII Redaction
  // Handles keys like token, secret, auth, etc., but ignores already redacted tokens
  const piiKeys = 'auth|token|key|secret|password|user|pwd|credential|email|ip';
  const kvRegex = new RegExp(`(?:${piiKeys})=[^ \\t\\n,;]+`, 'gi');
  
  sig = sig.replace(kvRegex, (match) => {
    const [key, val] = match.split('=');
    if (val === 'IP_ADDR' || val === 'EMAIL_ADDR') return match;
    return `${key}=REDACTED`;
  });

  // 4. Collapse Path and Hex Identifiers
  // Note: We use specific markers to avoid 'HEX_ID' being mangled by digit normalization
  return sig
    .replace(/\/[\w\-\.\/]+/g, '/FS_PATH')                  
    .replace(/[a-f0-9]{8,}/gi, 'XID')                     
    .replace(/\d+/g, '#')                                
    .trim();
}

export function generateTimeBuckets(entries: LogEntry[]): TimeBucket[] {
  if (entries.length === 0) return [];

  const validEntries = entries.filter(e => e.timestamp !== null) as (LogEntry & { timestamp: Date })[];
  const bucketCount = 40;
  
  if (validEntries.length === 0) {
    return Array.from({ length: bucketCount }, (_, i) => ({
      time: new Date().toISOString(), count: 0, errorCount: 0
    }));
  }

  const timestamps = validEntries.map(e => e.timestamp.getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const duration = maxTime - minTime;
  const bucketSize = duration / bucketCount || 1;

  const buckets: TimeBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    time: new Date(minTime + i * bucketSize).toISOString(),
    count: 0,
    errorCount: 0
  }));

  validEntries.forEach(entry => {
    const bucketIndex = Math.min(bucketCount - 1, Math.floor((entry.timestamp.getTime() - minTime) / bucketSize));
    buckets[bucketIndex].count++;
    if (entry.severity === Severity.ERROR || entry.severity === Severity.FATAL) {
      buckets[bucketIndex].errorCount++;
    }
  });

  return buckets;
}

export function chunkLogEntries(entries: LogEntry[]): LogChunk[] {
  const chunks: LogChunk[] = [];
  const CHUNK_SIZE = 100;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const segment = entries.slice(i, i + CHUNK_SIZE);
    chunks.push({
      id: `chunk-${i}`,
      content: segment.map(e => `[${e.severity}] ${e.raw}`).join('\n---\n')
    });
  }
  return chunks;
}

export function parseLogFile(line: string, filename: string): { entries: LogEntry[] } {
  const sig = getLogSignature(line);
  return {
    entries: [{
      id: Math.random().toString(36),
      timestamp: null,
      severity: Severity.INFO,
      message: line.substring(0, 500),
      raw: line,
      occurrenceCount: 1,
      metadata: { hasStackTrace: false, signature: sig, layer: 'UNKNOWN' }
    }]
  };
}
