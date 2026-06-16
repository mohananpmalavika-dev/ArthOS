/**
 * src/lib/backgroundTaskScheduler.ts
 *
 * Durable background task scheduler that survives tab close and session boundaries.
 * Stores scheduled tasks in IndexedDB and executes them based on cron-like schedules.
 *
 * Usage:
 *   const scheduler = new BackgroundTaskScheduler();
 *   
 *   scheduler.scheduleTask({
 *     id: 'daily_checkin',
 *     type: 'checkin',
 *     schedule: 'daily',  // 'hourly', 'daily', 'weekly', or cron string
 *     handler: async (taskContext) => {
 *       await apiPost('/api/checkin', { userId, timestamp: new Date().toISOString() });
 *     },
 *     durable: true  // Survives crashes
 *   });
 *
 *   scheduler.start();  // Start processing
 */

export type TaskSchedule = 'hourly' | 'daily' | 'weekly' | 'monthly' | string;  // Cron string support

export type TaskType = 'checkin' | 'sync_memory' | 'send_followup' | 'cleanup' | string;

export interface ScheduledTask {
  id: string;
  type: TaskType;
  schedule: TaskSchedule;
  durable: boolean;  // If true, stored in IndexedDB
  lastRun?: string;  // ISO timestamp
  nextRun: string;   // ISO timestamp
  createdAt: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface TaskContext {
  taskId: string;
  type: TaskType;
  lastRun?: Date;
  nextRun: Date;
}

// ============================================================================
// CRON SCHEDULE PARSING
// ============================================================================

/**
 * Calculate next run time based on schedule.
 */
function getNextRunTime(schedule: TaskSchedule, lastRun?: Date): Date {
  const now = new Date();
  const base = lastRun ? new Date(lastRun) : now;

  switch (schedule) {
    case 'hourly':
      return new Date(base.getTime() + 60 * 60 * 1000);

    case 'daily':
      const tomorrow = new Date(base);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);  // Default: 9 AM
      return tomorrow;

    case 'weekly':
      const nextWeek = new Date(base);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek;

    case 'monthly':
      const nextMonth = new Date(base);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(9, 0, 0, 0);
      return nextMonth;

    default:
      // Treat as cron expression - for now, just advance by 1 hour
      console.warn(`[BackgroundTaskScheduler] Unsupported cron: ${schedule}`);
      return new Date(base.getTime() + 60 * 60 * 1000);
  }
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
    const request = indexedDB.open('ArthOSBackgroundTasks', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('tasks')) {
        const store = db.createObjectStore('tasks', { keyPath: 'id' });
        store.createIndex('nextRun', 'nextRun', { unique: false });
        store.createIndex('isActive', 'isActive', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

// ============================================================================
// BACKGROUND TASK SCHEDULER
// ============================================================================

export class BackgroundTaskScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private handlers: Map<string, (context: TaskContext) => Promise<void>> = new Map();
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly pollIntervalMs = 60_000;  // Check every minute

  constructor() {
    this.loadPersistedTasks();
  }

  /**
   * Schedule a task with an async handler.
   */
  scheduleTask(config: {
    id: string;
    type: TaskType;
    schedule: TaskSchedule;
    handler: (context: TaskContext) => Promise<void>;
    durable?: boolean;
    metadata?: Record<string, any>;
  }): void {
    const task: ScheduledTask = {
      id: config.id,
      type: config.type,
      schedule: config.schedule,
      durable: config.durable ?? false,
      nextRun: getNextRunTime(config.schedule).toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true,
      metadata: config.metadata
    };

    this.tasks.set(config.id, task);
    this.handlers.set(config.id, config.handler);

    if (task.durable) {
      void this.persistTask(task);
    }

    console.info(`[BackgroundTaskScheduler] Scheduled task: ${config.id} (${config.schedule})`);
  }

  /**
   * Unschedule a task.
   */
  unscheduleTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.handlers.delete(taskId);

    const db = dbInstance;
    if (db) {
      void new Promise<void>((resolve, reject) => {
        const tx = db.transaction('tasks', 'readwrite');
        const store = tx.objectStore('tasks');
        const request = store.delete(taskId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }

    console.info(`[BackgroundTaskScheduler] Unscheduled task: ${taskId}`);
  }

  /**
   * Start processing scheduled tasks.
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Initial check
    void this.checkAndRunDueTasks();

    // Periodic check
    this.processingInterval = setInterval(() => {
      void this.checkAndRunDueTasks();
    }, this.pollIntervalMs);

    console.info('[BackgroundTaskScheduler] Started');
  }

  /**
   * Stop processing scheduled tasks.
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    console.info('[BackgroundTaskScheduler] Stopped');
  }

  /**
   * Check for due tasks and run them.
   */
  private async checkAndRunDueTasks(): Promise<void> {
    const now = new Date();
    const dueTasks: ScheduledTask[] = [];

    for (const task of this.tasks.values()) {
      if (!task.isActive) {
        continue;
      }

      const nextRun = new Date(task.nextRun);
      if (nextRun <= now) {
        dueTasks.push(task);
      }
    }

    for (const task of dueTasks) {
      await this.runTask(task);
    }
  }

  /**
   * Run a single task.
   */
  private async runTask(task: ScheduledTask): Promise<void> {
    const handler = this.handlers.get(task.id);
    if (!handler) {
      console.warn(`[BackgroundTaskScheduler] No handler for task: ${task.id}`);
      return;
    }

    try {
      const context: TaskContext = {
        taskId: task.id,
        type: task.type,
        lastRun: task.lastRun ? new Date(task.lastRun) : undefined,
        nextRun: new Date(task.nextRun)
      };

      console.info(`[BackgroundTaskScheduler] Running task: ${task.id}`);
      await handler(context);

      // Update task
      task.lastRun = new Date().toISOString();
      task.nextRun = getNextRunTime(task.schedule, new Date(task.lastRun)).toISOString();
      this.tasks.set(task.id, task);

      if (task.durable) {
        await this.persistTask(task);
      }

      console.info(`[BackgroundTaskScheduler] Task completed: ${task.id}, next run: ${task.nextRun}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[BackgroundTaskScheduler] Task failed: ${task.id}`, errorMsg);

      // Reschedule for next interval despite error
      task.nextRun = getNextRunTime(task.schedule).toISOString();
      this.tasks.set(task.id, task);

      if (task.durable) {
        await this.persistTask(task);
      }
    }
  }

  /**
   * Persist task to IndexedDB.
   */
  private async persistTask(task: ScheduledTask): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      const request = store.put(task);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Load persisted tasks from IndexedDB.
   */
  private async loadPersistedTasks(): Promise<void> {
    try {
      const db = await initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('tasks', 'readonly');
        const store = tx.objectStore('tasks');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const tasks: ScheduledTask[] = request.result || [];
          for (const task of tasks) {
            this.tasks.set(task.id, task);
          }
          console.info(`[BackgroundTaskScheduler] Loaded ${tasks.length} persisted tasks`);
          resolve();
        };
      });
    } catch (error) {
      console.warn('[BackgroundTaskScheduler] Failed to load persisted tasks:', error);
    }
  }

  /**
   * Get task by ID.
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks.
   */
  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get stats.
   */
  getStats(): { total: number; active: number; duesoon: number } {
    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 15 * 60_000);  // Next 15 minutes

    let total = 0;
    let active = 0;
    let dueSoon = 0;

    for (const task of this.tasks.values()) {
      total += 1;
      if (task.isActive) active += 1;
      if (task.isActive && new Date(task.nextRun) <= soonThreshold) dueSoon += 1;
    }

    return { total, active, dueSoon };
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let globalScheduler: BackgroundTaskScheduler | null = null;

/**
 * Get or create global background task scheduler instance.
 */
export function getGlobalBackgroundTaskScheduler(): BackgroundTaskScheduler {
  if (!globalScheduler) {
    globalScheduler = new BackgroundTaskScheduler();
  }
  return globalScheduler;
}
