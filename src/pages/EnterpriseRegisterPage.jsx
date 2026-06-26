import React from "react";
import { useNavigate } from "react-router-dom";
import RegisterPage from "./RegisterPage.jsx";

export default function EnterpriseRegisterPage() {
  const navigate = useNavigate();

  return (
    <RegisterPage
      onSwitchToLogin={() => navigate("/enterprise-login")}
      onClose={() => navigate("/enterprise", { replace: true })}
    />
  );
}
