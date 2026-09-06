# SamadhanSetu — SIH 2026 Frontend Prototype

From Community Problems to Collaborative Solutions.
A frontend-only React prototype of a civic innovation platform connecting **Citizens · Universities · Industry · Government** through an AI-assisted 12-stage project lifecycle.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Routes

| Route | Page |
|---|---|
| `/` | Homepage (problem, solution, stakeholders, AI, impact, analytics preview) |
| `/how-it-works` | Full 12-stage lifecycle explanation |
| `/simulation` | Interactive lifecycle simulation + Presentation Mode |
| `/about` | Concept, architecture, alignment |
| `/citizen` | Citizen dashboard — submit, track, community feed, impact |
| `/university` | University dashboard — recommendations, projects, teams, industry support, analytics |
| `/industry` | Industry dashboard — opportunities, portfolio, milestones, CSR impact |
| `/government` | Government dashboard — validation queue, district map, monitoring, ecosystem, impact |

## Demo script for judging (2–3 min)

1. **`/`** — hero + ecosystem visual, scroll to analytics preview.
2. **`/citizen/submit`** — submit a challenge → watch AI classify, score priority, detect duplicates and rank universities.
3. **`/government/challenges`** — the same challenge is already in the validation queue → **Run AI** / **Validate & route**.
4. **`/university/challenges`** — it now appears as an AI recommendation → **Accept** → **Form team** (AI auto-compose) → **Create proposal**.
5. **`/industry/opportunities`** — the proposal appears with an AI fit score → **Support**.
6. **`/university/projects`** — move through Prototype → Testing → Pilot → Deployment.
7. **`/government/projects`** — **Record impact**; then `/citizen/impact` shows the outcome back to the citizen.

Or open **`/simulation` → Presentation mode → Run full scenario** to drive all of the above automatically while switching dashboards.

## Architecture

```
src/
├── components/   shared UI, cards, charts, workflow, navigation
├── context/      PlatformContext — single useReducer store shared by all 4 dashboards
├── data/         constants (stages, roles, categories, districts), universities, industries, seed challenges
├── pages/        Home, Simulation, Citizen, University, Industry, Government
├── services/     aiEngine — simulated classification, priority, duplicates, matching
└── utils/        formatting helpers
```

Everything is in-memory mock data — no backend, database or auth. AI, notifications, matching and analytics are simulated deterministically in `src/services/aiEngine.js`.

Stack: React 19 · Vite · React Router · Tailwind CSS v4 · Framer Motion · Recharts · Lucide.
