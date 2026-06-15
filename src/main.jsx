import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./AppRouter.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { HistoricalDataProvider } from "./context/HistoricalDataContext.jsx";
import { initializeErrorLogging } from "./lib/errorLogger.ts";
import { initializeErrorMonitoring } from "./lib/errorMonitoring.ts";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ConsentBanner from "./components/ConsentBanner.jsx";
import "./styles.css";
import "./styles/vars.css";

// Initialize global error logging
initializeErrorLogging();
initializeErrorMonitoring();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConsentBanner />
      <AuthProvider>
        <HistoricalDataProvider>
          <AppRouter />
        </HistoricalDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
