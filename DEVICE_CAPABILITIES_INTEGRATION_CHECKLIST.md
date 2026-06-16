# Device Capabilities Integration Checklist

## 🎯 Overview

This checklist guides the integration of OS-level device capabilities into ARTH.OS:
- **Push Notifications** (Web Push API)
- **Reminder Delivery** (Multi-channel with durable jobs)
- **Calendar Integration** (.ics export, calendar deep links)
- **Share Intent** (Web Share API + deep linking)
- **Offline Sync** (CRDT-inspired conflict resolution)
- **Service Worker** (Offline support, request caching)

---

## ✅ Completed (Ready for Integration)

### Core Modules (7 files, 2,500+ lines)

- [x] `src/lib/pushNotificationService.ts` (350 lines)
  - Web Push API integration
  - In-app notification fallback
  - Notification click/close handlers

- [x] `src/lib/reminderDeliveryEngine.ts` (380 lines)
  - IndexedDB-backed reminder scheduling
  - Multi-channel delivery (push, email, in-app, calendar)
  - Durable job integration

- [x] `src/lib/calendarIntegration.ts` (350 lines)
  - iCalendar (.ics) generation
  - Calendar app deep linking
  - Google Calendar link generation

- [x] `src/lib/shareIntentHandler.ts` (300 lines)
  - Web Share API integration
  - QR code generation
  - Deep link handling

- [x] `src/lib/offlineSyncConflictResolver.ts` (400 lines)
  - Vector clock implementation
  - CRDT-inspired merge strategy
  - Field-level conflict resolution

- [x] `public/service-worker.js` (280 lines)
  - Request interception (network-first, cache-first)
  - Push notification handling
  - Offline fallback

- [x] `public/offline.html` (150 lines)
  - Offline experience UI
  - Connection status monitoring
  - Responsive design

- [x] `public/manifest.json` (150 lines)
  - PWA configuration
  - Share target definition
  - App shortcuts

### Documentation

- [x] `DEVICE_CAPABILITIES_ARCHITECTURE.md` (1000+ lines)
  - Complete architectural design
  - Data flows and integrations
  - Database schema
  - API endpoints

---

## 🔧 Priority 1: Foundation Setup

### Service Worker Registration

**Location**: `src/App.jsx` or `src/main.jsx` (whichever is entry point)

```typescript
import React, { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.info('Service Worker registered', { scope: reg.scope });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Request notification permission (optional, for early setup)
    // Can also be triggered on user action
  }, []);

  return (
    // ... existing render
  );
}
```

**Checklist**:
- [ ] Register service worker in App component useEffect
- [ ] Verify in DevTools: Application → Service Workers
- [ ] Check cache tabs: Storage → Cache Storage

### Update index.html

**Location**: `public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#667eea" />
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Icons -->
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/app-icon-192.png" />
    
    <!-- Theme color -->
    <meta name="theme-color" content="#667eea" />
    <meta name="description" content="Your AI-powered financial wellness companion" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Checklist**:
- [ ] Add manifest link to `<head>`
- [ ] Add theme-color meta tag
- [ ] Add apple-touch-icon for iOS
- [ ] Test manifest.json loads: DevTools → Application → Manifest

---

## 🔧 Priority 2: Push Notification Setup

### Enable Push Notifications

**Location**: `src/components/NotificationPermissionPrompt.jsx` (create new)

```typescript
import { getPushNotificationService } from '../lib/pushNotificationService';
import { useState, useEffect } from 'react';

export function NotificationPermissionPrompt() {
  const [permissionStatus, setPermissionStatus] = useState(null);

  const requestPermission = async () => {
    try {
      const service = getPushNotificationService();
      const subscription = await service.enablePushNotifications();

      if (subscription) {
        setPermissionStatus('granted');
        console.info('Push notifications enabled');
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      setPermissionStatus('error');
    }
  };

  return (
    <div className="notification-prompt">
      <h3>Stay Updated</h3>
      <p>Get reminders for check-ins, goals, and financial milestones</p>
      <button onClick={requestPermission}>
        Enable Notifications
      </button>
      {permissionStatus === 'granted' && (
        <p className="success">✓ Notifications enabled</p>
      )}
    </div>
  );
}
```

**Checklist**:
- [ ] Create notification permission component
- [ ] Add to dashboard or settings page
- [ ] Test permission prompt in browser
- [ ] Verify subscription sent to `/api/subscriptions`

### Wire Notification Clicks

**Location**: `src/App.jsx`

```typescript
import { getPushNotificationService } from './lib/pushNotificationService';

export default function App() {
  useEffect(() => {
    const pushService = getPushNotificationService();

    // Handle notification clicks
    pushService.onNotificationClick((data) => {
      if (data?.url) {
        window.location.href = data.url;
      }

      if (data?.actionId === 'assessment_followup') {
        // Navigate to followup or action
        window.location.href = '/assessment/followup';
      }
    });

    // Handle notification dismissal
    pushService.onNotificationClose((data) => {
      console.info('Notification dismissed', data);
    });

    return () => {
      // Cleanup listeners if needed
    };
  }, []);
}
```

**Checklist**:
- [ ] Wire notification click handlers
- [ ] Test: send test push, click notification
- [ ] Verify deep link navigation works
- [ ] Test in DevTools: Application → Service Workers → Push

---

## 🔧 Priority 3: Reminder Delivery Setup

### Initialize Reminder Engine

**Location**: `src/lib/backgroundServicesInitializer.ts` (add to existing initializer)

```typescript
import { getReminderDeliveryEngine } from './reminderDeliveryEngine';
import { getPushNotificationService } from './pushNotificationService';

export async function initializeBackgroundServices(config = {}) {
  // ... existing initialization ...

  // Initialize reminder delivery engine
  const reminderEngine = getReminderDeliveryEngine();
  reminderEngine.start();

  // Register reminder delivery handler in durable job queue
  const jobQueue = getGlobalDurableJobQueue();
  jobQueue.setProcessor('reminder_delivery', async (job) => {
    const { reminderId, channel, reminder } = job.payload;

    switch (channel) {
      case 'push': {
        // Send push notification
        const pushService = getPushNotificationService();
        if (pushService.isPushEnabled()) {
          // Note: actual push is sent by server, this is for in-app fallback
          pushService.showInAppNotification({
            title: reminder.title,
            body: reminder.body,
            tag: reminderId,
            data: {
              url: reminder.actionUrl,
              eventId: reminderId
            }
          });
        }
        return { status: 'delivered', channel: 'push' };
      }

      case 'in-app': {
        const pushService = getPushNotificationService();
        pushService.showInAppNotification({
          title: reminder.title,
          body: reminder.body,
          tag: reminderId,
          data: { url: reminder.actionUrl }
        });
        return { status: 'delivered', channel: 'in-app' };
      }

      case 'calendar': {
        // Calendar delivery happens server-side
        return { status: 'processed', channel: 'calendar' };
      }

      case 'email': {
        // Email delivery happens server-side via durable job
        return { status: 'queued', channel: 'email' };
      }

      default:
        throw new Error(`Unknown reminder channel: ${channel}`);
    }
  });

  return {
    // ... existing health checks ...
    reminders: reminderEngine.getHealthStatus()
  };
}
```

**Checklist**:
- [ ] Initialize reminder engine in background services
- [ ] Register durable job handler for `reminder_delivery`
- [ ] Test: create reminder, verify it's scheduled
- [ ] Check IndexedDB: `ArthOSReminders` store

### Schedule Reminders

**Location**: Any component that needs to schedule (e.g., `src/components/ActionFollowUpPanel.jsx`)

```typescript
import { getReminderDeliveryEngine } from '../lib/reminderDeliveryEngine';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

async function createActionReminder(action) {
  const engine = getReminderDeliveryEngine();
  const userId = useAuth().user?.id; // Get from auth context

  const reminder = {
    id: uuidv4(),
    userId,
    type: 'action-followup',
    title: `Follow-up: ${action.title}`,
    body: `Time to review: ${action.description}`,
    deliverAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // In 7 days
    timezone: 'America/New_York', // Get from user settings
    channels: ['push', 'in-app', 'email'],
    actionUrl: `/action/${action.id}`,
    actionLabel: 'View Action',
    maxRetries: 5,
    retryDelayMs: 60000,
    idempotencyKey: crypto.createHash('sha256')
      .update(JSON.stringify(action))
      .digest('hex'),
    metadata: { actionId: action.id }
  };

  const { reminderId } = await engine.scheduleReminder(reminder);
  console.info('Reminder scheduled', { reminderId });

  return reminderId;
}
```

**Checklist**:
- [ ] Add reminder creation helper to utilities
- [ ] Call from action creation workflow
- [ ] Test: create action, verify reminder in IndexedDB
- [ ] Manually trigger processing: `getReminderDeliveryEngine().processAndDeliver()`

---

## 🔧 Priority 4: Calendar Integration

### Export Reminders to Calendar

**Location**: `src/components/CalendarExportButton.jsx` (create new)

```typescript
import { getCalendarIntegration } from '../lib/calendarIntegration';
import { getReminderDeliveryEngine } from '../lib/reminderDeliveryEngine';

export function CalendarExportButton({ userId }) {
  const handleExport = async () => {
    try {
      const reminderEngine = getReminderDeliveryEngine();
      const calendarService = getCalendarIntegration();

      // Get all scheduled reminders
      const reminders = await reminderEngine.getScheduledReminders(userId);

      // Generate .ics file
      const icsContent = calendarService.generateIcsForReminders(reminders);

      // Trigger download
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arthOS-reminders-${Date.now()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.info('Calendar exported');
    } catch (error) {
      console.error('Failed to export calendar:', error);
    }
  };

  return (
    <button onClick={handleExport} className="btn-secondary">
      📅 Export to Calendar
    </button>
  );
}
```

**Checklist**:
- [ ] Create calendar export button component
- [ ] Add to settings or dashboard
- [ ] Test: download .ics file
- [ ] Open .ics in calendar app to verify format
- [ ] Test Google Calendar subscription link

---

## 🔧 Priority 5: Share Intent Setup

### Add Share Buttons

**Location**: `src/components/AssessmentResult.jsx` (existing)

```typescript
import { getShareIntentHandler } from '../lib/shareIntentHandler';

function AssessmentResult({ assessment }) {
  const handleShare = async () => {
    try {
      const shareService = getShareIntentHandler();
      await shareService.shareAssessment(assessment.id, {
        title: 'My Financial Assessment',
        message: `My financial wellness score is ${assessment.score}/100`
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className="result">
      <h2>Your Results</h2>
      <p>Score: {assessment.score}</p>
      <button onClick={handleShare}>Share Assessment</button>
    </div>
  );
}
```

**Checklist**:
- [ ] Add share buttons to assessment, insights, milestones
- [ ] Test on mobile: use native share sheet
- [ ] Test on desktop: copy link, email, QR code
- [ ] Verify deep links work: `arthOS://assessment/abc123`

---

## 🔧 Priority 6: Offline Sync Conflict Resolution

### Wire Conflict Resolver to Assessment Saves

**Location**: `src/App.jsx` (modify `saveAssessment` function)

```typescript
import { getOfflineSyncConflictResolver } from './lib/offlineSyncConflictResolver';
import { IdempotentRequest } from './lib/idempotentRequests';

async function saveAssessment(assessment) {
  const conflictResolver = getOfflineSyncConflictResolver();

  // Create versioned local copy
  const localVersion = {
    ...assessment,
    _version: {
      score: {
        value: assessment.score,
        timestamp: Date.now(),
        deviceId: conflictResolver.getDeviceId(),
        vector: conflictResolver.incrementVector({}, conflictResolver.getDeviceId())
      },
      income: {
        value: assessment.income,
        timestamp: Date.now(),
        deviceId: conflictResolver.getDeviceId(),
        vector: conflictResolver.incrementVector({}, conflictResolver.getDeviceId())
      }
      // ... other fields
    }
  };

  // Wrap with idempotent request
  const req = IdempotentRequest.create({
    endpoint: '/api/saveAssessment',
    payload: localVersion,
    type: 'assessment_save'
  });

  try {
    const result = await req.send();

    if (result.isDuplicate) {
      console.info('Assessment already saved');
      return;
    }

    if (result.conflict) {
      // Server returned conflict metadata
      const merged = conflictResolver.merge(
        localVersion._version,
        result.serverVersion,
        'auto'
      );

      // Update local state with merged version
      setAssessment(merged.merged);

      if (merged.conflicts.length > 0) {
        // Prompt user for manual resolution
        showConflictResolutionUI(merged.conflicts);
      }
    }
  } catch (error) {
    console.error('Failed to save assessment:', error);
  }
}
```

**Checklist**:
- [ ] Add version tracking to assessment saves
- [ ] Integrate conflict resolver with idempotent requests
- [ ] Test offline scenario: edit → go online → verify merge
- [ ] Test concurrent edits: two devices edit simultaneously
- [ ] Verify no data loss in merge

---

## 🔧 Priority 7: API Endpoints

Create these backend handlers:

### POST /api/subscriptions
```javascript
// Store push subscription
app.post('/api/subscriptions', async (req, res) => {
  const { endpoint, auth, p256dh, userAgent } = req.body;
  const userId = req.user.id;

  // Upsert subscription
  const result = await supabase
    .from('subscription_endpoints')
    .upsert({
      user_id: userId,
      endpoint,
      auth,
      p256dh,
      user_agent: userAgent,
      created_at: new Date(),
      last_used_at: new Date()
    }, { onConflict: 'endpoint' });

  res.json({ status: 'ok', endpoint });
});
```

### POST /api/durableJobProcessor
Already implemented in background services setup.

### GET/POST /api/reminders
```javascript
// List reminders
app.get('/api/reminders', async (req, res) => {
  const reminders = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('status', 'scheduled');

  res.json(reminders.data);
});

// Create reminder
app.post('/api/reminders', async (req, res) => {
  const reminder = await supabase
    .from('reminders')
    .insert(req.body);

  res.json(reminder.data[0]);
});
```

### POST /api/calendar/export
```javascript
// Export calendar as .ics
app.post('/api/calendar/export', async (req, res) => {
  const { type } = req.query; // 'reminders' or 'milestones'
  const userId = req.user.id;

  // Fetch reminders/milestones from DB
  // Generate .ics content
  // Return file

  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', 'attachment; filename="arthOS.ics"');
  res.send(icsContent);
});
```

### GET /api/share/{type}/{id}
```javascript
// Retrieve shared asset
app.get('/api/share/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const token = req.headers['x-share-token'];

  // Validate share token
  const share = await supabase
    .from('shared_assets')
    .select('*')
    .eq('access_token', token)
    .eq('content_id', id)
    .single();

  if (!share.data || share.data.expires_at < Date.now()) {
    return res.status(403).json({ error: 'Share expired or invalid' });
  }

  // Increment view count
  // Return asset

  res.json(share.data);
});
```

**Checklist**:
- [ ] Implement `/api/subscriptions` endpoint
- [ ] Implement `/api/reminders` endpoints
- [ ] Implement `/api/calendar/export` endpoint
- [ ] Implement `/api/share/*` endpoints
- [ ] Test each endpoint with curl/Postman

---

## 📊 Database Schema

### Supabase Migrations

```sql
-- Push subscriptions
CREATE TABLE subscription_endpoints (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100),
  endpoint VARCHAR(500) UNIQUE,
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
  status VARCHAR(20),
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shared assets
CREATE TABLE shared_assets (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),
  content_type VARCHAR(50),
  content_id VARCHAR(100),
  access_token VARCHAR(100),
  is_public BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Checklist**:
- [ ] Run migrations in Supabase console
- [ ] Verify tables created
- [ ] Add indexes: `endpoint`, `user_id`, `deliver_at`, `access_token`

---

## 🧪 Testing Scenarios

### Test 1: Push Notification Flow
```
1. Enable push notifications (grant permission)
2. Verify subscription sent to /api/subscriptions
3. Check IndexedDB: ArthOSDeduplication
4. Manually send test push via server
5. Verify notification displays
6. Click notification → verify deep link navigation
```

**Expected Outcome**: ✓ Notification displays, click navigates to correct page

### Test 2: Reminder Delivery
```
1. Create reminder with deliverAt = now
2. Wait 5 minutes for processor to run (or manually trigger)
3. Verify in-app notification appears
4. Check durable job queue for 'reminder_delivery' job
5. Verify retries on failure
```

**Expected Outcome**: ✓ Reminder delivered, retried on failure

### Test 3: Calendar Export
```
1. Create 3 reminders
2. Click "Export to Calendar"
3. Download .ics file
4. Open in calendar app (Google Calendar, Outlook, Apple Calendar)
5. Verify all reminders imported with correct dates/times
```

**Expected Outcome**: ✓ All reminders imported to calendar

### Test 4: Share Assessment
```
1. Complete assessment
2. Click "Share" button
3. On mobile: verify native share sheet
4. On desktop: copy link, generate QR, email
5. Share link → verify deep link opens assessment
6. Compare assessment with peer's data
```

**Expected Outcome**: ✓ Share works across all channels, deep link works

### Test 5: Offline Sync Conflict
```
1. Save assessment online (version 1)
2. Go offline
3. Edit assessment locally (version 2)
4. Go online (before save completes)
5. Other device saves different edit (version 3)
6. Server has version 3, local has version 2
7. Verify merge resolves to combined values
```

**Expected Outcome**: ✓ Merged correctly without data loss

### Test 6: Service Worker Offline
```
1. Load app and complete assessment online
2. Go offline (DevTools → Throttle to offline)
3. Try to save assessment
4. Verify in IndexedDB queue
5. Go online
6. Verify queued save retried automatically
```

**Expected Outcome**: ✓ Save queued offline, retried when online

---

## 📈 Monitoring & Observability

### Key Metrics

```typescript
// Log push sends
logger.info('push_subscription_sent', {
  userId,
  endpoint: subscription.endpoint,
  timestamp: Date.now()
});

// Log reminder delivery
logger.info('reminder_delivered', {
  reminderId,
  channel,
  deliveryTime: Date.now(),
  retries
});

// Log sync conflicts
logger.warn('sync_conflict_detected', {
  field,
  localVersion: local.timestamp,
  remoteVersion: remote.timestamp,
  resolution: 'merged'
});

// Log share activity
logger.info('content_shared', {
  contentId,
  contentType,
  channel,
  timestamp: Date.now()
});

// Log offline operations
logger.info('offline_operation_queued', {
  operationType,
  queueSize,
  timestamp: Date.now()
});
```

**Checklist**:
- [ ] Add logging to all device capability operations
- [ ] Set up log aggregation (Supabase, Datadog, etc.)
- [ ] Create dashboard for device capability metrics
- [ ] Set up alerts for failures (push delivery, sync conflicts)

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Test all 6 test scenarios above
- [ ] Verify service worker loads: DevTools → Service Workers
- [ ] Verify manifest.json valid: DevTools → Manifest
- [ ] Test offline mode: DevTools → Offline, refresh
- [ ] Test push notifications: Send test push from server
- [ ] Verify all databases created and indexed
- [ ] Test deep links: `arthOS://assessment/abc123`
- [ ] Test share target on mobile

### Deployment

- [ ] Deploy service worker (`public/service-worker.js`)
- [ ] Deploy manifest (`public/manifest.json`)
- [ ] Deploy offline fallback (`public/offline.html`)
- [ ] Deploy modules (`src/lib/*.ts`)
- [ ] Deploy API endpoints (`/api/*`)
- [ ] Deploy database migrations
- [ ] Update App.jsx with initializations
- [ ] Clear browser caches

### Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Verify push delivery rate > 95%
- [ ] Check conflict resolution logs
- [ ] Monitor sync conflict resolution time
- [ ] Verify calendar export works in 3+ apps
- [ ] Test share functionality across channels
- [ ] Monitor offline operation success rate
- [ ] Get user feedback on notifications

---

## 📚 References

- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [iCalendar Format (RFC 5545)](https://tools.ietf.org/html/rfc5545)
- [Conflict-free Replicated Data Types](https://crdt.tech/)
- [Vector Clocks](https://en.wikipedia.org/wiki/Vector_clock)

---

## Summary

**6 new modules + service worker + offline support + calendar + share intent + push notifications**

This integration transforms ARTH.OS into a **device-integrated platform** with OS-level capabilities. All modules integrate with the existing durable background services framework for reliability and observability.

**Next Steps**:
1. ✅ Register service worker in App.jsx
2. ✅ Request notification permission
3. ✅ Schedule first reminder
4. ✅ Export assessment to calendar
5. ✅ Share assessment with peer
6. ✅ Test offline sync merge
