import jwt from "jsonwebtoken";
import { calculateFinancialHealthV2 } from "../src/lib/scoring-v2.js";
import { buildRiskProfile } from "./services/cognitionEngine.js";
import { detectBiases } from "../src/engines/biasEngine.js";
import { detectTriggers } from "../src/engines/emotionalTriggerEngine.js";
import { opportunityForecast } from "../src/engines/opportunityForecastEngine.js";
import { calculateDefaultProbability } from "../src/engines/mlDefaultPredictionEngine.js";
import { calculateLoanHealth } from "./services/loanHealthEngine.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

const generatedReports = new Map();

const ENTERPRISE_CUSTOMERS = [
  {
    id: "BRW-1007",
    name: "Sarah Chen",
    mobile: "9876501007",
    loanNumber: "LN-1007",
    region: "Northwest",
    segment: "Salaried prime",
    loanType: "Personal Loan",
    loanBalance: 640000,
    emi: 18200,
    tenureMonths: 36,
    dpd: 42,
    creditScore: 618,
    salaryDelay: 4,
    salaryStability: "unstable",
    stressLevel: 86,
    loanShopping: true,
    gamblingExpense: false,
    borrowerSince: "2023-02-15",
    lastActivity: "2026-06-26T08:40:00.000Z",
    profile: {
      monthlyIncome: 78000,
      monthlyExpenses: 64500,
      monthlyEMI: 18200,
      emergencySavings: 12000,
      totalDebt: 720000,
      incomeStability: "unstable",
      perceivedSurvivalMonths: 2,
    },
    behaviour: {
      impulsiveSpending: "sometimes",
      expenseTracking: "rarely",
      debtComfort: "high",
      score: 18,
    },
    awareness: {
      knowsMonthlyExpenses: "roughly",
      emergencyFundClarity: "low",
      debtAwareness: "partial",
    },
    habits: {
      savingsFrequency: "irregular",
      reviewCadence: "monthly",
    },
    history: {
      paymentHistory: [
        { date: "2026-01-05", status: "paid" },
        { date: "2026-02-05", status: "late" },
        { date: "2026-03-05", status: "paid" },
        { date: "2026-04-05", status: "late" },
        { date: "2026-05-05", status: "missed" },
        { date: "2026-06-05", status: "late" },
      ],
      customerHistory: [
        { date: "2026-01-01", dpd: 0 },
        { date: "2026-03-01", dpd: 12 },
        { date: "2026-06-01", dpd: 42 },
      ],
    },
  },
  {
    id: "BRW-1044",
    name: "Amit Rao",
    mobile: "9876501044",
    loanNumber: "LN-1044",
    region: "South",
    segment: "Small business",
    loanType: "Business Loan",
    loanBalance: 1380000,
    emi: 42100,
    tenureMonths: 48,
    dpd: 18,
    creditScore: 676,
    salaryDelay: 1,
    salaryStability: "variable",
    stressLevel: 66,
    loanShopping: true,
    gamblingExpense: false,
    borrowerSince: "2022-11-20",
    lastActivity: "2026-06-25T12:05:00.000Z",
    profile: {
      monthlyIncome: 142000,
      monthlyExpenses: 103000,
      monthlyEMI: 42100,
      emergencySavings: 98000,
      totalDebt: 1510000,
      incomeStability: "variable",
      perceivedSurvivalMonths: 3,
    },
    behaviour: {
      impulsiveSpending: "rarely",
      expenseTracking: "sometimes",
      debtComfort: "medium",
      score: 26,
    },
    awareness: {
      knowsMonthlyExpenses: "yes",
      emergencyFundClarity: "medium",
      debtAwareness: "yes",
    },
    habits: {
      savingsFrequency: "monthly",
      reviewCadence: "weekly",
    },
    history: {
      paymentHistory: [
        { date: "2026-01-10", status: "paid" },
        { date: "2026-02-10", status: "paid" },
        { date: "2026-03-10", status: "late" },
        { date: "2026-04-10", status: "paid" },
        { date: "2026-05-10", status: "late" },
        { date: "2026-06-10", status: "paid" },
      ],
      customerHistory: [
        { date: "2026-01-01", dpd: 0 },
        { date: "2026-03-01", dpd: 8 },
        { date: "2026-06-01", dpd: 18 },
      ],
    },
  },
  {
    id: "BRW-1120",
    name: "Priya Menon",
    mobile: "9876501120",
    loanNumber: "LN-1120",
    region: "West",
    segment: "Salaried affluent",
    loanType: "Mortgage",
    loanBalance: 4260000,
    emi: 64800,
    tenureMonths: 180,
    dpd: 0,
    creditScore: 748,
    salaryDelay: 0,
    salaryStability: "stable",
    stressLevel: 24,
    loanShopping: false,
    gamblingExpense: false,
    borrowerSince: "2021-08-05",
    lastActivity: "2026-06-26T06:10:00.000Z",
    profile: {
      monthlyIncome: 265000,
      monthlyExpenses: 154000,
      monthlyEMI: 64800,
      emergencySavings: 820000,
      totalDebt: 4260000,
      incomeStability: "stable",
      perceivedSurvivalMonths: 6,
    },
    behaviour: {
      impulsiveSpending: "rarely",
      expenseTracking: "always",
      debtComfort: "low",
      score: 37,
    },
    awareness: {
      knowsMonthlyExpenses: "yes",
      emergencyFundClarity: "high",
      debtAwareness: "yes",
    },
    habits: {
      savingsFrequency: "monthly",
      reviewCadence: "weekly",
    },
    history: {
      paymentHistory: [
        { date: "2026-01-05", status: "paid" },
        { date: "2026-02-05", status: "paid" },
        { date: "2026-03-05", status: "paid" },
        { date: "2026-04-05", status: "paid" },
        { date: "2026-05-05", status: "paid" },
        { date: "2026-06-05", status: "paid" },
      ],
      customerHistory: [
        { date: "2026-01-01", dpd: 0 },
        { date: "2026-03-01", dpd: 0 },
        { date: "2026-06-01", dpd: 0 },
      ],
    },
  },
  {
    id: "BRW-1199",
    name: "Daniel Brooks",
    mobile: "9876501199",
    loanNumber: "LN-1199",
    region: "Central",
    segment: "Gig worker",
    loanType: "Micro Loan",
    loanBalance: 86000,
    emi: 7200,
    tenureMonths: 18,
    dpd: 67,
    creditScore: 582,
    salaryDelay: 7,
    salaryStability: "unstable",
    stressLevel: 91,
    loanShopping: true,
    gamblingExpense: true,
    borrowerSince: "2024-06-12",
    lastActivity: "2026-06-24T18:35:00.000Z",
    profile: {
      monthlyIncome: 42000,
      monthlyExpenses: 38800,
      monthlyEMI: 7200,
      emergencySavings: 2500,
      totalDebt: 142000,
      incomeStability: "unstable",
      perceivedSurvivalMonths: 1,
    },
    behaviour: {
      impulsiveSpending: "often",
      expenseTracking: "no",
      debtComfort: "high",
      score: 11,
    },
    awareness: {
      knowsMonthlyExpenses: "no",
      emergencyFundClarity: "low",
      debtAwareness: "partial",
    },
    habits: {
      savingsFrequency: "rarely",
      reviewCadence: "never",
    },
    history: {
      paymentHistory: [
        { date: "2026-01-15", status: "late" },
        { date: "2026-02-15", status: "paid" },
        { date: "2026-03-15", status: "late" },
        { date: "2026-04-15", status: "missed" },
        { date: "2026-05-15", status: "missed" },
        { date: "2026-06-15", status: "late" },
      ],
      customerHistory: [
        { date: "2026-01-01", dpd: 8 },
        { date: "2026-03-01", dpd: 30 },
        { date: "2026-06-01", dpd: 67 },
      ],
    },
  },
  {
    id: "BRW-1261",
    name: "Neha Kapoor",
    mobile: "9876501261",
    loanNumber: "LN-1261",
    region: "North",
    segment: "Young professional",
    loanType: "Education Loan",
    loanBalance: 520000,
    emi: 12800,
    tenureMonths: 60,
    dpd: 0,
    creditScore: 705,
    salaryDelay: 0,
    salaryStability: "stable",
    stressLevel: 38,
    loanShopping: false,
    gamblingExpense: false,
    borrowerSince: "2023-09-30",
    lastActivity: "2026-06-25T19:30:00.000Z",
    profile: {
      monthlyIncome: 98000,
      monthlyExpenses: 66500,
      monthlyEMI: 12800,
      emergencySavings: 174000,
      totalDebt: 520000,
      incomeStability: "stable",
      perceivedSurvivalMonths: 4,
    },
    behaviour: {
      impulsiveSpending: "sometimes",
      expenseTracking: "usually",
      debtComfort: "medium",
      score: 31,
    },
    awareness: {
      knowsMonthlyExpenses: "yes",
      emergencyFundClarity: "medium",
      debtAwareness: "yes",
    },
    habits: {
      savingsFrequency: "monthly",
      reviewCadence: "monthly",
    },
    history: {
      paymentHistory: [
        { date: "2026-01-05", status: "paid" },
        { date: "2026-02-05", status: "paid" },
        { date: "2026-03-05", status: "paid" },
        { date: "2026-04-05", status: "paid" },
        { date: "2026-05-05", status: "paid" },
        { date: "2026-06-05", status: "paid" },
      ],
      customerHistory: [
        { date: "2026-01-01", dpd: 0 },
        { date: "2026-03-01", dpd: 0 },
        { date: "2026-06-01", dpd: 0 },
      ],
    },
  },
];

function getPathname(req) {
  const original = req.headers["x-vercel-original-url"] || req.headers["x-now-original-url"] || req.url || "";
  return new URL(original, "http://localhost").pathname;
}

function requireEnterprise(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token && process.env.NODE_ENV !== "production") {
    return {
      id: "enterprise:demo",
      email: "loan.officer@arthos.demo",
      institution: { id: "demo-nbfc", name: "ARTH.OS Demo NBFC", type: "nbfc" },
    };
  }

  if (!token) {
    res.status(401).json({ error: "Enterprise access token required" });
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: "Invalid enterprise access token" });
    return null;
  }
}

function toAssessment(customer) {
  return {
    profile: customer.profile,
    behaviour: customer.behaviour,
    awareness: customer.awareness,
    habits: customer.habits,
  };
}

function riskLevelFrom(defaultRisk, loanHealth) {
  if (defaultRisk.probability >= 0.5 || customerRiskName(loanHealth.risk) === "critical") return "critical";
  if (defaultRisk.probability >= 0.28 || loanHealth.risk === "High") return "high";
  if (defaultRisk.probability >= 0.14 || loanHealth.risk === "Medium") return "medium";
  return "low";
}

function customerRiskName(value) {
  return String(value || "").toLowerCase();
}

function trendFromCustomer(customer) {
  const history = customer.history?.customerHistory || [];
  if (history.length < 2) return "stable";
  const first = history[0]?.dpd || 0;
  const last = history[history.length - 1]?.dpd || 0;
  if (last > first + 10) return "down";
  if (last < first - 5) return "up";
  return "stable";
}

function normalizeCustomer(customer) {
  const assessment = toAssessment(customer);
  const health = calculateFinancialHealthV2(assessment);
  const riskProfile = buildRiskProfile(
    { ...assessment.profile, ...assessment.behaviour, ...assessment.awareness },
    { scope: `enterprise:${customer.id}` }
  );
  const defaultRisk = calculateDefaultProbability(
    {
      creditScore: customer.creditScore,
      loanBalance: customer.loanBalance,
      dpd: customer.dpd,
      emi: customer.emi,
      monthlyIncome: customer.profile.monthlyIncome,
      salaryDelay: customer.salaryDelay,
      salaryStability: customer.salaryStability,
      stressLevel: customer.stressLevel,
      loanShopping: customer.loanShopping,
      gamblingExpense: customer.gamblingExpense,
    },
    customer.history
  );
  const loanHealth = calculateLoanHealth({
    salaryDelay: customer.salaryDelay,
    gamblingExpense: customer.gamblingExpense,
    emergencySavings: customer.profile.emergencySavings,
    emi: customer.emi,
    stressLevel: customer.stressLevel,
    loanShopping: customer.loanShopping,
  });
  const biases = detectBiases({ ...assessment.profile, ...assessment.behaviour, ...assessment.awareness });
  const triggers = detectTriggers({ ...assessment.profile, ...assessment.behaviour });
  const forecast = opportunityForecast(assessment.profile);
  const riskLevel = riskLevelFrom(defaultRisk, loanHealth);

  return {
    id: customer.id,
    name: customer.name,
    mobile: customer.mobile,
    loanNumber: customer.loanNumber || customer.id,
    region: customer.region,
    segment: customer.segment,
    loanType: customer.loanType,
    loanBalance: customer.loanBalance,
    emi: customer.emi,
    tenureMonths: customer.tenureMonths,
    dpd: customer.dpd,
    creditScore: customer.creditScore,
    borrowerSince: customer.borrowerSince,
    lastActivity: customer.lastActivity,
    profile: customer.profile,
    behaviour: customer.behaviour,
    awareness: customer.awareness,
    habits: customer.habits,
    history: customer.history,
    healthScore: health.healthScore,
    healthBand: health.categoryBand?.label || "Unrated",
    survivalMonths: health.survivalMonthsRaw,
    monthlyCashflow: health.monthlyCashflow,
    savingsRate: health.savingsRate,
    riskScore: riskProfile.riskScore,
    riskCalibration: riskProfile.profile?.riskCalibration || null,
    defaultProbability: defaultRisk.probability,
    defaultRiskScore: defaultRisk.riskScore,
    defaultRiskCategory: defaultRisk.riskCategory,
    defaultExplanation: defaultRisk.explanation,
    loanHealth,
    cognitiveBiases: biases,
    emotionalTriggers: triggers,
    forecast: {
      action: forecast.action,
      benefit: forecast.benefit,
      generatedAt: forecast.generatedAt,
    },
    nextBestAction:
      loanHealth.riskFactors?.[0]?.recommendedAction ||
      defaultRisk.explanation?.topReasons?.[0]?.recommendedAction ||
      health.recommendedActionText ||
      "Continue monthly monitoring",
    riskLevel,
    status: riskLevel === "critical" || riskLevel === "high" ? "alert" : "monitor",
    trend: trendFromCustomer(customer),
  };
}

function getCustomers() {
  return ENTERPRISE_CUSTOMERS.map(normalizeCustomer);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildPortfolio(customers) {
  const totalOutstanding = customers.reduce((sum, item) => sum + item.loanBalance, 0);
  const highRiskCustomers = customers.filter((item) => ["critical", "high"].includes(item.riskLevel));
  const par30 = customers.filter((item) => item.dpd > 30);
  const avgHealth = Math.round(customers.reduce((sum, item) => sum + item.healthScore, 0) / customers.length);
  const avgDefaultRisk =
    customers.reduce((sum, item) => sum + item.defaultProbability, 0) / Math.max(customers.length, 1);
  const revenueAtRisk = highRiskCustomers.reduce((sum, item) => sum + item.loanBalance, 0);

  const distribution = [
    { label: "Low risk", value: customers.filter((item) => item.riskLevel === "low").length, color: "#22c55e" },
    { label: "Medium", value: customers.filter((item) => item.riskLevel === "medium").length, color: "#eab308" },
    { label: "High", value: customers.filter((item) => item.riskLevel === "high").length, color: "#f97316" },
    { label: "Critical", value: customers.filter((item) => item.riskLevel === "critical").length, color: "#ef4444" },
  ].map((row) => ({
    ...row,
    percent: Math.round((row.value / customers.length) * 100),
  }));

  return {
    asOf: new Date().toISOString(),
    metrics: [
      { label: "Active borrowers", value: customers.length.toLocaleString("en-IN"), change: "+4.8% vs last month", tone: "positive" },
      { label: "Outstanding book", value: `Rs ${(totalOutstanding / 10000000).toFixed(2)} Cr`, change: "+2.1% portfolio growth", tone: "positive" },
      { label: "Avg ARTH health", value: String(avgHealth), change: `${Math.round(avgDefaultRisk * 100)}% avg default probability`, tone: avgDefaultRisk > 0.25 ? "negative" : "positive" },
      { label: "High-risk accounts", value: String(highRiskCustomers.length), change: `Rs ${(revenueAtRisk / 100000).toFixed(1)}L exposure`, tone: highRiskCustomers.length > 0 ? "negative" : "positive" },
      { label: "PAR 30+", value: `${Math.round((par30.length / customers.length) * 100)}%`, change: `${par30.length} accounts over 30 DPD`, tone: par30.length > 0 ? "negative" : "positive" },
    ],
    distribution,
    topRiskCustomers: customers
      .slice()
      .sort((a, b) => b.defaultProbability - a.defaultProbability)
      .slice(0, 4),
    recommendedActions: highRiskCustomers.slice(0, 3).map((customer) => ({
      id: customer.id,
      customerName: customer.name,
      action: customer.nextBestAction,
      riskLevel: customer.riskLevel,
    })),
  };
}

function buildAlerts(customers) {
  const alerts = [];
  for (const customer of customers) {
    if (customer.defaultProbability >= 0.45) {
      alerts.push({
        id: `default-${customer.id}`,
        customerId: customer.id,
        title: "Default probability spike",
        description: `${customer.name} is at ${Math.round(customer.defaultProbability * 100)}% default probability with ${customer.dpd} DPD.`,
        severity: customer.defaultProbability >= 0.6 ? "critical" : "warning",
        time: customer.lastActivity,
        action: customer.nextBestAction,
      });
    }

    for (const factor of customer.loanHealth.riskFactors || []) {
      alerts.push({
        id: `${factor.factor}-${customer.id}`,
        customerId: customer.id,
        title: factor.label,
        description: `${customer.name}: ${factor.description}.`,
        severity: factor.impact >= 25 ? "critical" : "warning",
        time: customer.lastActivity,
        action: factor.recommendedAction,
      });
    }
  }

  return alerts
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8)
    .map((alert) => ({ ...alert, timeLabel: formatDate(alert.time) }));
}

function buildAnalytics(customers) {
  const healthTrend = [
    { label: "Jan", value: 64 },
    { label: "Feb", value: 67 },
    { label: "Mar", value: 65 },
    { label: "Apr", value: 71 },
    { label: "May", value: 74 },
    { label: "Jun", value: Math.round(customers.reduce((sum, item) => sum + item.healthScore, 0) / customers.length / 10) },
  ];

  const churnRisk =
    customers.filter((item) => item.riskLevel === "critical" || item.dpd > 45).length / customers.length;
  const revenueAtRisk = customers
    .filter((item) => ["critical", "high"].includes(item.riskLevel))
    .reduce((sum, item) => sum + item.loanBalance, 0);

  return {
    metrics: [
      { title: "Churn Risk", value: `${Math.round(churnRisk * 100)}%`, detail: "Borrowers requiring retention or restructure outreach" },
      { title: "Revenue at Risk", value: `Rs ${(revenueAtRisk / 1000000).toFixed(1)}M`, detail: "Outstanding balance in high-risk segments" },
      { title: "Portfolio Growth", value: "+8.9%", detail: "Growth vs prior quarter" },
      { title: "Customer Engagement", value: "78%", detail: "Accounts with fresh behavioral signals" },
    ],
    healthTrend,
    segmentMix: Object.values(
      customers.reduce((acc, customer) => {
        acc[customer.segment] ||= { label: customer.segment, count: 0, exposure: 0 };
        acc[customer.segment].count += 1;
        acc[customer.segment].exposure += customer.loanBalance;
        return acc;
      }, {})
    ),
  };
}

function buildCompliance() {
  const reports = [
    {
      id: "rpt-monthly-2026-06",
      type: "monthly",
      name: "Monthly Portfolio Risk Review",
      date: "2026-06-26",
      size: "1.8 MB",
      status: "completed",
      regulations: ["RBI", "Fair Lending"],
      downloadUrl: "/api/enterprise/compliance/reports/rpt-monthly-2026-06/status",
    },
    {
      id: "rpt-quarterly-2026-q2",
      type: "quarterly",
      name: "Q2 Borrower Behavior Controls",
      date: "2026-06-25",
      size: "2.4 MB",
      status: "completed",
      regulations: ["RBI", "ISO 27001"],
      downloadUrl: "/api/enterprise/compliance/reports/rpt-quarterly-2026-q2/status",
    },
    ...Array.from(generatedReports.values()),
  ];

  return {
    metrics: [
      { regulation: "RBI Digital Lending", score: 96, status: "compliant", lastAudit: "2026-06-25" },
      { regulation: "Data Minimization", score: 92, status: "compliant", lastAudit: "2026-06-24" },
      { regulation: "Model Governance", score: 88, status: "review", lastAudit: "2026-06-22" },
      { regulation: "Access Controls", score: 94, status: "compliant", lastAudit: "2026-06-21" },
    ],
    reports,
    auditTrail: [
      { id: "aud-1", action: "Enterprise risk dashboard opened", actor: "loan.officer@arthos.demo", timestamp: "2026-06-26 09:12", status: "success" },
      { id: "aud-2", action: "Borrower risk report generated", actor: "risk.ops@arthos.demo", timestamp: "2026-06-26 08:44", status: "success" },
      { id: "aud-3", action: "Critical DPD alert acknowledged", actor: "collections@arthos.demo", timestamp: "2026-06-25 17:05", status: "warning" },
    ],
  };
}

function sendJson(res, payload) {
  return res.status(200).json(payload);
}

export default async function enterpriseDataHandler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-Id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const principal = requireEnterprise(req, res);
  if (!principal) return;

  const pathname = getPathname(req);
  const customers = getCustomers();
  const compliance = buildCompliance();

  if (req.method === "GET" && pathname === "/api/enterprise/portfolio") {
    return sendJson(res, buildPortfolio(customers));
  }

  if (req.method === "GET" && pathname === "/api/enterprise/customers") {
    const search = String(req.query?.q || "").toLowerCase().trim();
    const risk = String(req.query?.risk || "all").toLowerCase();
    const items = customers.filter((customer) => {
      const matchesSearch =
        !search ||
        customer.name.toLowerCase().includes(search) ||
        customer.id.toLowerCase().includes(search) ||
        customer.segment.toLowerCase().includes(search);
      const matchesRisk = risk === "all" || customer.riskLevel === risk;
      return matchesSearch && matchesRisk;
    });

    return sendJson(res, { items, total: items.length, asOf: new Date().toISOString() });
  }

  const customerMatch = /^\/api\/enterprise\/customers\/([^/]+)$/.exec(pathname);
  if (req.method === "GET" && customerMatch) {
    const customer = customers.find((item) => item.id === decodeURIComponent(customerMatch[1]));
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    return sendJson(res, customer);
  }

  if (req.method === "GET" && pathname === "/api/enterprise/risk-alerts") {
    return sendJson(res, { items: buildAlerts(customers), asOf: new Date().toISOString() });
  }

  if (req.method === "GET" && pathname === "/api/enterprise/analytics") {
    return sendJson(res, buildAnalytics(customers));
  }

  if (req.method === "GET" && pathname === "/api/enterprise/settings") {
    return sendJson(res, {
      institution: principal.institution || { id: "demo-nbfc", name: "ARTH.OS Demo NBFC", type: "nbfc" },
      apiKeys: [
        { id: "key-live-primary", label: "Primary lending API", lastUsed: "2026-06-26 08:58", status: "active" },
        { id: "key-risk-worker", label: "Risk batch worker", lastUsed: "2026-06-25 22:10", status: "active" },
      ],
      webhooks: [
        { id: "wh-risk", url: "https://bank.example/hooks/risk", events: ["risk.critical", "report.ready"], status: "healthy" },
      ],
      roles: [
        { role: "enterprise_admin", members: 3 },
        { role: "risk_analyst", members: 9 },
        { role: "collections_ops", members: 14 },
      ],
    });
  }

  if (req.method === "GET" && pathname === "/api/enterprise/compliance/metrics") {
    return sendJson(res, { items: compliance.metrics });
  }

  if (req.method === "GET" && pathname === "/api/enterprise/compliance/reports") {
    const type = String(req.query?.type || "all");
    const items = type === "all" ? compliance.reports : compliance.reports.filter((item) => item.type === type);
    return sendJson(res, { items });
  }

  if (req.method === "GET" && pathname === "/api/enterprise/compliance/audit-trail") {
    const limit = Math.max(1, Math.min(Number(req.query?.limit || 20), 100));
    return sendJson(res, { items: compliance.auditTrail.slice(0, limit) });
  }

  if (req.method === "POST" && pathname === "/api/enterprise/compliance/reports/generate") {
    const type = req.body?.type || "monthly";
    const id = `rpt-${type}-${Date.now()}`;
    const report = {
      id,
      reportId: id,
      type,
      name: `${String(type).charAt(0).toUpperCase()}${String(type).slice(1)} Enterprise Report`,
      date: new Date().toISOString().slice(0, 10),
      size: "Processing",
      status: "completed",
      regulations: ["RBI", "Model Governance"],
      downloadUrl: `/api/enterprise/compliance/reports/${id}/status`,
    };
    generatedReports.set(id, report);
    return res.status(201).json({ reportId: id, status: "completed", report });
  }

  const statusMatch = /^\/api\/enterprise\/compliance\/reports\/([^/]+)\/status$/.exec(pathname);
  if (req.method === "GET" && statusMatch) {
    const reportId = decodeURIComponent(statusMatch[1]);
    const report =
      compliance.reports.find((item) => item.id === reportId || item.reportId === reportId) ||
      generatedReports.get(reportId);
    if (!report) return res.status(404).json({ error: "Report not found" });
    return sendJson(res, {
      reportId,
      status: report.status,
      downloadUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(`${report.name}\nGenerated by ARTH.OS Enterprise`)}`,
    });
  }

  const emailMatch = /^\/api\/enterprise\/compliance\/reports\/([^/]+)\/email$/.exec(pathname);
  if (req.method === "POST" && emailMatch) {
    if (!req.body?.email) return res.status(400).json({ error: "Email is required" });
    return sendJson(res, {
      reportId: decodeURIComponent(emailMatch[1]),
      email: req.body.email,
      status: "queued",
    });
  }

  return res.status(404).json({ error: "Enterprise endpoint not found" });
}
