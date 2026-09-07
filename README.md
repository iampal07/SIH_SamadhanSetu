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


## What's new in this pass

**Design system** — one token set (`--surface`, `--border`, `--ink`, shadows) drives both themes. Cards, buttons, fields, chips, modals, charts and the map all read from it.

**Dark / light mode** — global toggle in every header (public nav, all four dashboards, simulation, login). Choice persists in `localStorage`, defaults to the OS preference. Implemented by remapping the neutral colour scale plus semantic surface tokens, so there is one design, not two.

**Multilingual — English · हिंदी · खोरठा** — centralised dictionary in `src/i18n/dictionary.js`, served through `useShell().t(key, fallback)`. Covers navigation, dashboard shells, lifecycle stages, categories, forms, buttons, notifications, map and simulation copy. Missing keys fall back to English automatically, and switching language never resets page state.

**Interactive district map** — real district cells (Voronoi cells derived from district centroids and clipped to the state boundary), choropleth heat by metric, pulsing hotspots for high-priority districts, category-coloured project markers, hover info card, click-to-filter, zoom and pan.

**Simulation** — rebuilt as a 9-scene animated story with hand-drawn SVG actors: the citizen photographs the handpump and files the report on a phone, the AI engine extracts Problem DNA, the officer stamps VALIDATED, four disciplines converge into one team, industry sends technology/mentorship/funding across to the university, the prototype progresses Idea → Design → Prototype, the pilot runs in the village, and impact is measured. Every scene states WHO → ACTION → RESULT → NEXT. Controls: Start, Play/Pause, Next, Previous, Restart, clickable scene timeline, and keyboard (space, ← →).

**Key innovations section** — Problem DNA, AI Solution Consortium, Impact & Feasibility Score, Impact Verification and District Innovation Heatmap are called out on the homepage and are live inside the dashboards.

**Presentation flow** — demo login (one click per role), seamless role switching from the sidebar while in demo mode, and Presentation Mode inside the simulation that drives one real challenge through all twelve stages while the four dashboards update live.

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
