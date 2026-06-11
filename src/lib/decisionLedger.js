// Simple Decision Ledger - in-memory prototype

class DecisionLedger {
  constructor() {
    this.store = new Map(); // userId -> decisions[]
  }

  addDecision(userId, decision) {
    // decision: { timestamp, category, goalAlignment, biasScore, futureImpact, valueConsistency, notes }
    if (!this.store.has(userId)) this.store.set(userId, []);
    this.store.get(userId).push({ ...decision, timestamp: decision.timestamp || new Date().toISOString() });
    return true;
  }

  getDecisions(userId) {
    return this.store.get(userId) || [];
  }
}

export const decisionLedger = new DecisionLedger();
