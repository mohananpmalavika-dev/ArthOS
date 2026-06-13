/**
 * L11: True Digital Twin Engine — v1 Full Implementation
 *
 * "Full simulation environment for financial futures"
 *
 * A complete, dynamic, real-time model of a user's financial life that:
 * - Maintains continuous state evolution over time
 * - Tracks behavior adaptation based on decisions
 * - Generates decision consequence graphs
 * - Produces multiple realistic futures via Monte Carlo
 * - Enables stress-testing and scenario exploration
 *
 * Blueprint: "Think of it as a flight simulator for your financial life.
 * You practice in the simulator before you fly the real thing."
 *
 * This engine converts ARTH.OS from a tool into a true flight simulator.
 */

// ============================================================
// CONTINUOUS STATE MODEL
// ============================================================

/**
 * Represents a single point in financial state at time t.
 * Every state has deterministic and probabilistic components.
 */
class FinancialState {
  constructor(t = 0, baseState = {}) {
    this.timestamp = t;
    this.date = new Date(Date.now() + t * 30 * 24 * 60 * 60 * 1000); // t months from now

    // Deterministic median state
    this.median = {
      income: baseState.income || 0,
      expenses: baseState.expenses || 0,
      savings: baseState.savings || 0,
      debt: baseState.debt || 0,
      investments: baseState.investments || 0,
      liabilities: baseState.liabilities || 0,
      netWorth: baseState.netWorth || 0,
      runway: baseState.runway || 0,
      healthScore: baseState.healthScore || 50
    };

    // Probabilistic bounds (5th and 95th percentiles)
    this.bounds = {
      lower: { ...this.median },
      upper: { ...this.median }
    };

    // Behavioral state
    this.behavior = {
      savingsRate: baseState.savingsRate || 0.1,
      savingsDiscipline: baseState.savingsDiscipline || 0.5, // 0-1 score
      spendingElasticity: baseState.spendingElasticity || 0.4,
      riskTolerance: baseState.riskTolerance || 0.5,
      decisionQuality: baseState.decisionQuality || 0.5, // Improves with good decisions
      impulseProbability: baseState.impulseProbability || 0.3 // Decreases with awareness
    };

    // Shocks and interventions applied at this point
    this.shocks = []; // [ { type, magnitude, effect } ]
    this.interventions = []; // [ { type, impact } ]
    this.decisions = []; // [ { name, consequence } ]
  }

  /**
   * Deterministically project next month's state
   */
  projectMonth(monthlyNet, volatility = 0.05) {
    const nextState = new FinancialState(this.timestamp + 1);

    // Apply monthly cash flow
    const variance = volatility * Math.abs(monthlyNet);
    nextState.median.savings = Math.max(
      0,
      this.median.savings + monthlyNet + (Math.random() - 0.5) * variance
    );

    // Income/expense growth (1% annual)
    const growthFactor = 1.0083; // 1% annually = 0.0083 monthly
    nextState.median.income = this.median.income * growthFactor;
    nextState.median.expenses = this.median.expenses * growthFactor;

    // Runway calculation
    nextState.median.runway =
      nextState.median.expenses > 0 ? nextState.median.savings / nextState.median.expenses : 0;

    // Health score evolution (moves toward 50-70 baseline + behavior effect)
    const healthBaseline = 55;
    const healthChange =
      (healthBaseline - this.median.healthScore) * 0.05 +
      (nextState.median.runway > 3 ? 1 : nextState.median.runway < 1 ? -2 : 0);
    nextState.median.healthScore = Math.max(
      0,
      Math.min(100, this.median.healthScore + healthChange)
    );

    // Behavior evolution (decisions improve discipline, poor outcomes reduce it)
    nextState.behavior.savingsDiscipline = Math.min(
      1,
      this.behavior.savingsDiscipline + 0.02 // Gradually improves
    );
    nextState.behavior.impulseProbability = Math.max(
      0,
      this.behavior.impulseProbability - 0.01 // Decreases with awareness
    );

    // Bounds propagate with uncertainty
    const uncertainty = Math.abs(monthlyNet) * volatility * 1.96; // 95% confidence interval
    nextState.bounds.lower.savings = Math.max(0, nextState.median.savings - uncertainty);
    nextState.bounds.upper.savings = nextState.median.savings + uncertainty;

    return nextState;
  }

  /**
   * Apply a decision and calculate its consequences
   */
  applyDecision(decision, impactHorizon = 12) {
    const consequence = {
      name: decision.name,
      type: decision.type, // 'saving' | 'spending' | 'income' | 'debt' | 'investment'
      monthlyImpact: decision.monthlyImpact || 0,
      oneTimeImpact: decision.oneTimeImpact || 0,
      behaviorShift: decision.behaviorShift || {}, // Changes to behavior state
      riskLevel: decision.riskLevel || "low", // 'low' | 'medium' | 'high'
      confidence: decision.confidence || 0.7, // 0-1
      horizon: impactHorizon,
      projectedOutcome: null // Will be calculated
    };

    // Update behavior based on decision type
    if (decision.type === "saving") {
      this.behavior.savingsDiscipline = Math.min(
        1,
        this.behavior.savingsDiscipline + decision.confidence * 0.1
      );
      this.behavior.decisionQuality = Math.min(1, this.behavior.decisionQuality + 0.05);
    } else if (decision.type === "spending_control") {
      this.behavior.impulseProbability = Math.max(
        0,
        this.behavior.impulseProbability - decision.confidence * 0.1
      );
    }

    // Calculate consequence path (simplified projection)
    let projectedSavings = this.median.savings;
    for (let m = 0; m < Math.min(impactHorizon, 12); m++) {
      projectedSavings += consequence.monthlyImpact + (m === 0 ? consequence.oneTimeImpact : 0);
    }
    consequence.projectedOutcome = {
      savingsAfter: Math.max(0, projectedSavings),
      runwayAfter: this.median.expenses > 0 ? projectedSavings / this.median.expenses : 0,
      impactScore: ((projectedSavings - this.median.savings) / this.median.savings) * 100
    };

    this.decisions.push(consequence);
    return consequence;
  }

  /**
   * Apply an external shock (job loss, medical emergency, etc.)
   */
  applyShock(shock) {
    const shockRecord = {
      type: shock.type, // 'income_loss' | 'expense_spike' | 'market_crash' | 'emergency'
      magnitude: shock.magnitude, // Absolute amount
      duration: shock.duration || 1, // Months
      recovery: shock.recovery || 12, // Months to recover
      severity: shock.severity || "medium",
      timestamp: this.timestamp
    };

    // Immediate impact
    if (shock.type === "income_loss") {
      this.median.income -= shock.magnitude;
    } else if (shock.type === "expense_spike") {
      this.median.savings -= shock.magnitude;
    } else if (shock.type === "emergency") {
      this.median.savings -= shock.magnitude;
      this.behavior.riskTolerance = Math.max(0, this.behavior.riskTolerance - 0.2);
    }

    this.shocks.push(shockRecord);
    return shockRecord;
  }

  /**
   * Apply an intervention (coaching, reminder, product feature)
   */
  applyIntervention(intervention) {
    const interventionRecord = {
      type: intervention.type, // 'nudge' | 'coaching' | 'automation' | 'goal_setting'
      effectiveness: intervention.effectiveness || 0.7, // 0-1
      persistencePeriod: intervention.persistencePeriod || 6, // Months
      behaviorShift: intervention.behaviorShift || {},
      adoptionProbability: intervention.adoptionProbability || 0.6,
      timestamp: this.timestamp
    };

    // Apply behavioral shift if adopted (based on adoption probability)
    if (Math.random() < interventionRecord.adoptionProbability) {
      if (intervention.type === "nudge") {
        this.behavior.impulseProbability *= 1 - intervention.effectiveness;
      } else if (intervention.type === "coaching") {
        this.behavior.decisionQuality += intervention.effectiveness * 0.15;
      } else if (intervention.type === "automation") {
        this.behavior.savingsDiscipline += intervention.effectiveness * 0.2;
      }
    }

    this.interventions.push(interventionRecord);
    return interventionRecord;
  }
}

// ============================================================
// DECISION CONSEQUENCE GRAPH
// ============================================================

/**
 * A directed acyclic graph (DAG) showing how decisions cascade through future states.
 * Each node is a decision, each edge shows the consequence path.
 */
class DecisionConsequenceGraph {
  constructor(initialState) {
    this.initialState = initialState;
    this.nodes = new Map(); // decisionId -> DecisionNode
    this.edges = new Map(); // decisionId -> [childDecisionIds]
    this.nodeCounter = 0;
  }

  /**
   * Add a decision node with its projected consequence path
   */
  addDecision(parentId, decision) {
    const nodeId = `decision_${this.nodeCounter++}`;
    const node = {
      id: nodeId,
      parentId,
      decision,
      timestamp: this.initialState.timestamp,
      consequences: [], // Consequences over horizon
      children: [],
      confidence: decision.confidence || 0.7,
      impact: decision.monthlyImpact || 0,
      oneTimeImpact: decision.oneTimeImpact || 0,
      projectedFinalState: null
    };

    // Project consequences
    const projState = { ...this.initialState.median };
    const consequences = [];

    for (let m = 0; m < 12; m++) {
      if (m === 0) {
        projState.savings = projState.savings + node.oneTimeImpact + node.impact;
      } else {
        projState.savings = projState.savings + node.impact;
      }

      consequences.push({
        month: m,
        savings: Math.max(0, projState.savings),
        runway: projState.expenses > 0 ? Math.max(0, projState.savings) / projState.expenses : 0,
        healthScore: projState.healthScore
      });
    }

    node.consequences = consequences;
    node.projectedFinalState = consequences[consequences.length - 1];
    this.nodes.set(nodeId, node);

    if (parentId && this.edges.has(parentId)) {
      this.edges.get(parentId).push(nodeId);
    } else if (parentId) {
      this.edges.set(parentId, [nodeId]);
    }

    return nodeId;
  }

  /**
   * Get the consequence path for a decision
   */
  getConsequencePath(decisionId) {
    const node = this.nodes.get(decisionId);
    return node ? node.consequences : [];
  }

  /**
   * Get all decisions leading to a certain state
   */
  getPathToState(targetCriteria) {
    const paths = [];
    for (const [nodeId, node] of this.nodes) {
      const finalState = node.projectedFinalState;
      if (
        finalState &&
        finalState.runway >= targetCriteria.minRunway &&
        finalState.healthScore >= targetCriteria.minHealth
      ) {
        paths.push({
          decisionId: nodeId,
          decision: node.decision.name,
          finalState,
          impact: node.impact
        });
      }
    }
    return paths.sort(
      (a, b) =>
        b.finalState.runway - a.finalState.runway ||
        b.finalState.healthScore - a.finalState.healthScore
    );
  }

  /**
   * Export as JSON for visualization
   */
  toJSON() {
    const nodes = Array.from(this.nodes.values()).map(n => ({
      id: n.id,
      parentId: n.parentId,
      decision: n.decision.name,
      impact: n.impact,
      confidence: n.confidence,
      finalRunway: n.projectedFinalState?.runway,
      finalHealth: n.projectedFinalState?.healthScore
    }));

    const edges = Array.from(this.edges.entries()).map(([from, to]) => ({
      from,
      to
    }));

    return { nodes, edges };
  }
}

// ============================================================
// MONTE CARLO FUTURE GENERATOR
// ============================================================

/**
 * Generates multiple realistic future paths with probability distributions.
 * Each path is a complete timeline of the user's financial life.
 */
class MonteCarloFutureGenerator {
  constructor(initialState, horizon = 60) {
    this.initialState = initialState;
    this.horizon = horizon; // Months
    this.futures = [];
  }

  /**
   * Generate N independent futures with different shocks, decisions, and outcomes
   */
  generateFutures(iterations = 1000) {
    const futures = [];

    for (let i = 0; i < iterations; i++) {
      const future = this.generateSingleFuture(i);
      futures.push(future);
    }

    this.futures = futures;
    return this.computeStatistics(futures);
  }

  /**
   * Generate a single realistic future path
   */
  generateSingleFuture(seed) {
    const timeline = [];
    let state = new FinancialState(0, this.initialState.median);
    state.behavior = { ...this.initialState.behavior };

    const rng = this.seededRandom(seed); // Deterministic RNG for reproducibility

    for (let t = 0; t < this.horizon; t++) {
      // Determine monthly cash flow with randomness
      const incomeVariance = rng() * 0.1 - 0.05; // ±5% variance
      const expenseVariance = rng() * 0.15 - 0.075; // ±7.5% variance

      const monthlyIncome = state.median.income * (1 + incomeVariance);
      const monthlyExpenses = state.median.expenses * (1 + expenseVariance);
      const monthlyNet = monthlyIncome - monthlyExpenses;

      // Stochastic shocks (job loss, medical emergency, etc.)
      if (rng() < 0.02) {
        // 2% chance each month
        const shockType = rng() < 0.6 ? "income_loss" : rng() < 0.9 ? "expense_spike" : "emergency";
        const shockMagnitude = monthlyExpenses * (rng() * 0.5 + 0.3); // 30-80% of monthly expenses
        state.applyShock({
          type: shockType,
          magnitude: shockMagnitude,
          duration: Math.floor(rng() * 3) + 1
        });
      }

      // Behavior-driven decisions (impulse spending, etc.)
      if (rng() < state.behavior.impulseProbability && state.median.savings > 0) {
        const impulseAmount = state.median.expenses * (rng() * 0.1 + 0.05);
        state.median.savings -= impulseAmount;
      }

      // Positive decisions (boost savings rate, etc.)
      if (rng() < state.behavior.savingsDiscipline && monthlyNet > 0) {
        state.median.savings += monthlyNet * (rng() * 0.3 + 0.2);
      }

      // Project next state
      state = state.projectMonth(monthlyNet, 0.05);

      timeline.push({
        month: t,
        income: state.median.income,
        expenses: state.median.expenses,
        savings: state.median.savings,
        runway: state.median.runway,
        healthScore: state.median.healthScore,
        shocks: state.shocks
      });

      // Stop if savings depleted (financial ruin)
      if (state.median.savings <= 0) {
        timeline.push({
          month: t + 1,
          savings: 0,
          runway: 0,
          status: "depleted"
        });
        break;
      }
    }

    return {
      pathId: seed,
      timeline,
      finalSavings: timeline[timeline.length - 1]?.savings || 0,
      finalRunway: timeline[timeline.length - 1]?.runway || 0,
      finalHealthScore: timeline[timeline.length - 1]?.healthScore || 50,
      maxRunway: Math.max(...timeline.map(t => t.runway || 0)),
      survived: state.median.savings > 0
    };
  }

  /**
   * Compute statistical distributions across all futures
   */
  computeStatistics(futures) {
    if (futures.length === 0) {
      return null;
    }

    const stats = {
      iterationCount: futures.length,
      survivalRate: (futures.filter(f => f.survived).length / futures.length) * 100,
      percentiles: {}
    };

    // Extract final state distributions
    const finalSavings = futures.map(f => f.finalSavings).sort((a, b) => a - b);
    const finalRunway = futures.map(f => f.finalRunway).sort((a, b) => a - b);
    const finalHealth = futures.map(f => f.finalHealthScore).sort((a, b) => a - b);

    stats.percentiles.finalSavings = {
      p5: finalSavings[Math.floor(futures.length * 0.05)],
      p25: finalSavings[Math.floor(futures.length * 0.25)],
      p50: finalSavings[Math.floor(futures.length * 0.5)],
      p75: finalSavings[Math.floor(futures.length * 0.75)],
      p95: finalSavings[Math.floor(futures.length * 0.95)],
      mean: finalSavings.reduce((a, b) => a + b, 0) / futures.length,
      stdev: this.standardDeviation(finalSavings)
    };

    stats.percentiles.finalRunway = {
      p5: finalRunway[Math.floor(futures.length * 0.05)],
      p25: finalRunway[Math.floor(futures.length * 0.25)],
      p50: finalRunway[Math.floor(futures.length * 0.5)],
      p75: finalRunway[Math.floor(futures.length * 0.75)],
      p95: finalRunway[Math.floor(futures.length * 0.95)],
      mean: finalRunway.reduce((a, b) => a + b, 0) / futures.length
    };

    stats.percentiles.finalHealth = {
      p5: finalHealth[Math.floor(futures.length * 0.05)],
      p25: finalHealth[Math.floor(futures.length * 0.25)],
      p50: finalHealth[Math.floor(futures.length * 0.5)],
      p75: finalHealth[Math.floor(futures.length * 0.75)],
      p95: finalHealth[Math.floor(futures.length * 0.95)],
      mean: finalHealth.reduce((a, b) => a + b, 0) / futures.length
    };

    // Time-series percentiles for runway
    stats.timeSeriesPercentiles = this.computeTimeSeriesPercentiles(futures);

    return stats;
  }

  /**
   * Compute percentiles over time (for charts)
   */
  computeTimeSeriesPercentiles(futures) {
    const maxLength = Math.max(...futures.map(f => f.timeline.length));
    const series = [];

    for (let t = 0; t < maxLength; t++) {
      const runwaysAtT = futures.map(f => f.timeline[t]?.runway || 0).sort((a, b) => a - b);

      if (runwaysAtT.length > 0) {
        series.push({
          month: t,
          p5: runwaysAtT[Math.floor(runwaysAtT.length * 0.05)],
          p25: runwaysAtT[Math.floor(runwaysAtT.length * 0.25)],
          p50: runwaysAtT[Math.floor(runwaysAtT.length * 0.5)],
          p75: runwaysAtT[Math.floor(runwaysAtT.length * 0.75)],
          p95: runwaysAtT[Math.floor(runwaysAtT.length * 0.95)]
        });
      }
    }

    return series;
  }

  /**
   * Seeded random number generator (for reproducibility)
   */
  seededRandom(seed) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  /**
   * Utility: standard deviation
   */
  standardDeviation(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const sq = arr.map(x => Math.pow(x - mean, 2));
    return Math.sqrt(sq.reduce((a, b) => a + b, 0) / arr.length);
  }

  /**
   * Find futures where a specific goal is achieved
   */
  filterFuturesByGoal(goalCriteria) {
    return this.futures.filter(
      f =>
        f.finalRunway >= goalCriteria.minRunway &&
        f.finalHealthScore >= goalCriteria.minHealth &&
        f.finalSavings >= goalCriteria.minSavings
    );
  }
}

// ============================================================
// BEHAVIOR EVOLUTION ENGINE
// ============================================================

/**
 * Models how user behavior changes over time based on:
 * - Decisions made and their outcomes
 * - Interventions applied
 * - Feedback and awareness
 * - Time horizon (people improve their discipline over time)
 */
class BehaviorEvolutionEngine {
  constructor(initialBehavior = {}) {
    this.history = [
      {
        timestamp: 0,
        behavior: initialBehavior,
        factors: []
      }
    ];

    this.initialBehavior = initialBehavior;
  }

  /**
   * Update behavior based on a life event or decision outcome
   */
  updateBehavior(timestamp, event) {
    const currentBehavior = { ...this.history[this.history.length - 1].behavior };
    const factors = [];

    if (event.type === "positive_outcome") {
      // Good outcome reinforces discipline
      currentBehavior.savingsDiscipline = Math.min(1, currentBehavior.savingsDiscipline + 0.05);
      currentBehavior.decisionQuality = Math.min(1, currentBehavior.decisionQuality + 0.03);
      factors.push("positive_reinforcement");
    } else if (event.type === "negative_outcome") {
      // Bad outcome reduces discipline
      currentBehavior.savingsDiscipline = Math.max(0, currentBehavior.savingsDiscipline - 0.05);
      factors.push("negative_reinforcement");
    }

    if (event.type === "impulse_moment") {
      currentBehavior.impulseProbability = Math.min(1, currentBehavior.impulseProbability + 0.1);
      factors.push("impulse_spike");
    }

    if (event.type === "awareness_moment") {
      // Awareness naturally improves discipline
      currentBehavior.impulseProbability = Math.max(0, currentBehavior.impulseProbability - 0.1);
      currentBehavior.decisionQuality = Math.min(1, currentBehavior.decisionQuality + 0.05);
      factors.push("awareness_increase");
    }

    // Time alone improves behavior (mean reversion toward better discipline)
    currentBehavior.savingsDiscipline = Math.min(1, currentBehavior.savingsDiscipline + 0.01);

    this.history.push({
      timestamp,
      behavior: currentBehavior,
      factors,
      event
    });

    return currentBehavior;
  }

  /**
   * Get behavior at a specific timestamp
   */
  getBehaviorAt(timestamp) {
    let closestRecord = this.history[0];
    for (const record of this.history) {
      if (record.timestamp <= timestamp) {
        closestRecord = record;
      }
    }
    return closestRecord.behavior;
  }

  /**
   * Project future behavior trajectory
   */
  projectBehaviorEvolution(horizon = 12) {
    const projection = [];
    const current = this.history[this.history.length - 1].behavior;

    for (let m = 0; m < horizon; m++) {
      const evolved = { ...current };

      // Natural improvement over time
      evolved.savingsDiscipline = Math.min(1, evolved.savingsDiscipline + 0.02);
      evolved.decisionQuality = Math.min(1, evolved.decisionQuality + 0.015);
      evolved.impulseProbability = Math.max(0, evolved.impulseProbability - 0.01);

      projection.push({
        month: m,
        discipline: evolved.savingsDiscipline,
        impulseControl: 1 - evolved.impulseProbability,
        decisionQuality: evolved.decisionQuality
      });
    }

    return projection;
  }
}

// ============================================================
// DIGITAL TWIN ORCHESTRATOR
// ============================================================

/**
 * Main API: Builds a complete digital twin with all components
 */
export function buildCompleteTwin(assessment = {}, profile = {}, history = {}) {
  const safeAssessment = assessment || {};
  const safeProfile = profile || {};
  const safeHistory = history || {};

  if (!safeAssessment.healthScore) {
    return null;
  }

  // Initialize continuous state
  const initialState = new FinancialState(0, {
    income: safeProfile.monthlyIncome || 0,
    expenses: safeProfile.monthlyExpense || safeProfile.monthlySpending || 0,
    savings: (safeProfile.emergencySavingsFixed || 0) + (safeProfile.emergencySavingsDiscretionary || 0),
    debt: safeProfile.totalDebt || 0,
    runway: safeAssessment.survivalMonthsRaw || 0,
    healthScore: safeAssessment.healthScore || 50,
    savingsRate:
      (safeProfile.monthlyIncome || 1) > 0
        ? (safeProfile.monthlySavings || 0) / (safeProfile.monthlyIncome || 1)
        : 0,
    savingsDiscipline: Math.min(1, (safeAssessment.behavioralTraits?.discipline || 0.3) / 100),
    spendingElasticity: 0.4,
    impulseProbability: Math.max(0, 1 - (safeAssessment.impulseControl || 50) / 100)
  });

  // Initialize behavior evolution
  const behaviorEngine = new BehaviorEvolutionEngine(initialState.behavior);

  // Initialize decision consequence graph
  const consequenceGraph = new DecisionConsequenceGraph(initialState);

  // Generate multiple futures
  const futureGenerator = new MonteCarloFutureGenerator(initialState, 60);
  const futureStatistics = futureGenerator.generateFutures(1000);

  // Export digital twin
  const twin = {
    id: `twin_${Date.now()}`,
    createdAt: new Date().toISOString(),
    userId: safeProfile.userId || "unknown",

    // Core state
    currentState: initialState,
    stateTimeline: [initialState],

    // Components
    behaviorEvolution: behaviorEngine,
    consequenceGraph,
    futureGenerator,

    // Statistics from Monte Carlo
    futureStatistics,

    // Metadata
    metadata: {
      healthScore: safeAssessment.healthScore,
      runway: safeAssessment.survivalMonthsRaw,
      confidence: 0.65, // Increases with more behavioral data
      dataPoints: safeHistory.assessments?.length || 0,
      imprecisionReason:
        (safeHistory.assessments?.length || 0) < 10 ? "Insufficient behavioral history" : "Data rich"
    },

    // Methods to interact with the twin
    methods: {
      /**
       * Simulate a decision and see its consequence path
       */
      simulateDecision: decision => {
        const consequenceId = consequenceGraph.addDecision(null, decision);
        return {
          decisionId: consequenceId,
          consequencePath: consequenceGraph.getConsequencePath(consequenceId),
          projectedOutcome: consequenceGraph.nodes.get(consequenceId).projectedFinalState
        };
      },

      /**
       * Find decisions that achieve a goal
       */
      findPathToGoal: criteria => {
        return consequenceGraph.getPathToState({
          minRunway: criteria.targetRunway || 6,
          minHealth: criteria.targetHealth || 70
        });
      },

      /**
       * Get future scenarios with uncertainty bounds
       */
      getFutureScenarios: () => ({
        median: futureStatistics.percentiles.finalRunway.p50,
        pessimistic: futureStatistics.percentiles.finalRunway.p5,
        optimistic: futureStatistics.percentiles.finalRunway.p95,
        survivalRate: futureStatistics.survivalRate,
        timeSeriesPercentiles: futureStatistics.timeSeriesPercentiles
      }),

      /**
       * Apply a decision and update the twin
       */
      applyDecision: decision => {
        const consequence = initialState.applyDecision(decision);
        behaviorEngine.updateBehavior(Date.now(), {
          type: "decision_applied",
          decision
        });
        return consequence;
      },

      /**
       * Get behavior evolution over time
       */
      getBehaviorProjection: () => behaviorEngine.projectBehaviorEvolution(12),

      /**
       * Stress test the twin
       */
      stressTest: scenarios => {
        const results = [];
        for (const scenario of scenarios) {
          const testState = new FinancialState(0, initialState.median);
          testState.applyShock(scenario);
          results.push({
            scenario: scenario.type,
            survived: testState.median.savings > 0,
            remainingSavings: testState.median.savings,
            runway: testState.median.runway
          });
        }
        return results;
      }
    }
  };

  return twin;
}

/**
 * Export for use in React components
 */
export {
  FinancialState,
  DecisionConsequenceGraph,
  MonteCarloFutureGenerator,
  BehaviorEvolutionEngine
};
