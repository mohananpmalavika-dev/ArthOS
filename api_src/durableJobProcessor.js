/**
 * api_src/durableJobProcessor.js
 *
 * Server-side processor for durable background jobs.
 * Handles delivery of telemetry batches, follow-ups, notifications, etc.
 * Ensures idempotency via request ID deduplication.
 *
 * Integration:
 * - Client: Durable job queue enqueues jobs with idempotencyKey
 * - Server: This processor receives jobs and validates idempotency
 * - Database: Jobs marked as complete/failed with results
 */

import { insertIntoTable, queryTable } from './dbClient.js';
import { createLogger } from './logger.js';

const log = createLogger('[durableJobProcessor]');

const JOBS_TABLE = process.env.SUPABASE_DURABLE_JOBS_TABLE || 'durable_jobs';
const IDEMPOTENCY_TABLE = process.env.SUPABASE_IDEMPOTENCY_TABLE || 'idempotency_keys';
const PROCESSED_JOB_TTL_DAYS = 7;  // Keep processed jobs for 7 days

// ============================================================================
// JOB PROCESSORS BY TYPE
// ============================================================================

const jobProcessors = {
  /**
   * Process telemetry batch.
   */
  async telemetry_batch(job) {
    const batch = job.payload;
    if (!batch || !Array.isArray(batch.events)) {
      throw new Error('Invalid telemetry batch: missing events array');
    }

    // Store batch
    const result = await insertIntoTable('telemetry_batches', {
      batch_id: batch.batchId,
      event_count: batch.batchSize,
      sampling_rate: batch.samplingRate,
      envelope_version: batch.envelopeVersion,
      events: batch.events,
      recorded_at: new Date().toISOString()
    });

    if (result.error) {
      throw new Error(`Failed to store telemetry batch: ${result.error.message}`);
    }

    log.info('Processed telemetry batch', {
      batchId: batch.batchId,
      eventCount: batch.batchSize
    });

    return {
      status: 'processed',
      batchId: batch.batchId,
      eventsProcessed: batch.batchSize
    };
  },

  /**
   * Process follow-up delivery.
   */
  async deliver_followup(job) {
    const followUp = job.payload;
    if (!followUp || !followUp.followUpId) {
      throw new Error('Invalid follow-up: missing followUpId');
    }

    // Store follow-up delivery attempt
    const result = await insertIntoTable('followup_deliveries', {
      followup_id: followUp.followUpId,
      user_id: followUp.userId,
      type: followUp.type,
      channels: followUp.channels,
      content: followUp.content,
      status: 'delivered',
      delivered_at: new Date().toISOString()
    });

    if (result.error) {
      throw new Error(`Failed to store follow-up delivery: ${result.error.message}`);
    }

    log.info('Processed follow-up delivery', {
      followUpId: followUp.followUpId,
      userId: followUp.userId,
      type: followUp.type
    });

    return {
      status: 'delivered',
      followUpId: followUp.followUpId
    };
  },

  /**
   * Process notification send.
   */
  async send_notification(job) {
    const notification = job.payload;
    if (!notification || !notification.id) {
      throw new Error('Invalid notification: missing id');
    }

    // Store notification delivery
    const result = await insertIntoTable('notification_deliveries', {
      notification_id: notification.id,
      user_id: notification.userId,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    if (result.error) {
      throw new Error(`Failed to store notification: ${result.error.message}`);
    }

    log.info('Processed notification send', {
      notificationId: notification.id,
      userId: notification.userId
    });

    return {
      status: 'sent',
      notificationId: notification.id
    };
  },

  /**
   * Process check-in event.
   */
  async checkin_event(job) {
    const checkin = job.payload;
    if (!checkin || !checkin.userId) {
      throw new Error('Invalid check-in: missing userId');
    }

    // Store check-in
    const result = await insertIntoTable('checkins', {
      user_id: checkin.userId,
      timestamp: checkin.timestamp || new Date().toISOString(),
      data: checkin.data || {},
      recorded_at: new Date().toISOString()
    });

    if (result.error) {
      throw new Error(`Failed to store check-in: ${result.error.message}`);
    }

    log.info('Processed check-in event', {
      userId: checkin.userId
    });

    return {
      status: 'recorded',
      userId: checkin.userId
    };
  },

  /**
   * Process memory event.
   */
  async memory_event(job) {
    const event = job.payload;
    if (!event || !event.userId) {
      throw new Error('Invalid memory event: missing userId');
    }

    // Store memory event
    const result = await insertIntoTable('memory_events', {
      user_id: event.userId,
      event_type: event.eventType,
      event_data: event.eventData || {},
      recorded_at: new Date().toISOString()
    });

    if (result.error) {
      throw new Error(`Failed to store memory event: ${result.error.message}`);
    }

    log.info('Processed memory event', {
      userId: event.userId,
      eventType: event.eventType
    });

    return {
      status: 'stored',
      userId: event.userId
    };
  },

  /**
   * Default processor: just log the job.
   */
  async default(job) {
    log.warn('No specific processor for job type', { type: job.type });
    return { status: 'noop', type: job.type };
  }
};

// ============================================================================
// IDEMPOTENCY CHECKING
// ============================================================================

/**
 * Check if a job has already been processed.
 * Returns cached result if found.
 */
async function checkIdempotency(idempotencyKey) {
  if (!idempotencyKey) {
    return null;  // No idempotency check
  }

  try {
    const result = await queryTable(IDEMPOTENCY_TABLE, {
      filters: { idempotency_key: idempotencyKey },
      limit: 1
    });

    if (result.error || !result.data || !result.data.length) {
      return null;
    }

    const record = result.data[0];
    return {
      isDuplicate: true,
      result: record.result,
      processedAt: record.processed_at
    };
  } catch (error) {
    log.warn('Failed to check idempotency', { error: error?.message });
    return null;  // Continue processing on error
  }
}

/**
 * Store idempotency record.
 */
async function storeIdempotencyRecord(idempotencyKey, result) {
  if (!idempotencyKey) {
    return;  // No idempotency key
  }

  try {
    await insertIntoTable(IDEMPOTENCY_TABLE, {
      idempotency_key: idempotencyKey,
      result,
      processed_at: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (PROCESSED_JOB_TTL_DAYS * 24 * 60 * 60)
    });
  } catch (error) {
    log.warn('Failed to store idempotency record', { error: error?.message });
  }
}

// ============================================================================
// MAIN JOB PROCESSOR
// ============================================================================

/**
 * Process a durable job.
 * Handles idempotency, processor dispatch, and result storage.
 */
export async function processDurableJob(job) {
  try {
    // Check idempotency
    const cached = await checkIdempotency(job.idempotencyKey);
    if (cached && cached.isDuplicate) {
      log.info('Duplicate job detected, returning cached result', {
        jobId: job.jobId,
        idempotencyKey: job.idempotencyKey
      });
      return {
        success: true,
        isDuplicate: true,
        result: cached.result
      };
    }

    // Get processor for job type
    const processor = jobProcessors[job.type] || jobProcessors.default;

    // Execute job
    log.info('Processing job', {
      jobId: job.jobId,
      type: job.type,
      priority: job.priority
    });

    const result = await processor(job);

    // Store idempotency record
    await storeIdempotencyRecord(job.idempotencyKey, result);

    log.info('Job completed successfully', {
      jobId: job.jobId,
      type: job.type
    });

    return {
      success: true,
      isDuplicate: false,
      result
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    log.error('Job processing failed', {
      jobId: job.jobId,
      type: job.type,
      error: errorMsg
    });

    throw error;  // Let caller handle retry
  }
}

// ============================================================================
// API ENDPOINT
// ============================================================================

/**
 * Serverless endpoint handler.
 * Receives durable jobs and processes them.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const job = req.body;

    if (!job || !job.jobId || !job.type) {
      return res.status(400).json({
        error: 'Invalid job',
        details: 'Missing jobId or type'
      });
    }

    // Process job
    const result = await processDurableJob(job);

    return res.status(200).json({
      status: 'success',
      jobId: job.jobId,
      isDuplicate: result.isDuplicate,
      result: result.result
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      error: 'Job processing failed',
      message: errorMsg
    });
  }
}
