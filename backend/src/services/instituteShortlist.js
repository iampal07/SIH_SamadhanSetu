const db = require("../db");

const SHORTLIST_SIZE = parseInt(process.env.SHORTLIST_SIZE || "10", 10);

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
}

/**
 * Scores every institute by keyword overlap between the complaint
 * (category + translated text) and the institute's declared domains +
 * past project descriptions. This is a cheap, deterministic pre-filter —
 * NOTHING here calls Gemini. We only hand the top N institutes to Gemini
 * afterwards for the final ranked pick + justification.
 */
async function shortlistInstitutes(category, englishText) {
  const { data: institutes, error } = await db.from("institutes").select("*");
  if (error) throw error;

  const queryTokens = new Set([
    ...tokenize(category || ""),
    ...tokenize(englishText || "")
  ]);

  const scored = (institutes || []).map((inst) => {
    const domains = inst.domains || [];
    const pastProjects = inst.past_projects || [];

    const domainTokens = new Set(domains.flatMap(tokenize));
    const projectTokens = new Set(pastProjects.flatMap(tokenize));

    let overlapScore = 0;
    for (const token of queryTokens) {
      if (domainTokens.has(token)) overlapScore += 2; // domain match weighted higher
      if (projectTokens.has(token)) overlapScore += 1;
    }

    // Exact category-in-domains match is a strong direct signal
    if (category && domains.some((d) => d.toLowerCase().includes(category.toLowerCase()))) {
      overlapScore += 5;
    }

    return { ...inst, domains, past_projects: pastProjects, keyword_score: overlapScore };
  });

  // Sort by keyword score first, then by NIRF rank (lower rank number = better,
  // 0/null treated as unranked and sorted last) as a tiebreaker.
  scored.sort((a, b) => {
    if (b.keyword_score !== a.keyword_score) return b.keyword_score - a.keyword_score;
    const rankA = a.nirf_rank || 9999;
    const rankB = b.nirf_rank || 9999;
    return rankA - rankB;
  });

  return scored.slice(0, SHORTLIST_SIZE);
}

module.exports = { shortlistInstitutes };
