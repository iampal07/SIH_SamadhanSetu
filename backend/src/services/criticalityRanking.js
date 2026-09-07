const { callGemini } = require("../geminiClient");

const CATEGORIES = [
  "education", "healthcare", "agriculture", "water resources", "sanitation",
  "environment", "energy", "urban development", "accessibility",
  "rural livelihoods", "public administration", "civil infrastructure"
];

const W_PEOPLE = parseFloat(process.env.WEIGHT_PEOPLE_AFFECTED || "0.45");
const W_SEVERITY = parseFloat(process.env.WEIGHT_SEVERITY || "0.35");
const W_DUPLICATE = parseFloat(process.env.WEIGHT_DUPLICATE_COUNT || "0.20");

function buildPrompt(englishText, peopleAffected) {
  return `You are triaging a citizen complaint submitted to a government innovation portal in Jharkhand, India. Assess how severe/urgent the underlying issue sounds from the text alone.

Complaint: "${englishText}"
People Affected (Provided by user): ${peopleAffected}

Extract the severity on a scale of 1-10 based on the description, but do NOT estimate the population size; rely strictly on the provided people_affected value to understand the scale, though your score should reflect the qualitative severity.
Pick exactly one category from this list: ${CATEGORIES.join(", ")}.

Return ONLY a valid JSON object with this exact shape (no markdown formatting, no backticks):
{"severity_score": Number (1-10), "category": "one of the listed categories", "reasoning": "one short sentence"}`;
}

function mockSeverityResult(text) {
  const urgentWords = ["no water", "collapsed", "flooding", "outbreak", "unsafe", "contaminated", "no electricity"];
  const isUrgent = urgentWords.some((w) => text.toLowerCase().includes(w));
  return {
    severity_score: isUrgent ? 8 : 4,
    category: "public administration",
    reasoning: isUrgent ? "[mock] urgent keywords detected" : "[mock] no urgent keywords found"
  };
}

function normalizePeopleAffected(peopleAffected) {
  const capped = Math.max(0, peopleAffected || 0);
  return Math.min(1, Math.log10(capped + 1) / 5);
}

function normalizeDuplicateCount(duplicateCount) {
  return Math.min(1, (duplicateCount || 0) / 5); 
}

async function scoreComplaint({ englishText, peopleAffected, duplicateCount }) {
  const severity = await callGemini(buildPrompt(englishText, peopleAffected), {
    mockResponse: mockSeverityResult(englishText)
  });

  const peopleNorm = normalizePeopleAffected(peopleAffected);
  const severityNorm = Math.min(1, Math.max(0, severity.severity_score / 10));
  const duplicateNorm = normalizeDuplicateCount(duplicateCount);

  const criticalityScore =
    (W_PEOPLE * peopleNorm + W_SEVERITY * severityNorm + W_DUPLICATE * duplicateNorm) * 100;

  return {
    severity_score: severity.severity_score,
    severity_reasoning: severity.reasoning,
    category: severity.category,
    criticality_score: Math.round(criticalityScore * 100) / 100
  };
}

module.exports = { scoreComplaint, CATEGORIES };