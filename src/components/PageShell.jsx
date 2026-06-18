import React from "react";
import PropTypes from "prop-types";
import Header from "./Header.jsx";
import OfflineBanner from "./OfflineBanner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useViewMode } from "../hooks/useViewMode.js";

export default function PageShell({ children }) {
  const { isAuthenticated, user } = useAuth();
  const { viewMode } = useViewMode();

  return (
    <div className="page-shell">
      <Header isAuthenticated={isAuthenticated} user={user} viewMode={viewMode} />
      <OfflineBanner />
      <main className="page-shell-main">{children}</main>
    </div>
  );
}

PageShell.propTypes = {
  children: PropTypes.node
};
