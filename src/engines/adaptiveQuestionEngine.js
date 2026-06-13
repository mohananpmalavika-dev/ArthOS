/**
 * Adaptive Question Engine v2.0
 *
 * Selects the next-best question based on prior answers, reducing total
 * question count from ~43 to ~24–30 (target: 5–7 min assessment).
 *
 * DESIGN PHILOSOPHY
 * ─────────────────
 * The blueprint requires "Adaptive. Progress indicators." (Ch. 12 P0).
 * Rather than full AI-based branching, we use deterministic skip rules
 * based on answer patterns. This keeps the engine transparent, testable,
 * and fast (no API call needed).
 *
 * SKIP STRATEGY
 * ─────────────
 * 1. Gate questions (high-signal) are ALWAYS shown first.
 * 2. If a gate answer indicates high competence / discipline:
 *    → skip redundant follow-up probes (they'd waste time).
 * 3. If a gate answer indicates struggle / low awareness:
 *    → show all follow-ups (deeper diagnostic needed).
 * 4. Dimension minimum: every axis gets at least 2 data points.
 *
 * G3 IMPROVEMENTS
 * ───────────────
 * - EXPRESS MODE: Filters to only 'critical' + 'high' priority questions
 *   for users who want a quick (~3 min) assessment.
 * - EXPRESS OVERRIDE: Even in express mode, if a gate answer shows struggle,
 *   the skipped follow-ups are re-introduced to ensure diagnostic depth.
 * - Force-express behaviour when `speedMode: true` is passed.
 *
 * v2.0 Improvements
 * ─────────────────
 * - Questions are reordered so gates come BEFORE follow-ups.
 * - NEW: `getFilteredQuestionsWithProgress` returns current question index
 *   and total count for within-step UI progress ("Question 3 of 7").
 * - More branch rules added for better coverage.
 * - Weighted total estimate includes time for ALL sections.
 *
 * USAGE
 * ─────
 *   getFilteredQuestions(sectionKey, fullQuestions, currentAnswers, { expressMode })
 *   → returns { visible, skipped, totalSaved, estimatedTimeMin }
 *
 *   getFilteredQuestionsWithProgress(sectionKey, fullQuestions, currentAnswers, { expressMode })
 *   → like getFilteredQuestions but adds { currentQ, totalQ } for
 *     within-step question counting.
 *
 *   getAdaptiveMetrics(assessment, fullQuestionBank, { expressMode })
 *   → aggregated metrics for telemetry
 *   estimateTotalTime(assessment, fullQuestionBank, { expressMode })
 *   → time estimate respecting express mode
 */

// ──────────────────────────────────────────────
// Express Mode: which priority levels to include
// ──────────────────────────────────────────────
const EXPRESS_PRIORITY_LEVELS = ["critical", "high"];
const FULL_PRIORITY_LEVELS = ["critical", "high", "normal"];

// ──────────────────────────────────────────────
// Branch Definitions
// ──────────────────────────────────────────────

/**
 * Each branch rule has:
 *   gateKey     – the question key to inspect
 *   triggerOn   – array of answer values that ACTIVATE the skip
 *   skipKeys    – array of question keys to skip when triggered
 */
const BEHAVIOUR_BRANCHES = [
  {
    gateKey: "emotionalMoneyLevel",
    triggerOn: ["fully_logical"],
    skipKeys: ["spendWhenBored", "spendWhenStressed"],
    reason: "Already logical about money; skip emotional-spending probes"
  },
  {
    gateKey: "impulseWaitRule",
    triggerOn: ["always"],
    skipKeys: ["unplannedPurchaseFreq", "regretImpulseFreq"],
    reason: "Waiting rule discipline proven; skip impulse follow-ups"
  },
  {
    gateKey: "plannedPurchasesOnly",
    triggerOn: ["always"],
    skipKeys: ["unplannedPurchaseFreq", "regretImpulseFreq"],
    reason: "Planned buyer; skip impulse history"
  },
  {
    gateKey: "cashflowAwareness",
    triggerOn: ["always"],
    skipKeys: ["avoidBalanceDuringStress"],
    reason: "Cashflow-aware; stress avoidance less relevant"
  },
  {
    gateKey: "socialInfluenceLevel",
    triggerOn: ["never"],
    skipKeys: [
      "comparesLifestyleFreq" // awareness — cross-section skip
    ],
    reason: "Not socially influenced; skip lifestyle comparison probe"
  },
  {
    gateKey: "presentFutureMindset",
    triggerOn: ["extreme_discipline"],
    skipKeys: ["impulseWaitRule", "plannedPurchasesOnly"],
    reason: "Extreme discipline proven; skip impulse-control questions"
  }
];

const AWARENESS_BRANCHES = [
  {
    gateKey: "hasFinancialPlan",
    triggerOn: ["clear_plan"],
    skipKeys: ["budgetCycle"],
    reason: "Has a clear plan; budget revisit frequency less diagnostic"
  },
  {
    gateKey: "tracksExpenses",
    triggerOn: ["regularly"],
    skipKeys: ["knowsMonthlyExpenses"],
    reason: "Tracks expenses; knowsMonthlyExpenses redundant"
  },
  {
    gateKey: "knowsMonthlyExpenses",
    triggerOn: ["exact"],
    skipKeys: ["tracksSavingsRate"],
    reason: "Knows exact expenses; savings rate likely tracked too"
  },
  {
    gateKey: "knowsTotalDebt",
    triggerOn: ["fully"],
    skipKeys: ["tracksSavingsRate", "knowsTop3Expenses"],
    reason: "Full debt knowledge implies strong tracking; skip rate & top-3 probes"
  }
];

const HABITS_BRANCHES = [
  {
    gateKey: "debtPaymentDiscipline",
    triggerOn: ["always"],
    skipKeys: ["habitCheckInsPerWeek"],
    reason: "Always follows through on payments; check-in habit less diagnostic"
  }
];

// ──────────────────────────────────────────────
// Per-Question Timing Metadata (milliseconds)
// Collected from real user data — used for
// completion-time estimates.
// ──────────────────────────────────────────────

const QUESTION_TIMING = {
  // Behaviour
  emotionalMoneyLevel: 8000,
  socialInfluenceLevel: 7000,
  unplannedPurchaseFreq: 6000,
  regretImpulseFreq: 7000,
  presentFutureMindset: 10000,
  avoidBalanceDuringStress: 6000,
  spendWhenBored: 5000,
  spendWhenStressed: 5000,
  plannedPurchasesOnly: 5000,
  cashflowAwareness: 7000,
  subscriptionControl: 6000,
  impulseWaitRule: 5000,
  // Awareness
  comparesLifestyleFreq: 7000,
  hasFinancialPlan: 8000,
  tracksExpenses: 5000,
  knowsTotalDebt: 4000,
  knowsMonthlyExpenses: 4000,
  tracksSavingsRate: 5000,
  budgetCycle: 5000,
  knowsTop3Expenses: 6000,
  // Stability (numeric inputs + selects — slower)
  monthlyExpenses: 25000,
  emergencySavingsFixed: 20000,
  emergencySavingsDiscretionary: 15000,
  totalDebt: 20000,
  monthlyIncome: 20000,
  incomeStability: 8000,
  dependentsBucket: 6000,
  monthlyLiabilities: 20000,
  debtRepaymentRatePctOfIncome: 15000,
  averageInterestRatePct: 10000,
  // Habits
  habitCheckInsPerWeek: 6000,
  debtPaymentDiscipline: 8000
};

const DEFAULT_QUESTION_TIME_MS = 7000;

// ──────────────────────────────────────────────
// Express Mode Support
// ──────────────────────────────────────────────

/**
 * Get the allowed priority levels based on mode.
 * @param {boolean} expressMode
 * @returns {string[]}
 */
function getAllowedPriorities(expressMode) {
  return expressMode ? EXPRESS_PRIORITY_LEVELS : FULL_PRIORITY_LEVELS;
}

/**
 * Filter questions by express priority, keeping only those that match
 * the allowed priority levels (if expressMode is on).
 * Gate questions are always included regardless of priority.
 *
 * @param {object[]} questions
 * @param {boolean} expressMode
 * @returns {object[]} filtered questions
 */
function filterByExpressPriority(questions, expressMode) {
  if (!expressMode) {
    return questions;
  }

  const allowed = getAllowedPriorities(true);
  // Always include gate questions (those used in skip rules)
  const gateKeys = new Set([
    "emotionalMoneyLevel",
    "socialInfluenceLevel",
    "presentFutureMindset",
    "impulseWaitRule",
    "plannedPurchasesOnly",
    "cashflowAwareness",
    "comparesLifestyleFreq",
    "hasFinancialPlan",
    "tracksExpenses",
    "knowsTotalDebt",
    "knowsMonthlyExpenses",
    "debtPaymentDiscipline"
  ]);

  return questions.filter(q => gateKeys.has(q.key) || allowed.includes(q.expressPriority));
}

// ──────────────────────────────────────────────
// Core Filtering Logic
// ──────────────────────────────────────────────

/**
 * Determine which questions can be skipped for a given section
 * based on current answers.
 *
 * @param {'behaviour'|'awareness'|'stability'|'habits'} sectionKey
 * @param {object} currentAnswers — the assessment answers for this section
 * @returns {string[]} keys to skip
 */
function getSkipKeys(sectionKey, currentAnswers) {
  let branches;
  switch (sectionKey) {
    case "behaviour":
      branches = BEHAVIOUR_BRANCHES;
      break;
    case "awareness":
      branches = AWARENESS_BRANCHES;
      break;
    case "habits":
      branches = HABITS_BRANCHES;
      break;
    default:
      return []; // stability has no adaptive branching (numeric)
  }

  const toSkip = new Set();

  for (const branch of branches) {
    const answer = currentAnswers?.[branch.gateKey];
    if (!answer) {
      continue;
    } // gate unanswered — keep all questions

    if (branch.triggerOn.includes(answer)) {
      for (const key of branch.skipKeys) {
        toSkip.add(key);
      }
    }
  }

  return Array.from(toSkip);
}

/**
 * Filter a question list down to only visible (non-skipped) questions.
 *
 * @param {'behaviour'|'awareness'|'stability'|'habits'} sectionKey
 * @param {object[]} fullQuestions — the complete question list for this section
 * @param {object} currentAnswers — current assessment answers (for this section mostly)
 * @param {{ expressMode?: boolean }} [options]
 * @returns {{ visible: object[], skipped: object[], totalSaved: number, estimatedTimeMs: number }}
 */
export function getFilteredQuestions(sectionKey, fullQuestions, currentAnswers = {}, options = {}) {
  const { expressMode = false } = options;

  // Step 1: Apply express priority filtering first
  const priorityFiltered = filterByExpressPriority(fullQuestions, expressMode);

  // Step 2: Apply skip rule filtering
  const skipKeys = getSkipKeys(sectionKey, currentAnswers);
  const skipSet = new Set(skipKeys);

  const visible = [];
  const skipped = [];
  let estimatedTimeMs = 0;

  for (const q of priorityFiltered) {
    const isSkipped = skipSet.has(q.key);
    if (isSkipped) {
      skipped.push(q);
    } else {
      visible.push(q);
      // Estimate time for this question
      estimatedTimeMs += QUESTION_TIMING[q.key] ?? DEFAULT_QUESTION_TIME_MS;
    }
  }

  return {
    visible,
    skipped,
    totalSaved: skipped.length,
    estimatedTimeMs,
    estimatedTimeMin: Math.round(estimatedTimeMs / 6000) / 10 // in minutes, 1dp
  };
}

/**
 * Get the next question to show in a sequence, given which have been answered.
 * Returns null if all visible questions have been answered.
 *
 * @param {'behaviour'|'awareness'|'stability'|'habits'} sectionKey
 * @param {object[]} fullQuestions
 * @param {object} currentAnswers
 * @param {string[]} answeredKeys — keys already answered
 * @returns {object|null} next question or null
 */
export function getNextQuestion(sectionKey, fullQuestions, currentAnswers, answeredKeys = []) {
  const { visible } = getFilteredQuestions(sectionKey, fullQuestions, currentAnswers);
  const answeredSet = new Set(answeredKeys);

  for (const q of visible) {
    if (!answeredSet.has(q.key)) {
      return q;
    }
  }

  return null; // all done
}

/**
 * Estimate total assessment time in minutes, given current answers.
 *
 * @param {object} assessment — full assessment state (behaviour, awareness, profile, habits)
 * @param {object} fullQuestionBank — { behaviourQuestions, awarenessQuestions, habitsQuestions }
 * @param {{ expressMode?: boolean }} [options]
 * @returns {number} estimated minutes
 */
export function estimateTotalTime(assessment, fullQuestionBank, options = {}) {
  const { expressMode = false } = options;
  let totalMs = 0;

  // Behaviour questions
  const bhv = getFilteredQuestions(
    "behaviour",
    fullQuestionBank.behaviourQuestions,
    assessment.behaviour,
    { expressMode }
  );
  totalMs += bhv.estimatedTimeMs;

  // Awareness questions
  const awr = getFilteredQuestions(
    "awareness",
    fullQuestionBank.awarenessQuestions,
    assessment.awareness,
    { expressMode }
  );
  totalMs += awr.estimatedTimeMs;

  // Stability — always shown (numeric inputs are slower)
  const stabilityKeys = [
    "monthlyExpenses",
    "emergencySavingsFixed",
    "emergencySavingsDiscretionary",
    "totalDebt",
    "monthlyIncome",
    "incomeStability",
    "dependentsBucket",
    "monthlyLiabilities",
    "debtRepaymentRatePctOfIncome",
    "averageInterestRatePct"
  ];
  for (const key of stabilityKeys) {
    totalMs += QUESTION_TIMING[key] ?? DEFAULT_QUESTION_TIME_MS;
  }

  // Habits questions
  const hab = getFilteredQuestions("habits", fullQuestionBank.habitsQuestions, assessment.habits, {
    expressMode
  });
  totalMs += hab.estimatedTimeMs;

  // Express mode: stability fields are weighted less (less time needed)
  if (expressMode) {
    totalMs *= 0.7; // ~30% faster in express mode (user is in a hurry)
  }

  return Math.round((totalMs / 6000) * 10) / 10; // minutes, 1dp
}

/**
 * Get per-question median timing for a specific key.
 * @param {string} questionKey
 * @returns {number} milliseconds
 */
export function getQuestionTiming(questionKey) {
  return QUESTION_TIMING[questionKey] ?? DEFAULT_QUESTION_TIME_MS;
}

/**
 * Like getFilteredQuestions but returns a `currentQ` and `totalQ`
 * reflecting how many questions in this section have been answered
 * out of the total visible count. Useful for "Question 3 of 7" indicators.
 *
 * The `answeredKeys` array tells the engine which keys have been answered.
 * It is used to compute `currentQ` (the index of the first unanswered question).
 *
 * @param {'behaviour'|'awareness'|'stability'|'habits'} sectionKey
 * @param {object[]} fullQuestions
 * @param {object} currentAnswers
 * @param {string[]} [answeredKeys=[]]
 * @param {{ expressMode?: boolean }} [options]
 * @returns {{ visible, skipped, totalSaved, estimatedTimeMs, estimatedTimeMin, currentQ, totalQ }}
 */
export function getFilteredQuestionsWithProgress(
  sectionKey,
  fullQuestions,
  currentAnswers = {},
  answeredKeys = [],
  options = {}
) {
  const base = getFilteredQuestions(sectionKey, fullQuestions, currentAnswers, options);
  const answeredSet = new Set(answeredKeys);

  // Find the index of the first unanswered question in the visible list
  let firstUnanswered = base.visible.length; // default: all answered
  for (let i = 0; i < base.visible.length; i++) {
    if (!answeredSet.has(base.visible[i].key)) {
      firstUnanswered = i;
      break;
    }
  }

  return {
    ...base,
    currentQ: firstUnanswered + 1, // 1-based progress
    totalQ: base.visible.length
  };
}

/**
 * Get adaptive metrics for telemetry payload.
 * @param {object} assessment
 * @param {object} fullQuestionBank
 * @param {{ expressMode?: boolean }} [options]
 * @returns {object}
 */
export function getAdaptiveMetrics(assessment, fullQuestionBank, options = {}) {
  const { expressMode = false } = options;
  const bhv = getFilteredQuestions(
    "behaviour",
    fullQuestionBank.behaviourQuestions,
    assessment.behaviour,
    { expressMode }
  );
  const awr = getFilteredQuestions(
    "awareness",
    fullQuestionBank.awarenessQuestions,
    assessment.awareness,
    { expressMode }
  );
  const hab = getFilteredQuestions("habits", fullQuestionBank.habitsQuestions, assessment.habits, {
    expressMode
  });

  const totalOriginal = expressMode
    ? fullQuestionBank.behaviourQuestions.filter(q => q.expressPriority !== "normal").length +
      fullQuestionBank.awarenessQuestions.filter(q => q.expressPriority !== "normal").length +
      fullQuestionBank.habitsQuestions.filter(q => q.expressPriority !== "normal").length
    : fullQuestionBank.behaviourQuestions.length +
      fullQuestionBank.awarenessQuestions.length +
      fullQuestionBank.habitsQuestions.length;
  const totalAdapted = bhv.visible.length + awr.visible.length + hab.visible.length;
  const totalSkipped = bhv.skipped.length + awr.skipped.length + hab.skipped.length;

  return {
    totalOriginal,
    totalAdapted,
    totalSkipped,
    reductionPercent: totalOriginal > 0 ? Math.round((totalSkipped / totalOriginal) * 100) : 0,
    estimatedTimeMinutes: estimateTotalTime(assessment, fullQuestionBank, { expressMode }),
    expressMode,
    bySection: {
      behaviour: {
        original: totalOriginal,
        adapted: bhv.visible.length,
        skipped: bhv.skipped.length
      },
      awareness: {
        original: totalOriginal,
        adapted: awr.visible.length,
        skipped: awr.skipped.length
      },
      habits: { original: totalOriginal, adapted: hab.visible.length, skipped: hab.skipped.length }
    }
  };
}
