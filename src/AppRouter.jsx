import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import { RoastViewPage } from "./pages/RoastViewPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
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
