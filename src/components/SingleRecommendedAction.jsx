import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { CheckCircle2, AlertCircle, Target } from "lucide-react";
import CollapsiblePanel from "./CollapsiblePanel.jsx";

function SingleRecommendedAction({ result, assessment }) {
  const [engaged, setEngaged] = useState(false);
  const [completed, setCompleted] = useState(false);

  const hasValidProps = Boolean(result && assessment);

  const lowestComponent = result?.lowestComponent?.key || "behaviour";
  const personalityType = result?.personalityType || "Optimizer";

  const actionMap = {
    behaviour: {
      headline: "Implement a 48-Hour Wait Rule",
      reason: `Your behaviour score (${result?.behaviourScore ?? 0}/45) is your weakest link. Impulse purchases compound financial stress.`,
      impact: "Could recover 1–3 months of runway annually",
      microGoal:
        "This week: identify your top 3 impulse triggers and create a written wait rule for each.",
      archetype: {
        Builder: "Lock discretionary spending into a calendar. Review weekly, not daily.",
        Survivor:
          "Set a ₹5,000 personal friction threshold—anything above it requires 48 hours to approve.",
        Planner: "Use YNAB or Kakeibo to auto-track impulse categories. Weekly review ritual.",
        Dreamer: "Create a visual 'wish list' board—move items there instead of buying on impulse.",
        Optimizer: "A/B test your current wait period vs. 48-hour rule for one month.",
          "Risk Taker": "Gamify it: save the ₹ you *didn't* spend this week as a 'win fund'."
      },
      trackingLabel: "Wait Rule Engagement"
    },
    awareness: {
      headline: "Know Your Monthly Burn Rate",
      reason: `Your awareness score (${result?.awarenessScore ?? 0}/30) shows you may be flying blind. You can't fix what you don't measure.`,
      impact: "Increased clarity leads to 2–5x faster debt payoff",
      microGoal:
        "Today: list your top 3 monthly expenses. Tomorrow: track one category for 7 days.",
      archetype: {
        Builder: "Spreadsheet everything. Monthly reconciliation ritual.",
        Survivor: "Use a simple note or Google Sheet. Review weekly.",
        Planner: "Set up 3 expense alerts on your banking app right now.",
        Dreamer: "Visual budget: print a simple pie chart and put it on your fridge.",
        Optimizer: "Export last 30 days of transactions and categorize them.",
        "Risk Taker": "Challenge: guess your monthly spend to ±₹1,000. Check the data."
      },
      trackingLabel: "Expense Tracking Adoption"
    },
    stability: {
      headline: `Build Your Emergency Buffer`,
        reason: `Your survival runway is ${result?.survivalMonthsDisplay || "0"} months. It's not enough cushion for life's surprises.`,
      impact: "Every ₹10,000 saved = 1 month more runway = reduced financial anxiety",
      microGoal: "This month: save just ₹2,000–₹3,000. That's 15–20 minutes of your hourly income.",
      archetype: {
        Builder: "Automate it. Set a standing order for ₹3,000 on payday.",
        Survivor: "Put it in a separate, hard-to-access account. Out of sight, out of temptation.",
        Planner: "Create sub-accounts: Fixed (locked), Discretionary (flexible buffer).",
        Dreamer: "Visualize: ₹1,00,000 in emergency savings = 10 months of peace of mind.",
        Optimizer: "High-yield savings account. Let interest compound your buffer.",
        "Risk Taker":
          "Skip one coffee/meal per week. Redirect that ₹500/month to emergency savings."
      },
      trackingLabel: "Buffer Growth Tracking"
    }
  };

  const action = actionMap[lowestComponent] || actionMap.behaviour;
  const archetypeGuidance = action.archetype[personalityType] || action.archetype.Optimizer;
  const [trackingKey] = useState(() => `arth-os-action-${lowestComponent}-${Date.now()}`);

  useEffect(() => {
    if (!hasValidProps) {
      return;
    }

    if (engaged && !completed) {
      console.log(`[Telemetry] Action Engagement: ${lowestComponent}`);
    }
    if (completed) {
      console.log(`[Telemetry] Action Completed: ${lowestComponent}`);
      localStorage.setItem(
        trackingKey,
        JSON.stringify({ completed: true, timestamp: new Date().toISOString() })
      );
    }
  }, [engaged, completed, lowestComponent, trackingKey, hasValidProps]);

  if (!hasValidProps) {
    return null;
  }

  return (
    <CollapsiblePanel
      className="single-action-card"
      headerClassName="result-heading"
      title="Your Next Move"
      subtitle="The single action with maximum impact"
      icon={<Target size={19} />}
    >
      <div className="action-container">
        <div className="action-headline-block">
          <h3>{action.headline}</h3>
          <p className="action-reason">{action.reason}</p>
        </div>

        <div className="action-impact-block">
          <span className="impact-icon">⚡</span>
          <div>
            <span className="impact-label">Estimated Impact</span>
            <span className="impact-value">{action.impact}</span>
          </div>
        </div>

        <div className="action-guidance-block">
          <h4>Personalized for {personalityType}s:</h4>
          <p className="archetype-guidance">{archetypeGuidance}</p>
        </div>

        <div className="action-microgola-block">
          <h4>Micro-Goal (This Week)</h4>
          <p className="microgola-text">{action.microGoal}</p>
        </div>

        <div className="action-engagement-block">
          <button
            className={`engagement-btn ${engaged ? "engaged" : ""}`}
            onClick={() => setEngaged(!engaged)}
          >
              {engaged ? "✓ I'm committed" : "I'll try this"}
          </button>

          {engaged && (
            <button
              className={`completion-btn ${completed ? "completed" : ""}`}
              onClick={() => setCompleted(!completed)}
            >
              {completed ? (
                <>
                  <CheckCircle2 size={16} />
                  Completed!
                </>
              ) : (
                <>
                  <AlertCircle size={16} />
                  Mark Complete
                </>
              )}
            </button>
          )}
        </div>

        {completed && (
          <div className="completion-badge">
            <CheckCircle2 size={20} />
              <span>Great work! You're building financial resilience one action at a time.</span>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}

SingleRecommendedAction.propTypes = {
  result: PropTypes.shape({
    lowestComponent: PropTypes.shape({
      key: PropTypes.string
    }),
    behaviourScore: PropTypes.number,
    awarenessScore: PropTypes.number,
    survivalMonthsDisplay: PropTypes.string,
    personalityType: PropTypes.string
  }),
  assessment: PropTypes.shape({
    profile: PropTypes.object,
    behaviour: PropTypes.object,
    awareness: PropTypes.object
  })
};

export default SingleRecommendedAction;
