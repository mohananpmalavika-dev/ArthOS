import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import { RoastViewPage } from './pages/RoastViewPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { useAuth } from './context/AuthContext.jsx';

/**
 * AppRouter
 * 
 * Main router component that handles:
 * - Public roast sharing pages (/roast/:id)
 * - Auth pages (/login, /register)
 * - Protected authenticated app
 */
function AppRouter() {
  const { isLoggedIn } = useAuth();

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Public roast sharing page - no auth required */}
          <Route path="/roast/:id" element={<RoastViewPage />} />

          {/* Auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Main app - shows login if not authenticated */}
          <Route
            path="/*"
            element={isLoggedIn ? <App /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default AppRouter;
