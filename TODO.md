# TODO – ARTH.OS Engagement & Retention

## Phase 1: Foundation (TODO.md creation + Sync Fix)
- [x] Create TODO.md for engagement/retention tracking
- [x] Trigger data sync on login (AuthContext + financialMemoryEngine)

## Phase 2: Score Improvement Notifications (in-app)
- [x] Detect score changes (delta from last assessment) — `detectAndNotifyScoreChange()` in notificationEngine.js; wired in App.jsx via `prevScoreRef`
- [x] Show in-app toast/banner when score improves/declines — NotificationToast.jsx polls for unread + shows animated toast
- [x] Show score improvement history in dashboard — AnalyticsDashboard.jsx + UserHistory.jsx (lazy-loaded) display score history

## Phase 3: Progress Milestones / Badges / Achievements
- [x] Create `src/engines/milestoneEngine.js` — detect milestone unlocks — exists with 20+ badge definitions, `checkAndUnlockMilestones()` wired in App.jsx
- [x] Store unlocked milestones in localStorage — via MILESTONE_STORAGE_KEY
- [x] Display badges in dashboard sidebar — BadgeDisplay.jsx with compact mode renders in sidebar
- [x] Show milestone popup on unlock — newlyUnlocked state in App.jsx passed to BadgeDisplay which shows milestone-popup cards

## Phase 4: Anonymized Peer Comparison
- [x] Create `src/engines/peerComparisonEngine.js` — local-only percentile ranges — exists with Box-Muller generated distribution
- [x] Add peer comparison card to dashboard — PeerComparisonCard.jsx rendered in sidebar of reports section
- [x] Show anonymized score distribution — bar chart (recharts) showing buckets with user highlight

## Phase 5: In-App Reminder/Notification System
- [x] Wire up the Bell icon in Header to notification panel — Bell icon calls `onToggleNotification` → toggles NotificationPanel
- [x] Create notification types: score change, milestone, streak, checkin reminder — all 4 types in notificationEngine.js
- [x] Show notification badge count — `notificationBadgeCount` displayed as badge dot in Header, refreshed every 30s
- [x] Build notification panel component — NotificationPanel.jsx with slide-out overlay, mark read/all, clear all

## Phase 6: Email/SMS Reminder Trigger System
- [x] Create API endpoint for reminder scheduling — `api_src/reminders.js` exists with full CRUD + trigger/delivery engine, now wired into `api/index.js` route definitions
- [x] Build reminder preference UI — `ReminderPreferences.jsx` with channel/time/frequency toggles, streak nudges, score alerts, milestone alerts; saved to localStorage + API; rendered in reports section via `App.jsx`
- [x] Wire reminder triggers to checkin/streak logic — `DailyCheckinForm.jsx` calls `scheduleStreakReminder()` on streak milestones; exports `useCheckinReminderScheduler` hook

## Phase 7: Polish & Verification
- [x] Test all components render correctly (manual)
- [x] Verify milestone detection edge cases (manual)
- [x] Confirm notification badges update correctly (manual)
- [x] Build passes without errors (`npm run build` succeeds)
