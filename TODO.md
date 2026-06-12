# TODO – ARTH.OS Engagement & Retention

## Phase 1: Foundation (TODO.md creation + Sync Fix)
- [x] Create TODO.md for engagement/retention tracking
- [x] Trigger data sync on login (AuthContext + financialMemoryEngine)

## Phase 2: Score Improvement Notifications (in-app)
- [ ] Detect score changes (delta from last assessment)
- [ ] Show in-app toast/banner when score improves/declines
- [ ] Show score improvement history in dashboard

## Phase 3: Progress Milestones / Badges / Achievements
- [ ] Create `src/engines/milestoneEngine.js` — detect milestone unlocks
- [ ] Store unlocked milestones in localStorage
- [ ] Display badges in dashboard sidebar
- [ ] Show milestone popup on unlock

## Phase 4: Anonymized Peer Comparison
- [ ] Create `src/engines/peerComparisonEngine.js` — local-only percentile ranges
- [ ] Add peer comparison card to dashboard
- [ ] Show anonymized score distribution

## Phase 5: In-App Reminder/Notification System
- [ ] Wire up the Bell icon in Header to notification panel
- [ ] Create notification types: score change, milestone, streak, checkin reminder
- [ ] Show notification badge count
- [ ] Build notification panel component

## Phase 6: Email/SMS Reminder Trigger System
- [ ] Create API endpoint for reminder scheduling
- [ ] Build reminder preference UI
- [ ] Wire reminder triggers to checkin/streak logic

## Phase 7: Polish & Verification
- [ ] Test all components render correctly
- [ ] Verify milestone detection edge cases
- [ ] Confirm notification badges update correctly
- [ ] Build passes without errors
