/**
 * src/lib/telemetryBatchingPipeline.ts
 *
 * Standardized telemetry batching and aggregation pipeline.
 * Batches events into time windows before sending to endpoint.
 * Prevents individual telemetry calls from overwhelming the API.
 *
 * Usage:
 *   const pipeline = new TelemetryBatchingPipeline('/api/telemetry', {
 *     batchWindowMs: 30_000,  // Batch every 30 seconds
 *     maxBatchSize: 100        // Or immediately if 100 events gathered
 *   });
 *
 *   pipeline.track('score_calculated', { newScore: 45, delta: +5 });
 *   pipeline.track('assessment_submitted', { assessmentId: 'abc123' });
 *   // Batches automatically on timer or size limit
 */

import { getGlobalDurableJobQueue } from './durableJobQueue';

export interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

export interface TelemetryBatch {
  batchId: string;
  events: TelemetryEvent[];
  batchSize: number;
  samplingRate: number;  // 1.0 = 100% sampled
  envelopeVersion: string;  // "1.0"
  createdAt: string;
  idempotencyKey: string;
}

export interface BatchingPipelineConfig {
  endpoint: string;
  batchWindowMs?: number;  // Default: 30 seconds
  maxBatchSize?: number;   // Default: 100 events
  samplingRate?: number;   // 0.0 to 1.0, default: 1.0
  flushOnBeforeUnload?: boolean;  // Default: true
}

// ============================================================================
// TELEMETRY BATCHING PIPELINE
// ============================================================================

export class TelemetryBatchingPipeline {
  private config: Required<BatchingPipelineConfig>;
  private events: TelemetryEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private readonly jobQueue = getGlobalDurableJobQueue();

  constructor(endpoint: string, options?: Partial<BatchingPipelineConfig>) {
    this.config = {
      endpoint,
      batchWindowMs: options?.batchWindowMs ?? 30_000,
      maxBatchSize: options?.maxBatchSize ?? 100,
      samplingRate: options?.samplingRate ?? 1.0,
      flushOnBeforeUnload: options?.flushOnBeforeUnload ?? true
    };

    this.sessionId = this.generateSessionId();

    // Auto-flush on page unload
    if (this.config.flushOnBeforeUnload && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSync();  // Synchronous flush before unload
      });
    }

    console.info('[TelemetryBatchingPipeline] Initialized', { endpoint });
  }

  /**
   * Track a telemetry event.
   * Adds to batch buffer and potentially triggers flush.
   */
  track(name: string, properties?: Record<string, any>, userId?: string): void {
    // Apply sampling
    if (Math.random() > this.config.samplingRate) {
      return;  // Sampled out
    }

    const event: TelemetryEvent = {
      name,
      properties,
      userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };

    this.events.push(event);

    // Check if batch is full
    if (this.events.length >= this.config.maxBatchSize) {
      void this.flush();
    } else if (!this.batchTimer) {
      // Start timer if not already running
      this.batchTimer = setTimeout(() => {
        void this.flush();
      }, this.config.batchWindowMs);
    }
  }

  /**
   * Flush pending events as a batch.
   * Uses durable job queue to ensure delivery.
   */
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (!this.events.length) {
      return;
    }

    const batch = this.createBatch();
    this.events = [];  // Clear buffer

    try {
      // Enqueue as durable job
      const jobId = await this.jobQueue.enqueue({
        type: 'telemetry_batch',
        payload: batch,
        priority: 'normal',
        idempotencyKey: batch.idempotencyKey,
        maxRetries: 3
      });

      console.info(`[TelemetryBatchingPipeline] Batched ${batch.batchSize} events`, {
        jobId,
        batchId: batch.batchId
      });
    } catch (error) {
      console.error('[TelemetryBatchingPipeline] Failed to enqueue batch:', error);
      // Keep events for retry (add back to buffer)
      this.events = batch.events;
    }
  }

  /**
   * Synchronous flush for beforeunload handler.
   * Uses sendBeacon for reliability.
   */
  private flushSync(): void {
    if (!this.events.length) {
      return;
    }

    const batch = this.createBatch();

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        this.config.endpoint,
        JSON.stringify(batch)
      );
    }
  }

  /**
   * Create a batch envelope from current events.
   */
  private createBatch(): TelemetryBatch {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const idempotencyKey = `telemetry:${batchId}`;

    return {
      batchId,
      events: this.events,
      batchSize: this.events.length,
      samplingRate: this.config.samplingRate,
      envelopeVersion: '1.0',
      createdAt: new Date().toISOString(),
      idempotencyKey
    };
  }

  /**
   * Get current buffer size.
   */
  getBufferSize(): number {
    return this.events.length;
  }

  /**
   * Generate a stable session ID.
   */
  private generateSessionId(): string {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = window.sessionStorage.getItem('__telemetry_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        window.sessionStorage.setItem('__telemetry_session_id', sessionId);
      }
      return sessionId;
    }
    return `session_${Date.now()}`;
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let globalPipeline: TelemetryBatchingPipeline | null = null;

/**
 * Initialize global telemetry pipeline (call once on app startup).
 */
export function initTelemetryPipeline(endpoint: string, options?: Partial<BatchingPipelineConfig>): TelemetryBatchingPipeline {
  if (!globalPipeline) {
    globalPipeline = new TelemetryBatchingPipeline(endpoint, options);
  }
  return globalPipeline;
}

/**
 * Get global telemetry pipeline instance.
 */
export function getTelemetryPipeline(): TelemetryBatchingPipeline {
  if (!globalPipeline) {
    throw new Error('Telemetry pipeline not initialized. Call initTelemetryPipeline() first.');
  }
  return globalPipeline;
}

/**
 * Track a telemetry event using global pipeline.
 */
export function trackTelemetry(name: string, properties?: Record<string, any>, userId?: string): void {
  getTelemetryPipeline().track(name, properties, userId);
}
