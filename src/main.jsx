import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./AppRouter.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { initializeErrorLogging } from "./lib/errorLogger.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ConsentBanner from "./components/ConsentBanner.jsx";
import "./styles.css";

// Initialize global error logging
initializeErrorLogging();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConsentBanner />
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
