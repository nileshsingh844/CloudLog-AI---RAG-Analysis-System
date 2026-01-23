
import { LogEntry, Severity, SearchIndex, LogChunk, FileInfo } from '../types';

/**
 * Universal Log Pattern Library
 */
const LOG_PATTERNS: Record<string, { regex: RegExp, category: string }> = {
  apache_combined: {
    regex: /^(\S+) \S+ \S+ \[([\w:/]+\s[+\-]\d{4})\] "(.+?)" (\d{3}) (\S+)/,
    category: 'Web Server'
  },
  nginx_combined: {
    regex: /^(\S+) - (\S+) \[([\w:/]+\s[+\-]\d{4})\] "(.+?)" (\d{3}) (\d+) "([^"]*)" "([^"]*)"/,
    category: 'Web Server'
  },
  syslog_rfc5424: {
    regex: /^<(\d+)>(\d+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (.*)/,
    category: 'System'
  },
  syslog_rfc3164: {
    regex: /^<(\d+)>(\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2}) (\S+) (.*)/,
    category: 'System'
  },
  iso8601_standard: {
    regex: /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+([A-Z]+)\s+(.*)/i,
    category: 'General'
  },
  java_log4j: {
    regex: /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})\s+\[(.*?)\]\s+([A-Z]+)\s+(.*?)\s+-\s+(.*)/,
    category: 'Runtime'
  },
  nmea_gps: {
    regex: /^\$GP[A-Z]{3},/,
    category: 'IoT/GNSS'
  },
  canbus_asc: {
    regex: /^\s*\d+\.\d+\s+\d+\s+[0-9A-F]+x\s+[0-9A-F\s]+/,
    category: 'Automotive'
  }
};

const SEVERITY_LEVELS: Record<string, Severity> = {
  FATAL: Severity.FATAL, CRITICAL: Severity.FATAL, EMERGENCY: Severity.FATAL, ALERT: Severity.FATAL,
  ERROR: Severity.ERROR, ERR: Severity.ERROR, FAIL: Severity.ERROR, SEVERE: Severity.ERROR,
  WARN: Severity.WARN, WARNING: Severity.WARN,
  INFO: Severity.INFO, NOTICE: Severity.INFO, EVENT: Severity.INFO,
  DEBUG: Severity.DEBUG, TRACE: Severity.DEBUG, VERBOSE: Severity.DEBUG, LOW: Severity.DEBUG
};

/**
 * Multi-Stage Format Detector
 */
export function detectFormat(filename: string, content: string): { format: string, category: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const firstLines = content.split('\n').slice(0, 10);

  // Stage 1: Content-based (JSON/XML/CSV)
  try {
    if (firstLines[0].trim().startsWith('{')) {
      JSON.parse(firstLines[0]);
      return { format: 'JSON (Structured)', category: 'Modern App' };
    }
  } catch {}

  if (firstLines[0].trim().startsWith('<?xml')) return { format: 'XML', category: 'Legacy App' };
  
  // Stage 2: Pattern-based
  for (const [key, pattern] of Object.entries(LOG_PATTERNS)) {
    if (firstLines.some(line => pattern.regex.test(line))) {
      return { format: key.replace(/_/g, ' ').toUpperCase(), category: pattern.category };
    }
  }

  // Stage 3: Extension-based hints
  if (['pcap', 'pcapng'].includes(ext)) return { format: 'PCAP (Network)', category: 'Security' };
  if (['trc', 'trace'].includes(ext)) return { format: 'Diagnostic Trace', category: 'IoT/Embedded' };
  if (ext === 'qxdm') return { format: 'Qualcomm QXDM', category: 'Cellular' };

  return { format: 'Generic Text', category: 'General' };
}

export function getLogSignature(message: string): string {
  return message
    .replace(/\b\d+\.\d+\.\d+\.\d+\b/g, '<IP>')
    .replace(/\b[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\b/g, '<UUID>')
    .replace(/\b0x[0-9a-fA-F]+\b/g, '<HEX>')
    .replace(/\b\d+\b/g, '<NUM>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchIndex(chunks: LogChunk[]): SearchIndex {
  const invertedIndex = new Map<string, Set<string>>();
  const termDocCount = new Map<string, number>();

  chunks.forEach(chunk => {
    const tokens = new Set(
      chunk.content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );

    tokens.forEach(token => {
      if (!invertedIndex.has(token)) {
        invertedIndex.set(token, new Set());
        termDocCount.set(token, 0);
      }
      invertedIndex.get(token)!.add(chunk.id);
      termDocCount.set(token, termDocCount.get(token)! + 1);
    });
  });

  const termWeights = new Map<string, number>();
  const totalDocs = chunks.length;
  termDocCount.forEach((count, term) => {
    termWeights.set(term, Math.log(totalDocs / (1 + count)));
  });

  return { invertedIndex, termWeights };
}

export function parseLogFile(content: string, filename: string, offset: number = 0): { entries: LogEntry[], fileInfo: FileInfo } {
  const { format, category } = detectFormat(filename, content);
  const rawLines = content.split(/\r?\n/);
  const entries: LogEntry[] = [];
  let currentEntryLines: string[] = [];

  const finalizeEntry = (lines: string[]) => {
    if (lines.length === 0) return;
    const fullRaw = lines.join('\n');
    let severity = Severity.UNKNOWN;
    
    // Look for severity labels
    for (const [label, level] of Object.entries(SEVERITY_LEVELS)) {
      const regex = new RegExp(`\\b${label}\\b`, 'i');
      if (regex.test(fullRaw)) {
        severity = level;
        break;
      }
    }

    // Smart Timestamp Detection
    let timestamp: Date | null = null;
    const tsMatch = fullRaw.match(/(\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)|(\d{2}:\d{2}:\d{2}(?:\.\d+)?)/);
    if (tsMatch) {
      timestamp = new Date(tsMatch[0]);
      if (isNaN(timestamp.getTime())) {
        timestamp = null;
      }
    }

    const firstLine = lines[0];
    entries.push({
      id: `log-${offset + entries.length}`,
      timestamp: timestamp,
      severity,
      message: firstLine.substring(0, 500),
      raw: fullRaw,
      metadata: {
        hasStackTrace: lines.length > 1,
        signature: getLogSignature(firstLine),
        formatDetected: format
      }
    });
  };

  // Basic line-by-line grouping logic
  // New entries start if a line starts with a common log prefix
  const NEW_ENTRY_PREFIX = /^(\d{4}|\w{3}\s+\d|\[\d|<)/;

  rawLines.forEach((line) => {
    if (line.trim() === '') return;

    if (NEW_ENTRY_PREFIX.test(line) && currentEntryLines.length > 0) {
      finalizeEntry(currentEntryLines);
      currentEntryLines = [line];
    } else {
      currentEntryLines.push(line);
    }
  });

  finalizeEntry(currentEntryLines);

  const fileInfo: FileInfo = {
    originalName: filename,
    extension: filename.split('.').pop() || '',
    format,
    compression: filename.match(/\.(gz|bz2|xz|zst|zip)$/) ? filename.split('.').pop()! : null,
    parserUsed: format === 'JSON (Structured)' ? 'JSONLogParser' : 'GenericTextParser',
    isBinary: ['pcap', 'pcapng', 'qxdm', 'evtx'].includes(filename.split('.').pop()?.toLowerCase() || ''),
    category
  };

  return { entries, fileInfo };
}

export function chunkLogEntries(entries: LogEntry[], maxTokens: number = 2500): LogChunk[] {
  const chunks: LogChunk[] = [];
  let current: LogEntry[] = [];
  let currentSize = 0;

  entries.forEach(entry => {
    const entrySize = Math.ceil(entry.raw.length / 4);

    if (currentSize + entrySize > maxTokens && current.length > 0) {
      chunks.push({
        id: `chunk-${chunks.length}`,
        content: current.map(e => e.raw).join('\n'),
        entries: [...current],
        tokenCount: currentSize
      });
      current = [];
      currentSize = 0;
    }

    current.push(entry);
    currentSize += entrySize;
  });

  if (current.length > 0) {
    chunks.push({
      id: `chunk-${chunks.length}`,
      content: current.map(e => e.raw).join('\n'),
      entries: [...current],
      tokenCount: currentSize
    });
  }

  return chunks;
}
