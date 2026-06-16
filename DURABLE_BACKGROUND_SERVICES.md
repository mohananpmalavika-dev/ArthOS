# Durable Background Services Architecture

## Overview

This document describes the complete durable background services layer that provides **idempotent endpoints**, **durable job scheduling**, and **standardized telemetry batching** for ARTH.OS.

**Problem Solved**: Previously, system services (telemetry, notifications, follow-ups) relied on direct API calls from `App.jsx` with simple localStorage queuing. This lacked:
- **Idempotency guarantees**: Retried requests could duplicate side effects
- **Durability**: No recovery after browser crashes
- **Scheduling**: No periodic tasks that survive session boundaries
- **Batching**: Scattered telemetry calls overwhelmed the API

**Solution**: OS-like background services layer built on IndexedDB, with automatic retry, deduplication, and batching.

---

## Architecture Layers

### Layer 1: Idempotent Request Handler (`src/lib/idempotentRequests.ts`)

Deduplicates requests based on payload content hash.

**Key Features**:
- Generates stable `requestId` from SHA256 hash of normalized payload
- Caches results in IndexedDB with configurable TTL (default 24h)
- Returns cached result if retry detected
- Safe for retries without side effect duplication

**Usage**:
```typescript
import { IdempotentRequest } from './lib/idempotentRequests';

const req = IdempotentRequest.create({
  endpoint: '/api/saveAssessment',
  payload: { assessment, result },
  type: 'assessment_save',
  ttlMs: 24 * 60 * 60 * 1000
});

const result = await req.send();  // Safe to retry multiple times
if (result.isDuplicate) {
  console.log('Request was already processed');
}
```

**Database**: IndexedDB `ArthOSDeduplication` store
- Fields: `requestId`, `contentHash`, `endpoint`, `type`, `result`, `timestamp`, `expiresAt`

---

### Layer 2: Durable Job Queue (`src/lib/durableJobQueue.ts`)

Persists jobs across crashes with automatic retry and exponential backoff.

**Key Features**:
- Priority-based processing (high/normal/low)
- Exponential backoff with jitter (1s → 2s → 4s → ... → 1h max)
- Job lifecycle: queued → in-flight → complete/failed → archived
- Auto-cleanup of old jobs (default 24h)
- Concurrent processing (up to 5 jobs)

**Job Structure**:
```typescript
{
  jobId: string;           // Unique identifier
  type: string;            // 'telemetry_batch', 'deliver_followup', etc.
  payload: any;            // Job-specific data
  status: JobStatus;       // 'queued' | 'in-flight' | 'complete' | 'failed'
  priority: 'low' | 'normal' | 'high';
  retries: number;         // Current retry count
  maxRetries: number;      // Default 5
  idempotencyKey?: string; // For deduplication
  nextRetryAt?: string;    // ISO timestamp
  lastError?: string;      // Last error message
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
}
```

**Usage**:
```typescript
import { getGlobalDurableJobQueue } from './lib/durableJobQueue';

const queue = getGlobalDurableJobQueue();

// Register processor
queue.setProcessor(async (job) => {
  // Send to server or handle locally
  const response = await fetch('/api/processor', { 
    method: 'POST', 
    body: JSON.stringify(job) 
  });
  return await response.json();
});

// Enqueue job
await queue.enqueue({
  type: 'send_notification',
  payload: { title: 'New score!', userId: '123' },
  priority: 'high',
  idempotencyKey: 'notif:xyz'
});

// Check stats
const stats = await queue.getStats();
console.log(`Queued: ${stats.queued}, Failed: ${stats.failed}`);
```

**Database**: IndexedDB `ArthOSDurableJobs` store
- Fields: `jobId`, `type`, `payload`, `status`, `priority`, `retries`, `nextRetryAt`, `idempotencyKey`
- Indices: status, nextRetryAt, priority, idempotencyKey, type

---

### Layer 3: Telemetry Batching Pipeline (`src/lib/telemetryBatchingPipeline.ts`)

Batches telemetry events and sends as grouped batches via job queue.

**Key Features**:
- Time-windowed batching (default 30 seconds)
- Size-based flushing (default 100 events max)
- Sampling support (send 1% of events if needed)
- Synchronous flush on beforeunload using sendBeacon
- Stable session ID generation

**Batch Envelope**:
```typescript
{
  batchId: string;
  events: TelemetryEvent[];
  batchSize: number;
  samplingRate: number;    // 0.0-1.0
  envelopeVersion: string; // "1.0"
  createdAt: string;
  idempotencyKey: string;  // For deduplication
}
```

**Usage**:
```typescript
import { initTelemetryPipeline, trackTelemetry } from './lib/telemetryBatchingPipeline';

// Initialize once on startup
initTelemetryPipeline('/api/telemetry', {
  batchWindowMs: 30_000,    // Batch every 30 seconds
  maxBatchSize: 100,
  samplingRate: 1.0,
  flushOnBeforeUnload: true
});

// Track events throughout the app
trackTelemetry('score_calculated', { 
  newScore: 45, 
  delta: 5,
  userId: 'user123'
});

trackTelemetry('assessment_submitted', {
  assessmentId: 'abc123',
  completionMs: 2500
});

// Manual flush if needed
getTelemetryPipeline().flush();
```

**How It Works**:
1. Events accumulated in memory buffer
2. Flushed on timer (30s) or when buffer reaches 100 events
3. Batch enqueued as durable job with idempotency key
4. Job queue retries via server processor if needed
5. On beforeunload, uses sendBeacon for reliable delivery

---

### Layer 4: Background Task Scheduler (`src/lib/backgroundTaskScheduler.ts`)

Schedules durable periodic tasks like daily check-ins.

**Key Features**:
- Schedule expressions: `hourly`, `daily`, `weekly`, `monthly`
- IndexedDB persistence (survives crashes and tab close)
- Automatic retry on failure
- Next run time calculated based on last run
- Async handlers

**Supported Schedules**:
```
'hourly'   → Every hour
'daily'    → Daily at 9 AM
'weekly'   → Every 7 days at 9 AM
'monthly'  → First of month at 9 AM
```

**Usage**:
```typescript
import { getGlobalBackgroundTaskScheduler } from './lib/backgroundTaskScheduler';

const scheduler = getGlobalBackgroundTaskScheduler();

// Schedule daily check-in
scheduler.scheduleTask({
  id: 'daily_checkin',
  type: 'checkin',
  schedule: 'daily',
  durable: true,  // Saved to IndexedDB
  handler: async (context) => {
    console.log(`Running task: ${context.taskId}`);
    // Will be called at scheduled time even if tab was closed
    await fetch('/api/checkin', {
      method: 'POST',
      body: JSON.stringify({ userId: '123' })
    });
  }
});

// Start processing
scheduler.start();

// Check stats
const stats = scheduler.getStats();
console.log(`Active tasks: ${stats.active}, Due soon: ${stats.dueSoon}`);

// Stop processing
scheduler.stop();
```

**Database**: IndexedDB `ArthOSBackgroundTasks` store
- Fields: `id`, `type`, `schedule`, `lastRun`, `nextRun`, `isActive`, `durable`, `metadata`
- Indices: nextRun, isActive, type

---

### Layer 5: Follow-Up Delivery Workflow (`src/lib/followUpWorkflow.ts`)

Manages scheduling and delivery of follow-ups with retry logic.

**Key Features**:
- Durable storage of follow-up events
- Schedule with future delivery time
- Support multiple channels (in-app, email, push)
- Automatic retry with exponential backoff
- Status tracking (scheduled → delivered/failed/cancelled)

**Follow-Up Structure**:
```typescript
{
  followUpId: string;
  userId: string;
  type: string;              // 'action_reminder', 'check_in', etc.
  content: {
    title: string;
    description?: string;
    actionId?: string;
  };
  deliverAt: string;         // ISO timestamp
  channels: ['in-app', 'email'];
  status: 'scheduled' | 'delivered' | 'failed' | 'cancelled';
  retries: number;
  maxRetries: number;
  idempotencyKey: string;
}
```

**Usage**:
```typescript
import { getGlobalFollowUpWorkflow } from './lib/followUpWorkflow';

const workflow = getGlobalFollowUpWorkflow();

// Schedule a follow-up for 7 days from now
const followUpId = await workflow.createFollowUp({
  userId: 'user123',
  type: 'action_reminder',
  content: {
    title: 'Review spending habits',
    description: 'Check your weekly summary',
    actionId: 'goal_123'
  },
  deliverAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  channels: ['in-app']
});

// Get stats
const stats = await workflow.getStats();
console.log(`Scheduled: ${stats.scheduled}, Delivered: ${stats.delivered}`);

// Mark as delivered
await workflow.markDelivered(followUpId);

// Cancel if needed
await workflow.cancelFollowUp(followUpId);
```

**Delivery Flow**:
1. Follow-up created and stored in IndexedDB
2. At `deliverAt` time, enqueued as durable job
3. Server processor stores delivery record
4. On failure, automatically retried with exponential backoff
5. Status updated in IndexedDB

**Database**: IndexedDB `ArthOSFollowUps` store
- Fields: `followUpId`, `userId`, `type`, `content`, `deliverAt`, `status`, `retries`, `idempotencyKey`
- Indices: userId, status, deliverAt, idempotencyKey

---

### Layer 6: Durable Job Processor (`api_src/durableJobProcessor.js`)

Server-side handler that processes jobs from the queue.

**Key Features**:
- Type-specific handlers for each job type
- Idempotency checking before processing
- Structured result storage
- TTL-based deduplication cache (default 7 days)

**Supported Job Types**:
```javascript
'telemetry_batch'     → Store telemetry batch
'deliver_followup'    → Deliver follow-up event
'send_notification'   → Send notification
'checkin_event'       → Record check-in
'memory_event'        → Store memory event
```

**Endpoint**: `POST /api/durableJobProcessor`

**Request**:
```json
{
  "jobId": "send_notification:1234567890:abc123",
  "type": "send_notification",
  "payload": { "title": "...", "userId": "..." },
  "idempotencyKey": "notif:xyz"
}
```

**Response**:
```json
{
  "status": "success",
  "jobId": "send_notification:1234567890:abc123",
  "isDuplicate": false,
  "result": { "status": "sent", "notificationId": "..." }
}
```

**Idempotency Flow**:
1. Check if `idempotencyKey` already processed
2. If yes, return cached result immediately
3. If no, process job and cache result
4. Store in `idempotency_keys` table with TTL

---

### Layer 7: Background Services Initializer (`src/lib/backgroundServicesInitializer.ts`)

Central initialization that wires everything together.

**Usage**:
```typescript
import { initializeBackgroundServices, trackEvent, createFollowUp } from './lib/backgroundServicesInitializer';

// In App.jsx useEffect
useEffect(() => {
  void initializeBackgroundServices({
    telemetryEndpoint: '/api/durableJobProcessor',
    telemetryBatchWindowMs: 30_000,
    telemetrySamplingRate: 1.0,
    enableCheckInScheduler: true,
    enableFollowUpWorkflow: true,
    enableIdempotencyCleanup: true
  });
}, []);

// Use helpers throughout app
trackEvent('user_clicked_button', { buttonId: 'save' });

await createFollowUp({
  userId: 'user123',
  type: 'action_reminder',
  content: { title: 'Remember to save' },
  deliverIn: 24 * 60 * 60 * 1000  // In 24 hours
});

// Health check
const health = await getBackgroundServicesHealth();
console.log(health);
```

**Health Check Output**:
```json
{
  "jobQueue": {
    "stats": {
      "queued": 5,
      "inFlight": 1,
      "failed": 0,
      "completed": 142
    }
  },
  "followUps": {
    "stats": {
      "scheduled": 12,
      "delivered": 95,
      "failed": 0,
      "cancelled": 3
    }
  },
  "scheduler": {
    "total": 1,
    "active": 1,
    "dueSoon": 0
  },
  "timestamp": "2026-06-16T10:30:00Z"
}
```

---

## Integration Steps

### 1. Initialize Services in App.jsx

```typescript
import { initializeBackgroundServices } from './lib/backgroundServicesInitializer';

function App() {
  useEffect(() => {
    void initializeBackgroundServices({
      enableCheckInScheduler: true,
      enableFollowUpWorkflow: true
    });
  }, []);

  return (
    // ... existing render
  );
}
```

### 2. Replace Scattered Telemetry with Batching Pipeline

**Before**:
```typescript
// Old: Direct fetch calls
await fetch('/api/telemetry', { 
  method: 'POST', 
  body: JSON.stringify({ event: 'score_updated' })
});
```

**After**:
```typescript
// New: Batched telemetry
import { trackTelemetry } from './lib/backgroundServicesInitializer';

trackTelemetry('score_updated', { newScore: 45, delta: 5 });
```

### 3. Replace Simple localStorage Queuing with Durable Jobs

**Before**:
```typescript
// Old: Simple localStorage queue
localStorage.setItem('offline_queue', JSON.stringify([...queue, job]));
```

**After**:
```typescript
// New: Durable IndexedDB queue with retry
import { getGlobalDurableJobQueue } from './lib/durableJobQueue';

const queue = getGlobalDurableJobQueue();
await queue.enqueue({
  type: 'send_notification',
  payload: notification,
  priority: 'high'
});
```

### 4. Add Idempotency to Sensitive Operations

**Before**:
```typescript
// Old: Could duplicate on refresh
await fetch('/api/saveAssessment', { 
  method: 'POST', 
  body: JSON.stringify({ assessment, result })
});
```

**After**:
```typescript
// New: Idempotent with deduplication
import { IdempotentRequest } from './lib/idempotentRequests';

const req = IdempotentRequest.create({
  endpoint: '/api/saveAssessment',
  payload: { assessment, result },
  type: 'assessment_save'
});

const result = await req.send();
```

### 5. Create Durable Follow-Ups

```typescript
import { createFollowUp } from './lib/backgroundServicesInitializer';

// Send follow-up in 7 days
await createFollowUp({
  userId: userId,
  type: 'action_reminder',
  content: {
    title: 'Weekly Check-In',
    description: 'How are your financial goals progressing?',
    actionId: 'goal_123'
  },
  deliverIn: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

---

## Data Flow Examples

### Example 1: Telemetry Event → Batching → Job Queue → Server

```
1. App calls: trackTelemetry('score_calculated', { newScore: 45 })
   ↓
2. TelemetryBatchingPipeline buffers event
   ↓
3. After 30s or 100 events, creates batch:
   {
     batchId: 'batch_1234567890_abc',
     events: [...100 telemetry events...],
     idempotencyKey: 'telemetry:batch_1234567890_abc'
   }
   ↓
4. DurableJobQueue enqueues:
   {
     jobId: 'telemetry_batch:1234567890:xyz',
     type: 'telemetry_batch',
     payload: {...batch...},
     idempotencyKey: 'telemetry:batch_1234567890_abc'
   }
   ↓
5. Job processor sends to server: POST /api/durableJobProcessor
   ↓
6. Server processor:
   - Checks idempotency cache
   - If duplicate, returns cached result
   - Otherwise, stores batch and caches result
```

### Example 2: Follow-Up Delivery

```
1. App calls: createFollowUp({
     userId: 'user123',
     content: { title: 'Weekly check-in' },
     deliverIn: 7 * 24 * 60 * 60 * 1000
   })
   ↓
2. FollowUpWorkflow stores in IndexedDB:
   {
     followUpId: 'followup_1234567890_xyz',
     status: 'scheduled',
     deliverAt: '2026-06-23T10:00:00Z'
   }
   ↓
3. At delivery time, background processor wakes:
   - Finds due follow-ups
   - Enqueues as durable job
   ↓
4. Job queue processes:
   - Sends to server: POST /api/durableJobProcessor
   - Server stores delivery record
   ↓
5. On failure, automatic retry:
   - Exponential backoff: 1s → 2s → 4s → ...
   - Max 3 retries
```

### Example 3: Check-In Task

```
1. Scheduler starts with task:
   {
     id: 'daily_checkin',
     schedule: 'daily',
     nextRun: '2026-06-17T09:00:00Z'
   }
   ↓
2. At 9 AM, scheduler calls handler:
   - async (context) => { ... }
   ↓
3. Handler enqueues check-in job:
   {
     type: 'checkin_event',
     payload: { userId: '123', timestamp: '...' },
     idempotencyKey: 'checkin:2026-06-17'
   }
   ↓
4. Job queue processes and sends to server
   ↓
5. Server stores check-in and updates task:
   nextRun: '2026-06-18T09:00:00Z'
```

---

## Failure Handling

### Scenario: Network Failure During Job Processing

```
1. Job starts processing
2. Network fails mid-request
3. JobQueue catches error, increments retries
4. Calculates exponential backoff: 1 second
5. Sets nextRetryAt to 1 second from now
6. On next cycle (5-minute check), retries
7. On failure, recalculates: 2 seconds
8. Repeats until maxRetries (5) exhausted
9. Job marked as 'failed' and logged
```

### Scenario: Browser Crash During Job Processing

```
1. App crashes while job in 'in-flight' state
2. Job stored in IndexedDB marked as 'in-flight'
3. User reopens app, DurableJobQueue initializes
4. Loads all 'in-flight' jobs
5. Treats them as 'queued' again (safety measure)
6. Resumes processing on next cycle
7. Server receives duplicate job request
8. Idempotency key prevents double-processing
9. Returns cached result from previous attempt
```

### Scenario: Server-Side Idempotency Failure

```
1. Client sends job with idempotencyKey: 'notif:xyz'
2. Server processes and caches result
3. Client retries (network hiccup)
4. Server checks idempotency cache
5. Cache hit! Returns cached result immediately
6. No side effect duplication occurs
```

---

## Monitoring & Debugging

### View Background Services Health

```typescript
import { logBackgroundServicesHealth } from './lib/backgroundServicesInitializer';

// Log to console
await logBackgroundServicesHealth();

// Output:
// ┌────────────────────────────────┬─────┐
// │ Job Queue (Queued)             │ 2   │
// │ Job Queue (In-Flight)          │ 0   │
// │ Job Queue (Failed)             │ 0   │
// │ Follow-Ups (Scheduled)         │ 5   │
// │ Follow-Ups (Delivered)         │ 42  │
// │ Scheduled Tasks (Active)       │ 1   │
// │ Scheduled Tasks (Due Soon)     │ 0   │
// └────────────────────────────────┴─────┘
```

### Check Specific Job Status

```typescript
const queue = getGlobalDurableJobQueue();
const job = await queue.getJob('telemetry_batch:1234567890:xyz');
console.log(job.status, job.retries, job.lastError);
```

### Manual Job Flush

```typescript
const pipeline = getTelemetryPipeline();
await pipeline.flush();  // Flush buffered events immediately
```

### Inspect Deduplication Cache

```typescript
import { getDeduplicationStats } from './lib/idempotentRequests';

const stats = await getDeduplicationStats();
console.log(`Total cached: ${stats.totalEntries}, Expired: ${stats.expiredEntries}`);
```

---

## Best Practices

1. **Always initialize on app startup** → Call `initializeBackgroundServices()` in useEffect
2. **Use idempotent requests for critical operations** → Assessment saves, follow-ups, etc.
3. **Batch telemetry** → Never call `/api/telemetry` directly; use `trackTelemetry()`
4. **Schedule durable tasks** → Periodic work should use background scheduler
5. **Handle follow-up failures gracefully** → The system retries automatically, but monitor failed status
6. **Clean up old jobs** → DurableJobQueue auto-cleans by default, but can be tuned
7. **Test offline scenarios** → Disable network in DevTools to verify queuing behavior
8. **Monitor health periodically** → Add health check to diagnostics dashboard

---

## Performance Considerations

- **Job Processing**: 5 jobs processed concurrently, ~5-second cycle
- **Telemetry Batching**: 30-second window or 100-event limit (configurable)
- **IndexedDB Storage**: Cleanup after 7 days (tunable per store)
- **Memory Impact**: Background tasks run in 5-minute intervals
- **Network**: sendBeacon used for beforeunload to avoid missing final telemetry

---

## API Reference

### `initializeBackgroundServices(config)`
Initializes all background services. Call once on app startup.

### `trackTelemetry(name, properties?, userId?)`
Track a telemetry event (batched automatically).

### `createFollowUp(config)`
Create a durable follow-up scheduled for future delivery.

### `scheduleBackgroundTask(config)`
Schedule a durable periodic task.

### `getBackgroundServicesHealth()`
Get health status of all services (async).

### `logBackgroundServicesHealth()`
Log health status to console (async).

---

## Future Enhancements

- [ ] Service Worker integration for periodic background sync
- [ ] Web Push API for push notifications
- [ ] Scheduled tasks via Service Worker (native Periodic Background Sync API)
- [ ] Analytics dashboard for background job metrics
- [ ] Webhooks for follow-up delivery
- [ ] SMS channel support for follow-ups
