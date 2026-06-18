/**
 * src/lib/backgroundServicesInitializer.ts
 *
 * Central initializer for all durable background services.
 * Call this once from App.jsx on startup.
 *
 * Initializes:
 * - Durable job queue with processor
 * - Telemetry batching pipeline
 * - Background task scheduler (for check-ins)
 * - Follow-up delivery workflow
 * - Idempotent request deduplication cleanup
 */

import { getGlobalDurableJobQueue, type DurableJob } from './durableJobQueue';
import { initTelemetryPipeline } from './telemetryBatchingPipeline';
import { getGlobalBackgroundTaskScheduler } from './backgroundTaskScheduler';
import { getGlobalFollowUpWorkflow } from './followUpWorkflow';
import { startDeduplicationCleanup } from './idempotentRequests';
import { getTelemetryPipeline } from './telemetryBatchingPipeline';

const log = (...args: any[]) => console.info('[BackgroundServicesInitializer]', ...args);
const err = (...args: any[]) => console.error('[BackgroundServicesInitializer]', ...args);
const isTestMode = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

// ============================================================================
// JOB PROCESSOR IMPLEMENTATION
// ============================================================================

/**
 * Process a durable job by sending it to the server.
 */
async function processDurableJobOnServer(job: DurableJob): Promise<any> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/durableJobProcessor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': job.jobId
        },
        body: JSON.stringify(job),
        keepalive: true
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${data.error || response.statusText}`);
      }

      const result = await response.json();
      log(`Job processed: ${job.jobId} (${job.type})`);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log(`Job processing attempt ${attempt}/${maxRetries} failed: ${job.jobId}`, lastError.message);

      if (attempt < maxRetries) {
        // Wait before retrying
        const delay = 1000 * Math.pow(2, attempt - 1);  // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Job processing failed');
}

// ============================================================================
// BACKGROUND SERVICES INITIALIZATION
// ============================================================================

export interface BackgroundServicesConfig {
  userId?: string; // Current authenticated user ID
  telemetryEndpoint?: string | false;
  telemetryBatchWindowMs?: number;
  telemetrySamplingRate?: number;
  enableCheckInScheduler?: boolean;
  enableFollowUpWorkflow?: boolean;
  enableIdempotencyCleanup?: boolean;
}

/**
 * Initialize all background services.
 * Should be called once on app startup (e.g., in App.jsx useEffect).
 * @param config Configuration object, including userId from auth context
 */
export async function initializeBackgroundServices(config: BackgroundServicesConfig = {}): Promise<void> {
  if (isTestMode) {
    log('Test mode detected; skipping background services initialization.');
    return;
  }

  log('Initializing background services...');

  try {
    // 1. Initialize durable job queue
    log('Setting up durable job queue...');
    const jobQueue = getGlobalDurableJobQueue();
    jobQueue.setProcessor(processDurableJobOnServer);
    log('✓ Durable job queue ready');

    // 2. Initialize telemetry batching pipeline
    if (config.telemetryEndpoint !== false) {
      log('Setting up telemetry batching pipeline...');
      const telemetryEndpoint = config.telemetryEndpoint || '/api/durableJobProcessor';
      initTelemetryPipeline(telemetryEndpoint, {
        batchWindowMs: config.telemetryBatchWindowMs || 30_000,
        maxBatchSize: 100,
        samplingRate: config.telemetrySamplingRate || 1.0,
        flushOnBeforeUnload: true
      });
      log('✓ Telemetry batching pipeline ready');
    }

    // 3. Initialize background task scheduler
    if (config.enableCheckInScheduler !== false) {
      log('Setting up background task scheduler...');
      const scheduler = getGlobalBackgroundTaskScheduler();

      // Get userId from config (passed from App.jsx auth context)
      const userId = config.userId || 'system';

      // Schedule daily check-in
      scheduler.scheduleTask({
        id: 'daily_checkin',
        type: 'checkin',
        schedule: 'daily',
        durable: true,
        handler: async (context) => {
          log('Executing daily check-in task');

          // Enqueue check-in as a durable job
          try {
            await jobQueue.enqueue({
              type: 'checkin_event',
              payload: {
                userId: userId, // Use userId from config instead of hardcoded 'system'
                timestamp: new Date().toISOString(),
                data: {
                  taskId: context.taskId,
                  lastRun: context.lastRun?.toISOString()
                }
              },
              priority: 'normal',
              idempotencyKey: `checkin:${new Date().toDateString()}`
            });
          } catch (error) {
            err('Failed to enqueue check-in job:', error);
          }
        }
      });

      scheduler.start();
      log('✓ Background task scheduler ready');
    }

    // 4. Initialize follow-up delivery workflow
    if (config.enableFollowUpWorkflow !== false) {
      log('Setting up follow-up delivery workflow...');
      getGlobalFollowUpWorkflow();
      // Workflow starts processing automatically in constructor
      log('✓ Follow-up delivery workflow ready');
    }

    // 5. Initialize idempotency deduplication cleanup
    if (config.enableIdempotencyCleanup !== false) {
      log('Setting up idempotency cleanup...');
      startDeduplicationCleanup(60 * 60 * 1000);  // Hourly cleanup
      log('✓ Idempotency cleanup ready');
    }

    log('✓ All background services initialized successfully');
  } catch (error) {
    err('Failed to initialize background services:', error);
    throw error;
  }
}

// ============================================================================
// HEALTH CHECK / DIAGNOSTICS
// ============================================================================

export interface BackgroundServicesHealth {
  jobQueue: {
    stats: {
      queued: number;
      inFlight: number;
      failed: number;
      completed: number;
    };
  };
  followUps: {
    stats: {
      scheduled: number;
      delivered: number;
      failed: number;
      cancelled: number;
    };
  };
  scheduler: {
    total: number;
    active: number;
    dueSoon: number;
  };
  timestamp: string;
}

/**
 * Get health status of all background services.
 */
export async function getBackgroundServicesHealth(): Promise<BackgroundServicesHealth> {
  try {
    const jobQueue = getGlobalDurableJobQueue();
    const scheduler = getGlobalBackgroundTaskScheduler();
    const followUpWorkflow = getGlobalFollowUpWorkflow();

    const jobQueueStats = await jobQueue.getStats();
    const schedulerStats = scheduler.getStats();
    const followUpStats = await followUpWorkflow.getStats();

    return {
      jobQueue: {
        stats: jobQueueStats
      },
      followUps: {
        stats: followUpStats
      },
      scheduler: schedulerStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    err('Failed to get health status:', error);
    throw error;
  }
}

/**
 * Log background services health to console.
 */
export async function logBackgroundServicesHealth(): Promise<void> {
  const health = await getBackgroundServicesHealth();
  console.table({
    'Job Queue (Queued)': health.jobQueue.stats.queued,
    'Job Queue (In-Flight)': health.jobQueue.stats.inFlight,
    'Job Queue (Failed)': health.jobQueue.stats.failed,
    'Follow-Ups (Scheduled)': health.followUps.stats.scheduled,
    'Follow-Ups (Delivered)': health.followUps.stats.delivered,
    'Scheduled Tasks (Active)': health.scheduler.active,
    'Scheduled Tasks (Due Soon)': health.scheduler.dueSoon
  });
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Helper: Track a telemetry event.
 * Use this throughout the app to send telemetry.
 */
export function trackEvent(name: string, properties?: Record<string, any>, userId?: string): void {
  try {
    getTelemetryPipeline().track(name, properties, userId);
  } catch (error) {
    err('Failed to track telemetry:', error);
  }
}

/**
 * Helper: Create a follow-up.
 */
export async function createFollowUp(config: {
  userId: string;
  type: string;
  content: { title: string; description?: string; actionId?: string };
  deliverIn?: number;  // milliseconds from now
  channels?: string[];
}): Promise<string> {
  try {
    const followUpWorkflow = getGlobalFollowUpWorkflow();
    const deliverAt = config.deliverIn
      ? new Date(Date.now() + config.deliverIn)
      : new Date();

    return await followUpWorkflow.createFollowUp({
      userId: config.userId,
      type: config.type as any,
      content: config.content,
      deliverAt,
      channels: config.channels as any
    });
  } catch (error) {
    err('Failed to create follow-up:', error);
    throw error;
  }
}

/**
 * Helper: Schedule a background task.
 */
export function scheduleBackgroundTask(config: {
  id: string;
  type: string;
  schedule: string;
  handler: (context: any) => Promise<void>;
  durable?: boolean;
}): void {
  try {
    const scheduler = getGlobalBackgroundTaskScheduler();
    scheduler.scheduleTask({
      id: config.id,
      type: config.type as any,
      schedule: config.schedule as any,
      handler: config.handler,
      durable: config.durable
    });
  } catch (error) {
    err('Failed to schedule task:', error);
  }
}
