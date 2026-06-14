import React from "react";
import AiCoachInterface from "./AiCoachInterface.jsx";

export default function CoachScreen({ userId, result, assessment }) {
  return (
    <section className="page-section coach-screen" style={{ minHeight: "100vh" }}>
      <AiCoachInterface userId={userId} result={result} assessment={assessment} />
    </section>
  );
}
