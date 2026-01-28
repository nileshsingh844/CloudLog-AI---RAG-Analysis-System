
// Standardized Normalization logic for RAG precision

const Severity = {
  FATAL: 'FATAL',
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  UNKNOWN: 'UNKNOWN'
};

const MAX_UNIQUE_SIGNATURES = 5000;
const MAX_SAMPLED_LOGS = 10000; 

function getSignature(message) {
  if (!message) return 'EMPTY';
  let sig = message;
  // 1. IP Redaction
  sig = sig.replace(/(?:\d{1,3}\.){3}\d{1,3}/g, 'IP_ADDR');
  // 2. Email Redaction
  sig = sig.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'EMAIL_ADDR');
  // 3. Key-Value PII Redaction
  const piiKeys = 'auth|token|key|secret|password|user|pwd|credential|email|ip';
  const kvRegex = new RegExp(`(?:${piiKeys})=[^ \\t\\n,;]+`, 'gi');
  sig = sig.replace(kvRegex, (match) => {
    const [key, val] = match.split('=');
    if (val === 'IP_ADDR' || val === 'EMAIL_ADDR') return match;
    return `${key}=REDACTED`;
  });
  return sig
    .replace(/[a-f0-9]{8,}/gi, 'XID')
    .replace(/\d+/g, '#')
    .replace(/\/[\w\-\.\/]+/g, '/FS_PATH')
    .trim();
}

function detectSeverity(raw) {
  if (/\b(FATAL|CRITICAL|EMERGENCY)\b/i.test(raw)) return Severity.FATAL;
  if (/\b(ERROR|ERR|FAIL|FAILURE)\b/i.test(raw)) return Severity.ERROR;
  if (/\b(WARN|WARNING)\b/i.test(raw)) return Severity.WARN;
  if (/\b(DEBUG|TRACE)\b/i.test(raw)) return Severity.DEBUG;
  return Severity.INFO;
}

function extractTimestamp(raw) {
  const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  const commonRegex = /\[\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}/;
  const isoMatch = raw.match(isoRegex);
  if (isoMatch) return isoMatch[0];
  const commonMatch = raw.match(commonRegex);
  if (commonMatch) return commonMatch[0].replace('[', '');
  return null;
}

function isStackLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('at ') || trimmed.startsWith('...') || trimmed.startsWith('Caused by:');
}

self.onmessage = async (e) => {
  const { file, type } = e.data || {};
  
  if (type === "INIT") {
    self.postMessage({ type: "READY" });
    return;
  }

  if (!file) return;

  try {
    const stream = file.stream().pipeThrough(new TextDecoderStream());
    const reader = stream.getReader();

    let totalBytesRead = 0;
    let partialLine = '';
    let entries = [];
    let signatureMap = new Map();
    let severityCounts = {
      [Severity.FATAL]: 0, [Severity.ERROR]: 0, [Severity.WARN]: 0, 
      [Severity.INFO]: 0, [Severity.DEBUG]: 0, [Severity.UNKNOWN]: 0
    };

    let lineCount = 0;
    let currentEntry = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytesRead += new TextEncoder().encode(value).length;
      const lines = (partialLine + value).split(/\r?\n/);
      partialLine = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        lineCount++;

        if (isStackLine(line) && currentEntry) {
          currentEntry.raw += '\n' + line;
          currentEntry.metadata.hasStackTrace = true;
          continue;
        }

        if (currentEntry) {
          processEntry(currentEntry);
        }

        const severity = detectSeverity(line);
        currentEntry = {
          id: `w-${lineCount}`,
          timestamp: extractTimestamp(line),
          severity,
          message: line.substring(0, 500),
          raw: line,
          metadata: {
            hasStackTrace: false,
            signature: getSignature(line),
            layer: 'UNKNOWN'
          }
        };
      }
    }

    if (currentEntry) processEntry(currentEntry);

    function processEntry(entry) {
      severityCounts[entry.severity]++;
      const sig = entry.metadata.signature;
      
      let sigData = signatureMap.get(sig);
      if (sigData) {
        sigData.count++;
      } else if (signatureMap.size < MAX_UNIQUE_SIGNATURES) {
        signatureMap.set(sig, { count: 1, sample: entry.raw.substring(0, 300), severity: entry.severity });
      }

      const isCritical = entry.severity === Severity.ERROR || entry.severity === Severity.FATAL;
      const shouldSample = isCritical || (entries.length < 1000) || (entries.length < MAX_SAMPLED_LOGS && lineCount % 20 === 0);

      if (shouldSample) {
        entry.timestamp = entry.timestamp ? new Date(entry.timestamp) : null;
        entries.push(entry);
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
