/**
 * src/lib/durableJobQueue.ts
 *
 * IndexedDB-based durable job queue with automatic retry logic.
 * Persists across browser crashes, tab closes, and session boundaries.
 *
 * Usage:
 *   const queue = new DurableJobQueue();
 *   await queue.enqueue({
 *     type: 'send_notification',
 *     payload: { title: 'New score!', body: '...', userId: '123' },
 *     priority: 'high',
 *     idempotencyKey: 'notif:xyz'
 *   });
 *   // Queue automatically retries with exponential backoff
 */

export type JobStatus = 'queued' | 'in-flight' | 'complete' | 'failed' | 'archived';

export interface DurableJob {
  jobId: string;
  type: string;  // e.g., 'send_notification', 'deliver_followup', 'sync_telemetry'
  payload: any;
  status: JobStatus;
  priority: 'low' | 'normal' | 'high';  // Default: 'normal'
  retries: number;
  maxRetries: number;  // Default: 5
  nextRetryAt?: string;  // ISO timestamp
  lastError?: string;
  idempotencyKey?: string;  // For deduplication
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  metadata?: Record<string, any>;
}

export interface DurableJobQueueStats {
  queued: number;
  inFlight: number;
  failed: number;
  completed: number;
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let dbInstance: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ArthOSDurableJobs', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('jobs')) {
        const store = db.createObjectStore('jobs', { keyPath: 'jobId' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('nextRetryAt', 'nextRetryAt', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('idempotencyKey', 'idempotencyKey', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

// ============================================================================
// BACKOFF STRATEGY
// ============================================================================

/**
 * Calculate next retry delay with exponential backoff.
 * Jitter to prevent thundering herd.
 */
function calculateNextRetryDelay(retries: number, baseDelayMs: number = 1000): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, retries);
  const maxDelay = 60 * 60 * 1000;  // Max 1 hour
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  const jitter = Math.random() * 0.1 * cappedDelay;  // ±10% jitter
  return Math.floor(cappedDelay + jitter);
}

// ============================================================================
// DURABLE JOB QUEUE CLASS
// ============================================================================

export class DurableJobQueue {
  private processor: ((job: DurableJob) => Promise<any>) | null = null;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start processing immediately
    this.startProcessing();
  }

  /**
   * Register a job processor function.
   * Called whenever a job becomes ready for processing.
   */
  setProcessor(processor: (job: DurableJob) => Promise<any>): void {
    this.processor = processor;
  }

  /**
   * Enqueue a new job.
   */
  async enqueue(config: {
    type: string;
    payload: any;
    priority?: 'low' | 'normal' | 'high';
    maxRetries?: number;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const jobId = `${config.type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

    const job: DurableJob = {
      jobId,
      type: config.type,
      payload: config.payload,
      status: 'queued',
      priority: config.priority || 'normal',
      retries: 0,
      maxRetries: config.maxRetries || 5,
      idempotencyKey: config.idempotencyKey,
      createdAt: new Date().toISOString(),
      metadata: config.metadata
    };

    await this.store(job);
    console.info(`[DurableJobQueue] Enqueued job: ${jobId} (${config.type})`);

    return jobId;
  }

  /**
   * Get job by ID.
   */
  async getJob(jobId: string): Promise<DurableJob | null> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('jobs', 'readonly');
      const store = tx.objectStore('jobs');
      const request = store.get(jobId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Get all jobs by status.
   */
  async getJobsByStatus(status: JobStatus): Promise<DurableJob[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('jobs', 'readonly');
      const store = tx.objectStore('jobs');
      const index = store.index('status');
      const request = index.getAll(status);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Get queue statistics.
   */
  async getStats(): Promise<DurableJobQueueStats> {
    const db = await initDB();
    const stats: DurableJobQueueStats = {
      queued: 0,
      inFlight: 0,
      failed: 0,
      completed: 0
    };

    const statuses: JobStatus[] = ['queued', 'in-flight', 'failed', 'complete'];

    for (const status of statuses) {
      const jobs = await this.getJobsByStatus(status);
      switch (status) {
        case 'queued': stats.queued = jobs.length; break;
        case 'in-flight': stats.inFlight = jobs.length; break;
        case 'failed': stats.failed = jobs.length; break;
        case 'complete': stats.completed = jobs.length; break;
      }
    }

    return stats;
  }

  /**
   * Store or update a job.
   */
  private async store(job: DurableJob): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('jobs', 'readwrite');
      const store = tx.objectStore('jobs');
      const request = store.put(job);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Start background processing of queued jobs.
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;  // Already started
    }

    // Check for ready jobs every 5 seconds
    this.processingInterval = setInterval(() => {
      void this.processReadyJobs();
    }, 5000);

    // Initial check
    void this.processReadyJobs();
  }

  /**
   * Stop background processing.
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process all jobs that are ready (queued or ready for retry).
   */
  private async processReadyJobs(): Promise<void> {
    if (this.isProcessing || !this.processor) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get all queued jobs
      const queued = await this.getJobsByStatus('queued');

      // Sort by priority (high first), then by creation time
      queued.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const prio = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (prio !== 0) return prio;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      // Process up to 5 jobs concurrently
      const batch = queued.slice(0, 5);
      await Promise.all(batch.map(job => this.processJob(job)));

      // Also check for jobs ready to retry
      const now = new Date();
      const retryable = await this.getJobsByStatus('failed');
      const readyToRetry = retryable.filter(job => {
        if (!job.nextRetryAt) return false;
        return new Date(job.nextRetryAt) <= now;
      });

      await Promise.all(readyToRetry.map(job => this.processJob(job)));
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job.
   */
  private async processJob(job: DurableJob): Promise<void> {
    if (!this.processor) {
      console.warn('[DurableJobQueue] No processor registered');
      return;
    }

    try {
      // Mark as in-flight
      job.status = 'in-flight';
      job.startedAt = new Date().toISOString();
      await this.store(job);

      // Execute job
      const result = await this.processor(job);

      // Mark as complete
      job.status = 'complete';
      job.completedAt = new Date().toISOString();
      job.result = result;
      await this.store(job);

      console.info(`[DurableJobQueue] Completed job: ${job.jobId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[DurableJobQueue] Job failed: ${job.jobId}`, errorMsg);

      // Decide whether to retry
      if (job.retries < job.maxRetries) {
        job.retries += 1;
        job.status = 'failed';
        job.lastError = errorMsg;
        job.nextRetryAt = new Date(
          Date.now() + calculateNextRetryDelay(job.retries)
        ).toISOString();
        await this.store(job);

        console.info(
          `[DurableJobQueue] Scheduled retry: ${job.jobId} (attempt ${job.retries}/${job.maxRetries})`
        );
      } else {
        // Max retries exhausted
        job.status = 'failed';
        job.lastError = errorMsg;
        job.completedAt = new Date().toISOString();
        await this.store(job);

        console.error(
          `[DurableJobQueue] Max retries exhausted: ${job.jobId}`
        );
      }
    }
  }

  /**
   * Clear all completed/archived jobs older than given age.
   */
  async cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const db = await initDB();
    const cutoff = new Date(Date.now() - olderThanMs).toISOString();
    let deleted = 0;

    for (const status of ['complete', 'archived']) {
      const jobs = await this.getJobsByStatus(status as JobStatus);
      const toDelete = jobs.filter(job => job.completedAt && job.completedAt < cutoff);

      for (const job of toDelete) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('jobs', 'readwrite');
          const store = tx.objectStore('jobs');
          const request = store.delete(job.jobId);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            deleted += 1;
            resolve();
          };
        });
      }
    }

    console.info(`[DurableJobQueue] Cleanup: deleted ${deleted} old jobs`);
    return deleted;
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let globalQueue: DurableJobQueue | null = null;

/**
 * Get or create the global durable job queue instance.
 */
export function getGlobalDurableJobQueue(): DurableJobQueue {
  if (!globalQueue) {
    globalQueue = new DurableJobQueue();
  }
  return globalQueue;
}
