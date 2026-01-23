
import { LogEntry, Severity, SearchIndex, LogChunk } from '../types';

const SEVERITY_PATTERNS = [
  /\b(FATAL|CRITICAL|EMERGENCY)\b/i,
  /\b(ERROR|ERR|FAIL|SEVERE)\b/i,
  /\b(WARN|WARNING)\b/i,
  /\b(INFO|NOTICE)\b/i,
  /\b(DEBUG|TRACE)\b/i
];

const TIMESTAMP_PATTERNS = [
  // ISO-like: 2023-05-24 10:00:00 or 2023-05-24T10:00:00
  /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/,
  // Syslog/Common: May 24 10:00:00
  /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/,
  // Bracketed: [2023-05-24 10:00:00]
  /^\[(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})\]/
];

const STACK_TRACE_CONTINUATION_PATTERNS = [
  /^\s+at\s+[\w.<>$]+\(.*\)/,        // Java/JS 'at ...'
  /^\s+...\s+\d+\s+more/,            // Java '... 14 more'
  /^Caused by:/,                      // Java 'Caused by:'
  /^\s*File\s+".*",\s+line\s+\d+/,   // Python trace
  /^\s+[\w.<>$]+Exception:/,         // Exception header
  /^\s+[\w.<>$]+Error:/,             // Error header
  /^\t/,                             // Tab-indented lines
  /^\s{2,}/                          // Heavily indented lines
];

export function getLogSignature(message: string): string {
  return message
    .replace(/\b\d+\.\d+\.\d+\.\d+\b/g, '<IP>')
    .replace(/\b[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\b/g, '<UUID>')
    .replace(/\b0x[0-9a-fA-F]+\b/g, '<HEX>')
    .replace(/\b\d+\b/g, '<NUM>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Builds a search index in a single pass
 */
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
    // IDF calculation: weight rare terms (error codes) higher than common ones
    termWeights.set(term, Math.log(totalDocs / (1 + count)));
  });

  return { invertedIndex, termWeights };
}

export function parseLogFile(content: string, offset: number = 0): LogEntry[] {
  const rawLines = content.split(/\r?\n/);
  const entries: LogEntry[] = [];
  let currentEntryLines: string[] = [];

  const finalizeEntry = (lines: string[]) => {
    if (lines.length === 0) return;
    const fullRaw = lines.join('\n');
    let severity = Severity.UNKNOWN;
    
    // Severity detection
    for (let i = 0; i < SEVERITY_PATTERNS.length; i++) {
      if (SEVERITY_PATTERNS[i].test(fullRaw)) {
        const labels = [Severity.FATAL, Severity.ERROR, Severity.WARN, Severity.INFO, Severity.DEBUG];
        severity = labels[i];
        break;
      }
    }

    // Timestamp detection - check first line primarily
    let timestamp: Date | null = null;
    for (const pattern of TIMESTAMP_PATTERNS) {
      const match = lines[0].match(pattern);
      if (match) {
        timestamp = new Date(match[1]);
        if (!isNaN(timestamp.getTime())) break;
        else timestamp = null;
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
        hasStackTrace: lines.length > 1 || STACK_TRACE_CONTINUATION_PATTERNS.some(p => p.test(fullRaw)),
        signature: getLogSignature(firstLine)
      }
    });
  };

  rawLines.forEach((line) => {
    if (line.trim() === '') return;

    // Boundary Detection Logic
    // A line is a "New Entry" if it starts with a timestamp OR a clear severity marker
    const hasTimestamp = TIMESTAMP_PATTERNS.some(p => p.test(line));
    const hasSeverityTag = /^\[(INFO|DEBUG|ERROR|WARN|FATAL|ERR|FAIL|NOTICE|TRACE)\]/i.test(line) ||
                           /^(INFO|DEBUG|ERROR|WARN|FATAL|ERR|FAIL|NOTICE|TRACE):/i.test(line);
    
    // A line is a "Continuation/Stack Trace" if it matches known indentation or trace prefixes
    const isContinuation = STACK_TRACE_CONTINUATION_PATTERNS.some(p => p.test(line));

    // Decision: Start new entry if it looks like one AND isn't explicitly a continuation pattern
    const isNew = (hasTimestamp || hasSeverityTag) && !isContinuation;

    if (isNew && currentEntryLines.length > 0) {
      finalizeEntry(currentEntryLines);
      currentEntryLines = [line];
    } else {
      currentEntryLines.push(line);
    }
  });

  finalizeEntry(currentEntryLines);
  return entries;
}

/**
 * Smart Chunker: Groups LogEntry objects into chunks.
 * Ensures that individual LogEntry objects (and their contained stack traces) 
 * are never fragmented across chunk boundaries.
 */
export function chunkLogEntries(entries: LogEntry[], maxTokens: number = 2500): LogChunk[] {
  const chunks: LogChunk[] = [];
  let current: LogEntry[] = [];
  let currentSize = 0;

  entries.forEach(entry => {
    // Rough estimate: 1 token ~= 4 characters
    const entrySize = Math.ceil(entry.raw.length / 4);

    // If adding this entry exceeds maxTokens, finalize current chunk
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

    // Add entry to current working set
    // Note: If a single entry is larger than maxTokens, it will still be in its own chunk
    // this guarantees stack trace integrity.
    current.push(entry);
    currentSize += entrySize;
  });

  // Finalize any remaining entries
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

