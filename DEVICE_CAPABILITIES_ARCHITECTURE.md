# Device Capabilities Architecture

## Overview

This document describes the missing OS-level device integration layer that extends ARTH.OS from a web app into a true platform. It addresses four critical gaps:

1. **Push Notifications** — System-level + in-app notifications
2. **Calendar Integration** — Reminders delivery to native calendar apps
3. **Share Intent Hooks** — Rich sharing, Web Share API, deep linking
4. **Offline Sync Conflict Resolution** — CRDT-inspired merge strategy for offline edits

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARTH.OS Device Capabilities Layer             │
├──────────────────┬──────────────────┬──────────────────────────┤
│  Push Notif      │  Calendar        │  Share Intent + Deep Link │
│  Service         │  Integration     │  Handler                 │
└────────┬─────────┴────────┬─────────┴──────────────┬────────────┘
         │                  │                        │
    ┌────▼──────────────────▼────────────────────────▼──────┐
    │   Reminder Delivery Engine (Durable Jobs)             │
    │   - Uses DurableJobQueue                              │
    │   - Provides idempotent delivery                       │
    │   - Retry with exponential backoff                     │
    └────┬─────────────────────────────────────────────────┘
         │
    ┌────▼────────────────────────────────────────────────┐
    │   Offline Sync Conflict Resolver                      │
    │   - CRDT-inspired merge strategy                       │
    │   - Vector clocks for causality                        │
    │   - Deterministic conflict resolution                  │
    └────┬────────────────────────────────────────────────┘
         │
    ┌────▼────────────────────────────────────────────────┐
    │   Service Worker                                      │
    │   - Request interception                              │
    │   - Cache strategies (network-first, cache-first)     │
    │   - Push event handling                               │
    │   - Background sync events                            │
    └─────────────────────────────────────────────────────┘
```

---

## 1. Push Notification Service

### Purpose
Enable system-level push notifications via Web Push API, with graceful fallback to in-app notifications.

### Architecture

**Push Flow**:
```
1. User opts into notifications
   ↓
2. Request notification permission (OS-level prompt)
   ↓
3. Register service worker + get push subscription
   ↓
4. Send subscription to server (idempotent operation)
   ↓
5. Server stores in subscription_endpoints table
   ↓
6. Reminder trigger occurs
   ↓
7. Server calls Web Push API with endpoint
   ↓
8. Browser receives push event in service worker
   ↓
9. Service worker displays notification (or enqueue in-app fallback)
```

### Key Interfaces

**src/lib/pushNotificationService.ts**

```typescript
export interface PushSubscriptionData {
  endpoint: string;
  auth: string;          // Base64-encoded shared secret
  p256dh: string;        // Base64-encoded public key
  userAgent: string;     // Browser fingerprint
  createdAt: number;
  lastUsedAt: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  tag: string;           // For deduplication
  badge?: string;        // Icon URL
  icon?: string;         // Notification icon
  image?: string;        // Large image
  actions?: NotificationAction[];
  data?: {
    url?: string;        // Deep link on click
    actionId?: string;
    userId?: string;
  };
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class PushNotificationService {
  /**
   * Request notification permission + register for push
   * @returns Subscription endpoint or null if denied
   */
  async enablePushNotifications(): Promise<PushSubscriptionData | null>;

  /**
   * Disable push notifications and unsubscribe from Web Push API
   */
  async disablePushNotifications(): Promise<void>;

  /**
   * Check if push notifications are enabled (permission granted)
   */
  isPushEnabled(): boolean;

  /**
   * Show in-app notification (fallback for when push fails)
   */
  showInAppNotification(payload: NotificationPayload): void;

  /**
   * Register handler for notification click
   */
  onNotificationClick(handler: (data: NotificationPayload['data']) => void): void;

  /**
   * Register handler for notification close
   */
  onNotificationClose(handler: (data: NotificationPayload['data']) => void): void;

  /**
   * Health check: verify service worker is registered
   */
  getHealthStatus(): {
    isSupported: boolean;
    permissionStatus: 'granted' | 'denied' | 'default';
    isSubscribed: boolean;
    serviceWorkerReady: boolean;
  };
}

// Global singleton
export function getPushNotificationService(): PushNotificationService;
```

### Lifecycle

1. **Permission Request**: On first interaction, request `Notification` permission
2. **Service Worker Registration**: Register `/service-worker.js` if not already done
3. **Subscription**: Get push subscription from service worker, send to server via `POST /api/subscriptions`
4. **Server Storage**: Store in `subscription_endpoints` table (Supabase)
5. **Delivery**: Reminder job triggers server to call Web Push API
6. **Reception**: Service worker receives push event, displays notification
7. **Interaction**: User clicks notification, service worker sends client message
8. **Handling**: Message handler navigates or performs action

### Error Handling

- **Permission Denied**: Fall back to in-app notifications
- **Subscription Failed**: Log error, offer manual reminders
- **Push Delivery Failed**: Server retries, eventually offers in-app
- **Service Worker Down**: In-app fallback is always available

---

## 2. Reminder Delivery Engine

### Purpose
Durable, multi-channel reminder delivery integrated with background services.

### Architecture

**Reminder Delivery Channels**:
- **Push**: System push notification (highest priority)
- **Email**: Delivered via server-side email service
- **In-App**: Notification toast + notification center
- **Calendar**: .ics file generated and shared to calendar app
- **Browser**: sendBeacon before unload (last resort)

### Key Interfaces

**src/lib/reminderDeliveryEngine.ts**

```typescript
export type ReminderChannel = 'push' | 'email' | 'in-app' | 'calendar' | 'browser';

export interface ReminderSpec {
  id: string;
  userId: string;
  type: 'check-in' | 'action-followup' | 'goal-review' | 'weekly-summary';
  
  // Scheduling
  deliverAt: number;           // Unix timestamp
  timezone: string;            // e.g., 'America/New_York'
  
  // Content
  title: string;
  body: string;
  actionUrl?: string;          // Deep link
  actionLabel?: string;
  
  // Channels
  channels: ReminderChannel[];
  channelPreferences?: {
    push?: { enabled: boolean; quiet: boolean };
    email?: { enabled: boolean; template: string };
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
}

export class ReminderDeliveryEngine {
  /**
   * Schedule a reminder for delivery (durable)
   */
  async scheduleReminder(spec: ReminderSpec): Promise<{ reminderId: string }>;

  /**
   * Get all scheduled reminders for a user
   */
  async getScheduledReminders(userId: string): Promise<ReminderSpec[]>;

  /**
   * Cancel a scheduled reminder
   */
  async cancelReminder(reminderId: string): Promise<void>;

  /**
   * Update reminder channels
   */
  async updateReminderChannels(
    reminderId: string,
    channels: ReminderChannel[]
  ): Promise<void>;

  /**
   * Mark reminder as delivered (per channel)
   */
  async markChannelDelivered(
    reminderId: string,
    channel: ReminderChannel
  ): Promise<void>;

  /**
   * Get delivery status
   */
  async getDeliveryStatus(reminderId: string): Promise<{
    status: 'pending' | 'delivered' | 'failed';
    channels: Record<ReminderChannel, 'pending' | 'delivered' | 'failed'>;
    lastAttempt: number;
    retries: number;
  }>;

  /**
   * Batch deliver due reminders (called by background processor)
   */
  async processAndDeliver(): Promise<number>;

  /**
   * Request push notification + email delivery via durable job
   */
  private async enqueueDurableDelivery(spec: ReminderSpec): Promise<void>;
}

// Global singleton
export function getReminderDeliveryEngine(): ReminderDeliveryEngine;
```

### Integration with DurableJobQueue

Each reminder delivery becomes a **durable job** with type `'reminder_delivery'`:

```typescript
// In background services initializer, register handler:
durableJobQueue.setProcessor('reminder_delivery', async (job) => {
  const { reminderId, channel, payload } = job.payload;
  
  switch (channel) {
    case 'push':
      return await pushNotificationService.sendPush(payload);
    case 'email':
      return await emailService.send(payload);
    case 'in-app':
      return await inAppNotificationService.queue(payload);
    case 'calendar':
      return await calendarIntegration.generateIcs(payload);
  }
});
```

### Retry Strategy

- **First attempt**: At scheduled time
- **Failures**: Exponential backoff (1s → 2s → 4s → ... → 24h max)
- **Max retries**: 5 by default (configurable per reminder)
- **Max lifetime**: 7 days (auto-fail if older)

---

## 3. Calendar Integration

### Purpose
Export reminders and financial milestones to native calendar apps (Google Calendar, Outlook, Apple Calendar).

### Architecture

**Calendar Export Flow**:
```
1. Generate .ics file (iCalendar format per RFC 5545)
   ├── VEVENT for each reminder/milestone
   ├── VALARM for notification triggers
   └── RRULE for recurring (daily check-in, weekly review)

2. Serve .ics via endpoint
   └── POST /api/calendar/export → .ics download

3. Share to calendar app
   ├── iOS: `webcal://` URL scheme → Calendar app
   ├── Android: `intent://` URI → Calendar app
   ├── Web: OAuth → Google Calendar API / Microsoft Graph

4. Deep link back to ARTH.OS
   └── Click event in calendar → opens app with context
```

### Key Interfaces

**src/lib/calendarIntegration.ts**

```typescript
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: number;        // Unix timestamp
  endTime?: number;
  location?: string;
  
  // Reminder properties
  alarmMinutesBefore?: number[];  // e.g., [0, 15, 60]
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endTime?: number;
  };
  
  // Deep link back to app
  url?: string;
  
  metadata?: Record<string, any>;
}

export class CalendarIntegration {
  /**
   * Generate iCalendar (.ics) string for reminders
   */
  generateIcsForReminders(reminders: ReminderSpec[]): string;

  /**
   * Generate iCalendar (.ics) for financial milestones
   */
  generateIcsForMilestones(milestones: FinancialMilestone[]): string;

  /**
   * Export as .ics file and trigger download
   */
  downloadIcs(events: CalendarEvent[], filename: string): void;

  /**
   * Generate share link to subscribe to calendar (Google Calendar format)
   */
  generateSubscriptionLink(filename: string): string;

  /**
   * Open native calendar app with event details (iOS/Android)
   */
  openNativeCalendarApp(event: CalendarEvent): void;

  /**
   * Save to Google Calendar via OAuth (web)
   */
  async saveToGoogleCalendar(events: CalendarEvent[]): Promise<void>;

  /**
   * Save to Microsoft Calendar via OAuth (web)
   */
  async saveToMicrosoftCalendar(events: CalendarEvent[]): Promise<void>;

  /**
   * Generate deep link to app with calendar context
   */
  generateDeepLink(eventId: string, context: 'reminder' | 'milestone'): string;
}

// Global singleton
export function getCalendarIntegration(): CalendarIntegration;
```

### iCalendar Format Example

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ARTH.OS//Financial Wellness//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
NAME:ARTH.OS Reminders
DESCRIPTION:Financial wellness reminders and milestones

BEGIN:VEVENT
UID:reminder_check-in_123@arthOS.app
DTSTART:20260617T090000Z
DTEND:20260617T091500Z
SUMMARY:Daily Financial Check-In
DESCRIPTION:Review spending, income, and progress toward goals
LOCATION:https://arthOS.app/checkin
ALARM:TRIGGER:-PT15M;ACTION:DISPLAY;DESCRIPTION:Check-in reminder

BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-PT15M
DESCRIPTION:Check-in reminder
END:VALARM

END:VEVENT

BEGIN:VEVENT
UID:goal_savings_milestone_456@arthOS.app
DTSTART:20260801T000000Z
SUMMARY:Target Savings Goal: $5,000
RRULE:FREQ=MONTHLY;INTERVAL=1
DESCRIPTION:Monthly savings milestone check
END:VEVENT

END:VCALENDAR
```

### Deep Linking

**URL Scheme**: `arthOS://calendar/event/{eventId}`

Parsed by app to:
1. Navigate to relevant dashboard (reminder type, milestone context)
2. Highlight the event in timeline
3. Optionally pre-populate action UI

---

## 4. Share Intent Handler

### Purpose
Rich sharing with Web Share API, share target detection, and deep linking context preservation.

### Architecture

**Share Flow**:
```
1. User clicks "Share" on assessment result
   ↓
2. Web Share API triggered (or fallback to copy/email)
   ├── System native share sheet (iOS/Android)
   │  └── Options: Messages, WhatsApp, Email, Notes, etc.
   │
   ├── Or Web native (desktop)
   │  └── Options: Link copy, QR code, email
   │
   └── Or fallback UI
      └── Copy link, Generate QR, Email form

3. Share includes:
   ├── Deep link: arthOS://assessment/{assessmentId}
   ├── Title: "My Financial Assessment"
   ├── Text: One-liner summary
   ├── Image: Generated shareable graphic
   └── Metadata: OpenGraph tags in HTML

4. Recipient clicks link
   ↓
5. App opens with context
   ├── Pre-fetch shared assessment data
   ├── Show comparison against recipient's data (if public)
   └── Prompt for action (view, take assessment, etc.)
```

### Key Interfaces

**src/lib/shareIntentHandler.ts**

```typescript
export interface ShareableAsset {
  title: string;
  description: string;
  type: 'assessment' | 'insight' | 'milestone' | 'comparison';
  contentId: string;
  
  // Visual
  imageUrl?: string;
  thumbnailUrl?: string;
  
  // Sharing
  url: string;           // Full shareable URL
  deepLink: string;      // arthOS:// URL
  
  // Access control
  isPublic: boolean;
  expiresAt?: number;
  accessToken?: string;  // For private shares
}

export interface ShareMetadata {
  sharedAt: number;
  sharedBy: string;
  sharedWith?: string[];  // emails or user IDs
  channel?: string;       // 'native' | 'email' | 'link' | etc
  viewCount: number;
}

export class ShareIntentHandler {
  /**
   * Share assessment result via Web Share API or fallback
   */
  async shareAssessment(
    assessmentId: string,
    options?: { title?: string; message?: string }
  ): Promise<ShareMetadata>;

  /**
   * Share insight/recommendation card
   */
  async shareInsight(
    insightId: string,
    options?: { template?: 'image' | 'link' }
  ): Promise<ShareMetadata>;

  /**
   * Share financial milestone achievement
   */
  async shareMilestone(milestoneId: string): Promise<ShareMetadata>;

  /**
   * Generate shareable graphic (assessment summary)
   */
  async generateShareableGraphic(assessmentId: string): Promise<Blob>;

  /**
   * Generate QR code for mobile scanning
   */
  async generateQrCode(url: string, size?: number): Promise<string>;

  /**
   * Handle incoming shared link (deep link processing)
   */
  async handleIncomingShare(deepLink: string): Promise<ShareableAsset>;

  /**
   * Get share statistics for an asset
   */
  async getShareStats(contentId: string): Promise<{
    viewCount: number;
    clickCount: number;
    shareCount: number;
    topChannels: string[];
  }>;

  /**
   * Register as Web Share Target (manifest.json integration)
   */
  registerShareTarget(): void;

  /**
   * Revoke share access (private shares only)
   */
  async revokeShare(contentId: string, accessToken: string): Promise<void>;
}

// Global singleton
export function getShareIntentHandler(): ShareIntentHandler;
```

### Web Share Target (manifest.json)

```json
{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "media",
          "accept": ["image/*", "application/pdf"]
        }
      ]
    }
  }
}
```

### Deep Link Handling

URL format: `arthOS://[type]/[id]?token=[accessToken]&view=[mode]`

Examples:
- `arthOS://assessment/abc123` — View public assessment
- `arthOS://assessment/abc123?token=xyz` — View private assessment
- `arthOS://comparison/abc123?compare-with=def456` — Peer comparison
- `arthOS://insight/rec789?highlight=true` — Highlight recommendation

---

## 5. Offline Sync Conflict Resolution

### Purpose
Handle merge conflicts when offline edits and server updates collide (CRDT-inspired approach).

### Problem Scenario

```
Timeline:
T0: Assessment saved to server {score: 45, income: 5000}

T1: Device A goes offline
T2: Device A edits assessment {score: 50, income: 5000}
T3: Device A sends to queue (local only)

T4: Device B (same user) updates via web {score: 45, income: 6000}
T5: Server now has {score: 45, income: 6000}

T6: Device A comes online
T7: Device A tries to send {score: 50, income: 5000}
    ❌ CONFLICT: Which version wins?
    - Last-write-wins? → Loses Device A's score change
    - Device A wins? → Loses Device B's income change
    - Merge both? → {score: 50, income: 6000} ← Correct!
```

### Architecture: Vector Clocks + Merge

**Key Idea**: Each field gets a vector clock (timestamp + device ID).

```typescript
interface VersionedField<T> {
  value: T;
  timestamp: number;
  deviceId: string;
  vector: Record<string, number>;  // {deviceA: 5, deviceB: 3}
}

interface ConflictResolutionStrategy {
  'last-write-wins': // Simple but lossy
  'merge-by-field': // Field-level resolution (smart)
  'user-confirmed': // Prompt user if conflict
  'crdt-lww': // CRDT + last-write-wins tie-break
}
```

### Key Interfaces

**src/lib/offlineSyncConflictResolver.ts**

```typescript
export interface VectorClock {
  [deviceId: string]: number;
}

export interface VersionedValue<T> {
  value: T;
  timestamp: number;
  deviceId: string;
  vector: VectorClock;
}

export interface SyncConflict {
  field: string;
  local: VersionedValue<any>;
  remote: VersionedValue<any>;
  resolution: 'local' | 'remote' | 'merged';
  reason: string;
}

export class OfflineSyncConflictResolver {
  /**
   * Detect conflicts between local and remote versions
   */
  detectConflicts(
    local: Record<string, VersionedValue<any>>,
    remote: Record<string, VersionedValue<any>>
  ): SyncConflict[];

  /**
   * Merge two versions using CRDT strategy
   */
  merge(
    local: Record<string, VersionedValue<any>>,
    remote: Record<string, VersionedValue<any>>,
    strategy: 'auto' | 'manual'
  ): {
    merged: Record<string, VersionedValue<any>>;
    conflicts: SyncConflict[];
  };

  /**
   * Check if local is causally before remote (happens-before)
   */
  happensBefore(local: VectorClock, remote: VectorClock): boolean;

  /**
   * Check if versions are concurrent (neither before the other)
   */
  areConcurrent(local: VectorClock, remote: VectorClock): boolean;

  /**
   * Increment vector clock for this device
   */
  incrementVector(vector: VectorClock, deviceId: string): VectorClock;

  /**
   * Prompt user to resolve conflict
   */
  async promptUserResolution(conflict: SyncConflict): Promise<'local' | 'remote' | 'custom'>;

  /**
   * Apply custom merge strategy (for specific fields)
   */
  registerCustomStrategy(
    field: string,
    strategy: (local: any, remote: any) => any
  ): void;
}

// Global singleton
export function getOfflineSyncConflictResolver(): OfflineSyncConflictResolver;
```

### Merge Strategies

1. **Last-Write-Wins (LWW)**: Remote wins if newer (timestamp-based)
   - Fast, no user prompts
   - Loses edits from earlier device
   - Use for: Preferences, non-critical fields

2. **Field-Level Merge**: Merge non-conflicting fields
   - `score: local_value` (Device A edited)
   - `income: remote_value` (Device B edited)
   - Use for: Structured objects where fields are independent

3. **Operational Transform (OT)**: Rebase operations
   - Complex but preserves intent
   - Requires operation history
   - Use for: Text fields, sequential edits

4. **User Confirmation**: Prompt if concurrent edits on same field
   - Shows both versions
   - User chooses or custom merges
   - Use for: Critical financial decisions

### Example: Assessment Merge

```typescript
local = {
  assessment_score: {
    value: 50,
    timestamp: 1000,
    deviceId: 'A',
    vector: {A: 5, B: 2}
  },
  annual_income: {
    value: 5000,
    timestamp: 900,
    deviceId: 'A',
    vector: {A: 4, B: 2}
  }
}

remote = {
  assessment_score: {
    value: 45,
    timestamp: 950,
    deviceId: 'server',
    vector: {A: 4, B: 3}
  },
  annual_income: {
    value: 6000,
    timestamp: 1050,
    deviceId: 'B',
    vector: {A: 4, B: 5}
  }
}

result = resolver.merge(local, remote, 'auto')
// → {
//   assessment_score: {value: 50, ...} // Local is newer (1000 > 950)
//   annual_income: {value: 6000, ...}  // Remote is newer (1050 > 900)
// }
```

---

## 6. Service Worker

### Purpose
Foundation for push, offline support, caching strategies, and background sync.

### Architecture

**public/service-worker.js**

```javascript
// Install: cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1-critical').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/main.css',
        '/js/app.js',
        // Core offline experience
      ]);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== 'v1-critical')
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first + cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Network-first for API calls
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            caches.open('v1-api').then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache or offline page
          return caches.match(request) || caches.match('/offline.html');
        })
    );
  }

  // Cache-first for static assets
  else {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open('v1-assets').then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => caches.match('/offline.html'));
      })
    );
  }
});

// Push: receive and display notification
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const { title, body, badge, icon, tag, data: metadata } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      badge,
      icon,
      tag,
      data: metadata,
      // Allow notification persistence across browser restarts
      persistent: true
    })
  );
});

// Notification click: navigate to deep link or action
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  const url = notification.data?.url || '/dashboard';

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Find open ARTH.OS window
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync: retry failed offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({
            type: 'SYNC_OFFLINE_QUEUE'
          });
        }
      })()
    );
  }
});

// Message: receive commands from client (e.g., get subscription)
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'GET_PUSH_SUBSCRIPTION') {
    event.ports[0].postMessage(
      self.registration.pushManager.getSubscription()
    );
  }
});
```

### Caching Strategies

| Strategy | When | Pros | Cons |
|----------|------|------|------|
| **Network-First** | API, Auth | Fresh data | Slow on offline |
| **Cache-First** | Assets, CSS, JS | Fast, offline | Stale content |
| **Stale-While-Revalidate** | Images, data | Fast + fresh | Complex |
| **Network-Only** | Streaming | Always fresh | No offline |

---

## Integration with Durable Background Services

All device capabilities thread through the **DurableJobQueue**:

```
Push Notification Service
  ↓
Reminder Delivery Engine → Enqueue 'reminder_delivery' job
  ↓
DurableJobQueue (with exponential backoff)
  ↓
Service Worker (receives push event)
  ↓
In-App Notification / Calendar / Email
  ↓
User Interaction (click, action)
  ↓
Deep Link / Sync Conflict Resolution
```

---

## Database Schema

### Supabase Tables

```sql
-- Push subscriptions
CREATE TABLE subscription_endpoints (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100),
  endpoint VARCHAR(500),
  auth VARCHAR(100),
  p256dh VARCHAR(100),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Scheduled reminders
CREATE TABLE reminders (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),
  type VARCHAR(50),
  title VARCHAR(255),
  body TEXT,
  deliver_at BIGINT,
  timezone VARCHAR(100),
  channels TEXT[],
  status VARCHAR(20), -- 'scheduled', 'delivered', 'failed'
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Share metadata
CREATE TABLE shared_assets (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),
  content_type VARCHAR(50),
  content_id VARCHAR(100),
  access_token VARCHAR(100),
  is_public BOOLEAN,
  expires_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sync conflict resolution history
CREATE TABLE sync_conflicts (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100),
  device_id VARCHAR(100),
  field VARCHAR(100),
  local_value JSONB,
  remote_value JSONB,
  resolution VARCHAR(20),
  timestamp BIGINT,
  vector_clock JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Deployment Checklist

### Priority 1: Foundation
- [ ] Service worker registration (public/service-worker.js)
- [ ] Push notification permission flow
- [ ] In-app notification fallback UI

### Priority 2: Integration
- [ ] Reminder delivery engine + durable jobs
- [ ] Calendar .ics generation and export
- [ ] Deep link handling in App.jsx

### Priority 3: Sharing
- [ ] Web Share API + fallback UI
- [ ] Shareable asset generation
- [ ] Share target registration

### Priority 4: Advanced
- [ ] Sync conflict resolver
- [ ] Offline merge strategy
- [ ] User conflict resolution UI

### Priority 5: Polish
- [ ] Calendar OAuth (Google, Microsoft)
- [ ] Analytics / share tracking
- [ ] Notification preferences UI

---

## API Endpoints Required

```
POST /api/subscriptions
  - Register device for push notifications
  - Payload: { endpoint, auth, p256dh, userAgent }

POST /api/reminders
  - Schedule a reminder (creates durable job)
  - Payload: ReminderSpec

GET /api/reminders/{userId}
  - List scheduled reminders

DELETE /api/reminders/{reminderId}
  - Cancel reminder

POST /api/calendar/export
  - Generate and download .ics file
  - Query: ?type=reminders|milestones

GET /api/calendar/subscribe
  - Subscribe to calendar updates
  - Returns .ics subscription URL

POST /api/share/{contentType}/{contentId}
  - Create shareable asset
  - Returns: accessToken, shareUrl, deepLink

GET /api/share/{contentType}/{contentId}
  - Retrieve shared asset (with token validation)

POST /api/sync/conflicts/resolve
  - Resolve offline sync conflict
  - Payload: {local, remote, strategy}
```

---

## Monitoring & Observability

### Metrics to Track

- Push notification delivery rate
- Notification click-through rate
- Reminder delivery by channel (push, email, in-app)
- Sync conflict resolution rate
- Service worker cache hit ratio
- Offline operation success rate

### Logging

```typescript
// Push sent
logger.info('push_sent', {
  userId,
  reminderId,
  channel: 'push',
  timestamp: Date.now()
});

// Sync conflict detected
logger.warn('sync_conflict', {
  userId,
  field: 'assessment_score',
  local_version: 50,
  remote_version: 45,
  resolution: 'merged'
});

// Service worker activity
logger.info('service_worker_fetch', {
  url,
  cacheHit: true,
  duration: 45
});
```

---

## Future Enhancements

1. **Notification Grouping**: Bundle multiple reminders (e.g., "3 financial updates")
2. **Smart Scheduling**: AI-powered best-time-to-notify based on user behavior
3. **Voice Reminders**: Text-to-speech notifications for accessibility
4. **Wearable Integration**: Apple Watch, Wear OS notifications
5. **Multi-Device Sync**: Cross-device conflict resolution with device priority
6. **Offline Forms**: Full assessment editing offline with merge on sync
7. **Webhook Integration**: Zapier, IFTTT recipe support
8. **Rich Notifications**: Image carousel, action buttons in notifications
9. **Calendar 3-Way Sync**: Google Calendar ↔ ARTH.OS ↔ Local Events
10. **Account Sync**: iCloud Keychain, Google Smart Lock for credentials

---

## Summary

This architecture transforms ARTH.OS from a web app into a **device-integrated platform** by:

1. **Push Notifications** — System-level urgency + in-app fallback
2. **Calendar Integration** — Native calendar ownership of financial milestones
3. **Rich Sharing** — Web Share + deep links + peer learning
4. **Offline Resilience** — CRDT-inspired merge for true offline-first
5. **Service Worker** — Foundation for all above + caching + background sync

All layers integrate with the **DurableJobQueue** for reliability, idempotency, and observability.
