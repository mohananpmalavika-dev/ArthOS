import React from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n.js";
import AppRouter from "./AppRouter.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { EnterpriseAuthProvider } from "./context/EnterpriseAuthContext.jsx";

import { SettingsProvider } from "./context/SettingsContext.jsx";
import { CapabilitiesProvider } from "./context/CapabilitiesContext.jsx";
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
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <AuthProvider>
          <EnterpriseAuthProvider>
            <SettingsProvider>
              <ConsentBanner />
              <CapabilitiesProvider>
                <HistoricalDataProvider>
                  <AppRouter />
                </HistoricalDataProvider>
              </CapabilitiesProvider>
            </SettingsProvider>
          </EnterpriseAuthProvider>
        </AuthProvider>

      </ErrorBoundary>
    </I18nextProvider>
  </React.StrictMode>
);
