/**
 * useHistoricalData Hook
 * Centralizes state for historical and temporal data
 * - Score history tracking
 * - Scenarios (twin scenarios)
 * - Memory timeline
 * - Weekly check-ins
 */

import { useState, useCallback, useMemo } from "react";
import { UnifiedMemoryEngine } from "../engines/unifiedMemoryEngine.js";

export function useHistoricalData() {
  const [scoreHistory, setScoreHistory] = useState([]);
  const [twinScenarios, setTwinScenarios] = useState(null);
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [weeklyCheckins, setWeeklyCheckins] = useState([]);
  const [historyTimespan, setHistoryTimespan] = useState("all");
  const [memoryTimeline, setMemoryTimeline] = useState([]);
  const [showFullMemoryTimeline, setShowFullMemoryTimeline] = useState(false);

  // Initialize memory engine
  const memoryEngine = useMemo(() => new UnifiedMemoryEngine(), []);

  const addScoreHistory = useCallback(entry => {
    setScoreHistory(prev => [...prev, entry]);
  }, []);

  const clearScoreHistory = useCallback(() => {
    setScoreHistory([]);
  }, []);

  const addCheckin = useCallback(checkin => {
    setWeeklyCheckins(prev => [...prev, checkin]);
  }, []);

  const clearCheckins = useCallback(() => {
    setWeeklyCheckins([]);
  }, []);

  const addMemoryEvent = useCallback(event => {
    setMemoryTimeline(prev => [...prev, event]);
  }, []);

  const toggleFullMemoryTimeline = useCallback(() => {
    setShowFullMemoryTimeline(prev => !prev);
  }, []);

  return {
    // State
    scoreHistory,
    setScoreHistory,
    twinScenarios,
    setTwinScenarios,
    digitalTwin,
    setDigitalTwin,
    weeklyCheckins,
    setWeeklyCheckins,
    historyTimespan,
    setHistoryTimespan,
    memoryTimeline,
    setMemoryTimeline,
    showFullMemoryTimeline,
    setShowFullMemoryTimeline,
    // Engine
    memoryEngine,
    // Methods
    addScoreHistory,
    clearScoreHistory,
    addCheckin,
    clearCheckins,
    addMemoryEvent,
    toggleFullMemoryTimeline
  };
}
