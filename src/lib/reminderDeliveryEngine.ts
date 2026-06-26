/**
 * Reminder Delivery Engine
 * 
 * Durable, multi-channel reminder delivery integrated with DurableJobQueue.
 * Supports push, email, in-app, calendar, and browser notifications.
 * 
 * Uses:
 * - DurableJobQueue for retry + exponential backoff
 * - IndexedDB for local reminder scheduling
 * - Server-side delivery via durable jobs
 */

import { eventBus } from './eventBus';
import { getGlobalDurableJobQueue } from './durableJobQueue';

export type ReminderChannel = 'push' | 'email' | 'in-app' | 'calendar' | 'browser';

export type ReminderType = 'check-in' | 'action-followup' | 'goal-review' | 'weekly-summary' | 'custom';

export interface ReminderSpec {
  id: string;
  userId: string;
  type: ReminderType;

  // Scheduling
  deliverAt: number;                // Unix timestamp (ms)
  timezone: string;                 // e.g., 'America/New_York'

  // Content
  title: string;
  body: string;
  actionUrl?: string;               // Deep link
  actionLabel?: string;

  // Channels
  channels: ReminderChannel[];
  channelPreferences?: {
    push?: { enabled: boolean; quiet: boolean };
    email?: { enabled: boolean; template?: string };
    inApp?: { enabled: boolean };
    calendar?: { enabled: boolean };
  };

  // Retry strategy
  maxRetries: number;
  retryDelayMs: number;

  // Metadata
  idempotencyKey: string;
  createdAt: number;
  metadata?: Record<string, any>;

  // Populated when persisted / during delivery
  status?: 'pending' | 'delivered' | 'failed' | 'cancelled';
  attempts?: number;
  lastAttemptAt?: number;
  lastError?: string;
  channelStatus?: Partial<Record<ReminderChannel, 'pending' | 'delivered' | 'failed'>>;
}

export interface DeliveryStatus {
  status: 'pending' | 'delivered' | 'failed' | 'cancelled';
  channels: Record<ReminderChannel, 'pending' | 'delivered' | 'failed'>;
  lastAttempt: number;
  retries: number;
  error?: string;
}

function createDefaultChannelStatus(): Record<ReminderChannel, 'pending' | 'delivered' | 'failed'> {
  return {
    push: 'pending',
    email: 'pending',
    'in-app': 'pending',
    calendar: 'pending',
    browser: 'pending'
  };
}

function getChannelPreference(
  preferences: ReminderSpec['channelPreferences'],
  channel: ReminderChannel
) {
  if (!preferences) {
    return undefined;
  }

  switch (channel) {
    case 'push':
    case 'browser':
      return preferences.push;
    case 'email':
      return preferences.email;
    case 'in-app':
      return preferences.inApp;
    case 'calendar':
      return preferences.calendar;
    default:
      return undefined;
  }
}

class ReminderDeliveryEngine {
  private static instance: ReminderDeliveryEngine;
  private db: IDBDatabase | null = null;
  private processingTimerId: ReturnType<typeof setTimeout> | null = null;
  private nextReminderAt: number | null = null;
  private dbReadyResolver!: () => void;
  private dbReadyPromise: Promise<void>;
  private readonly DB_NAME = 'ArthOSReminders';
  private readonly STORE_NAME = 'reminders';

  private constructor() {
    this.dbReadyPromise = new Promise((resolve) => {
      this.dbReadyResolver = resolve;
    });

    this.initializeDatabase();
    eventBus.on('reminder:scheduled', this.handleReminderScheduled);
  }

  /**
   * Get or create singleton
   */
  static getInstance(): ReminderDeliveryEngine {
    if (!ReminderDeliveryEngine.instance) {
      ReminderDeliveryEngine.instance = new ReminderDeliveryEngine();
    }
    return ReminderDeliveryEngine.instance;
  }

  /**
   * Initialize IndexedDB for reminder storage
   */
  private initializeDatabase(): void {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available');
      return;
    }

    const request = indexedDB.open(this.DB_NAME, 1);

    request.onerror = () => {
      console.error('Reminder DB error:', request.error);
      this.dbReadyResolver();
    };

    request.onsuccess = () => {
      this.db = request.result;
      console.info('Reminder database initialized');
      this.dbReadyResolver();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('deliverAt', 'deliverAt', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        console.info('Reminder object store created');
      }
    };
  }

  /**
   * Schedule a reminder for delivery (persists to IndexedDB + enqueues job)
   */
  async scheduleReminder(spec: ReminderSpec): Promise<{ reminderId: string }> {
    await this.dbReadyPromise;
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Store reminder locally
    const reminderId = spec.id;
    const reminder = {
      ...spec,
      status: 'pending' as const,
      attempts: 0,
      channelStatus: Object.fromEntries(
        spec.channels.map((ch) => [ch, 'pending'])
      )
    };

    await this.dbPut(reminder);

    console.info('Reminder scheduled', {
      reminderId,
      deliverAt: new Date(spec.deliverAt).toISOString(),
      channels: spec.channels
    });

    eventBus.emit('reminder:scheduled', reminder);
    return { reminderId };
  }

  /**
   * Get all scheduled reminders for a user
   */
  async getScheduledReminders(userId: string): Promise<ReminderSpec[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        resolve(request.result.filter((r) => r.status !== 'delivered'));
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cancel a scheduled reminder
   */
  async cancelReminder(reminderId: string): Promise<void> {
    const reminder = await this.dbGet(reminderId);
    if (reminder) {
      reminder.status = 'cancelled';
      await this.dbPut(reminder);
      console.info('Reminder cancelled', { reminderId });
    }
  }

  /**
   * Update reminder channels
   */
  async updateReminderChannels(reminderId: string, channels: ReminderChannel[]): Promise<void> {
    const reminder = await this.dbGet(reminderId);
    if (reminder) {
      reminder.channels = channels;
      await this.dbPut(reminder);
      console.info('Reminder channels updated', { reminderId, channels });
    }
  }

  /**
   * Mark channel as delivered
   */
  async markChannelDelivered(reminderId: string, channel: ReminderChannel): Promise<void> {
    const reminder = await this.dbGet(reminderId);
    if (reminder) {
      reminder.channelStatus = reminder.channelStatus || {};
      reminder.channelStatus[channel] = 'delivered';

      // Check if all channels delivered
      const allDelivered = Object.values(reminder.channelStatus).every((s) => s === 'delivered');
      if (allDelivered) {
        reminder.status = 'delivered';
      }

      await this.dbPut(reminder);
    }
  }

  /**
   * Get delivery status for a reminder
   */
  async getDeliveryStatus(reminderId: string): Promise<DeliveryStatus> {
    const reminder = await this.dbGet(reminderId);

    if (!reminder) {
      return {
        status: 'pending',
        channels: createDefaultChannelStatus(),
        lastAttempt: 0,
        retries: 0
      };
    }

    return {
      status: reminder.status || 'pending',
      channels: {
        ...createDefaultChannelStatus(),
        ...(reminder.channelStatus || {})
      },
      lastAttempt: reminder.lastAttemptAt || 0,
      retries: reminder.attempts || 0,
      error: reminder.lastError
    };
  }

  /**
   * Process and deliver due reminders (called by background processor)
   * @returns Number of reminders processed
   */
  async processAndDeliver(): Promise<number> {
    if (!this.db) return 0;

    const now = Date.now();
    let processed = 0;

    // Query all due reminders
    const reminders = await new Promise<any[]>((resolve, reject) => {
      const tx = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('deliverAt');
      const range = IDBKeyRange.upperBound(now);
      const request = index.getAll(range);

      request.onsuccess = () => {
        resolve(
          request.result.filter(
            (r) => r.status === 'pending' || r.status === 'failed'
          )
        );
      };

      request.onerror = () => reject(request.error);
    });

    // Process each due reminder
    for (const reminder of reminders) {
      try {
        await this.enqueueDurableDelivery(reminder);
        processed++;
      } catch (error) {
        console.error('Failed to enqueue reminder delivery:', error, {
          reminderId: reminder.id
        });
      }
    }

    return processed;
  }

  /**
   * Enqueue reminder delivery as durable job
   */
  private async enqueueDurableDelivery(reminder: ReminderSpec): Promise<void> {
    const jobQueue = getGlobalDurableJobQueue();

    // Enqueue job for each channel
    for (const channel of reminder.channels) {
      const channelPref = getChannelPreference(reminder.channelPreferences, channel);

      // Skip disabled channels
      if (channelPref && !channelPref.enabled) {
        console.info('Channel disabled, skipping', { channel });
        continue;
      }

      const jobPayload = {
        reminderId: reminder.id,
        userId: reminder.userId,
        channel,
        reminder,
        timestamp: Date.now()
      };

      try {
        await jobQueue.enqueue({
          type: 'reminder_delivery',
          payload: jobPayload,
          priority: 'high',
          maxRetries: reminder.maxRetries,
          idempotencyKey: `${reminder.idempotencyKey}-${channel}`
        });

        console.info('Reminder delivery enqueued', {
          reminderId: reminder.id,
          channel
        });
      } catch (error) {
        console.error('Failed to enqueue reminder delivery job:', error);
        throw error;
      }
    }

    // Update reminder attempt count
    reminder.attempts = (reminder.attempts || 0) + 1;
    reminder.lastAttemptAt = Date.now();
    await this.dbPut(reminder);
  }

  /**
   * Start background reminder processor.
   */
  start(): void {
    if (this.processingTimerId) {
      console.warn('Reminder processor already running');
      return;
    }

    void this.dbReadyPromise.then(() => {
      void this.processAndDeliver().then(() => {
        void this.scheduleNextReminder();
      }).catch((error) => {
        console.error('Reminder delivery process failed:', error);
        void this.scheduleNextReminder();
      });
    }).catch((error) => {
      console.error('Reminder DB readiness failed:', error);
    });

    console.info('Reminder processor started');
  }

  /**
   * Stop background processor
   */
  stop(): void {
    if (this.processingTimerId) {
      clearTimeout(this.processingTimerId);
      this.processingTimerId = null;
      this.nextReminderAt = null;
    }

    eventBus.off('reminder:scheduled', this.handleReminderScheduled);
    console.info('Reminder processor stopped');
  }

  private handleReminderScheduled = async (reminder: ReminderSpec): Promise<void> => {
    if (!reminder || reminder.status !== 'pending') {
      return;
    }

    if (this.nextReminderAt === null || reminder.deliverAt < this.nextReminderAt) {
      await this.scheduleNextReminder();
    }
  };

  private async scheduleNextReminder(): Promise<void> {
    if (!this.db) {
      return;
    }

    if (this.processingTimerId) {
      clearTimeout(this.processingTimerId);
      this.processingTimerId = null;
      this.nextReminderAt = null;
    }

    const now = Date.now();

    const reminders = await new Promise<any[]>((resolve, reject) => {
      const tx = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('deliverAt');
      const request = index.getAll();

      request.onsuccess = () => {
        resolve(
          (request.result || []).filter(
            (r: any) => (r.status === 'pending' || r.status === 'failed') && r.deliverAt >= now
          )
        );
      };

      request.onerror = () => reject(request.error);
    });

    const nextReminder = reminders.reduce((earliest: any | null, reminder: any) => {
      if (!earliest || reminder.deliverAt < earliest.deliverAt) {
        return reminder;
      }
      return earliest;
    }, null);

    if (!nextReminder) {
      return;
    }

    const waitMs = Math.max(0, nextReminder.deliverAt - now);
    this.nextReminderAt = nextReminder.deliverAt;
    this.processingTimerId = setTimeout(async () => {
      this.processingTimerId = null;
      this.nextReminderAt = null;

      try {
        await this.processAndDeliver();
      } catch (error) {
        console.error('Reminder delivery process failed:', error);
      } finally {
        await this.scheduleNextReminder();
      }
    }, waitMs);
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    isRunning: boolean;
    dbReady: boolean;
    remindersCount?: number;
  } {
    return {
      isRunning: this.processingTimerId !== null,
      dbReady: this.db !== null
    };
  }

  // ============ Private DB helpers ============

  private dbGet(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const tx = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private dbPut(reminder: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const tx = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put(reminder);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Global singleton getter
 */
export function getReminderDeliveryEngine(): ReminderDeliveryEngine {
  return ReminderDeliveryEngine.getInstance();
}

export default ReminderDeliveryEngine;
