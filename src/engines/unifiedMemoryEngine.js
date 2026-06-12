const UNIFIED_MEMORY_KEY = "arth-os-unified-memory";

export class UnifiedMemoryEngine {
  constructor() {
    this.timeline = this._loadTimeline();
  }

  _canPersist() {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  _loadTimeline() {
    if (!this._canPersist()) return [];
    try {
      const raw = window.localStorage.getItem(UNIFIED_MEMORY_KEY);
      const timeline = raw ? JSON.parse(raw) : [];
      return Array.isArray(timeline) ? timeline : [];
    } catch {
      return [];
    }
  }

  _persistTimeline() {
    if (!this._canPersist()) return;
    try {
      window.localStorage.setItem(UNIFIED_MEMORY_KEY, JSON.stringify(this.timeline));
    } catch {
      // ignore storage failures
    }
  }

  addEvent(event) {
    const payload = {
      ...event,
      timestamp: Date.now(),
    };

    this.timeline.push(payload);
    this._persistTimeline();
    return payload;
  }

  getHistory() {
    return [...this.timeline];
  }

  getPattern(type) {
    return this.timeline.filter((x) => x.type === type);
  }
}
