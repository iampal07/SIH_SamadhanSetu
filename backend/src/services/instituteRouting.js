const db = require("../db");
const { callGemini } = require("../geminiClient");
const { shortlistInstitutes } = require("./instituteShortlist");

function buildPrompt(englishText, category, shortlist) {
  const candidates = shortlist.map((inst) => ({
    institute_id: inst.id,
    name: inst.name,
    nirf_rank: inst.nirf_rank,
    domains: inst.domains,
    past_projects: inst.past_projects
  }));

  return `You are an allocation engine routing a citizen complaint to the most relevant higher-education institutes in Jharkhand, India for research/technical assistance.

Complaint category: "${category}"
Complaint (English): "${englishText}"

Candidate institutes (already pre-filtered by keyword overlap):
${JSON.stringify(candidates, null, 2)}

Pick and rank the top 3 (or fewer, if fewer make sense) candidates best suited to this complaint.

Return ONLY a valid JSON object with this exact shape (no markdown formatting, no backticks):
{"rankings": [{"institute_id": Number, "rank": Number (1 = best), "score": Number (0-1), "reasoning": "one short sentence"}]}`;
}

function mockRoutingResult(shortlist) {
  return {
    rankings: shortlist.slice(0, 3).map((inst, i) => ({
      institute_id: inst.id,
      rank: i + 1,
      score: Math.max(0.1, 0.9 - i * 0.2),
      reasoning: "[mock] top keyword-overlap match"
    }))
  };
}

async function routeToInstitutes(complaintId, category, englishText) {
  const shortlist = await shortlistInstitutes(category, englishText);
  if (shortlist.length === 0) return [];

  const result = await callGemini(buildPrompt(englishText, category, shortlist), {
    mockResponse: mockRoutingResult(shortlist)
  });

  const rows = result.rankings.map((r) => ({
    complaint_id: complaintId,
    institute_id: r.institute_id,
    rank: r.rank,
    match_score: r.score,
    reasoning: r.reasoning
  }));

  const { error } = await db.from("institute_matches").insert(rows);
  if (error) throw error;

  return result.rankings;
}

module.exports = { routeToInstitutes };
