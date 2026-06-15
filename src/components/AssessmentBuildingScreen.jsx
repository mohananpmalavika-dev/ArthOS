import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import "./assessment-building-screen.css";

/**
 * AssessmentBuildingScreen
 *
 * Shows animated building/loading screen after assessment completion.
 * Builds anticipation before Big Reveal with a checklist of steps.
 */
export default function AssessmentBuildingScreen({ onComplete }) {
  const [steps, setSteps] = useState([
    { id: "behaviour", label: "Behaviour Analysis", completed: false, delay: 0 },
    { id: "stability", label: "Stability Mapping", completed: false, delay: 0.4 },
    { id: "risk", label: "Risk Detection", completed: false, delay: 0.8 },
    { id: "simulation", label: "Future Simulation", completed: false, delay: 1.2 },
    { id: "cognitive", label: "Cognitive Profiling", completed: false, delay: 1.6 }
  ]);

  useEffect(() => {
    steps.forEach((step, index) => {
      const timer = setTimeout(() => {
        setSteps(prev =>
          prev.map(s => (s.id === step.id ? { ...s, completed: true } : s))
        );
      }, (step.delay + 0.1) * 1000);

      return () => clearTimeout(timer);
    });

    // After all steps complete, trigger the callback
    const finalTimer = setTimeout(() => {
      if (typeof onComplete === "function") {
        onComplete();
      }
    }, 3200);

    return () => clearTimeout(finalTimer);
  }, []);

  return (
    <div className="assessment-building-screen">
      <div className="building-content">
        <motion.div
          className="building-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Building Your Financial DNA</h1>
          <p>Analyzing your assessment across multiple dimensions...</p>
        </motion.div>

        <div className="building-steps">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className={`building-step ${step.completed ? "completed" : ""}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { delay: step.delay }
              }}
            >
              <motion.div
                className="step-icon"
                initial={{ scale: 0 }}
                animate={
                  step.completed
                    ? { scale: 1, transition: { delay: step.delay + 0.15 } }
                    : { scale: 0 }
                }
              >
                {step.completed && <CheckCircle2 size={24} />}
              </motion.div>
              <span className="step-label">{step.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="building-progress"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 3 }}
        />
      </div>
    </div>
  );
}
