const SCORE_HISTORY_KEY = "arth-os-score-history";
const WEEKLY_CHECKIN_KEY = "arth-os-weekly-checkins";
const ASSESSMENT_HISTORY_KEY = "arth-os-assessment-history";

export function loadScoreHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SCORE_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    return Array.isArray(history)
      ? history.sort((a, b) => new Date(a.date) - new Date(b.date))
      : [];
  } catch {
    return [];
  }
}

export function persistScoreHistory(history) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore storage failures
  }
}

export function appendScoreHistory(healthScore) {
  if (typeof window === "undefined") return loadScoreHistory();
  if (healthScore === undefined || healthScore === null) return loadScoreHistory();

  const history = loadScoreHistory();
  const today = new Date().toISOString().split("T")[0];
  const roundedScore = Math.round(Number(healthScore) || 0);

  const existing = history.find((entry) => entry.date === today);
  let updated;

  if (existing) {
    updated = history.map((entry) =>
      entry.date === today ? { ...entry, score: roundedScore } : entry
    );
  } else {
    updated = [...history, { date: today, score: roundedScore }];
  }

  persistScoreHistory(updated);
  return updated;
}

export function getScoreProgression(history, timespan = "all") {
  if (!Array.isArray(history)) return [];
  if (timespan === "all") return history;

  const now = new Date();
  const cutoff = new Date(now);

  if (timespan === "week") cutoff.setDate(now.getDate() - 7);
  else if (timespan === "month") cutoff.setMonth(now.getMonth() - 1);
  else if (timespan === "quarter") cutoff.setMonth(now.getMonth() - 3);

  return history.filter((item) => new Date(item.date) >= cutoff);
}

export function getProgressSummary(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      improvement: 0,
      startDate: null,
      endDate: null,
      periodLabel: "No history yet",
    };
  }

  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const improvement = last.score - first.score;
  const assessments = sorted.length;

  return {
    improvement,
    startDate: first.date,
    endDate: last.date,
    periodLabel: assessments === 1
      ? `1 assessment, ${improvement >= 0 ? "+" : ""}${improvement} points`
      : `${assessments} assessments, ${improvement >= 0 ? "+" : ""}${improvement} points`,
  };
}

export function loadAssessmentHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ASSESSMENT_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    return Array.isArray(history)
      ? history.sort((a, b) => new Date(a.date) - new Date(b.date))
      : [];
  } catch {
    return [];
  }
}

export function persistAssessmentHistory(history) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ASSESSMENT_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore storage failures
  }
}

export function appendAssessmentHistory(entry) {
  if (typeof window === "undefined") return loadAssessmentHistory();
  const history = loadAssessmentHistory();
  const today = new Date().toISOString().split("T")[0];
  const created = {
    date: today,
    score: Math.round(Number(entry.healthScore) || 0),
    personalityType: entry.personalityType || "Unknown",
    stabilityMonths: entry.survivalMonthsRaw || 0,
    awarenessScore: entry.awarenessScore || 0,
    behaviourSummary: entry.behaviourSummary || {},
  };

  const existing = history.find((item) => item.date === today);
  let updated;

  if (existing) {
    updated = history.map((item) =>
      item.date === today ? { ...item, ...created } : item
    );
  } else {
    updated = [...history, created];
  }

  persistAssessmentHistory(updated);
  return updated;
}

export function loadWeeklyCheckins() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WEEKLY_CHECKIN_KEY);
    const checkins = raw ? JSON.parse(raw) : [];
    return Array.isArray(checkins) ? checkins : [];
  } catch {
    return [];
  }
}

export function persistWeeklyCheckins(checkins) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WEEKLY_CHECKIN_KEY, JSON.stringify(checkins));
  } catch {
    // ignore storage failures
  }
}

export function appendWeeklyCheckin(checkin) {
  if (typeof window === "undefined") return loadWeeklyCheckins();
  const checkins = loadWeeklyCheckins();
  const today = new Date().toISOString().split("T")[0];
  const entry = {
    date: today,
    ...checkin,
  };

  const existing = checkins.find((item) => item.date === today);
  const updated = existing
    ? checkins.map((item) => (item.date === today ? { ...item, ...entry } : item))
    : [...checkins, entry];

  persistWeeklyCheckins(updated);
  return updated;
}

export function countRecentCheckins(checkins, days = 7) {
  if (!Array.isArray(checkins)) return 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return checkins.filter((item) => new Date(item.date) >= cutoff).length;
}

export function calculateConsecutiveStreak(checkins) {
  if (!Array.isArray(checkins) || checkins.length === 0) return 0;

  const sorted = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  let expectedDate = new Date();

  for (const checkin of sorted) {
    const checkinDate = new Date(checkin.date);
    if (checkinDate.toDateString() === expectedDate.toDateString()) {
      streak += 1;
      expectedDate.setDate(expectedDate.getDate() - 1);
      continue;
    }

    if (checkinDate < expectedDate) break;
  }

  return streak;
}
