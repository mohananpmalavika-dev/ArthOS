/**
 * src/lib/followUpWorkflow.ts
 *
 * Durable, idempotent follow-up delivery workflow.
 * Manages scheduling, delivery, retry, and status tracking of follow-ups.
 *
 * Usage:
 *   const workflow = new FollowUpWorkflow();
 *   
 *   await workflow.createFollowUp({
 *     userId: 'user123',
 *     type: 'action_reminder',
 *     content: {
 *       title: 'Review your spending habits',
 *       description: '...',
 *       actionId: 'goal_123'
 *     },
 *     deliverAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // In 7 days
 *     channels: ['in-app', 'email']  // Optional
 *   });
 */

import { getGlobalDurableJobQueue } from './durableJobQueue';

export type FollowUpType = 'action_reminder' | 'check_in' | 'milestone' | 'warning' | string;

export type DeliveryChannel = 'in-app' | 'email' | 'push-notification';

export type FollowUpStatus = 'scheduled' | 'delivered' | 'failed' | 'cancelled';

export interface FollowUp {
  followUpId: string;
  userId: string;
  type: FollowUpType;
  content: {
    title: string;
    description?: string;
    actionId?: string;
    metadata?: Record<string, any>;
  };
  deliverAt: string;  // ISO timestamp
  channels: DeliveryChannel[];
  status: FollowUpStatus;
  deliveredAt?: string;
  failureReason?: string;
  retries: number;
  maxRetries: number;
  createdAt: string;
  idempotencyKey: string;
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
    const request = indexedDB.open('ArthOSFollowUps', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('followups')) {
        const store = db.createObjectStore('followups', { keyPath: 'followUpId' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('deliverAt', 'deliverAt', { unique: false });
        store.createIndex('idempotencyKey', 'idempotencyKey', { unique: false });
      }
    };
  });
}

// ============================================================================
// FOLLOW-UP WORKFLOW
// ============================================================================

export class FollowUpWorkflow {
  private jobQueue = getGlobalDurableJobQueue();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start background processing
    this.startProcessing();
  }

  /**
   * Create a new follow-up.
   */
  async createFollowUp(config: {
    userId: string;
    type: FollowUpType;
    content: {
      title: string;
      description?: string;
      actionId?: string;
      metadata?: Record<string, any>;
    };
    deliverAt: Date;
    channels?: DeliveryChannel[];
    idempotencyKey?: string;
  }): Promise<string> {
    const followUpId = `followup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const idempotencyKey = config.idempotencyKey || `followup:${followUpId}`;

    const followUp: FollowUp = {
      followUpId,
      userId: config.userId,
      type: config.type,
      content: config.content,
      deliverAt: config.deliverAt.toISOString(),
      channels: config.channels || ['in-app'],
      status: 'scheduled',
      retries: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      idempotencyKey
    };

    await this.storeFollowUp(followUp);
    console.info(`[FollowUpWorkflow] Created follow-up: ${followUpId}`, { userId: config.userId, type: config.type });

    return followUpId;
  }

  /**
   * Get follow-up by ID.
   */
  async getFollowUp(followUpId: string): Promise<FollowUp | null> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('followups', 'readonly');
      const store = tx.objectStore('followups');
      const request = store.get(followUpId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Get all follow-ups for a user.
   */
  async getFollowUpsForUser(userId: string, status?: FollowUpStatus): Promise<FollowUp[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('followups', 'readonly');
      const store = tx.objectStore('followups');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let followUps: FollowUp[] = request.result || [];
        if (status) {
          followUps = followUps.filter(fu => fu.status === status);
        }
        resolve(followUps);
      };
    });
  }

  /**
   * Cancel a follow-up.
   */
  async cancelFollowUp(followUpId: string): Promise<void> {
    const followUp = await this.getFollowUp(followUpId);
    if (!followUp) {
      throw new Error(`Follow-up not found: ${followUpId}`);
    }

    followUp.status = 'cancelled';
    await this.storeFollowUp(followUp);

    console.info(`[FollowUpWorkflow] Cancelled follow-up: ${followUpId}`);
  }

  /**
   * Start background delivery processing.
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    // Check for due follow-ups every 5 minutes
    this.processingInterval = setInterval(() => {
      void this.processScheduledFollowUps();
    }, 5 * 60 * 1000);

    // Initial check
    void this.processScheduledFollowUps();

    console.info('[FollowUpWorkflow] Started background processing');
  }

  /**
   * Stop background delivery processing.
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    console.info('[FollowUpWorkflow] Stopped background processing');
  }

  /**
   * Process all scheduled follow-ups that are due.
   */
  private async processScheduledFollowUps(): Promise<void> {
    const db = await initDB();
    const now = new Date().toISOString();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('followups', 'readwrite');
      const store = tx.objectStore('followups');
      const index = store.index('status');
      const request = index.openCursor('scheduled');

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          const followUp: FollowUp = cursor.value;

          // Check if due
          if (followUp.deliverAt <= now) {
            void this.deliverFollowUp(followUp);
          }

          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Deliver a single follow-up.
   */
  private async deliverFollowUp(followUp: FollowUp): Promise<void> {
    try {
      // Enqueue as durable job
      const jobId = await this.jobQueue.enqueue({
        type: 'deliver_followup',
        payload: followUp,
        priority: 'high',
        idempotencyKey: followUp.idempotencyKey,
        maxRetries: followUp.maxRetries
      });

      console.info(`[FollowUpWorkflow] Enqueued delivery job: ${jobId}`, { followUpId: followUp.followUpId });
    } catch (error) {
      console.error(`[FollowUpWorkflow] Failed to enqueue delivery: ${followUp.followUpId}`, error);
      // Will retry on next processing cycle
    }
  }

  /**
   * Mark follow-up as delivered.
   */
  async markDelivered(followUpId: string, deliveryTime: Date = new Date()): Promise<void> {
    const followUp = await this.getFollowUp(followUpId);
    if (!followUp) {
      throw new Error(`Follow-up not found: ${followUpId}`);
    }

    followUp.status = 'delivered';
    followUp.deliveredAt = deliveryTime.toISOString();
    await this.storeFollowUp(followUp);

    console.info(`[FollowUpWorkflow] Marked as delivered: ${followUpId}`);
  }

  /**
   * Mark follow-up as failed and update retry count.
   */
  async markFailed(followUpId: string, failureReason: string): Promise<void> {
    const followUp = await this.getFollowUp(followUpId);
    if (!followUp) {
      throw new Error(`Follow-up not found: ${followUpId}`);
    }

    followUp.retries += 1;
    followUp.failureReason = failureReason;

    if (followUp.retries >= followUp.maxRetries) {
      followUp.status = 'failed';
      console.error(`[FollowUpWorkflow] Max retries exceeded: ${followUpId}`, failureReason);
    } else {
      // Will be retried on next cycle
      console.warn(`[FollowUpWorkflow] Delivery failed, will retry: ${followUpId}`, failureReason);
    }

    await this.storeFollowUp(followUp);
  }

  /**
   * Get stats about follow-ups.
   */
  async getStats(): Promise<{
    scheduled: number;
    delivered: number;
    failed: number;
    cancelled: number;
  }> {
    const db = await initDB();
    const statuses: FollowUpStatus[] = ['scheduled', 'delivered', 'failed', 'cancelled'];
    const stats: Record<FollowUpStatus, number> = {
      scheduled: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0
    };

    for (const status of statuses) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('followups', 'readonly');
        const store = tx.objectStore('followups');
        const index = store.index('status');
        const request = index.count(status);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          stats[status] = request.result;
          resolve();
        };
      });
    }

    return stats;
  }

  /**
   * Store follow-up in IndexedDB.
   */
  private async storeFollowUp(followUp: FollowUp): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('followups', 'readwrite');
      const store = tx.objectStore('followups');
      const request = store.put(followUp);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let globalWorkflow: FollowUpWorkflow | null = null;

/**
 * Get or create global follow-up workflow instance.
 */
export function getGlobalFollowUpWorkflow(): FollowUpWorkflow {
  if (!globalWorkflow) {
    globalWorkflow = new FollowUpWorkflow();
  }
  return globalWorkflow;
}
