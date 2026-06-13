/**
 * Decision Ledger v2 — Production Upgrade
 *
 * Persistent, event-sourced ledger for financial decisions.
 * Previously in-memory Map (prototype). Now: localStorage-backed with
 * server-side sync via /api/memory/event, and comprehensive querying.
 *
 * Each decision is a first-class event with: timestamp, type, amount,
 * notes, factors (urgency, emotional, bias, information, orientation),
 * and outcome metadata.
 */

const DECISION_LEDGER_KEY = 'arth-os-decision-ledger';
const API_BASE = '/api';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeRead() {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(DECISION_LEDGER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function safeWrite(store) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DECISION_LEDGER_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('[decisionLedger] Failed to persist decision ledger:', {
      numDecisions: Object.values(store).reduce((sum, arr) => sum + arr.length, 0),
      error: error?.message,
      code: error?.code,
    });
  }
}

async function apiPost(endpoint, payload) {
  try {
    const resp = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch (error) {
    console.error('[decisionLedger] Failed to sync decision to server:', {
      endpoint,
      error: error?.message,
    });
    return false;
  }
}

class DecisionLedger {
  constructor() {
    this.store = safeRead();
    this._syncInProgress = false;
  }

  _persist() {
    safeWrite(this.store);
  }

  addDecision(userId, decision) {
    if (!userId) return false;
    if (!this.store[userId]) this.store[userId] = [];
    const entry = {
      id: decision.id || `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...decision,
      timestamp: decision.timestamp || new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    };
    this.store[userId].push(entry);
    this._persist();
    apiPost('/memory/event', { userId, event: { type: 'decision', ...entry } });
    return true;
  }

  getDecisions(userId, opts = {}) {
    const decisions = this.store[userId] || [];
    let filtered = [...decisions];
    if (opts.fromDate) {
      const from = new Date(opts.fromDate);
      filtered = filtered.filter((d) => new Date(d.timestamp) >= from);
    }
    if (opts.toDate) {
      const to = new Date(opts.toDate);
      filtered = filtered.filter((d) => new Date(d.timestamp) <= to);
    }
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (opts.limit && opts.limit > 0) filtered = filtered.slice(0, opts.limit);
    return filtered;
  }

  getDecision(userId, decisionId) {
    const decisions = this.store[userId] || [];
    return decisions.find((d) => d.id === decisionId) || null;
  }

  deleteDecision(userId, decisionId) {
    if (!this.store[userId]) return false;
    const idx = this.store[userId].findIndex((d) => d.id === decisionId);
    if (idx === -1) return false;
    this.store[userId].splice(idx, 1);
    this._persist();
    return true;
  }

  updateDecision(userId, decisionId, updates) {
    if (!this.store[userId]) return false;
    const decision = this.store[userId].find((d) => d.id === decisionId);
    if (!decision) return false;
    Object.assign(decision, updates, { updatedAt: new Date().toISOString() });
    this._persist();
    return true;
  }

  getDecisionsByCategory(userId) {
    const decisions = this.store[userId] || [];
    const grouped = {};
    for (const d of decisions) {
      const cat = d.category || d.type || 'uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(d);
    }
    return grouped;
  }

  getDecisionCount(userId, sinceDate = null) {
    const decisions = this.store[userId] || [];
    if (!sinceDate) return decisions.length;
    const since = new Date(sinceDate);
    return decisions.filter((d) => new Date(d.timestamp) >= since).length;
  }

  async syncToServer(userId) {
    if (this._syncInProgress) return { status: 'in_progress' };
    this._syncInProgress = true;
    try {
      const decisions = this.store[userId] || [];
      if (decisions.length === 0) return { status: 'empty' };
      const result = await apiPost('/memory/sync/events', {
        userId,
        data: decisions.map((d) => ({ ...d, type: 'decision' })),
      });
      return { status: result ? 'synced' : 'failed', count: decisions.length };
    } finally {
      this._syncInProgress = false;
    }
  }

  clearUser(userId) {
    delete this.store[userId];
    this._persist();
  }

  getStats(userId) {
    const decisions = this.store[userId] || [];
    if (decisions.length === 0) {
      return { total: 0, avgQuality: 0, categories: {}, streak: 0 };
    }
    const categories = {};
    let totalQuality = 0;
    let qualityCount = 0;
    const sorted = [...decisions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    for (const d of decisions) {
      const cat = d.category || d.type || 'uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
      if (typeof d.overallDecisionQuality === 'number') {
        totalQuality += d.overallDecisionQuality;
        qualityCount++;
      }
    }
    let streak = 0;
    const currentDate = new Date();
    for (const d of sorted) {
      const dDate = new Date(d.timestamp);
      const diffDays = Math.round((currentDate - dDate) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    return {
      total: decisions.length,
      avgQuality: qualityCount > 0 ? Math.round(totalQuality / qualityCount) : null,
      categories,
      streak,
      lastDecision: sorted[0]?.timestamp || null,
    };
  }
}

export const decisionLedger = new DecisionLedger();
