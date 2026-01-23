
import { LogEntry, Severity, SearchIndex, LogChunk, FileInfo, SourceLocation } from '../types';

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
 * Stack Trace Extraction Patterns
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

/**
 * Detects if a file path is likely part of a library or third-party dependency.
 */
function isLibraryPath(path: string): boolean {
  const libMarkers = [
    'node_modules',
    'site-packages',
    'dist-packages',
    'vendor',
    'lib/python',
    'maven2',
    '.m2',
    'jdk',
    'jre',
    'jar:',
    'target/classes',
    'usr/lib',
    'usr/local/lib',
    'bower_components',
    'Internal.Packages'
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
        
        // Java match: [1] class, [2] method, [3] file, [4] line
        if (pattern.source.includes('at\\s+([\\w$.]+)')) {
          loc = { filePath: match[3], line: parseInt(match[4]), method: `${match[1]}.${match[2]}` };
        } 
        // Python match: [1] file, [2] line, [3] method
        else if (pattern.source.includes('File\\s+"([^"]+)"')) {
          loc = { filePath: match[1], line: parseInt(match[2]), method: match[3] };
        }
        // Node match: [1] method, [2] file, [3] line
        else if (pattern.source.includes('at\\s+(?:(.+)\\s+\\()?')) {
          loc = { filePath: match[2], line: parseInt(match[3]), method: match[1] };
        }
        // C# match: [1] method, [2] file, [3] line
        else if (pattern.source.includes('at\\s+(.+)\\s+in\\s+(.+):line')) {
          loc = { filePath: match[2], line: parseInt(match[3]), method: match[1] };
        }
        // General match: [1] file, [2] line
        else {
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

  // Deduplicate by file and line
  return Array.from(new Set(locations.map(l => `${l.filePath}:${l.line}`)))
    .map(key => locations.find(l => `${l.filePath}:${l.line}` === key)!);
}

export function detectFormat(filename: string, content: string): { format: string, category: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
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
    
    for (const [label, level] of Object.entries(SEVERITY_LEVELS)) {
      const regex = new RegExp(`\\b${label}\\b`, 'i');
      if (regex.test(fullRaw)) {
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
    isBinary: false,
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
