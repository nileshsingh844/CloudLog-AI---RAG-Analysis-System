
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
  /at\s+([\w$.]+)\.([\w$<>]+)\(([^:)]+):(\d+)\)/,
  /File\s+"([^"]+)",\s+line\s+(\d+),\s+in\s+(\w+)/,
  /at\s+(?:(.+)\s+\()?([^:(\s]+):(\d+):(\d+)\)?/,
  /at\s+(.+)\s+in\s+(.+):line\s+(\d+)/,
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
      count: entries.reduce((acc, e) => acc + e.occurrenceCount, 0), 
      errorCount: entries.filter(e => e.severity === Severity.ERROR || e.severity === Severity.FATAL).reduce((acc, e) => acc + e.occurrenceCount, 0)
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
    
    buckets[index].count += entry.occurrenceCount;
    if (entry.severity === Severity.ERROR || entry.severity === Severity.FATAL) {
      buckets[index].errorCount += entry.occurrenceCount;
    }
  });

  return buckets;
}

export function parseLogFile(content: string, filename: string): { entries: LogEntry[], fileInfo: FileInfo } {
  const { format, category } = detectFormat(filename, content);
  const rawLines = content.split(/\r?\n/);
  const entryMap = new Map<string, LogEntry>();
  const entryOrder: string[] = [];
  
  let currentEntryLines: string[] = [];

  const finalizeEntry = (lines: string[]) => {
    if (lines.length === 0) return;
    const fullRaw = lines.join('\n');
    const signature = getLogSignature(lines[0]);
    
    if (entryMap.has(signature)) {
      entryMap.get(signature)!.occurrenceCount += 1;
      return;
    }

    let timestamp: Date | null = null;
    const tsMatch = fullRaw.match(/(\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)|(\d{2}:\d{2}:\d{2}(?:\.\d+)?)/);
    if (tsMatch) {
      timestamp = new Date(tsMatch[0]);
      if (isNaN(timestamp.getTime())) timestamp = null;
    }
    
    let severity = Severity.INFO;
    for (const [label, level] of Object.entries(SEVERITY_LEVELS)) {
      if (new RegExp(`\\b${label}\\b`, 'i').test(fullRaw)) {
        severity = level;
        break;
      }
    }

    const sourceLocations = extractSourceLocations(fullRaw);
    
    const entry: LogEntry = {
      id: `log-${entryOrder.length}`,
      timestamp,
      severity,
      message: lines[0].substring(0, 500),
      raw: fullRaw,
      occurrenceCount: 1,
      metadata: {
        hasStackTrace: lines.length > 1,
        signature: signature,
        formatDetected: format,
        sourceLocations: sourceLocations.length > 0 ? sourceLocations : undefined
      }
    };
    
    entryMap.set(signature, entry);
    entryOrder.push(signature);
  };

  // High-performance state machine for multi-line logs
  const NEW_ENTRY_PREFIX = /^(\d{4}|\w{3}\s+\d|\[\d|<)/;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.trim() === '') continue;

    const looksLikeNewEntry = NEW_ENTRY_PREFIX.test(line);
    const looksLikeStackTrace = STACK_CONTINUATION_REGEX.test(line);

    if (looksLikeNewEntry && !looksLikeStackTrace && currentEntryLines.length > 0) {
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
    parserUsed: 'ForensicDeduplicatorV2',
    isBinary: false,
    category
  };

  return { entries: entryOrder.map(sig => entryMap.get(sig)!), fileInfo };
}

export function chunkLogEntries(entries: LogEntry[], maxTokens: number = 2500): LogChunk[] {
  const rawChunks: LogChunk[] = [];
  let currentBatch: LogEntry[] = [];
  let currentBatchTokens = 0;

  const pushBatch = () => {
    if (currentBatch.length === 0) return;
    const content = currentBatch.map(e => e.raw).join('\n');
    const sig = getLogSignature(content.replace(/\d/g, '#')); // Normalized content signature
    
    rawChunks.push({
      id: `chunk-${rawChunks.length}`,
      content: content,
      entries: [...currentBatch],
      tokenCount: currentBatchTokens,
      signature: sig,
      occurrenceCount: 1,
      timeRange: {
        start: currentBatch[0]?.timestamp || null,
        end: currentBatch[currentBatch.length - 1]?.timestamp || null
      }
    });
    currentBatch = [];
    currentBatchTokens = 0;
  };

  entries.forEach(entry => {
    const entryTokens = Math.ceil(entry.raw.length / 4);

    // Large entries (like stack traces) might need their own chunk
    if (entryTokens > maxTokens) {
      pushBatch();
      // Split giant entry if absolutely necessary (truncation)
      const lines = entry.raw.split('\n');
      const headerLine = lines[0];
      const headerTokens = Math.ceil(headerLine.length / 4);
      
      let subChunkLines: string[] = [headerLine];
      let subChunkTokens = headerTokens;

      for (let j = 1; j < lines.length; j++) {
        const line = lines[j];
        const lineTokens = Math.ceil(line.length / 4);

        if (subChunkTokens + lineTokens > maxTokens) {
          // Push current sub-chunk
          const content = subChunkLines.join('\n');
          rawChunks.push({
            id: `chunk-${rawChunks.length}`,
            content,
            entries: [entry],
            tokenCount: subChunkTokens,
            signature: getLogSignature(content.replace(/\d/g, '#')),
            occurrenceCount: 1,
            timeRange: { start: entry.timestamp, end: entry.timestamp }
          });
          // Start next sub-chunk with same header
          subChunkLines = [headerLine, `[Continuation] ${line}`];
          subChunkTokens = headerTokens + Math.ceil(subChunkLines[1].length / 4);
        } else {
          subChunkLines.push(line);
          subChunkTokens += lineTokens;
        }
      }
      
      if (subChunkLines.length > 1) {
        const content = subChunkLines.join('\n');
        rawChunks.push({
          id: `chunk-${rawChunks.length}`,
          content,
          entries: [entry],
          tokenCount: subChunkTokens,
          signature: getLogSignature(content.replace(/\d/g, '#')),
          occurrenceCount: 1,
          timeRange: { start: entry.timestamp, end: entry.timestamp }
        });
      }
      return;
    }

    if (currentBatchTokens + entryTokens > maxTokens) {
      pushBatch();
    }
    
    currentBatch.push(entry);
    currentBatchTokens += entryTokens;
  });

  pushBatch();

  // Deduplicate identical chunks globally to save LLM tokens
  const uniqueChunks = new Map<string, LogChunk>();
  rawChunks.forEach(chunk => {
    if (uniqueChunks.has(chunk.signature)) {
      const existing = uniqueChunks.get(chunk.signature)!;
      existing.occurrenceCount += 1;
      if (chunk.timeRange.start && (!existing.timeRange.start || chunk.timeRange.start < existing.timeRange.start)) {
        existing.timeRange.start = chunk.timeRange.start;
      }
      if (chunk.timeRange.end && (!existing.timeRange.end || chunk.timeRange.end > existing.timeRange.end)) {
        existing.timeRange.end = chunk.timeRange.end;
      }
    } else {
      uniqueChunks.set(chunk.signature, chunk);
    }
  });

  return Array.from(uniqueChunks.values());
}
