import React, { createContext, useContext } from "react";
import { useHistoricalData } from "../hooks/useHistoricalData.js";

/**
 * HistoricalDataContext
 *
 * Provides shared access to historical and temporal data across the entire app.
 * This allows routed pages to access the same score history, digital twin,
 * and memory timeline that App.jsx manages.
 */
const HistoricalDataContext = createContext(null);

/**
 * HistoricalDataProvider
 *
 * Wraps the app with shared historical data state.
 * Should be placed at a high level (above AppRouter) to ensure all pages
 * can access the data.
 */
export function HistoricalDataProvider({ children }) {
  const historicalData = useHistoricalData();

  return (
    <HistoricalDataContext.Provider value={historicalData}>
      {children}
    </HistoricalDataContext.Provider>
  );
}

/**
 * useHistoricalDataContext
 *
 * Hook to access shared historical data.
 * Returns the same object as useHistoricalData but from context,
 * ensuring all consumers share the same state.
 *
 * @returns {Object} Historical data state
 *   - scoreHistory: array of historical scores
 *   - setScoreHistory: setter
 *   - twinScenarios: financial twin scenarios
 *   - setTwinScenarios: setter
 *   - digitalTwin: complete digital twin object
 *   - setDigitalTwin: setter
 *   - weeklyCheckins: array of weekly check-ins
 *   - setWeeklyCheckins: setter
 *   - historyTimespan: filter timespan ("all", "year", "month")
 *   - setHistoryTimespan: setter
 *   - memoryTimeline: array of memory events
 *   - setMemoryTimeline: setter
 *   - showFullMemoryTimeline: boolean
 *   - setShowFullMemoryTimeline: setter
 *   - memoryEngine: UnifiedMemoryEngine instance
 *   - addScoreHistory, clearScoreHistory, addCheckin, clearCheckins, addMemoryEvent, toggleFullMemoryTimeline
 */
export function useHistoricalDataContext() {
  const context = useContext(HistoricalDataContext);
  if (!context) {
    throw new Error("useHistoricalDataContext must be used within HistoricalDataProvider");
  }
  return context;
}
