
import { LogEntry, Severity, SearchIndex, LogChunk, FileInfo, SourceLocation, TimeBucket, TechLayer, Industry } from '../types';

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
  'Java (Spring Boot)': { patterns: ['Spring Boot', 'hibernate', 'jpa', 'org.springframework', 'log4j', 'logback'], layer: 'BACKEND' },
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

function detectEntryLayer(raw: string): TechLayer {
  for (const config of Object.values(TECH_SIGNATURES)) {
    if (config.patterns.some(p => raw.includes(p))) {
      return config.layer;
    }
  }
  return 'UNKNOWN';
}

export function parseLogFile(content: string, filename: string): { entries: LogEntry[], fileInfo: FileInfo } {
  const { format, category } = detectFormat(filename, content);
  const rawLines = content.split(/\r?\n/);
  const entries: LogEntry[] = [];
  
  // Format-specific logic
  if (format === 'JSON') {
    return parseJsonLogs(rawLines, filename, category);
  } else if (format === 'CSV') {
    return parseCsvLogs(rawLines, filename, category);
  } else if (format === 'XML') {
    return parseXmlLogs(content, filename, category);
  }

  // Fallback to Generic Text / Syslog parsing
  return parseTextLogs(rawLines, filename, format, category);
}

function parseJsonLogs(lines: string[], filename: string, category: string): { entries: LogEntry[], fileInfo: FileInfo } {
  const entries: LogEntry[] = [];
  lines.forEach((line, i) => {
    try {
      if (!line.trim()) return;
      const parsed = JSON.parse(line);
      const msg = parsed.message || parsed.msg || parsed.log || line;
      const ts = parsed.timestamp || parsed.time || parsed.ts || null;
      const level = parsed.level || parsed.severity || parsed.status || 'INFO';
      
      entries.push({
        id: `json-${i}`,
        timestamp: ts ? new Date(ts) : null,
        severity: detectSeverity(String(level) + " " + msg),
        message: msg.substring(0, 500),
        raw: line,
        occurrenceCount: 1,
        metadata: {
          hasStackTrace: !!parsed.stack || !!parsed.exception,
          signature: getLogSignature(msg),
          layer: detectEntryLayer(line),
          tenantId: parsed.tenant_id || parsed.org_id,
          transactionId: parsed.transaction_id || parsed.order_id
        }
      });
    } catch { /* skip non-json lines */ }
  });

  return { 
    entries, 
    fileInfo: { 
      originalName: filename, extension: 'json', format: 'JSON', compression: null, 
      parserUsed: 'NeuralJsonV3', isBinary: false, category 
    } 
  };
}

function parseCsvLogs(lines: string[], filename: string, category: string): { entries: LogEntry[], fileInfo: FileInfo } {
  const entries: LogEntry[] = [];
  if (lines.length < 2) return { entries, fileInfo: { originalName: filename, extension: 'csv', format: 'CSV', compression: null, parserUsed: 'TableParser', isBinary: false, category } };
  
  const headers = lines[0].split(/[;,]/).map(h => h.trim().toLowerCase());
  lines.slice(1).forEach((line, i) => {
    const cols = line.split(/[;,]/);
    if (cols.length < headers.length) return;
    
    const data: any = {};
    headers.forEach((h, idx) => data[h] = cols[idx]);

    const msg = data.message || data.msg || line;
    entries.push({
      id: `csv-${i}`,
      timestamp: data.timestamp ? new Date(data.timestamp) : null,
      severity: detectSeverity(line),
      message: msg.substring(0, 500),
      raw: line,
      occurrenceCount: 1,
      metadata: {
        hasStackTrace: false,
        signature: getLogSignature(msg),
        layer: detectEntryLayer(line)
      }
    });
  });

  return { entries, fileInfo: { originalName: filename, extension: 'csv', format: 'CSV', compression: null, parserUsed: 'TableParser', isBinary: false, category } };
}

function parseXmlLogs(content: string, filename: string, category: string): { entries: LogEntry[], fileInfo: FileInfo } {
  // Simple regex-based XML log parsing for common patterns like Windows Event Log or HL7
  const entries: LogEntry[] = [];
  const matches = content.matchAll(/<log.*?>(.*?)<\/log>/gs);
  let count = 0;
  for (const match of matches) {
    const body = match[1];
    entries.push({
      id: `xml-${count++}`,
      timestamp: null, // would need deeper regex for ts
      severity: detectSeverity(body),
      message: body.substring(0, 500).trim(),
      raw: match[0],
      occurrenceCount: 1,
      metadata: { hasStackTrace: false, signature: 'xml-node', layer: 'UNKNOWN' }
    });
  }
  return { entries, fileInfo: { originalName: filename, extension: 'xml', format: 'XML', compression: null, parserUsed: 'TagScanner', isBinary: false, category } };
}

function parseTextLogs(rawLines: string[], filename: string, format: string, category: string): { entries: LogEntry[], fileInfo: FileInfo } {
  const entries: LogEntry[] = [];
  let currentEntryLines: string[] = [];

  const finalizeEntry = (lines: string[]) => {
    if (lines.length === 0) return;
    const fullRaw = lines.join('\n');
    const signature = getLogSignature(lines[0]);
    
    let timestamp: Date | null = null;
    const tsMatch = fullRaw.match(/(\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2})|(\d{2}:\d{2}:\d{2})|(\b\w{3}\s+\d{1,2}\s\d{2}:\d{2}:\d{2}\b)/);
    if (tsMatch) {
      timestamp = new Date(tsMatch[0]);
      if (isNaN(timestamp.getTime())) timestamp = null;
    }
    
    entries.push({
      id: `txt-${entries.length}`,
      timestamp,
      severity: detectSeverity(fullRaw),
      message: lines[0].substring(0, 500),
      raw: fullRaw,
      occurrenceCount: 1,
      metadata: {
        hasStackTrace: lines.length > 1 || fullRaw.includes('at '),
        signature: signature,
        layer: detectEntryLayer(fullRaw)
      }
    });
  };

  const NEW_ENTRY_PREFIX = /^(\d{4}|\w{3}\s+\d|\[\d|<|(?:\d{2}:){2}\d{2})/;
  rawLines.forEach(line => {
    if (line.trim() === '') return;
    if (NEW_ENTRY_PREFIX.test(line) && currentEntryLines.length > 0) {
      finalizeEntry(currentEntryLines);
      currentEntryLines = [line];
    } else {
      currentEntryLines.push(line);
    }
  });
  finalizeEntry(currentEntryLines);

  return { 
    entries, 
    fileInfo: { 
      originalName: filename, extension: filename.split('.').pop() || 'log', format, 
      compression: null, parserUsed: 'ForensicDeduplicatorV3', isBinary: false, category 
    } 
  };
}

function detectSeverity(raw: string): Severity {
  const SEVERITY_LEVELS: Record<string, Severity> = {
    FATAL: Severity.FATAL, ERROR: Severity.ERROR, WARN: Severity.WARN, WARNING: Severity.WARN, INFO: Severity.INFO, DEBUG: Severity.DEBUG
  };
  for (const [label, level] of Object.entries(SEVERITY_LEVELS)) {
    if (new RegExp(`\\b${label}\\b`, 'i').test(raw)) return level;
  }
  return Severity.INFO;
}

export function detectFormat(filename: string, content: string): { format: string, category: string } {
  const sample = content.trim().substring(0, 500);
  if (sample.startsWith('{') || sample.startsWith('[')) return { format: 'JSON', category: 'Modern App' };
  if (sample.startsWith('<')) return { format: 'XML', category: 'Structured System' };
  if (sample.includes(',') && sample.split('\n')[0].split(',').length > 2) return { format: 'CSV', category: 'Tabular Data' };
  if (/\w{3}\s+\d{1,2}\s\d{2}:\d{2}:\d{2}/.test(sample)) return { format: 'Syslog', category: 'Network Infrastructure' };
  return { format: 'Generic Text', category: 'General' };
}

export function getLogSignature(message: string): string {
  return message.replace(/\d+/g, '#').replace(/[a-f0-9]{8,}/g, 'ID').trim();
}

export function buildSearchIndex(chunks: LogChunk[]): SearchIndex {
  const invertedIndex = new Map<string, Set<string>>();
  chunks.forEach(chunk => {
    const tokens = new Set(chunk.content.toLowerCase().split(/\s+/));
    tokens.forEach(token => {
      if (!invertedIndex.has(token)) invertedIndex.set(token, new Set());
      invertedIndex.get(token)!.add(chunk.id);
    });
  });
  return { invertedIndex, termWeights: new Map() };
}

export function generateTimeBuckets(entries: LogEntry[]): TimeBucket[] { return []; }
export function chunkLogEntries(entries: LogEntry[]): LogChunk[] { return []; }
export function serializeIndex(index: SearchIndex | null): any { return null; }
export function deserializeIndex(serialized: any): SearchIndex | null { return null; }
