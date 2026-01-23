
import { useState, useCallback } from 'react';
import { AppState, LogEntry, LogChunk, ProcessingStats, ChatMessage, Severity, SystemMetrics, TimeBucket, ModelOption } from '../types';
import { parseLogFile, chunkLogEntries, buildSearchIndex } from '../utils/logParser';

const initialMetrics: SystemMetrics = {
  queryLatency: [],
  indexingLatency: 0,
  totalQueries: 0,
  errorCount: 0,
  rateLimitHits: 0,
  memoryUsage: 0
};

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3-flash-preview',
    provider: 'google-gemini',
    name: 'Gemini 3 Flash',
    description: 'Ultra-fast analysis optimized for high-volume logs.',
    capabilities: ['speed', 'context'],
    status: 'active'
  },
  {
    id: 'gemini-3-pro-preview',
    provider: 'google-gemini',
    name: 'Gemini 3 Pro',
    description: 'High-reasoning model for complex root cause analysis.',
    capabilities: ['logic', 'context'],
    status: 'active'
  },
  {
    id: 'gemini-2.5-flash-lite-latest',
    provider: 'google-gemini',
    name: 'Gemini 2.5 Flash Lite',
    description: 'Cost-effective model for routine log scanning.',
    capabilities: ['speed'],
    status: 'active'
  },
  {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    description: 'Omni-model with top-tier reasoning capabilities.',
    capabilities: ['logic', 'vision'],
    status: 'requires-config'
  },
  {
    id: 'claude-3-5-sonnet',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    description: 'Excellent balance of speed and advanced intelligence.',
    capabilities: ['logic', 'context'],
    status: 'requires-config'
  }
];

export function useLogStore() {
  const [state, setState] = useState<AppState>({
    apiKey: process.env.API_KEY || null,
    isProcessing: false,
    ingestionProgress: 0,
    logs: [],
    chunks: [],
    searchIndex: null,
    stats: null,
    messages: [],
    selectedModelId: 'gemini-3-flash-preview',
    metrics: initialMetrics,
    viewMode: 'diagnostic',
    isSettingsOpen: false
  });

  const setProcessing = useCallback((val: boolean) => setState(s => ({ ...s, isProcessing: val })), []);
  const setIngestionProgress = useCallback((val: number) => setState(s => ({ ...s, ingestionProgress: val })), []);
  const setViewMode = useCallback((mode: 'diagnostic' | 'operator') => setState(s => ({ ...s, viewMode: mode })), []);
  const setSettingsOpen = useCallback((open: boolean) => setState(s => ({ ...s, isSettingsOpen: open })), []);

  const selectModel = useCallback((modelId: string) => {
    setState(s => ({ ...s, selectedModelId: modelId }));
  }, []);

  const processNewFile = useCallback(async (file: File) => {
    const startTime = performance.now();
    setProcessing(true);
    setIngestionProgress(0);
    
    const CHUNK_SIZE = 64 * 1024 * 1024;
    let offset = 0;
    let allEntries: LogEntry[] = [];
    let leftover = '';

    const getCompactionThreshold = (size: number) => {
      if (size > 5 * 1024 * 1024 * 1024) return 5000;
      if (size > 1024 * 1024 * 1024) return 15000;
      return 50000;
    };

    const compactionThreshold = getCompactionThreshold(file.size);

    try {
      while (offset < file.size) {
        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const text = leftover + await slice.text();
        const lastNewline = text.lastIndexOf('\n');
        const toProcess = lastNewline === -1 ? text : text.substring(0, lastNewline);
        leftover = lastNewline === -1 ? '' : text.substring(lastNewline + 1);

        const chunkEntries = parseLogFile(toProcess, allEntries.length);
        
        if (allEntries.length > compactionThreshold) {
           const compacted: LogEntry[] = [];
           chunkEntries.forEach(entry => {
             const last = compacted[compacted.length - 1] || allEntries[allEntries.length - 1];
             if (last && last.metadata.signature === entry.metadata.signature && !entry.metadata.hasStackTrace) {
                last.metadata.occurrenceCount = (last.metadata.occurrenceCount || 1) + 1;
             } else {
                compacted.push(entry);
             }
           });
           allEntries = allEntries.concat(compacted);
        } else {
           allEntries = allEntries.concat(chunkEntries);
        }
        
        offset += CHUNK_SIZE;
        setIngestionProgress(Math.min(95, Math.round((offset / file.size) * 100)));
        await new Promise(r => setTimeout(r, 0));
      }

      if (leftover.trim()) {
        allEntries = allEntries.concat(parseLogFile(leftover, allEntries.length));
      }

      const chunks = chunkLogEntries(allEntries);
      const searchIndex = buildSearchIndex(chunks);
      
      const severities: Record<Severity, number> = {
        [Severity.FATAL]: 0, [Severity.ERROR]: 0, [Severity.WARN]: 0,
        [Severity.INFO]: 0, [Severity.DEBUG]: 0, [Severity.UNKNOWN]: 0,
      };

      let start: Date | null = null;
      let end: Date | null = null;

      allEntries.forEach(log => {
        const count = log.metadata.occurrenceCount || 1;
        severities[log.severity] += count;
        if (log.timestamp) {
          if (!start || log.timestamp < start) start = log.timestamp;
          if (!end || log.timestamp > end) end = log.timestamp;
        }
      });

      const timeBuckets: TimeBucket[] = [];
      if (start && end && start < end) {
        const bucketCount = 60;
        const duration = end.getTime() - start.getTime();
        const bucketSize = duration / bucketCount;

        for (let i = 0; i < bucketCount; i++) {
          timeBuckets.push({
            time: new Date(start.getTime() + (i * bucketSize)).toISOString(),
            count: 0,
            errorCount: 0
          });
        }

        allEntries.forEach(log => {
          if (log.timestamp) {
            const idx = Math.min(bucketCount - 1, Math.floor((log.timestamp.getTime() - start!.getTime()) / bucketSize));
            if (idx >= 0) {
              const count = log.metadata.occurrenceCount || 1;
              timeBuckets[idx].count += count;
              if (log.severity === Severity.ERROR || log.severity === Severity.FATAL) {
                timeBuckets[idx].errorCount += count;
              }
            }
          }
        });
      }

      const stats: ProcessingStats = {
        totalEntries: allEntries.length,
        severities,
        timeRange: { start, end },
        timeBuckets, 
        fileSize: file.size,
        fileName: file.name,
        chunkCount: chunks.length
      };

      const endTime = performance.now();
      
      setState(s => ({
        ...s,
        logs: allEntries,
        chunks,
        searchIndex,
        stats,
        isProcessing: false,
        ingestionProgress: 100,
        messages: [],
        metrics: {
          ...s.metrics,
          indexingLatency: Math.round(endTime - startTime),
          memoryUsage: Math.round(allEntries.length * 0.12)
        }
      }));
    } catch (err) {
      console.error("Critical Ingestion Failure:", err);
      setProcessing(false);
      setState(s => ({ ...s, metrics: { ...s.metrics, errorCount: s.metrics.errorCount + 1 } }));
    }
  }, [setProcessing, setIngestionProgress]);

  const recordQueryMetric = useCallback((latency: number, isError: boolean = false, isRateLimit: boolean = false) => {
    setState(s => ({
      ...s,
      metrics: {
        ...s.metrics,
        queryLatency: [...s.metrics.queryLatency, latency].slice(-15),
        totalQueries: s.metrics.totalQueries + 1,
        errorCount: isError ? s.metrics.errorCount + 1 : s.metrics.errorCount,
        rateLimitHits: isRateLimit ? s.metrics.rateLimitHits + 1 : s.metrics.rateLimitHits
      }
    }));
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setState(s => ({ ...s, messages: [...s.messages, msg] }));
  }, []);

  const updateLastMessageChunk = useCallback((chunk: string) => {
    setState(s => {
      const messages = [...s.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        messages[lastIndex] = { ...messages[lastIndex], content: messages[lastIndex].content + chunk };
      }
      return { ...s, messages };
    });
  }, []);

  const setLastMessageSources = useCallback((sources: string[]) => {
    setState(s => {
      const messages = [...s.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        messages[lastIndex] = { ...messages[lastIndex], sources };
      }
      return { ...s, messages };
    });
  }, []);

  const finishLastMessage = useCallback(() => {
    setState(s => {
      const messages = [...s.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        messages[lastIndex] = { ...messages[lastIndex], isLoading: false };
      }
      return { ...s, messages };
    });
  }, []);

  const updateLastMessageError = useCallback((error: string) => {
    setState(s => {
      const messages = [...s.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        messages[lastIndex] = { ...messages[lastIndex], content: error, isLoading: false };
      }
      return { ...s, messages };
    });
  }, []);

  const openKeyManager = useCallback(async () => {
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }, []);

  return {
    state,
    processNewFile,
    addMessage,
    updateLastMessageChunk,
    setLastMessageSources,
    finishLastMessage,
    updateLastMessageError,
    recordQueryMetric,
    setViewMode,
    selectModel,
    setSettingsOpen,
    openKeyManager
  };
}
