const CUSTOMER_FIELD_ALIASES = {
  id: [
    "id",
    "customer_id",
    "customerid",
    "borrower_id",
    "borrowerid",
    "loan_account",
    "loanaccount"
  ],
  name: ["name", "customer_name", "customername", "borrower", "borrower_name", "borrowername"],
  region: ["region", "zone", "branch_region", "branchregion"],
  segment: [
    "segment",
    "customer_segment",
    "customersegment",
    "borrower_segment",
    "borrowersegment"
  ],
  loanType: ["loan_type", "loantype", "product", "product_type", "producttype"],
  loanBalance: [
    "loan_balance",
    "loanbalance",
    "outstanding",
    "outstanding_balance",
    "outstandingbalance",
    "balance"
  ],
  emi: ["emi", "monthly_emi", "monthlyemi", "installment", "instalment"],
  tenureMonths: ["tenure", "tenure_months", "tenuremonths"],
  dpd: ["dpd", "days_past_due", "dayspastdue", "days_overdue", "daysoverdue"],
  creditScore: ["credit_score", "creditscore", "bureau_score", "bureauscore"],
  monthlyIncome: ["monthly_income", "monthlyincome", "income", "salary"],
  monthlyExpenses: ["monthly_expenses", "monthlyexpenses", "expenses"],
  emergencySavings: ["emergency_savings", "emergencysavings", "savings"],
  healthScore: ["health_score", "healthscore", "arth_score", "arthscore"],
  riskLevel: ["risk", "risk_level", "risklevel", "default_risk", "defaultrisk"],
  defaultProbability: ["default_probability", "defaultprobability", "default_prob", "defaultprob"],
  nextBestAction: [
    "next_best_action",
    "nextbestaction",
    "action",
    "recommended_action",
    "recommendedaction"
  ]
};

const RISK_ORDER = ["low", "medium", "high", "critical"];

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buildNormalizedRow(row) {
  return Object.entries(row || {}).reduce((acc, [key, value]) => {
    acc[normalizeKey(key)] = value;
    return acc;
  }, {});
}

function pick(row, aliases, fallback = "") {
  for (const alias of aliases) {
    const value = row[normalizeKey(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
}

function parseNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const cleaned = String(value).replace(/[%₹Rs,\s]/gi, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRiskLevel(value, dpd, defaultProbability) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  const explicit = RISK_ORDER.find(risk => normalized.includes(risk));
  if (explicit) {
    return explicit;
  }
  if (defaultProbability >= 0.5 || dpd >= 60) {
    return "critical";
  }
  if (defaultProbability >= 0.28 || dpd >= 30) {
    return "high";
  }
  if (defaultProbability >= 0.14 || dpd >= 1) {
    return "medium";
  }
  return "low";
}

function deriveDefaultProbability(rowValue, creditScore, dpd) {
  const parsed = parseNumber(rowValue, NaN);
  if (Number.isFinite(parsed)) {
    return parsed > 1 ? clamp(parsed / 100, 0, 1) : clamp(parsed, 0, 1);
  }
  const bureauRisk = clamp((700 - creditScore) / 500, 0, 0.55);
  const delinquencyRisk = clamp(dpd / 100, 0, 0.65);
  return clamp(Number((bureauRisk + delinquencyRisk).toFixed(2)), 0.03, 0.9);
}

function deriveHealthScore(rowValue, creditScore, dpd, monthlyCashflow) {
  const parsed = parseNumber(rowValue, NaN);
  if (Number.isFinite(parsed)) {
    return clamp(Math.round(parsed), 0, 100);
  }
  const bureauScore = clamp((creditScore - 300) / 6, 0, 100);
  const dpdPenalty = clamp(dpd * 0.45, 0, 45);
  const cashflowAdjustment = monthlyCashflow >= 0 ? 6 : -10;
  return clamp(Math.round(bureauScore - dpdPenalty + cashflowAdjustment), 0, 100);
}

function splitDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function detectDelimiter(line) {
  const candidates = [",", "\t", ";"];
  return candidates
    .map(delimiter => ({ delimiter, count: splitDelimitedLine(line, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function parseDelimited(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(line => line.trim());

  if (lines.length < 2) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitDelimitedLine(lines[0], delimiter);

  return lines.slice(1).map(line => {
    const cells = splitDelimitedLine(line, delimiter);
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] || "";
      return row;
    }, {});
  });
}

function normalizeCustomer(row, index) {
  const normalized = buildNormalizedRow(row);
  const id = String(pick(normalized, CUSTOMER_FIELD_ALIASES.id, `IMPORT-${index + 1}`)).trim();
  const name = String(
    pick(normalized, CUSTOMER_FIELD_ALIASES.name, `Imported Customer ${index + 1}`)
  ).trim();
  const loanBalance = parseNumber(pick(normalized, CUSTOMER_FIELD_ALIASES.loanBalance), 0);
  const emi = parseNumber(pick(normalized, CUSTOMER_FIELD_ALIASES.emi), 0);
  const dpd = parseNumber(pick(normalized, CUSTOMER_FIELD_ALIASES.dpd), 0);
  const creditScore = parseNumber(pick(normalized, CUSTOMER_FIELD_ALIASES.creditScore), 650);
  const monthlyIncome = parseNumber(pick(normalized, CUSTOMER_FIELD_ALIASES.monthlyIncome), 0);
  const monthlyExpenses = parseNumber(pick(normalized, CUSTOMER_FIELD_ALIASES.monthlyExpenses), 0);
  const monthlyCashflow = monthlyIncome - monthlyExpenses - emi;
  const defaultProbability = deriveDefaultProbability(
    pick(normalized, CUSTOMER_FIELD_ALIASES.defaultProbability),
    creditScore,
    dpd
  );
  const riskLevel = normalizeRiskLevel(
    pick(normalized, CUSTOMER_FIELD_ALIASES.riskLevel),
    dpd,
    defaultProbability
  );
  const healthScore = deriveHealthScore(
    pick(normalized, CUSTOMER_FIELD_ALIASES.healthScore),
    creditScore,
    dpd,
    monthlyCashflow
  );

  return {
    id,
    name,
    region: String(pick(normalized, CUSTOMER_FIELD_ALIASES.region, "Unassigned")),
    segment: String(pick(normalized, CUSTOMER_FIELD_ALIASES.segment, "Imported")),
    loanType: String(pick(normalized, CUSTOMER_FIELD_ALIASES.loanType, "Loan")),
    loanBalance,
    emi,
    tenureMonths: parseNumber(pick(normalized, CUSTOMER_FIELD_ALIASES.tenureMonths), 0),
    dpd,
    creditScore,
    borrowerSince: "",
    lastActivity: new Date().toISOString(),
    profile: {
      monthlyIncome,
      monthlyExpenses,
      monthlyEMI: emi,
      emergencySavings: parseNumber(pick(normalized, CUSTOMER_FIELD_ALIASES.emergencySavings), 0),
      totalDebt: loanBalance,
      incomeStability: "unknown",
      perceivedSurvivalMonths: 0
    },
    behaviour: {},
    awareness: {},
    habits: {},
    history: {
      paymentHistory: [],
      customerHistory: [{ date: new Date().toISOString().slice(0, 10), dpd }]
    },
    healthScore,
    healthBand: healthScore >= 75 ? "Strong" : healthScore >= 55 ? "Watch" : "At risk",
    survivalMonths: 0,
    monthlyCashflow,
    savingsRate: monthlyIncome > 0 ? monthlyCashflow / monthlyIncome : 0,
    riskScore: Math.round(defaultProbability * 100),
    defaultProbability,
    defaultRiskScore: Math.round(defaultProbability * 100),
    defaultRiskCategory: riskLevel,
    loanHealth: { risk: riskLevel },
    cognitiveBiases: [],
    emotionalTriggers: [],
    forecast: { action: "Review imported borrower profile", generatedAt: new Date().toISOString() },
    nextBestAction:
      String(pick(normalized, CUSTOMER_FIELD_ALIASES.nextBestAction, "")).trim() ||
      (riskLevel === "critical" || riskLevel === "high"
        ? "Prioritize collections outreach"
        : "Continue monthly monitoring"),
    riskLevel,
    status: riskLevel === "critical" || riskLevel === "high" ? "alert" : "monitor",
    trend: dpd > 0 ? "down" : "stable"
  };
}

export async function readEnterpriseCustomerFile(file) {
  if (!file) {
    throw new Error("Select a CSV or Excel customer file.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  let rows = [];

  if (["csv", "tsv", "txt"].includes(extension)) {
    rows = parseDelimited(await file.text());
  } else if (["xlsx", "xls"].includes(extension)) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    rows = firstSheetName
      ? XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: "" })
      : [];
  } else {
    throw new Error("Unsupported file type. Upload .csv, .xlsx, or .xls.");
  }

  const customers = rows
    .filter(row => Object.values(row || {}).some(value => String(value || "").trim()))
    .map(normalizeCustomer);

  if (!customers.length) {
    throw new Error("No customer rows were found in the uploaded file.");
  }
  return customers;
}
