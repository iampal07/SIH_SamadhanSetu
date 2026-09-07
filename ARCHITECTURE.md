# SamadhanSetu — full-stack architecture

```
                         React frontend (Vite)
                                  |
        +-------------------------+-------------------------+
        |                                                   |
  PlatformContext                                    AuthContext
  (single client store)                              (Supabase Auth)
        |                                                   |
  services/repository.js  ────────────────────────────────────┐
  services/aiService.js                                       │
        |                                                     │
        |  supabase-js (anon key, RLS enforced)                │
        v                                                     v
   ┌──────────────────────── SUPABASE ────────────────────────────┐
   │  Postgres            Auth            Storage      Realtime   │
   │  challenges          profiles        attachments  postgres_  │
   │  ai_analysis                                      changes    │
   │  projects / teams / team_members                             │
   │  project_milestones / solutions                              │
   │  industry_support / government_reviews                       │
   │  deployments / citizen_feedback                              │
   │  challenge_media / project_updates                           │
   │  notifications / activity_log                                │
   └──────────────────────────┬───────────────────────────────────┘
                              │  Edge Function (Deno, server-side)
                              v
                     functions/ai-analyze
                              │  GEMINI_API_KEY (secret, never in browser)
                              v
                    Google Gemini generateContent
```

## Where the AI came from

`jharkhand-portal-backend` was an Express service whose useful part was the Gemini
pipeline (language detection + translation, severity/category extraction with a
weighted criticality score, duplicate detection, institute shortlisting and
routing). Its Express/`pg`/SQLite layer was half-finished — several services
imported a `../db` module and a `callGemini` export that did not exist, and the
one working route wrote to a `complaints` table this platform does not use.

So the **pipeline was ported, not the server**: `supabase/functions/ai-analyze`
runs the same four stages with the same prompts and the same scoring weights
(`WEIGHT_PEOPLE_AFFECTED` 0.45, `WEIGHT_SEVERITY` 0.35, `WEIGHT_DUPLICATE_COUNT`
0.20), but as a Supabase Edge Function. That keeps one app to run, keeps the API
key server-side, and deploys anywhere without a second Node process.

Every stage falls back to a deterministic engine if `GEMINI_API_KEY` is missing
or a call fails, and the UI labels which engine produced each result — so the
platform never blocks on the model and never shows invented output.

## Data flow for one challenge

| Step | Writes to |
|---|---|
| Citizen submits + uploads evidence | `challenges`, `challenge_media` (Storage), `activity_log`, `notifications` |
| AI analysis | `ai_analysis`, updates `challenges.category/priority_*`, `activity_log` |
| Government validates | `challenges.validation_*`, `activity_log`, `notifications` |
| University accepts | `projects` |
| Team formed | `teams`, `team_members` |
| Proposal published | `projects.proposal`, `project_milestones` |
| Industry joins | `industry_support` |
| Prototype published | `solutions` |
| Government review | `government_reviews`, `deployments` |
| Citizen feedback | `citizen_feedback` |

`services/repository.js` is the only writer. Realtime `postgres_changes` on all of
those tables refreshes every open dashboard, so the four portals always read the
same records.

## Setup on a new machine

```bash
npm install
cp .env.example .env        # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

Apply the schema in the Supabase SQL editor, in order:

1. `supabase/migrations/001_core.sql`
2. `supabase/migrations/002_lifecycle_and_ai.sql`

Deploy the AI function and give it the Gemini key (this is the only place the key
lives):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set GEMINI_API_KEY=<key> GEMINI_MODEL=gemini-2.5-flash
npx supabase functions deploy ai-analyze --no-verify-jwt
```

Seed the demo dataset as real database rows:

```bash
npm run seed            # insert what is missing
npm run seed -- --reset # wipe the lifecycle tables first
```

Then `npm run dev`.
