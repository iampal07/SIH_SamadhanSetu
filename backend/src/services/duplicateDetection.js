const db = require("../db");
const { callGemini } = require("../geminiClient");
const { findNearbyComplaints } = require("./geoClustering");

const RADIUS_KM = parseFloat(process.env.DUPLICATE_RADIUS_KM || "0.5");

function buildPrompt(textA, textB) {
  return `You are checking whether two citizen-submitted civic complaints from Jharkhand, India describe the SAME underlying issue.

Complaint A: "${textA}"
Complaint B: "${textB}"

They may be worded very differently, be in different languages/dialects, or mention different level of detail — focus on whether they describe the same underlying problem at the same place, not on exact wording.

Return ONLY a JSON object with this exact shape:
{"is_duplicate": true or false, "confidence": a number from 0 to 1, "reasoning": "one short sentence"}`;
}

function mockDuplicateResult(textA, textB) {
  // Naive mock heuristic just for local testing without an API key:
  // flags as duplicate if they share several significant words.
  const wordsA = new Set(textA.toLowerCase().split(/\W+/).filter((w) => w.length > 4));
  const wordsB = new Set(textB.toLowerCase().split(/\W+/).filter((w) => w.length > 4));
  const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
  const is_duplicate = overlap >= 2;
  return {
    is_duplicate,
    confidence: is_duplicate ? 0.8 : 0.2,
    reasoning: is_duplicate
      ? "[mock] shared keywords suggest same issue"
      : "[mock] not enough overlap to call it a duplicate"
  };
}

/**
 * Checks a new complaint against nearby existing complaints (already
 * geo-filtered — this function never runs against the whole database).
 * Returns the id of the original complaint if a confident duplicate is
 * found, otherwise null.
 */
async function checkForDuplicate(complaint) {
  const nearby = await findNearbyComplaints(
    complaint.latitude,
    complaint.longitude,
    RADIUS_KM,
    complaint.id
  );

  if (nearby.length === 0) return null;

  const textToCompare = complaint.english_text || complaint.raw_text;

  for (const candidate of nearby) {
    const candidateText = candidate.english_text || candidate.raw_text;

    const result = await callGemini(buildPrompt(textToCompare, candidateText), {
      mockResponse: mockDuplicateResult(textToCompare, candidateText)
    });

    if (result.is_duplicate && result.confidence >= 0.7) {
      // Found a confident match — bump the original's duplicate_count
      // (this feeds directly into its criticality score later).
      const { error } = await db
        .from("complaints")
        .update({
          duplicate_count: (candidate.duplicate_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", candidate.id);
      if (error) throw error;

      return { originalId: candidate.id, reasoning: result.reasoning, confidence: result.confidence };
    }
  }

  return null;
}

module.exports = { checkForDuplicate };
