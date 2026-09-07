# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A prototype backend for the Jharkhand Societal Innovation Portal (SamadhanSetu):
citizens submit complaints, and a pipeline uses the Gemini API (plus deterministic
backend logic) to detect language, dedupe against nearby complaints, score
criticality, and route each complaint to the top-3 matching institutes.

This directory (`backend/`) is a standalone Express server, separate from the
React frontend at the repo root. **The `integration` / `feature/supabase-auth-and-portals`
branches contain this same pipeline ported to a Supabase Edge Function
(`supabase/functions/ai-analyze`)** instead — check with whoever owns those
branches before running both against the same Supabase tables, since they'd be
processing complaints/challenges twice.

## Commands

```bash
npm install
cp .env.example .env   # fill in SUPABASE_URL / SUPABASE_KEY, and GEMINI_API_KEY if using real Gemini
npm run seed             # runs src/db/seed.js — loads data/institutes.sample.json into Supabase
npm start                 # node src/server.js
npm run dev                # node --watch src/server.js
```

Before first run, apply `data/schema.sql` once in the Supabase SQL editor —
it creates the `complaints`, `institutes`, and `institute_matches` tables this
code reads/writes.

There is no test runner, lint config, or build step configured in `package.json` —
`test-ai.js` is a standalone manual script (`node test-ai.js`) that hits the real
Gemini API directly, not an automated test.

`USE_MOCK_GEMINI` in `.env` toggles between real Gemini calls and synthetic mock
responses (each service file defines its own `mockResponse`/`mock*Result`), so
the pipeline can be exercised without burning API quota.

## Architecture

```
POST /complaints
      │
      ▼
 [in-process job queue]  ──► processComplaint(id)   [src/queue/jobQueue.js]
      │
      ├─ 1. languageService.js       → Gemini: detect language + translate to English
      │
      ├─ 2. geoClustering.js         → pure math, NO Gemini call: finds nearby
      │      duplicateDetection.js      complaints within radius, then Gemini only
      │                                 compares text within that geo-cluster
      │      (if duplicate found → stop here, linked to original)
      │
      ├─ 3. criticalityRanking.js    → Gemini: severity score (0-10) + category,
      │                                 combined with a weighted formula using
      │                                 people_affected (never LLM-guessed) and
      │                                 duplicate_count (weights in .env)
      │
      └─ 4. instituteShortlist.js    → pure keyword/domain match, NO Gemini call:
             instituteRouting.js        narrows all institutes to top ~10
                                         → Gemini picks + justifies final top 3
```

Gemini is only ever called with a small, pre-filtered slice of context (one
geo-cluster, or ~10 shortlisted institutes) — never the whole database — to
keep cost/latency predictable as the portal scales.

Key files:
- `src/db/index.js` — exports the Supabase client every service reads/writes
  through (`require("../db")`); the actual client setup is in `supabaseClient.js`.
- `src/geminiClient.js` — the single place that talks to the Gemini API;
  `callGemini(prompt, { mockResponse })` is what every service calls, and it's
  where `USE_MOCK_GEMINI` is checked.
- `src/queue/jobQueue.js` — the FIFO in-process queue tying the pipeline steps
  together per submission (single worker, no persistence across restarts —
  intentionally simple; swap for BullMQ+Redis or Cloud Tasks for real volume).
- `src/services/*` — one file per pipeline step (see diagram above).
- `src/routes/complaints.js` — `POST /` inserts + enqueues, `GET /:id` polls
  status, `GET /` lists everything ranked by criticality (duplicates excluded).

## Known simplifications

- **Queue**: in-process FIFO, single worker, no persistence across restarts.
  `processComplaint()` in `jobQueue.js` would plug into BullMQ+Redis or Cloud
  Tasks unchanged if this needs to survive restarts / scale to multiple workers.
- **Duplicate detection** only compares text, not attached photos/evidence.
- **Khortha/regional dialects**: best-effort via the Gemini prompt — not an
  officially supported language for any major model provider.
- **Institute data**: `data/institutes.sample.json` has sample Jharkhand
  institutions with made-up domains/NIRF ranks — replace with real DHTE data
  before actual deployment.
- **CORS** is wide open (`cors()` with no origin restriction) — tighten to the
  frontend's actual origin before production.
