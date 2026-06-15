import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import { RoastViewPage } from "./pages/RoastViewPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import BigReveal from "./pages/BigReveal.jsx";
import Reality from "./pages/Reality.jsx";
import Why from "./pages/Why.jsx";
import Future from "./pages/Future.jsx";
import FutureYou from "./pages/FutureYou.jsx";
import OneAction from "./pages/OneAction.jsx";
import PageShell from "./components/PageShell.jsx";
import AdvancedArea from "./pages/AdvancedArea.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useAuth } from "./context/AuthContext.jsx";

/**
 * AppRouter
 *
 * Main router component that handles:
 * - Public roast sharing pages (/roast/:id)
 * - Auth pages (/login, /register)
 * - Protected authenticated app
 */
function AppRouter() {
  const { isAuthenticated, loading } = useAuth();
  const demoMode = typeof window !== "undefined" &&
    window.location.pathname.startsWith("/demo");

  // Show nothing while checking authentication status
  if (loading) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <Routes>
          {/* Public roast sharing page - no auth required */}
          <Route path="/roast/:id" element={<RoastViewPage />} />

          {/* Auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Guided story and cinematic flow */}
          <Route
            path="/onboarding"
            element={
              isAuthenticated ? (
                <PageShell>
                  <Onboarding />
                </PageShell>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/big-reveal"
            element={
              isAuthenticated ? (
                <PageShell>
                  <BigReveal />
                </PageShell>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/reality"
            element={
              isAuthenticated ? (
                <PageShell>
                  <Reality />
                </PageShell>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/why"
            element={
              isAuthenticated ? (
                <PageShell>
                  <Why />
                </PageShell>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/future"
            element={
              isAuthenticated ? (
                <PageShell>
                  <Future />
                </PageShell>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/future-you"
            element={
              isAuthenticated ? (
                <PageShell>
                  <FutureYou />
                </PageShell>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/action"
            element={
              isAuthenticated ? (
                <PageShell>
                  <OneAction />
                </PageShell>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Advanced area (not on the primary nav) */}
          <Route path="/advanced" element={isAuthenticated ? <AdvancedArea /> : <Navigate to="/login" replace />} />

          {/* Root: send authenticated users into the cinematic onboarding flow first. */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/onboarding" replace /> : <Navigate to="/login" replace />} />

          {/* Main app demo route - the same app but with investor demo framing. */}
          {(() => {
            const isLocalDev = typeof window !== "undefined" &&
              (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
            return (
              <>
                <Route path="/demo/*" element={isAuthenticated || isLocalDev ? <App demoMode={true} /> : <Navigate to="/login" replace />} />
                <Route path="/*" element={isAuthenticated || isLocalDev ? <App demoMode={false} /> : <Navigate to="/login" replace />} />
              </>
            );
          })()}
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default AppRouter;
