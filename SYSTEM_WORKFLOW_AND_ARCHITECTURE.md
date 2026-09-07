# SamadhanSetu (समाधान सेतु) — Complete Technical Architecture & Workflow Specification

> **Smart India Hackathon (SIH) 2026**  
> **Platform Name**: SamadhanSetu (Problem &rarr; Solution Bridge)  
> **Core Architecture**: Quadruple-Helix Civic Innovation Platform (Citizen · Government · University · Industry)  
> **Tech Stack**: React 19, Vite, Tailwind CSS v4, Framer Motion, Supabase (PostgreSQL, Auth, Storage, Realtime), Recharts, Lucide Icons  

---

## 1. Executive Summary & Problem Scope

SamadhanSetu is a national digital public infrastructure designed to bridge the structural disconnect between:
1. **Citizens** facing acute, hyper-local community problems (water shortages, non-functional lift irrigation, healthcare access, broken roads, civic emergencies).
2. **Government Authorities** overwhelmed by unstructured grievances, lacking AI-driven deduplication, priority scoring, and structured routing to technical problem-solvers.
3. **Universities and Academic Institutions** whose engineering faculties and students often build hypothetical capstone projects instead of solving real ground-level societal problems.
4. **Industry & CSR Partners** possessing innovation budgets and CSR mandates but lacking vetted, field-ready technological prototypes to fund and scale.

Through a coordinated 12-stage lifecycle, problems submitted by citizens are parsed by an **AI Classification & Triage Engine**, validated by **Government Administrators**, developed into working prototypes by **University Innovation Teams**, and funded/scaled by **Industry CSR Divisions**.

---

## 2. End-to-End 12-Stage Innovation Lifecycle

```
[1. Submitted] ──> [2. AI Analysed] ──> [3. Validated] ──> [4. University Matched]
                                                                     │
[8. Prototype] <── [7. Industry Matched] <── [6. Proposal] <── [5. Team Formed]
      │
      └──> [9. Testing] ──> [10. Pilot] ──> [11. Deployment] ──> [12. Impact Measured]
```

### Stage-by-Stage Breakdown:

| Stage # | Stage Key | Owner | What Occurs at this Stage |
|---|---|---|---|
| **1** | `submitted` | **Citizen** | Citizen reports a civic issue, tags district/gram panchayat, specifies affected count, and attaches photos, videos, or documents. |
| **2** | `ai_analysed` | **AI Engine** | AI analyzes natural language description, classifies societal category, calculates urgency priority score (0–100), flags duplicates, and matches top 3 universities by domain. |
| **3** | `validated` | **Government** | District Nodal Officer / Block Officer inspects the issue in the **Validation Queue**, adds field verification notes, and approves or rejects duplicate claims. |
| **4** | `university_matched` | **University** | Matched University Innovation & Incubation Cell receives the challenge in **Recommended Challenges** and formally accepts ownership. |
| **5** | `team_formed` | **University** | Faculty Lead and Student Innovators form a multidisciplinary project task force with assigned roles. |
| **6** | `proposal_created` | **University** | Team submits a structured Solution Proposal with technical approach, milestones, budget requirements, and specific industry assistance needs. |
| **7** | `industry_matched` | **Industry** | Corporate CSR or R&D partner discovers the proposal, signs an MoU, and commits funds/hardware support. |
| **8** | `prototype` | **University** | Lab-tested working prototype is uploaded to the **Prototype Showcase** with TRL (Technology Readiness Level 5–7), demo video, and integration specs. |
| **9** | `testing` | **University** | Controlled pilot and environmental stress testing in laboratory and simulated field environments. |
| **10** | `pilot` | **Industry + Univ** | Supervised field deployment in the citizen's actual locality or gram panchayat. |
| **11** | `deployment` | **Govt + Industry** | Full-scale administrative commissioning and handover to local panchayat/urban body. |
| **12** | `impact_measured` | **All Stakeholders** | Post-handover impact audit: citizens benefited, water saved, turnaround time improved, and cost savings quantified. |

---

## 3. System Architecture & Component Interaction

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User Interfaces                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Citizen Hub  │  │  Govt Portal │  │  University  │  │   Industry  │ │
│  │ (/citizen)   │  │ (/government)│  │ (/university)│  │ (/industry) │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Context & State Layer                           │
│  • AuthContext: Supabase Auth, Google OAuth, Session, User Profile    │
│  • PlatformContext: Challenge Store, Live Realtime Sync, Reducer       │
│  • AppShellContext: Multilingual Dictionary (i18n), Theme Controls     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Services Layer                                │
│  • supabase.js: Client initialization, Auth wrappers, Profile upsert   │
│  • db.js: Resilient storage, Base64 fallback, DB CRUD operations       │
│  • aiEngine.js: Domain classification, Priority algorithm, Matching   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Supabase Cloud Backend                            │
│  • auth.users (Google OAuth & Email/Password Identities)               │
│  • public.profiles (User roles, districts, organization affiliations)  │
│  • public.challenges (Problems, validation status, attachments)        │
│  • public.prototypes_and_proposals (University TRL prototypes & video) │
│  • public.industry_commitments (Corporate funding pledges & MoUs)      │
│  • Realtime Channel ('public:challenges' live pub/sub broadcast)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema & Data Models (`supabase_schema.sql`)

### 4.1 Custom Postgres Types
```sql
create type user_role as enum ('citizen', 'govt', 'varsity', 'industry');
create type challenge_validation_status as enum ('pending', 'validated', 'rejected');
```

### 4.2 Tables & Relationships

#### 1. `public.profiles`
Links 1-to-1 with `auth.users`. Contains user role, district, and organization:
- `id` (`uuid`, PK, references `auth.users(id)` on delete cascade)
- `email` (`text`, NOT NULL)
- `full_name` (`text`)
- `avatar_url` (`text`)
- `role` (`user_role`, NULL until user completes onboarding)
- `organization_name` (`text`)
- `district` (`text`, e.g., 'Ranchi', 'Bokaro', 'Dhanbad')
- `designation` (`text`)
- `phone` (`text`)
- `is_onboarded` (`boolean`, default `false`)
- `created_at`, `updated_at` (`timestamptz`)

#### 2. `public.challenges`
Stores community problems reported by citizens:
- `id` (`uuid`, PK, default `gen_random_uuid()`)
- `code` (`text`, UNIQUE, e.g., 'CH-1201')
- `title` (`text`, NOT NULL)
- `description` (`text`, NOT NULL)
- `category` (`text`, e.g., 'Water & Sanitation', 'Healthcare')
- `district` (`text`, NOT NULL)
- `village` (`text`)
- `affected_population` (`integer`, default 0)
- `citizen_id` (`uuid`, references `public.profiles(id)`)
- `citizen_name` (`text`)
- `status` (`text`, default `'submitted'`)
- `validation_status` (`challenge_validation_status`, default `'pending'`)
- `validated_by` (`text`)
- `validation_notes` (`text`)
- `priority_score` (`integer`, default 50)
- `priority_level` (`text`, default `'MEDIUM'`)
- `attachments` (`jsonb`, default `'[]'::jsonb`) — stores array of `{ name, url, size, type }`
- `upvotes` (`integer`, default 1)
- `created_at` (`timestamptz`)

#### 3. `public.prototypes_and_proposals`
Stores university prototypes and proposals:
- `id` (`uuid`, PK)
- `challenge_id` (`uuid`, references `public.challenges(id)`)
- `university_id` (`uuid`, references `public.profiles(id)`)
- `university_name` (`text`)
- `title` (`text`, NOT NULL)
- `abstract` (`text`, NOT NULL)
- `trl_level` (`integer`, check 1-9)
- `demo_url` (`text`)
- `video_demo_url` (`text`)
- `estimated_funding_required` (`numeric`)
- `integration_requirements` (`jsonb`)
- `faculty_lead` (`text`)
- `student_contributors` (`jsonb`)
- `is_industry_ready` (`boolean`, default `true`)

#### 4. `public.industry_commitments`
Stores industry CSR and R&D funding commitments:
- `id` (`uuid`, PK)
- `challenge_id` (`uuid`, references `public.challenges(id)`)
- `industry_id` (`uuid`, references `public.profiles(id)`)
- `industry_name` (`text`)
- `amount_committed` (`numeric`)
- `support_types` (`jsonb`)
- `notes` (`text`)
- `mou_status` (`text`, default `'inquiry'`)

---

## 5. Exhaustive Directory & File-by-File Breakdown

### 5.1 Root Configuration Files

#### `package.json`
- **Purpose**: Defines dependencies and npm scripts for the application.
- **Key Dependencies**:
  - `react` / `react-dom` (v19.2.8): Modern React runtime.
  - `react-router-dom` (v7.18.3): Client-side routing with nested layout trees and route guards.
  - `@supabase/supabase-js` (v2.115.0): Official Supabase client for auth, database queries, and realtime pub/sub.
  - `framer-motion` (v13.1.1): Declarative UI animations, modal transitions, and spring animations.
  - `lucide-react` (v1.39.0): Icons across all portals.
  - `recharts` (v3.10.1): Interactive data visualization charts for analytics.
  - `@tailwindcss/vite` & `tailwindcss` (v4.3.3): Utility-first CSS styling engine.
- **Scripts**: `npm run dev` (starts Vite dev server), `npm run build` (production bundler), `npm run preview`.

#### `vite.config.js`
- **Purpose**: Configuration for Vite bundler, registering `@vitejs/plugin-react` and `@tailwindcss/vite`.

#### `index.html`
- **Purpose**: Single-page application entry HTML file; defines viewport, fonts, and mounts `#root` with `src/main.jsx`.

#### `.gitignore`
- **Purpose**: Prevents secrets and build artifacts from entering version control.
- **Critical Entries**: Explicitly ignores `.env`, `.env.*`, `dist`, `node_modules`.

#### `supabase_schema.sql`
- **Purpose**: Complete idempotent PostgreSQL migration script containing types, tables, functions, triggers, and Row Level Security (RLS) policies for Supabase.

---

### 5.2 Core Application Entry (`src/`)

#### `src/main.jsx`
- **Purpose**: Application bootstrap file.
- **Workings**:
  - Wraps the application inside `BrowserRouter`.
  - Stacks providers in order: `AuthProvider` &rarr; `PlatformProvider` &rarr; `AppShellProvider`.
  - Mounts `<App />` to DOM.

#### `src/App.jsx`
- **Purpose**: Central routing table and layout switcher.
- **Workings**:
  - **Public Routes**: `/` (Home), `/how-it-works`, `/about`, `/simulation` under `PublicLayout`.
  - **Auth Routes**: `/login`, `/auth/callback`, `/onboarding`.
  - **Protected Stakeholder Portals**:
    - `/citizen/*` guarded by `<ProtectedRoute allowedRoles={['citizen']}>`.
    - `/university/*` guarded by `<ProtectedRoute allowedRoles={['varsity']}>`.
    - `/industry/*` guarded by `<ProtectedRoute allowedRoles={['industry']}>`.
    - `/government/*` guarded by `<ProtectedRoute allowedRoles={['govt']}>`.
  - **Alias Redirects**: Automatically forwards legacy `/varsity/*` &rarr; `/university` and `/govt/*` &rarr; `/government`.
  - Renders global animated toast notifications.

#### `src/index.css`
- **Purpose**: Global styling sheet with Tailwind CSS imports, custom color definitions, glassmorphism utilities, badge styles, and dark-mode overrides.

---

### 5.3 Authentication & Authorization Layer

#### `src/services/supabase.js`
- **Purpose**: Core Supabase SDK client wrapper and authentication interface.
- **Key Functions**:
  - `isSupabaseConfigured`: Detects whether real Supabase credentials exist in `.env`.
  - `signInWithGoogle()`: Initiates Google OAuth with offline access and prompt consent, redirecting to `/auth/callback`.
  - `signUpWithEmail(email, password, metadata)`: Creates a new user with email and pre-populates role metadata.
  - `signInWithEmail(email, password)`: Authenticates existing users.
  - `signOutUser()`: Destroys user session.
  - `fetchUserProfile(userId)`: Reads user profile row from `public.profiles`.
  - `saveUserProfile(profileData)`: Upserts user profile with an **automatic fallback mechanism** that retries without `is_onboarded` if the column is absent from the schema cache.

#### `src/context/AuthContext.jsx`
- **Purpose**: Global React authentication context provider (`useAuth()`).
- **Workings**:
  - Maintains `user`, `session`, `profile`, and `role` state.
  - Listens to Supabase `onAuthStateChange` to update state on login/logout across tabs.
  - `completeOnboarding({ role, organizationName, district, phone })`:
    1. Updates Supabase Auth metadata via `supabase.auth.updateUser()`.
    2. Sets local `samadhan_onboarded_<uid>` in `localStorage`.
    3. Upserts profile in `public.profiles`.
    4. Updates local state and routes user to their designated portal.
  - `loginAsDemoRole(roleKey)`: Provides instant 1-click role authentication for SIH presentation judges using predefined demo personas.

#### `src/components/auth/ProtectedRoute.jsx`
- **Purpose**: High-security route guard protecting stakeholder portals.
- **Workings**:
  - Validates authentication: unauthenticated requests are redirected to `/login?redirect=...`.
  - Validates onboarding: users who haven't completed role selection are sent to `/onboarding`.
  - Validates role permissions: if a Citizen attempts to open `/government`, access is blocked, and a "Restricted Portal Access" modal gives one-click navigation back to their authorized workspace.

#### `src/pages/Auth/Login.jsx`
- **Purpose**: Dual-mode login and registration page.
- **Workings**:
  - **"Continue with Google"** button for OAuth sign-in.
  - **Email & Password tab** with role selector, district picker, and organization field for registration.
  - **Demo Personas chip row** allowing SIH hackathon evaluators to test Citizen, Government, University, or Industry in 1 click.

#### `src/pages/Auth/AuthCallback.jsx`
- **Purpose**: OAuth return handler executed when Google redirects back.
- **Workings**:
  - Extracts the active session from Supabase.
  - Queries `public.profiles` and `user_metadata`.
  - If the user has completed onboarding, routes directly to their assigned portal (`/government`, `/university`, `/industry`, `/citizen`).
  - If first-time Google login (un-onboarded), routes directly to `/onboarding`.

#### `src/pages/Auth/Onboarding.jsx`
- **Purpose**: First-time identity setup screen.
- **Workings**:
  - Presents 4 interactive role cards with color accents and descriptions:
    1. **Citizen** (Community problem reporter)
    2. **Government Official** (Nodal officer / Administrative validation)
    3. **University / Academia** (Faculty, students & innovation cell)
    4. **Industry & CSR Partner** (Corporate funding & commercial scaling)
  - Captures primary District and Organization / Panchayat name.
  - Persists data through `completeOnboarding()` and immediately transitions user to their portal.

---

### 5.4 Database & Storage Services Layer

#### `src/services/db.js`
- **Purpose**: Centralized database queries, updates, and resilient file storage management.
- **Key Functions**:
  - `uploadFileToSupabase(file, bucket, userId)`:
    - Attempts upload to Supabase Storage bucket (`attachments`).
    - **Durable Base64 Fallback**: If the storage bucket is missing or errors, reads the file via `FileReader` as a base64 Data URL (`data:image/...` or `data:video/...`), ensuring uploaded media is **permanently preserved** in the database row.
    - Accurately tags file types as `image`, `video`, or `doc`.
  - `insertChallengeInDb(challenge)`: Writes a new challenge into `public.challenges` table with all metadata and attachment URLs.
  - `updateChallengeInDb(codeOrId, patch)`: Updates challenge status, validation notes, and priority scores. Uses regex to determine whether to query by UUID `id` or string `code` (`CH-1201`), avoiding PostgreSQL UUID syntax errors.
  - `insertPrototypeInDb(prototypeData, challenge)`: Inserts working prototypes into `public.prototypes_and_proposals`.
  - `insertIndustryCommitmentInDb(commitment)`: Writes corporate funding pledges into `public.industry_commitments`.
  - `fetchChallengesFromDb()`: Loads all challenges from Supabase ordered by creation date.

#### `src/services/aiEngine.js`
- **Purpose**: In-browser heuristic AI analysis and triage engine simulating the national NLP classifier.
- **Key Functions**:
  - `classifyText(text)`: Scans keyword tokens across 9 civic domains (Water & Sanitation, Healthcare, Agriculture, Education, Urban Infrastructure, Environment, Rural Development, Accessibility, Public Services) and returns the top category with confidence percentage.
  - `scorePriority(challenge, category)`: Calculates an urgency index (0–100) based on affected population size, danger keywords, domain urgency factor, and village context. Produces levels: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - `detectDuplicates(challenge, existingList)`: Uses Jaccard similarity and shared district/locality matching to flag duplicate problem submissions.
  - `matchUniversities(category, district)`: Ranks universities based on department alignment, research track records, and geographic proximity.
  - `matchIndustries(challenge)`: Matches CSR funds by domain focus and funding capacity.
  - `runAnalysis(challenge, existingList)`: Executes the complete automated assessment pipeline.

---

### 5.5 State Management & Context Layer

#### `src/context/PlatformContext.jsx`
- **Purpose**: The central nervous system of the platform (`usePlatform()`, `useAnalytics()`, `useNotifications()`).
- **Workings**:
  - **Initial State**: Seeds with realistic Jharkhand challenges across all 12 stages.
  - **Supabase Cloud Sync**: On mount, queries `fetchChallengesFromDb()` and prepends real database submissions (`MERGE_DB_CHALLENGES`).
  - **Live Realtime Broadcast**: Subscribes to Supabase `postgres_changes` on `challenges`. Whenever any citizen reports an issue or government validates, all open portals receive live state updates without page refreshes.
  - **Reducer Actions**:
    - `SUBMIT_CHALLENGE`: Appends new citizen problem with real attachments and citizen profile ID.
    - `RUN_AI`: Triggers AI analysis on demand.
    - `VALIDATE` / `REJECT_CHALLENGE`: Updates administrative status and generates notifications.
    - `UNIVERSITY_ACCEPT`: Assigns university ownership and advances lifecycle.
    - `FORM_TEAM` / `CREATE_PROPOSAL`: Builds university task force and roadmap.
    - `INDUSTRY_JOIN` / `PLEDGE_SCALING_FUNDING`: Records corporate capital commitment and advances to `pilot`.
    - `ADVANCE`: Steps challenge through subsequent lifecycle stages.
  - `useAnalytics()`: Computes real-time statistics (total challenges, active projects, beneficiaries, district distributions, stage counts).
  - `useNotifications(role)`: Filters role-specific real-time alerts.

#### `src/context/AppShellContext.jsx`
- **Purpose**: Manages multilingual localization (`useShell()`) and shell UI preferences.
- **Workings**:
  - Provides translation helper `t(key, fallback)` backed by `src/i18n/dictionary.js`.
  - Supports English (`en`), Hindi (`hi`), and regional languages.
  - Manages dark/light theme switching.

#### `src/i18n/dictionary.js`
- **Purpose**: Exhaustive internationalization dictionary containing hundreds of translation strings across all platform modules.

---

### 5.6 Data Models & Seed Catalogs (`src/data/`)

#### `src/data/constants.js`
- **Purpose**: System-wide enumerations, metadata, and routing helpers.
- **Key Exports**:
  - `STAGES`: 12 lifecycle stages with stage key, label, icon, and owner role.
  - `ROLES`: Theme colors, gradients, and display badges for `citizen`, `govt`, `varsity`, `industry`, `ai`.
  - `ROLE_PORTAL_PATHS`: Centralized routing mapping (`citizen` &rarr; `/citizen`, `varsity` &rarr; `/university`, `industry` &rarr; `/industry`, `govt` &rarr; `/government`).
  - `getRolePortalPath(role)`: Universal route resolver preventing 404 mismatches.
  - `CATEGORIES` & `DISTRICTS`: Normalised coordinates for all 24 Jharkhand districts.

#### `src/data/seedChallenges.js`
- **Purpose**: High-fidelity benchmark challenges for demonstration mode, covering real districts (Hazaribagh, Khunti, Simdega, Gumla, Dhanbad, Ranchi).

#### `src/data/universities.js`
- **Purpose**: Directory of Jharkhand higher education institutions (BIT Mesra, NIT Jamshedpur, IIT ISM Dhanbad, Birsa Agricultural University, Ranchi University) with departmental strengths, faculty counts, and talent pools.

#### `src/data/industries.js`
- **Purpose**: Directory of industry and CSR partners (Tata Steel Foundation, Coal India CSR, NTPC, Jindal Steel & Power, Vedanta Foundation) with funding capacities and support types.

---

### 5.7 Shared UI & Workflow Components (`src/components/`)

#### `src/components/navigation/PublicNav.jsx`
- **Purpose**: Top navigation header on public pages. Includes logo, nav links, language/theme selectors, and user avatar with workspace shortcut.

#### `src/components/navigation/DashboardLayout.jsx`
- **Purpose**: Master shell layout for all 4 stakeholder portals.
- **Workings**: Collapsible sidebar, notification center with unread count badge, role-switching bar, user avatar card, and mobile responsive drawer.

#### `src/components/cards/ChallengeCard.jsx`
- **Purpose**: Reusable card component displaying challenge cards across feeds.
- **Workings**: Shows category icon, code badge, priority indicator, locality/district, affected count, time ago, and attachment count indicator.

#### `src/components/shared/ChallengeDetail.jsx`
- **Purpose**: Comprehensive modal dialog providing deep-dive view into any challenge.
- **Key Sections**:
  - **Overview**: Full description, citizen identity, community upvotes, and government verification notes.
  - **Interactive Media Previews**: Responsive grid rendering **image thumbnail previews with click-to-zoom** and an embedded **HTML5 `<video controls>` player** for `.mp4` attachments.
  - **AI Analysis Panel**: Confidence ring, domain breakdown, similarity duplicates, and matched institutions.
  - **Team & Proposal**: Faculty leads, student contributors, budget, and milestone roadmap.
  - **Impact Metrics**: Beneficiaries and sustainability scores.

#### `src/components/workflow/Lifecycle.jsx`
- **Purpose**: Interactive visual progress tracker displaying the 12-stage lifecycle with color-coded completed, active, and pending states.

#### `src/components/charts/Charts.jsx`
- **Purpose**: Recharts wrappers for category donuts, trend area charts, horizontal and vertical bar charts.

#### `src/components/charts/JharkhandMap.jsx`
- **Purpose**: Interactive SVG map of Jharkhand's districts with color-coded challenge density heatmaps and clickable district analytics.

#### `src/components/shared/ui.jsx`
- **Purpose**: Foundational design-system primitives: `Modal`, `Tabs`, `Chip`, `Stat`, `ScoreRing`, `SearchInput`, `Select`, `Empty`, and `Toasts`.

---

### 5.8 Stakeholder Portal Pages (`src/pages/`)

#### 1. Citizen Portal (`src/pages/Citizen/CitizenDashboard.jsx`)
- **Routes**:
  - `/citizen`: Overview hero with personal stats (Mine, Validated, Assigned, Endorsements) and tracked challenge cards.
  - `/citizen/submit`: Problem submission form. Uploads evidence files with base64 resilience, saves directly to Supabase `challenges` table, and triggers AI analysis.
  - `/citizen/challenges`: "My Challenges" view filtered dynamically by authenticated `user.id`.
  - `/citizen/community`: Public civic feed allowing citizens to endorse and upvote issues in their district.
  - `/citizen/impact`: Impact report showing completed community solutions.

#### 2. Government Portal (`src/pages/Government/GovernmentDashboard.jsx`)
- **Routes**:
  - `/government`: High-level district innovation metrics, critical alerts, and resolution rates.
  - `/government/challenges`: **Validation Queue**. Filter by Pending, Validated, and All.
    - Displays `CH-1201` and all incoming citizen problems.
    - Click **"Validate"** &rarr; opens `ValidateModal` with AI category, priority score, duplicate detection, and verification note input.
    - Automatically updates Supabase `challenges` row with `validation_status: 'validated'` and broadcast to universities.
  - `/government/map`: District-by-district GIS analytics.
  - `/government/projects`: Milestone tracking for ongoing university solutions.
  - `/government/impact`: District-wide outcomes and cost savings.

#### 3. University Portal (`src/pages/University/UniversityDashboard.jsx`)
- **Routes**:
  - `/university`: Overview of research domains, active innovation teams, and accepted challenges.
  - `/university/challenges`: **Recommended Challenges** automatically routed by AI and verified by Government.
    - One-click **"Accept this challenge"** &rarr; writes `status: 'university_matched'` to Supabase.
  - `/university/projects`: Active project workspaces with team management and milestone creation.
  - `/university/showcase`: **Prototype Showcase**. Form to upload lab-tested working prototypes (TRL 5–7), demo URLs, video links, estimated budget, and integration requirements into `public.prototypes_and_proposals`.
  - `/university/teams`: Student and faculty talent pool assignment.

#### 4. Industry Portal (`src/pages/Industry/IndustryDashboard.jsx`)
- **Routes**:
  - `/industry`: Corporate CSR overview and portfolio allocation.
  - `/industry/scalable-ready`: **Scalable Prototypes Marketplace**. Discovers prototypes submitted by universities with technical prerequisites and funding progress bars.
    - Click **"Adopt & Fund Scaling"** &rarr; records CSR/R&D pledge in `public.industry_commitments` and advances challenge to `pilot`.
  - `/industry/opportunities`: University project needs (hardware, mentorship, capital).
  - `/industry/portfolio`: Funded projects with live milestone verification.

#### 5. Interactive Simulation (`src/pages/Simulation/Simulation.jsx`)
- **Purpose**: Interactive end-to-end sandbox specifically built for **SIH Judges and Evaluators**.
- **Workings**: Runs the complete 12-stage innovation pipeline automatically in 15 seconds, visibly demonstrating the problem flowing from Citizen &rarr; AI &rarr; Government &rarr; University &rarr; Industry &rarr; Deployed Impact.

---

## 6. How the Entire Flow Runs Step-by-Step

```
[Citizen] 
  1. Signs in with Google at /login -> completes /onboarding as 'Citizen'.
  2. Submits problem at /citizen/submit with photo/video attachment.
  3. Image converts to durable base64 / Supabase storage and saves to public.challenges.
       │
       ▼
[Supabase Cloud] 
  Realtime channel ('public:challenges') fires an insert event.
       │
       ▼
[Government]
  4. Officer signs in at /login -> opens /government/challenges.
  5. Challenge appears at the top of 'Pending Validation' queue with '1 attachment'.
  6. Officer clicks 'Details' -> sees photo preview thumbnail or video player.
  7. Officer clicks 'Validate' -> ValidateModal opens -> Officer confirms validation note.
  8. Challenge updates to 'validated' in Supabase.
       │
       ▼
[University]
  9. University researcher opens /university/challenges.
 10. Validated challenge appears in 'Recommended Challenges' based on research domain.
 11. University clicks 'Accept this challenge' -> moves to 'My Projects'.
 12. University uploads working prototype showcase at /university/showcase with TRL and funding requirement.
       │
       ▼
[Industry]
 13. Industry CSR manager opens /industry/scalable-ready.
 14. Discovers the University's working prototype.
 15. Clicks 'Adopt & Fund Scaling' -> enters ₹15,00,000 funding pledge.
 16. Commitment is written to Supabase and project advances to field pilot and full deployment.
```

---

## 7. Developer Cheat Sheet & Quick Commands

### Start Local Development Server:
```powershell
cd C:\Work\SIH_SamadhanSetu-main
npm run dev
# Open http://localhost:5173 in browser
```

### Run Production Build Verification:
```powershell
npm run build
```

### Git Branch & Remote Tracking:
- **Active Feature Branch**: `feature/supabase-auth-and-portals`
- **Remote Repository**: `https://github.com/iampal07/SIH_SamadhanSetu.git`
- **Pull Request**: [Create Pull Request on GitHub](https://github.com/iampal07/SIH_SamadhanSetu/pull/new/feature/supabase-auth-and-portals)
