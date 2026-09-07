const db = require("../db");
const { detectAndTranslate } = require("../services/languageService");
const { checkForDuplicate } = require("../services/duplicateDetection");
const { scoreComplaint } = require("../services/criticalityRanking");
const { routeToInstitutes } = require("../services/instituteRouting");

/**
 * A minimal FIFO queue with a single worker loop, running in the same
 * Node process. This is intentionally simple so the project is easy to
 * demo and reason about.
 *
 * For a real production deployment with higher submission volume, swap
 * this for BullMQ + Redis (or Google Cloud Tasks) so jobs survive a
 * server restart and multiple workers can run concurrently — the
 * `processComplaint` function below would plug in unchanged.
 */
const queue = [];
let isProcessing = false;

function enqueueComplaint(complaintId) {
  queue.push(complaintId);
  processNext();
}

async function processNext() {
  if (isProcessing) return;
  if (queue.length === 0) return;

  isProcessing = true;
  const complaintId = queue.shift();

  try {
    await processComplaint(complaintId);
  } catch (err) {
    console.error(`[queue] complaint ${complaintId} failed:`, err.message);
    await db
      .from("complaints")
      .update({ status: "failed", error_message: err.message, updated_at: new Date().toISOString() })
      .eq("id", complaintId);
  } finally {
    isProcessing = false;
    processNext(); // pick up the next job, if any
  }
}

async function getComplaint(complaintId) {
  const { data, error } = await db.from("complaints").select("*").eq("id", complaintId).single();
  if (error) throw error;
  return data;
}

async function setStatus(complaintId, status, extra = {}) {
  const { error } = await db
    .from("complaints")
    .update({ status, ...extra, updated_at: new Date().toISOString() })
    .eq("id", complaintId);
  if (error) throw error;
}

/**
 * The full pipeline for one submission, in order:
 *   1. Language detection + translation to English
 *   2. Geo-clustered duplicate check (Gemini only called within the cluster)
 *   3. If duplicate -> stop here, linked to the original
 *   4. If original -> criticality scoring (severity via Gemini + formula)
 *   5. Institute shortlist (deterministic) -> Gemini top-3 routing
 */
async function processComplaint(complaintId) {
  const complaint = await getComplaint(complaintId);
  if (!complaint) throw new Error("complaint not found");

  // Step 1: language + translation
  await setStatus(complaintId, "translating");
  const lang = await detectAndTranslate(complaint.raw_text);
  await setStatus(complaintId, complaint.status, {
    detected_language: lang.detected_language,
    english_text: lang.english_translation
  });

  const refreshed = await getComplaint(complaintId);

  // Step 2: duplicate check within geo-cluster only
  await setStatus(complaintId, "checking_duplicates");
  const dup = await checkForDuplicate(refreshed);

  if (dup) {
    await setStatus(complaintId, "duplicate", { duplicate_of: dup.originalId });
    return; // stop pipeline here — duplicates don't get their own routing
  }

  // Step 3: criticality scoring
  await setStatus(complaintId, "scoring");
  const scored = await scoreComplaint({
    englishText: refreshed.english_text,
    peopleAffected: refreshed.people_affected,
    duplicateCount: refreshed.duplicate_count
  });

  await setStatus(complaintId, "scoring", {
    category: scored.category,
    severity_score: scored.severity_score,
    severity_reasoning: scored.severity_reasoning,
    criticality_score: scored.criticality_score
  });

  // Step 4: institute shortlist (deterministic) + Gemini top-3 routing
  await setStatus(complaintId, "routing");
  await routeToInstitutes(complaintId, scored.category, refreshed.english_text);

  await setStatus(complaintId, "processed");
}

module.exports = { enqueueComplaint };
