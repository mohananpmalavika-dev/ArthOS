import React from "react";
import PropTypes from "prop-types";
import Header from "./Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function PageShell({ children }) {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="page-shell">
      <Header isAuthenticated={isAuthenticated} user={user} />
      <main className="page-shell-main">{children}</main>
    </div>
  );
}

PageShell.propTypes = {
  children: PropTypes.node
};
