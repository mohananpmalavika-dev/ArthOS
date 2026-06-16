// api/saveAssessment.js
// Serverless handler to persist assessment submissions to Supabase or local PostgreSQL
// Now associates assessments with authenticated users via JWT token
// Includes runtime validation of assessment and result payloads with versioning

import { insertIntoTable } from "./dbClient.js";
import { extractUserFromRequest } from "./auth/jwt.js";
import {
  validateAssessmentSubmission,
  logValidationFailure
} from "./payloadValidator.js";

const TABLE_NAME = process.env.SUPABASE_ASSESSMENTS_TABLE || "assessments";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const payload = req.body;
    if (!payload || !payload.assessment || !payload.result) {
      return res.status(400).json({ error: "Incomplete payload" });
    }

    // Validate assessment and result payloads
    const validation = validateAssessmentSubmission(payload.assessment, payload.result);
    if (!validation.valid) {
      logValidationFailure('saveAssessment', payload, validation);
      return res.status(400).json({
        error: "Invalid assessment payload",
        details: validation.errors,
        schemas: validation.schemas
      });
    }

    // Extract authenticated user from JWT token
    const user = await extractUserFromRequest(req);
    console.log("[SaveAssessment] Authenticated user:", user?.id || "anonymous");

    // Log the incoming payload for debugging (avoid in production if PII concerns)
    console.log("[SaveAssessment] received payload keys:", Object.keys(payload));
    try {
      console.log("[SaveAssessment] participant:", payload.assessment?.participant ?? null);
    } catch (e) {
      // ignore logging errors
    }

    // Extract flattened behaviour answers
    const behaviour = payload.assessment?.behaviour || {};
    // Extract flattened awareness answers
    const awareness = payload.assessment?.awareness || {};
    // Extract flattened habits answers
    const habits = payload.assessment?.habits || {};
    // Extract financial profile
    const profile = payload.assessment?.profile || {};

    const assessmentRecord = {
      assessment: payload.assessment,
      result: payload.result,
      schema_version: validation.schemas.assessment,
      result_schema_version: validation.schemas.result,
      user_id: user?.id || null,  // Associate with authenticated user
      participant_name: payload.assessment.participant?.name || null,
      participant_age: payload.assessment.participant?.age || null,
      participant_email: payload.assessment.participant?.email || null,
      created_at: new Date().toISOString(),

      // Flattened behaviour columns
      behaviour_emotionalMoneyLevel: behaviour.emotionalMoneyLevel || null,
      behaviour_socialInfluenceLevel: behaviour.socialInfluenceLevel || null,
      behaviour_unplannedPurchaseFreq: behaviour.unplannedPurchaseFreq || null,
      behaviour_regretImpulseFreq: behaviour.regretImpulseFreq || null,
      behaviour_presentFutureMindset: behaviour.presentFutureMindset || null,
      behaviour_avoidBalanceDuringStress: behaviour.avoidBalanceDuringStress || null,
      behaviour_spendWhenBored: behaviour.spendWhenBored || null,
      behaviour_spendWhenStressed: behaviour.spendWhenStressed || null,
      behaviour_plannedPurchasesOnly: behaviour.plannedPurchasesOnly || null,
      behaviour_cashflowAwareness: behaviour.cashflowAwareness || null,
      behaviour_subscriptionControl: behaviour.subscriptionControl || null,
      behaviour_impulseWaitRule: behaviour.impulseWaitRule || null,

      // Flattened awareness columns
      awareness_comparesLifestyleFreq: awareness.comparesLifestyleFreq || null,
      awareness_hasFinancialPlan: awareness.hasFinancialPlan || null,
      awareness_tracksExpenses: awareness.tracksExpenses || null,
      awareness_knowsTotalDebt: awareness.knowsTotalDebt || null,
      awareness_knowsMonthlyExpenses: awareness.knowsMonthlyExpenses || null,
      awareness_tracksSavingsRate: awareness.tracksSavingsRate || null,
      awareness_budgetCycle: awareness.budgetCycle || null,
      awareness_knowsTop3Expenses: awareness.knowsTop3Expenses || null,

      // Flattened habits columns
      habits_habitCheckInsPerWeek: habits.habitCheckInsPerWeek || null,
      habits_debtPaymentDiscipline: habits.debtPaymentDiscipline || null,

      // Flattened profile columns
      profile_monthlyExpenses: profile.monthlyExpenses ? Number(profile.monthlyExpenses) : null,
      profile_monthlyIncome: profile.monthlyIncome ? Number(profile.monthlyIncome) : null,
      profile_totalDebt: profile.totalDebt ? Number(profile.totalDebt) : null,
      profile_emergencySavingsFixed: profile.emergencySavingsFixed ? Number(profile.emergencySavingsFixed) : null,
      profile_emergencySavingsDiscretionary: profile.emergencySavingsDiscretionary ? Number(profile.emergencySavingsDiscretionary) : null,
      profile_monthlyLiabilities: profile.monthlyLiabilities ? Number(profile.monthlyLiabilities) : null,
      profile_incomeStability: profile.incomeStability || null,
      profile_dependentsBucket: profile.dependentsBucket || null,
      profile_debtRepaymentRatePctOfIncome: profile.debtRepaymentRatePctOfIncome ? Number(profile.debtRepaymentRatePctOfIncome) : null,
      profile_averageInterestRatePct: profile.averageInterestRatePct ? Number(profile.averageInterestRatePct) : null,
    };

    const { error } = await insertIntoTable(TABLE_NAME, assessmentRecord);
    if (error) {
      console.error("[SaveAssessment] DB insert error:", error.message || error);
      return res.status(500).json({ status: "error", reason: "db_insert_failed" });
    }

    return res.status(200).json({ status: "saved" });
  } catch (error) {
    // If no database is configured, gracefully return success
    if (error?.message?.includes("No database configuration")) {
      console.log("[SaveAssessment] No database - assessment data logged locally");
      return res.status(200).json({ status: "logged", message: "Assessment received" });
    }

    console.error("[SaveAssessment] handler error:", error?.message || error);
    return res.status(500).json({ status: "error", reason: "internal_error" });
  }
}
