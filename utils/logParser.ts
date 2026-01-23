
import { LogEntry, Severity, SearchIndex, LogChunk, FileInfo, SourceLocation, TimeBucket } from '../types';

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
 * Stack Trace Extraction & Detection Patterns
 */
const STACK_TRACE_PATTERNS = [
  // Java: at com.package.Class.method(FileName.java:123)
  /at\s+([\w$.]+)\.([\w$<>]+)\(([^:)]+):(\d+)\)/,
  // Python: File "filename.py", line 123, in method
  /File\s+"([^"]+)",\s+line\s+(\d+),\s+in\s+(\w+)/,
  // Node/JS: at method (filename.js:123:45) or at filename.js:123:45
  /at\s+(?:(.+)\s+\()?([^:(\s]+):(\d+):(\d+)\)?/,
  // C#: at Namespace.Class.Method(...) in path\to\file.cs:line 123
  /at\s+(.+)\s+in\s+(.+):line\s+(\d+)/,
  // General: path/to/file:123
  /([/\w\.-]+\.\w+):(\d+)/
];

const STACK_CONTINUATION_REGEX = /^\s+(at\s+|Caused\s+by|...|[\w$.]+\(.*\)|---|\s* File\s*|Traceback)|^\t/i;

function isLibraryPath(path: string): boolean {
  const libMarkers = [
    'node_modules', 'site-packages', 'dist-packages', 'vendor', 'lib/python',
    'maven2', '.m2', 'jdk', 'jre', 'jar:', 'target/classes', 'usr/lib',
    'usr/local/lib', 'bower_components', 'Internal.Packages'
  ];
  return libMarkers.some(marker => path.toLowerCase().includes(marker.toLowerCase()));
}

export function extractSourceLocations(raw: string): SourceLocation[] {
  const locations: SourceLocation[] = [];
  const lines = raw.split('\n');
  
  lines.forEach(line => {
    for (const pattern of STACK_TRACE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        let loc: SourceLocation | null = null;
        
        if (pattern.source.includes('at\\s+([\\w$.]+)')) {
          loc = { filePath: match[3], line: parseInt(match[4]), method: `${match[1]}.${match[2]}` };
        } else if (pattern.source.includes('File\\s+"([^"]+)"')) {
          loc = { filePath: match[1], line: parseInt(match[2]), method: match[3] };
        } else if (pattern.source.includes('at\\s+(?:(.+)\\s+\\()?')) {
          loc = { filePath: match[2], line: parseInt(match[3]), method: match[1] };
        } else if (pattern.source.includes('at\\s+(.+)\\s+in\\s+(.+):line')) {
          loc = { filePath: match[2], line: parseInt(match[3]), method: match[1] };
        } else {
          loc = { filePath: match[1], line: parseInt(match[2]) };
        }

        if (loc) {
          loc.isLibrary = isLibraryPath(loc.filePath);
          locations.push(loc);
        }
        break; 
      }
    }
  });

  return Array.from(new Set(locations.map(l => `${l.filePath}:${l.line}`)))
    .map(key => locations.find(l => `${l.filePath}:${l.line}` === key)!);
}

export function detectFormat(filename: string, content: string): { format: string, category: string } {
  const firstLines = content.split('\n').slice(0, 10);
  try {
    if (firstLines[0]?.trim().startsWith('{')) {
      JSON.parse(firstLines[0]);
      return { format: 'JSON (Structured)', category: 'Modern App' };
    }
  } catch {}
  if (firstLines[0]?.trim().startsWith('<?xml')) return { format: 'XML', category: 'Legacy App' };
  for (const [key, pattern] of Object.entries(LOG_PATTERNS)) {
    if (firstLines.some(line => pattern.regex.test(line))) {
      return { format: key.replace(/_/g, ' ').toUpperCase(), category: pattern.category };
    }
  }
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
      chunk.content.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 2)
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

export function serializeIndex(index: SearchIndex | null): any {
  if (!index) return null;
  const invertedIndexObj: Record<string, string[]> = {};
  index.invertedIndex.forEach((val, key) => { invertedIndexObj[key] = Array.from(val); });
  const termWeightsObj: Record<string, number> = {};
  index.termWeights.forEach((val, key) => { termWeightsObj[key] = val; });
  return { invertedIndex: invertedIndexObj, termWeights: termWeightsObj };
}

export function deserializeIndex(serialized: any): SearchIndex | null {
  if (!serialized) return null;
  const invertedIndex = new Map<string, Set<string>>();
  Object.entries(serialized.invertedIndex || {}).forEach(([key, val]) => { invertedIndex.set(key, new Set(val as string[])); });
  const termWeights = new Map<string, number>();
  Object.entries(serialized.termWeights || {}).forEach(([key, val]) => { termWeights.set(key, val as number); });
  return { invertedIndex, termWeights };
}

export function generateTimeBuckets(entries: LogEntry[], bucketCount: number = 24): TimeBucket[] {
  const validEntries = entries.filter(e => e.timestamp);
  if (validEntries.length === 0) return [];
  
  const timestamps = validEntries.map(e => e.timestamp!.getTime());
  const start = Math.min(...timestamps);
  const end = Math.max(...timestamps);
  const totalRange = end - start;
  
  if (totalRange <= 0) {
    return [{ 
      time: new Date(start).toISOString(), 
      count: entries.length, 
      errorCount: entries.filter(e => e.severity === Severity.ERROR || e.severity === Severity.FATAL).length 
    }];
  }

  const bucketSize = totalRange / bucketCount;
  const buckets: TimeBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    time: new Date(start + i * bucketSize).toISOString(),
    count: 0,
    errorCount: 0
  }));

  entries.forEach(entry => {
    if (!entry.timestamp) return;
    const time = entry.timestamp.getTime();
    let index = Math.floor((time - start) / bucketSize);
    if (index >= bucketCount) index = bucketCount - 1;
    if (index < 0) index = 0;
    
    buckets[index].count++;
    if (entry.severity === Severity.ERROR || entry.severity === Severity.FATAL) {
      buckets[index].errorCount++;
    }
  });

  return buckets;
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
    for (const [label, level] of Object.entries(SEVERITY_LEVELS)) {
      if (new RegExp(`\\b${label}\\b`, 'i').test(fullRaw)) {
        severity = level;
        break;
      }
    }
    let timestamp: Date | null = null;
    const tsMatch = fullRaw.match(/(\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)|(\d{2}:\d{2}:\d{2}(?:\.\d+)?)/);
    if (tsMatch) {
      timestamp = new Date(tsMatch[0]);
      if (isNaN(timestamp.getTime())) timestamp = null;
    }
    const sourceLocations = extractSourceLocations(fullRaw);
    entries.push({
      id: `log-${offset + entries.length}`,
      timestamp,
      severity,
      message: lines[0].substring(0, 500),
      raw: fullRaw,
      metadata: {
        hasStackTrace: lines.length > 1,
        signature: getLogSignature(lines[0]),
        formatDetected: format,
        sourceLocations: sourceLocations.length > 0 ? sourceLocations : undefined
      }
    });
  };

  const NEW_ENTRY_PREFIX = /^(\d{4}|\w{3}\s+\d|\[\d|<)/;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.trim() === '') continue;

    const looksLikeNewEntry = NEW_ENTRY_PREFIX.test(line);
    const looksLikeStackTrace = STACK_CONTINUATION_REGEX.test(line);

    // Lookahead logic: if it looks like a new entry, confirm it isn't just a nested log line 
    // that belongs to a multi-line stack trace/exception.
    if (looksLikeNewEntry && !looksLikeStackTrace && currentEntryLines.length > 0) {
      // Basic state-based grouping check: 
      // If we are currently processing a block that definitely has stack trace markers,
      // and the next line is indented or has stack-like traits, we might want to continue.
      finalizeEntry(currentEntryLines);
      currentEntryLines = [line];
    } else {
      currentEntryLines.push(line);
    }
  }

  finalizeEntry(currentEntryLines);

  const fileInfo: FileInfo = {
    originalName: filename,
    extension: filename.split('.').pop() || '',
    format,
    compression: filename.match(/\.(gz|bz2|xz|zst|zip)$/) ? filename.split('.').pop()! : null,
    parserUsed: 'SmartForensicParser',
    isBinary: false,
    category
  };

  return { entries, fileInfo };
}

/**
 * Refactored chunking logic for improved stack trace association.
 * Ensures that if a single large log entry is split across chunks, 
 * the context (header, timestamp, severity) is repeated in the subsequent segments.
 */
export function chunkLogEntries(entries: LogEntry[], maxTokens: number = 2500): LogChunk[] {
  const chunks: LogChunk[] = [];
  let currentBatch: LogEntry[] = [];
  let currentBatchTokens = 0;

  const pushBatch = () => {
    if (currentBatch.length === 0) return;
    chunks.push({
      id: `chunk-${chunks.length}`,
      content: currentBatch.map(e => e.raw).join('\n'),
      entries: [...currentBatch],
      tokenCount: currentBatchTokens
    });
    currentBatch = [];
    currentBatchTokens = 0;
  };

  entries.forEach(entry => {
    const entryTokens = Math.ceil(entry.raw.length / 4);

    // Case 1: Entry itself is larger than chunk limit (likely massive stack trace)
    if (entryTokens > maxTokens) {
      pushBatch(); // Flush existing batch first
      
      const lines = entry.raw.split('\n');
      const headerLine = lines[0]; // Retain the first line for context repetition
      const headerTokens = Math.ceil(headerLine.length / 4);
      
      let subChunkLines: string[] = [headerLine];
      let subChunkTokens = headerTokens;

      for (let j = 1; j < lines.length; j++) {
        const line = lines[j];
        const lineTokens = Math.ceil(line.length / 4);

        if (subChunkTokens + lineTokens > maxTokens) {
          // Push current sub-chunk
          chunks.push({
            id: `chunk-${chunks.length}`,
            content: subChunkLines.join('\n'),
            entries: [entry], // Associate with same entry
            tokenCount: subChunkTokens
          });
          // Start next sub-chunk by repeating the header context
          subChunkLines = [headerLine, `[Continuation from Part ${chunks.length}] ${line}`];
          subChunkTokens = headerTokens + Math.ceil(subChunkLines[1].length / 4);
        } else {
          subChunkLines.push(line);
          subChunkTokens += lineTokens;
        }
      }
      
      // Final segment of the split entry
      if (subChunkLines.length > 1) {
        chunks.push({
          id: `chunk-${chunks.length}`,
          content: subChunkLines.join('\n'),
          entries: [entry],
          tokenCount: subChunkTokens
        });
      }
      return;
    }

    // Case 2: Adding entry would exceed current batch limit
    if (currentBatchTokens + entryTokens > maxTokens) {
      pushBatch();
    }
    
    currentBatch.push(entry);
    currentBatchTokens += entryTokens;
  });

  pushBatch(); // Final flush
  return chunks;
}
