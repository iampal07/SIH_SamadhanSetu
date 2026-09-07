# Jharkhand Societal Innovation Portal — Backend

A working prototype backend for the four AI-assisted tasks: criticality ranking,
duplicate detection, multilingual handling, and institute routing — built around
a single Gemini API integration plus deterministic backend logic around it.

> **Note:** the `integration` / `feature/supabase-auth-and-portals` branches
> also contain this same pipeline ported to a Supabase Edge Function
> (`supabase/functions/ai-analyze`), so the platform doesn't need a second
> Node process running. This standalone Express server is kept here as an
> alternative if you need it to run independently of Supabase Edge Functions —
> reconcile with whoever owns those branches before running both against the
> same tables.

## Architecture

```
POST /complaints
      │
      ▼
 [in-process job queue]  ──► processComplaint(id)
      │
      ├─ 1. languageService.js       → Gemini: detect language + translate to English
      │
      ├─ 2. geoClustering.js         → pure math, NO Gemini call: finds nearby
      │      duplicateDetection.js   → complaints within radius, then Gemini only
      │                                 compares text within that geo-cluster
      │      (if duplicate found → stop here, linked to original)
      │
      ├─ 3. criticalityRanking.js    → Gemini: severity score (0-10) + category
      │                                 combined with your own weighted formula
      │                                 using people_affected (never LLM-guessed)
      │                                 and duplicate_count
      │
      └─ 4. instituteShortlist.js    → pure keyword/domain match, NO Gemini call:
             instituteRouting.js       narrows ~all institutes down to top ~10
                                        → Gemini picks + justifies final top 3
```

The point of this split: Gemini is only ever called with a *small, pre-filtered*
amount of context (one geo-cluster, or ~10 shortlisted institutes) — never the
whole database. That keeps cost and latency predictable as the portal scales.

## Setup

Persistence is Supabase (Postgres). Run `data/schema.sql` once in your
Supabase project's SQL editor (creates `complaints`, `institutes`, and
`institute_matches`), then:

```bash
npm install
cp .env.example .env   # fill in SUPABASE_URL / SUPABASE_KEY, and GEMINI_API_KEY if using real Gemini
npm run seed             # loads data/institutes.sample.json into the institutes table
npm start
```

By default `.env` has `USE_MOCK_GEMINI=true`, so you can run and test the
entire pipeline with **no API key** — every Gemini call returns a synthetic
but realistic response (see the `mockResponse` in each service file). This is
useful for development, demos, and grading without burning API quota.

To use the real Gemini API:
1. Get a key from https://aistudio.google.com/apikey
2. In `.env`, set `GEMINI_API_KEY=your_real_key` and `USE_MOCK_GEMINI=false`

`SUPABASE_KEY` should be the project's `service_role`/secret key (not the
public anon key) — this server writes directly to tables and needs to bypass
RLS.

## Try it

```bash
# Submit a complaint
curl -X POST http://localhost:4000/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Our village has had no drinking water for 10 days, pipeline broken",
    "people_affected": 2500,
    "latitude": 23.3441,
    "longitude": 85.3096
  }'
# -> {"id": 1, "status": "queued", ...}

# Check its status/results (processing is async — poll after a second or two)
curl http://localhost:4000/complaints/1

# See everything ranked by criticality score (duplicates excluded)
curl http://localhost:4000/complaints
```

Submit a second complaint with near-identical text and a location within
~500m of the first (`DUPLICATE_RADIUS_KM` in `.env`) to see the dedup logic
mark it `"status": "duplicate", "duplicate_of": 1` instead of scoring it
separately.

## Files that matter most

| File | What it does |
|---|---|
| `src/services/criticalityRanking.js` | The ranking formula — Gemini severity score blended with people-affected (log-normalized) and duplicate count. Weights are in `.env`. |
| `src/services/geoClustering.js` | Haversine-distance radius search — the deterministic pre-filter before any dedup Gemini call. |
| `src/services/duplicateDetection.js` | Only ever compares complaints already inside the same geo-cluster. |
| `src/services/instituteShortlist.js` | Keyword/domain overlap scoring against `institutes` table — **no LLM call**. |
| `src/services/instituteRouting.js` | Takes the shortlist and asks Gemini for the final top-3 + reasoning. |
| `src/queue/jobQueue.js` | Ties the whole pipeline together, in order, per submission. |
| `src/geminiClient.js` | The one place that talks to the Gemini API — swap the model name here. |

## Known simplifications (worth mentioning in your proposal)

- **Queue**: this is a simple in-process FIFO queue (single worker, no
  persistence across restarts). Fine for a prototype/demo. For a real
  government deployment with higher volume, swap this for **BullMQ + Redis**
  or **Google Cloud Tasks** — `processComplaint()` in `jobQueue.js` would plug
  in unchanged, only the queueing mechanism changes.
- **Duplicate image matching**: not implemented here — this only compares
  text. If citizens attach photos, add perceptual hashing (pHash) or CLIP
  embeddings as a second duplicate signal alongside the text comparison.
- **Khortha/regional dialects**: the language prompt explicitly asks Gemini
  to attempt Khortha/Nagpuri/Bhojpuri, but these aren't officially "supported
  languages" for any major model provider today — treat this as best-effort,
  and consider it a good "Phase 2: fine-tune on citizen-submitted data"
  roadmap item in your proposal.
- **Institute data**: `data/institutes.sample.json` has 8 sample Jharkhand
  institutions with made-up domains/NIRF ranks for demo purposes — replace
  with real DHTE institute data before actual deployment.
- **Data residency**: citizen complaint text is sent to Google's Gemini API.
  For a real government deployment, check whether your department needs
  on-prem/sovereign LLM hosting instead.
