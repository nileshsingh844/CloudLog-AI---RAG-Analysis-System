
import { Severity, LogEntry } from './types';

// Memory-safe limits for heavy trace files
const MAX_UNIQUE_SIGNATURES = 5000;
const MAX_SAMPLED_LOGS = 10000; 

function getSignature(message: string): string {
  return message
    .replace(/[a-f0-9]{8,}/gi, 'ID')
    .replace(/\d+/g, '#')
    .replace(/\/[\w\-\.\/]+/g, '/PATH')
    .replace(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/g, 'IP')
    .trim();
}

function detectSeverity(raw: string): Severity {
  if (/\b(FATAL|CRITICAL|EMERGENCY)\b/i.test(raw)) return Severity.FATAL;
  if (/\b(ERROR|ERR|FAIL|FAILURE)\b/i.test(raw)) return Severity.ERROR;
  if (/\b(WARN|WARNING)\b/i.test(raw)) return Severity.WARN;
  if (/\b(DEBUG|TRACE)\b/i.test(raw)) return Severity.DEBUG;
  return Severity.INFO;
}

function extractTimestamp(raw: string): string | null {
  const isoRegex = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?/;
  const commonRegex = /\[\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}/;
  
  const isoMatch = raw.match(isoRegex);
  if (isoMatch) return isoMatch[0].replace(' ', 'T');
  
  const commonMatch = raw.match(commonRegex);
  if (commonMatch) return commonMatch[0].replace('[', '');
  
  return null;
}

self.onmessage = async (e: MessageEvent) => {
  const { file } = e.data;
  if (!file) return;

  const stream = file.stream().pipeThrough(new TextDecoderStream());
  const reader = stream.getReader();

  let totalBytesRead = 0;
  let partialLine = '';
  let entries: LogEntry[] = [];
  let signatureMap = new Map<string, { count: number, sample: string, severity: Severity }>();
  let severityCounts: Record<Severity, number> = {
    [Severity.FATAL]: 0, [Severity.ERROR]: 0, [Severity.WARN]: 0, 
    [Severity.INFO]: 0, [Severity.DEBUG]: 0, [Severity.UNKNOWN]: 0
  };

  let lineCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytesRead += new TextEncoder().encode(value).length;
      const lines = (partialLine + value).split(/\r?\n/);
      partialLine = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        lineCount++;
        
        const severity = detectSeverity(line);
        const sig = getSignature(line);
        const ts = extractTimestamp(line);
        
        severityCounts[severity]++;

        let sigData = signatureMap.get(sig);
        if (sigData) {
          sigData.count++;
        } else if (signatureMap.size < MAX_UNIQUE_SIGNATURES) {
          signatureMap.set(sig, { count: 1, sample: line.substring(0, 300), severity });
        }

        const isCritical = severity === Severity.ERROR || severity === Severity.FATAL;
        const shouldSample = isCritical || 
                           (lineCount < 100) || 
                           (entries.length < MAX_SAMPLED_LOGS && lineCount % 20 === 0);

        if (shouldSample) {
          entries.push({
            id: `w-${lineCount}`,
            timestamp: ts ? (new Date(ts) as any) : null, 
            severity,
            message: line.substring(0, 500),
            raw: line,
            occurrenceCount: 1,
            metadata: {
              hasStackTrace: line.includes('at ') || line.includes('stack'),
              signature: sig,
              layer: 'UNKNOWN'
            }
          });
        }

        if (lineCount % 1000 === 0) {
          self.postMessage({ 
            type: 'PROGRESS', 
            progress: Math.max(1, Math.round((totalBytesRead / (file.size || 1)) * 100))
          });
        }
      }
    }

    self.postMessage({
      type: 'COMPLETE',
      payload: {
        logs: entries,
        signatureMap: Array.from(signatureMap.entries()),
        severityCounts,
        lineCount,
        fileSize: file.size || totalBytesRead,
        fileName: file.name
      }
    });

  } catch (err) {
    self.postMessage({ type: 'ERROR', error: String(err) });
  }
};
