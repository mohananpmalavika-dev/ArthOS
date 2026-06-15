/**
 * Salary Roast Generator
 * Creates shareable, viral financial reports with personality & humor
 * Designed to drive engagement and word-of-mouth growth
 */
import { normalizeScore } from "../lib/scoring-v2.js";

export function generateSalaryRoast(assessmentResult, profile) {
  if (!assessmentResult || !profile) {
    return null;
  }

  const {
    healthScore: rawHealthScore,
    behaviourScore,
    awarenessScore,
    stabilityScore,
    personalityType,
    survivalMonthsRaw,
    futureRiskLabel,
    categoryBand
  } = assessmentResult;

  const healthScore = normalizeScore(rawHealthScore);

  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || 0;
  const savingsRate =
    monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  // Generate roast commentary based on personality & scores
  const roastLines = generateRoastCommentary(
    personalityType,
    healthScore,
    savingsRate,
    survivalMonthsRaw
  );

  // Comparison stats - with more emotionally engaging messaging
  const percentileScore = Math.round((healthScore / 100) * 100);
  const nationalAverage = 55; // fictional baseline
  const comparisonVsAverage = percentileScore - nationalAverage;

  // Headline - hook for sharing (enhanced for virality)
  const headline = generateHeadlineViral(healthScore, personalityType, monthlyIncome);

  // Badges/Achievements
  const badges = generateBadges(healthScore, savingsRate, survivalMonthsRaw, behaviourScore);

  // Shareable stats
  const stats = [
    { label: "Financial Health Score", value: Math.round(healthScore), unit: "/100" },
    { label: "Survival Window", value: Math.round(survivalMonthsRaw * 10) / 10, unit: " months" },
    { label: "Savings Rate", value: Math.round(savingsRate), unit: "%" },
    {
      label: "vs National Average",
      value: comparisonVsAverage >= 0 ? `+${comparisonVsAverage}` : comparisonVsAverage,
      unit: " points"
    },
    { label: "Risk Level", value: futureRiskLabel, unit: "" }
  ];

  // Generate shareable text - enhanced for virality
  const shareText = generateShareTextViral(
    headline,
    Math.round(healthScore),
    personalityType,
    monthlyIncome,
    survivalMonthsRaw
  );

  return {
    title: "Your Financial Roast 🔥",
    headline,
    personalityType,
    scorePercentile: percentileScore,
    comparisonVsAverage,
    roastCommentary: roastLines,
    badges,
    stats,
    shareText,
    shareLink: generateShareLink(healthScore, personalityType),
    timestamp: new Date().toISOString()
  };
}

function generateHeadline(score, personality, income) {
  const band = score >= 75 ? "Killer" : score >= 50 ? "Mid" : "Risky";
  const incomeDesc =
    income >= 100000 ? "High-Earner" : income >= 50000 ? "Solid-Income" : "Just-Getting-By";

  const templates = [
    `I'm a ${band} ${personality} with ₹${Math.round(income / 1000)}K monthly income`,
    `${band} Financial Health: My ₹${Math.round(income / 1000)}K salary tells a story`,
    `My Financial Roast: ${personality} earning ₹${Math.round(income / 1000)}K/month`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * VIRAL-ENHANCED headline with stronger emotional hooks & urgency
 * Optimized for social sharing and click-through
 */
function generateHeadlineViral(score, personality, income) {
  const emoji = score >= 75 ? "🚀" : score >= 50 ? "⚡" : "🔥";
  const sentiment = score >= 75 ? "Crushing It" : score >= 50 ? "Getting By" : "In Trouble";

  const templates = [
    `${emoji} I took the Financial Roast. My ${personality} score: ${Math.round(score)}/100. (Ouch.)`,
    `${emoji} Honest Assessment: I earn ₹${Math.round(income / 1000)}K/month but my finances are ${sentiment.toLowerCase()}`,
    `${emoji} Just discovered my financial personality is ${personality}. The roast? Brutal. Accurate. Eye-opening.`,
    `${emoji} My ${personality} financial DNA decoded: Score ${Math.round(score)}/100. I'm not prepared for what I learned.`,
    `${emoji} "Your survival window is X months" — This Financial Roast just changed my life.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateRoastCommentary(personality, score, savingsRate, survivalMonths) {
  const lines = [];

  // Personality-specific roasts
  const personalityRoasts = {
    Builder: [
      "You're disciplined AF. Your emergency fund probably has an emergency fund.",
      "Your spreadsheets have spreadsheets. This is love.",
      "You'd rather cut off your own arm than miss a savings goal."
    ],
    Survivor: [
      "You've mastered the art of playing it safe. Maybe too safe.",
      "Your risk appetite: 0. Your peace of mind: 100.",
      "Caution is your middle name. Opportunity cost is your hidden shadow."
    ],
    Optimizer: [
      "You track everything. You probably know your CPP (Cost Per Purchase).",
      "Analysis paralysis meets financial discipline. It's oddly beautiful.",
      "You crunch numbers so hard, Excel probably sends you friend requests."
    ],
    Dreamer: [
      "Your vision is huge. Your buffer is... well, let's talk.",
      "You dream big. The numbers dream bigger (about your shortfall).",
      "Grand plans + tight cashflow = recipe for character growth."
    ],
    "Risk Taker": [
      "You're fast-paced. Sometimes *too* fast-paced.",
      "Your runway is shorter than your attention span.",
      "You move fast and break things (including financial plans)."
    ]
  };

  const roasts = personalityRoasts[personality] || personalityRoasts.Survivor;
  lines.push(roasts[Math.floor(Math.random() * roasts.length)]);

  // Score-based roasts
  if (score >= 75) {
    lines.push("Your finances? Chef's kiss. 💋");
  } else if (score >= 50) {
    lines.push("You're on the right track. Keep pushing.");
  } else {
    lines.push("Buckle up. This runway is short.");
  }

  // Savings rate roast
  if (savingsRate > 30) {
    lines.push(`Saving ${Math.round(savingsRate)}% is serious business. Respect.`);
  } else if (savingsRate > 10) {
    lines.push(`${Math.round(savingsRate)}% savings rate. Not bad, not great.`);
  } else {
    lines.push(`${Math.round(savingsRate)}% savings rate. Let's fix this.`);
  }

  // Survival window roast
  if (survivalMonths >= 6) {
    lines.push(`${Math.round(survivalMonths)} months of runway. You're protected.`);
  } else if (survivalMonths >= 2) {
    lines.push(`${Math.round(survivalMonths)} months of buffer. One emergency away from panic.`);
  } else {
    lines.push(`${Math.round(survivalMonths)} days of buffer. This needs immediate action.`);
  }

  return lines;
}

function generateBadges(score, savingsRate, survivalMonths, behaviourScore) {
  const badges = [];

  if (score >= 75) {
    badges.push({ icon: "⭐", label: "Financial Star", color: "gold" });
  }
  if (savingsRate > 25) {
    badges.push({ icon: "💰", label: "Super Saver", color: "green" });
  }
  if (survivalMonths >= 6) {
    badges.push({ icon: "🛡️", label: "Well Protected", color: "blue" });
  }
  if (behaviourScore >= 35) {
    badges.push({ icon: "🎯", label: "Disciplined", color: "purple" });
  }

  if (badges.length === 0) {
    badges.push({ icon: "🚀", label: "On a Journey", color: "orange" });
  }

  return badges;
}

function generateShareText(headline, score, personality, income) {
  const templates = [
    `Just got my Financial Roast 🔥 ${headline} #ArthOS #FinancialHealth`,
    `My financial health score: ${score}/100. I'm a ${personality}. What about you? #ArthOS`,
    `Found out I earn ₹${Math.round(income / 1000)}K/month but my finances say... 🤷 #FinancialRoast #ArthOS`,
    `${headline}. Want yours? Try ARTH.OS 👇 #FinancialWellness`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * VIRAL-ENHANCED share text with stronger CTAs & emotional resonance
 * Optimized for WhatsApp, Twitter, LinkedIn
 */
function generateShareTextViral(headline, score, personality, income, survivalMonths) {
  const emoji = score >= 75 ? "🚀" : score >= 50 ? "⚡" : "🔥";
  const urgency =
    survivalMonths < 3
      ? "(This is urgent)"
      : survivalMonths < 6
        ? "(Wake-up call)"
        : "(Solid foundation)";

  const templates = [
    `${emoji} Just got my Financial Roast and it's BRUTAL. Score: ${score}/100. I'm a ${personality}. ${urgency} What's yours? #ArthOS`,
    `My ₹${Math.round(income / 1000)}K salary. My financial reality: Score ${score}/100. This honestly changed how I see my money. #FinancialRoast`,
    `${emoji} "Your survival window is ${Math.round(survivalMonths)} months" — This roast just became my wake-up call. #ArthOS #FinancialHealth`,
    `I'm a ${personality} with a ${score}/100 score. Not gonna lie, this financial roast hit different. Take yours → #ArthOS #MoneyMatters`,
    `Financial Roast dropped: ${score}/100. I'm ${score >= 75 ? "CRUSHING IT 🚀" : score >= 50 ? "getting by ⚡" : "in trouble 🔥"}. This is eye-opening.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateShareLink(score, personality) {
  // Generate a short link that encodes key metrics (browser-safe)
  const payload = JSON.stringify({
    score: Math.round(score),
    personality
  });

  // Browser-safe base64 encoder that preserves Unicode
  function base64EncodeUnicode(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      // Fallback: use global Buffer if available (node/electron)
      if (typeof Buffer !== "undefined") {
        return Buffer.from(str).toString("base64");
      }
      throw e;
    }
  }

  const encoded = base64EncodeUnicode(payload).substring(0, 8);
  return `https://arth-os.dev/roast/${encoded}`;
}

/**
 * Generate comparison report (vs friends, vs average, vs categories)
 */
export function generateComparisonReport(userScore, userPersonality) {
  const fakeData = {
    nationalAverage: 55,
    nationalByPersonality: {
      Builder: 68,
      Survivor: 52,
      Optimizer: 61,
      Dreamer: 48,
      "Risk Taker": 45
    },
    percentile: Math.min(99, Math.max(1, Math.round((userScore / 100) * 99)))
  };

  const personalityAvg =
    fakeData.nationalByPersonality[userPersonality] || fakeData.nationalAverage;
  const vs_personality = userScore - personalityAvg;

  return {
    userScore: Math.round(userScore),
    nationalAverage: fakeData.nationalAverage,
    personalityAverage: personalityAvg,
    percentile: fakeData.percentile,
    vs_national: userScore - fakeData.nationalAverage,
    vs_personality: vs_personality,
    message:
      vs_personality > 10
        ? `You're crushing it compared to other ${userPersonality}s!`
        : vs_personality > 0
          ? `You're slightly ahead of other ${userPersonality}s.`
          : vs_personality > -10
            ? `You're close to other ${userPersonality}s.`
            : `Time to level up against other ${userPersonality}s.`
  };
}

/**
 * Generate Instagram-style stat card text
 */
export function generateInstagramCaption(score, personality, income, survivalMonths) {
  const captions = [
    `My financial health: ${Math.round(score)}/100. I'm a ${personality}. What's yours? 🔥 #FinancialHealth #ArthOS`,
    `Just discovered I can survive ${Math.round(survivalMonths)} months without income. Eye-opening. 👀 #FinancialReality`,
    `Earning ₹${Math.round(income / 1000)}K but my finances feel... complicated. Let's fix this. #FinancialJourney`,
    `Took my financial roast. It was brutal. It was honest. It was needed. 🔥 #ArthOS`
  ];

  return captions[Math.floor(Math.random() * captions.length)];
}
