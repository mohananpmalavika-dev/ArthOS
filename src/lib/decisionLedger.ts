/**
 * src/lib/decisionLedger.ts
 * Decision Ledger v2 with TypeScript
 *
 * Persistent, event-sourced ledger for financial decisions.
 * localStorage-backed with server-side sync via /api/memory/event,
 * and comprehensive querying capabilities.
 *
 * Each decision is a first-class event with: timestamp, type, amount,
 * notes, factors (urgency, emotional, bias, information, orientation),
 * and outcome metadata.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DecisionEntry {
  id: string;
  type?: string;
  category?: string;
  amount?: number;
  notes?: string;
  timestamp: string;
  recordedAt: string;
  updatedAt?: string;
  urgency?: string;
  emotional?: boolean;
  bias?: string;
  information?: number; // 0-100
  orientation?: string;
  overallDecisionQuality?: number;
  [key: string]: unknown;
}

interface GetDecisionsOptions {
  fromDate?: string | Date;
  toDate?: string | Date;
  limit?: number;
}

interface SyncResult {
  status: 'in_progress' | 'empty' | 'synced' | 'failed';
  count?: number;
}

interface DecisionStats {
  total: number;
  avgQuality: number | null;
  categories: Record<string, number>;
  streak: number;
  lastDecision: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DECISION_LEDGER_KEY = 'arth-os-decision-ledger';
const API_BASE = '/api';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if code is running in browser with localStorage access
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Safely read decision ledger from localStorage
 */
function safeRead(): Record<string, DecisionEntry[]> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(DECISION_LEDGER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Safely write decision ledger to localStorage
 */
function safeWrite(store: Record<string, DecisionEntry[]>): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DECISION_LEDGER_KEY, JSON.stringify(store));
  } catch {
    console.warn('[decisionLedger] Failed to persist to localStorage');
  }
}

/**
 * Make API call to sync decision to server
 */
async function apiPost(endpoint: string, payload: unknown): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Generate unique decision ID
 */
function generateDecisionId(): string {
  return `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// DECISION LEDGER CLASS
// ============================================================================

class DecisionLedger {
  private store: Record<string, DecisionEntry[]>;
  private _syncInProgress: boolean = false;

  constructor() {
    this.store = safeRead();
  }

  /**
   * Persist store to localStorage
   */
  private _persist(): void {
    safeWrite(this.store);
  }

  /**
   * Add a new decision to the ledger
   * @param userId - User ID
   * @param decision - Decision object
   * @returns Success status
   */
  addDecision(userId: string, decision: Partial<DecisionEntry>): boolean {
    if (!userId) return false;

    if (!this.store[userId]) {
      this.store[userId] = [];
    }

    const entry: DecisionEntry = {
      id: decision.id || generateDecisionId(),
      ...decision,
      timestamp: decision.timestamp || new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    } as DecisionEntry;

    this.store[userId].push(entry);
    this._persist();

    // Async sync to server (fire and forget) with schema versioning
    void apiPost('/memory/event', { userId, event: { type: 'decision', ...entry, schema_version: "1.0.0" } });

    return true;
  }

  /**
   * Get decisions with optional filtering and sorting
   * @param userId - User ID
   * @param opts - Query options (fromDate, toDate, limit)
   * @returns Array of decisions
   */
  getDecisions(userId: string, opts: GetDecisionsOptions = {}): DecisionEntry[] {
    const decisions = this.store[userId] || [];
    let filtered = [...decisions];

    // Date range filtering
    if (opts.fromDate) {
      const from = new Date(opts.fromDate);
      filtered = filtered.filter((d) => new Date(d.timestamp) >= from);
    }

    if (opts.toDate) {
      const to = new Date(opts.toDate);
      filtered = filtered.filter((d) => new Date(d.timestamp) <= to);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (opts.limit && opts.limit > 0) {
      filtered = filtered.slice(0, opts.limit);
    }

    return filtered;
  }

  /**
   * Get a single decision by ID
   * @param userId - User ID
   * @param decisionId - Decision ID
   * @returns Decision or null if not found
   */
  getDecision(userId: string, decisionId: string): DecisionEntry | null {
    const decisions = this.store[userId] || [];
    return decisions.find((d) => d.id === decisionId) || null;
  }

  /**
   * Delete a decision
   * @param userId - User ID
   * @param decisionId - Decision ID
   * @returns Success status
   */
  deleteDecision(userId: string, decisionId: string): boolean {
    if (!this.store[userId]) return false;

    const idx = this.store[userId].findIndex((d) => d.id === decisionId);
    if (idx === -1) return false;

    this.store[userId].splice(idx, 1);
    this._persist();

    return true;
  }

  /**
   * Update a decision
   * @param userId - User ID
   * @param decisionId - Decision ID
   * @param updates - Partial decision updates
   * @returns Success status
   */
  updateDecision(
    userId: string,
    decisionId: string,
    updates: Partial<DecisionEntry>
  ): boolean {
    if (!this.store[userId]) return false;

    const decision = this.store[userId].find((d) => d.id === decisionId);
    if (!decision) return false;

    Object.assign(decision, updates, { updatedAt: new Date().toISOString() });
    this._persist();

    return true;
  }

  /**
   * Get decisions grouped by category
   * @param userId - User ID
   * @returns Object with categories as keys and decision arrays as values
   */
  getDecisionsByCategory(userId: string): Record<string, DecisionEntry[]> {
    const decisions = this.store[userId] || [];
    const grouped: Record<string, DecisionEntry[]> = {};

    for (const d of decisions) {
      const cat = d.category || d.type || 'uncategorized';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(d);
    }

    return grouped;
  }

  /**
   * Get count of decisions since a date
   * @param userId - User ID
   * @param sinceDate - Optional start date (ISO string)
   * @returns Count of decisions
   */
  getDecisionCount(userId: string, sinceDate?: string | null): number {
    const decisions = this.store[userId] || [];

    if (!sinceDate) return decisions.length;

    const since = new Date(sinceDate);
    return decisions.filter((d) => new Date(d.timestamp) >= since).length;
  }

  /**
   * Sync all decisions for a user to server
   * @param userId - User ID
   * @returns Sync status
   */
  async syncToServer(userId: string): Promise<SyncResult> {
    if (this._syncInProgress) {
      return { status: 'in_progress' };
    }

    this._syncInProgress = true;

    try {
      const decisions = this.store[userId] || [];

      if (decisions.length === 0) {
        return { status: 'empty' };
      }

      const result = await apiPost('/memory/sync/events', {
        userId,
        data: decisions.map((d) => ({ ...d, type: 'decision' })),
      });

      return {
        status: result ? 'synced' : 'failed',
        count: decisions.length,
      };
    } finally {
      this._syncInProgress = false;
    }
  }

  /**
   * Clear all decisions for a user
   * @param userId - User ID
   */
  clearUser(userId: string): void {
    delete this.store[userId];
    this._persist();
  }

  /**
   * Get statistics for a user's decisions
   * @param userId - User ID
   * @returns Decision statistics
   */
  getStats(userId: string): DecisionStats {
    const decisions = this.store[userId] || [];

    if (decisions.length === 0) {
      return { total: 0, avgQuality: null, categories: {}, streak: 0, lastDecision: null };
    }

    const categories: Record<string, number> = {};
    let totalQuality = 0;
    let qualityCount = 0;

    const sorted = [...decisions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Calculate categories and average quality
    for (const d of decisions) {
      const cat = d.category || d.type || 'uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;

      if (typeof d.overallDecisionQuality === 'number') {
        totalQuality += d.overallDecisionQuality;
        qualityCount++;
      }
    }

    // Calculate decision streak (consecutive days)
    let streak = 0;
    const currentDate = new Date();

    for (const d of sorted) {
      const dDate = new Date(d.timestamp);
      const diffDays = Math.round((currentDate.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24));

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

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const decisionLedger = new DecisionLedger();

export default decisionLedger;
