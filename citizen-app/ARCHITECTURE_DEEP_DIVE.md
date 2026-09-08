# ARCHITECTURE & CODEBASE DEEP DIVE
## SIH 2026: AI-Powered Societal Innovation Collaboration Portal (Team Outlaws · Problem SIH26043)
### Subsystem: Citizen Problem Portal (Step 1 Foundation)

---

## 1. Executive Summary & Project Context

### 1.1 What Is This Project?
This codebase is the **Step 1 (Citizen Portal)** foundation for **Smart India Hackathon 2026 (Problem Statement ID: SIH26043)**, titled *"AI-Powered Societal Innovation Collaboration Portal"*, developed by **Team Outlaws**.

The broader platform vision connects four major stakeholders:
1. **Citizens** (who report grassroots societal problems)
2. **Government Authorities** (who review, validate, and fund solutions)
3. **Universities & Researchers** (who engineer solutions)
4. **Industry / Startups** (who scale and deploy solutions)

### 1.2 What Does This Step 1 Specifically Do?
Step 1 is the **citizen ingestion pipeline**. It provides a frictionless, bilingual, mobile-first web application tailored for citizens (specifically localized for the state of **Jharkhand**) to:
- Select their preferred language (**English** or **Hindi**).
- Report local societal problems (e.g., drinking water shortages, unpaved roads, power cuts, hospital infrastructure deficits).
- Attach ground evidence (camera/gallery photos) and GPS coordinates (latitude/longitude).
- Review all details prior to final submission.
- Receive an official, human-readable Challenge Tracking ID (e.g., `JH-2026-000001`).
- Track submitted problems and their live statuses under **"My Reports"**.

### 1.3 What Is Deliberately NOT in Step 1 (Prepared for Step 2+)?
- **No complex AI processing yet**: The status stays at `SUBMITTED`. Future steps will attach AI classification, deduplication, and severity scoring.
- **No external auth provider yet**: Step 1 uses cookie-based mock citizen identity (`src/proxy.ts`), designed to be swapped 1-to-1 with Supabase Auth or Aadhaar/DigiLocker.
- **No cloud bucket yet**: Images are written to local disk (`public/uploads`) behind an abstracted storage interface (`src/lib/storage.ts`), ready to swap to Supabase Storage or AWS S3 with zero changes to consuming code.

---

## 2. Technology Stack & Modern Next.js Conventions

| Layer | Technology | Details / Version | Architectural Role |
|---|---|---|---|
| **Framework** | **Next.js 16.3.4** | App Router (`src/app/`) | Fullstack React framework utilizing Server Components (RSC) and Route Handlers. Uses the new Next 16 `proxy.ts` convention. |
| **UI Runtime** | **React 19.2.8** | Client & Server Components | Modern React with Server Component streaming and async page parameter resolution. |
| **Language** | **TypeScript 5** | Strict mode enabled | End-to-end type safety spanning validation, database models, and components. |
| **Styling** | **Tailwind CSS v4** | `@tailwindcss/postcss` | Utility-first styling with `@theme inline` CSS variables and touch-optimized accessible designs. |
| **Database** | **PostgreSQL** | Relational DB | Persistent storage for problems and attached evidence files. |
| **ORM** | **Prisma 6.19.3** | `@prisma/client` | Type-safe queries, relational joins, automated migrations, and transaction management. |
| **Validation** | **Zod 4.5.4** | Shared Schemas | Synchronous client-side validation and runtime server-side payload parsing. |

---

## 3. High-Level System Architecture & Request Flows

```mermaid
flowchart TD
    subgraph Browser ["Citizen Client (Browser / PWA)"]
        UI_Lang["Language Select (/)"]
        UI_Home["Dashboard (/home)"]
        UI_Report["Multi-Step Report Form (/report)"]
        UI_List["My Reports (/reports)"]
        UI_Detail["Report Details (/reports/[id])"]
    end

    subgraph Edge ["Next.js Proxy Layer"]
        Proxy["src/proxy.ts (Next 16 Proxy)"]
        CookieAssign["Assign 'citizen_id' Cookie via crypto.randomUUID()"]
    end

    subgraph ServerApp ["Next.js App Router (Server)"]
        RSC_Reports["Server Component: /reports/page.tsx"]
        RSC_Detail["Server Component: /reports/[id]/page.tsx"]
        RSC_Success["Server Component: /report/success/[id]/page.tsx"]
        API_Create["POST /api/problems"]
        API_Get["GET /api/problems"]
        API_GetOne["GET /api/problems/[id]"]
    end

    subgraph CoreServices ["Core Services & Helpers"]
        CitizenLib["src/lib/citizen.ts (getCitizenId)"]
        Validation["src/lib/validation.ts (Zod Schema)"]
        Storage["src/lib/storage.ts (saveImageFile)"]
        IdGen["src/lib/challengeId.ts (generateChallengeId)"]
        I18nServer["src/lib/i18n/server.ts (getServerDictionary)"]
    end

    subgraph StorageLayer ["Persistence"]
        PrismaClient["src/lib/prisma.ts"]
        Postgres[(PostgreSQL Database)]
        LocalFS[("Disk Storage: public/uploads")]
    end

    Browser -->|HTTP Request| Proxy
    Proxy -->|Set/Pass citizen_id| ServerApp
    UI_Report -->|Multipart FormData| API_Create
    API_Create --> Validation
    API_Create --> Storage
    Storage --> LocalFS
    API_Create --> CitizenLib
    API_Create --> IdGen
    API_Create --> PrismaClient
    PrismaClient --> Postgres

    RSC_Reports --> CitizenLib
    RSC_Reports --> I18nServer
    RSC_Reports --> PrismaClient

    RSC_Detail --> CitizenLib
    RSC_Detail --> I18nServer
    RSC_Detail --> PrismaClient
```

---

## 4. End-to-End Directory & File Walkthrough

```
c:\Work\SIH_FINAL\SIH_APP\SIH2026-Societal-Innovation-Portal-main
├── package.json              # Project dependencies & scripts
├── tsconfig.json              # TypeScript paths (@/* -> ./src/*)
├── next.config.ts             # Next.js configuration
├── prisma.config.ts           # Prisma configuration (DB URL, migrations)
├── prisma/
│   ├── schema.prisma          # Database schema (Problem & ProblemEvidence)
│   └── migrations/            # SQL migration history
├── public/
│   └── uploads/               # Local disk destination for uploaded evidence photos
└── src/
    ├── proxy.ts               # Next.js 16 request interceptor (anonymous citizen cookie)
    ├── lib/
    │   ├── prisma.ts          # PrismaClient singleton
    │   ├── citizen.ts         # Server-side citizen ID retrieval
    │   ├── challengeId.ts     # Collision-free Challenge ID generation
    │   ├── districts.ts       # 24 Districts of Jharkhand (autocomplete)
    │   ├── storage.ts         # File upload validation & disk writer
    │   ├── validation.ts      # Shared Zod validation schema & categories
    │   └── i18n/
    │       ├── index.ts       # Supported languages, constants, dictionary types
    │       ├── en.ts          # English dictionary (source of truth)
    │       ├── hi.ts          # Hindi dictionary
    │       └── server.ts      # Server-side cookie-based dictionary resolver
    ├── components/
    │   ├── LanguageProvider.tsx # Client-side language context & sync
    │   ├── ImageUploader.tsx    # Multi-file photo selector with object previews
    │   ├── LocationCapture.tsx  # Browser Geolocation API coordinator
    │   └── ui/
    │       ├── Button.tsx       # Standard touch-first buttons (primary, secondary, outline)
    │       ├── Field.tsx        # Accessible inputs (TextField, TextAreaField, SelectField)
    │       ├── PageHeader.tsx   # Mobile navigation header with back button
    │       └── StatusBadge.tsx  # Color-coded workflow badge (e.g. SUBMITTED)
    └── app/
        ├── layout.tsx         # Root HTML layout with viewport and LanguageProvider
        ├── globals.css        # Tailwind 4 directives and design tokens
        ├── page.tsx           # Route: / (Language Selection screen)
        ├── home/
        │   └── page.tsx       # Route: /home (Main Citizen Dashboard)
        ├── report/
        │   ├── page.tsx       # Route: /report (Interactive Submission Wizard)
        │   └── success/
        │       └── [id]/
        │           └── page.tsx # Route: /report/success/[id] (Submission receipt)
        ├── reports/
        │   ├── page.tsx       # Route: /reports (Citizen's submitted problems list)
        │   └── [id]/
        │       └── page.tsx   # Route: /reports/[id] (Single problem detail view)
        └── api/
            └── problems/
                ├── route.ts       # POST /api/problems & GET /api/problems
                └── [id]/
                    └── route.ts   # GET /api/problems/[id]
```

---

## 5. In-Depth Subsystem Deep Dives

### 5.1 Identity & Session Architecture (`src/proxy.ts` & `src/lib/citizen.ts`)
#### The Problem:
Citizens in rural/semi-urban areas frequently abandon apps when confronted with immediate sign-up forms, OTP barriers, or password requirements. However, submitted problems must still be associated with a citizen so they can track them on their device.

#### The Implementation:
1. **Next.js 16 Proxy Convention (`src/proxy.ts`)**:
   Instead of traditional Next.js middleware, Next 16 uses `proxy.ts`. It intercepts all requests except static assets (`_next/static`, `favicon.ico`).
2. **First-Request Cookie Injection**:
   ```typescript
   export const CITIZEN_ID_COOKIE = "citizen_id";

   export function proxy(request: NextRequest) {
     const existing = request.cookies.get(CITIZEN_ID_COOKIE);
     if (existing?.value) {
       return NextResponse.next();
     }

     const citizenId = crypto.randomUUID();
     // Mutate the incoming request so the immediate route handler can read it:
     request.cookies.set(CITIZEN_ID_COOKIE, citizenId);

     const response = NextResponse.next({ request });
     // Set a persistent 1-year HttpOnly cookie on the response:
     response.cookies.set(CITIZEN_ID_COOKIE, citizenId, {
       httpOnly: true,
       sameSite: "lax",
       path: "/",
       maxAge: 60 * 60 * 24 * 365,
     });
     return response;
   }
   ```
3. **Consumption (`src/lib/citizen.ts`)**:
   Server components and route handlers call `await getCitizenId()`, which reads the cookie store. If the cookie is missing, an error is thrown.
4. **Step 2 Migration Strategy**:
   When replacing this with real authentication (Supabase Auth or OTP), only `getCitizenId()` in `src/lib/citizen.ts` needs to be updated to inspect the auth session. Zero changes are needed across API routes or UI components.

---

### 5.2 Challenge ID Generation System (`src/lib/challengeId.ts`)
#### The Problem:
Internal database IDs are random UUIDs (`e.g., 550e8400-e29b-41d4-a716-446655440000`), which are impossible for citizens or government officials to reference over phone or paper. The system requires a clean, official tracking ID.

#### The Implementation:
- Format: `JH-<YEAR>-<6-DIGIT-SEQUENCE>` (e.g., `JH-2026-000001`).
- Atomic Sequence Generation:
  ```typescript
  export async function generateChallengeId(
    tx: Pick<typeof prisma, "problem">,
    year = new Date().getFullYear()
  ): Promise<string> {
    const prefix = `JH-${year}-`;
    const count = await tx.problem.count({
      where: { challengeId: { startsWith: prefix } },
    });
    const sequence = String(count + 1).padStart(6, "0");
    return `${prefix}${sequence}`;
  }
  ```
- **Concurrency Safety**:
  In `src/app/api/problems/route.ts`, this calculation runs **inside a Prisma interactive database transaction** (`prisma.$transaction(async (tx) => { ... })`). This guarantees that concurrent submissions cannot produce duplicate challenge IDs.

---

### 5.3 Bilingual i18n Architecture (`src/lib/i18n/` & `LanguageProvider.tsx`)
The app supports both **English (`en`)** and **Hindi (`hi`)**. Because Next.js mixes Client Components and Server Components, translation must work seamlessly in both worlds.

```
Client Action (select language)
   ├── Updates React State (t)
   ├── Writes to localStorage ("citizen_app_language")
   └── Sets Document Cookie ("citizen_app_language=hi")
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       Client Components (CSR)                 Server Components (RSC)
       `useT()` / `useLanguage()`              `await getServerDictionary()`
       Re-renders UI instantly                 Reads cookie on server request
```

1. **Client Tier (`LanguageProvider.tsx`)**:
   - `useState` initializes with the default language (`en`).
   - `useEffect` checks `localStorage` after mount to avoid server/client hydration mismatches.
   - When language changes, it updates state, sets `localStorage`, and updates `document.cookie`.
2. **Server Tier (`src/lib/i18n/server.ts`)**:
   - For React Server Components (like `/reports`, `/reports/[id]`, and `/report/success/[id]`), `getServerDictionary()` reads `cookies()` directly.
   - The server renders translated HTML before sending it down the wire, preventing flashes of unstyled or incorrectly translated content.
3. **Strict Typings**:
   `Dictionary` is defined as `Record<keyof typeof en, string>`, guaranteeing that every translation key present in `en.ts` is strictly required in `hi.ts`.

---

### 5.4 Form Handling, Validation & Wizard (`src/app/report/page.tsx`)
The problem reporting interface is an interactive two-stage client wizard:
1. **Stage 1 (`form`)**:
   - **Title**: Text input (5 to 200 chars).
   - **Description**: Textarea (20 to 5000 chars).
   - **Category**: Dropdown selecting from standard societal categories (`Water & Sanitation`, `Health`, `Education`, `Roads & Infrastructure`, `Electricity`, `Agriculture`, `Environment`, `Other`).
   - **District**: Free-text field with HTML `<datalist>` autocomplete suggesting the 24 official districts of Jharkhand (`src/lib/districts.ts`). Free text is preserved so unlisted sub-districts never block a citizen.
   - **Village / Locality**: Text input.
   - **People Affected**: Optional integer.
   - **Photos (`ImageUploader`)**: Up to 5 image uploads with local blob previews (`URL.createObjectURL`), cleanup (`URL.revokeObjectURL`), and mobile camera capture (`capture="environment"`).
   - **Location (`LocationCapture`)**: One-tap GPS capture using the browser `navigator.geolocation.getCurrentPosition` API with `enableHighAccuracy: true`. If permission is denied or GPS is unavailable, the user can still proceed.
2. **Stage 2 (`review`)**:
   - Validates client state against the shared Zod schema (`problemInputSchema`).
   - If invalid, sets inline error highlights on fields.
   - If valid, transitions to a read-only summary review card where the citizen verifies their details before final submission.
3. **Network Submission**:
   - Encodes data as `multipart/form-data`.
   - Sends to `POST /api/problems`.
   - On success, navigates to `/report/success/${challengeId}`.

---

### 5.5 File Storage Pipeline (`src/lib/storage.ts`)
- **Incoming Files**: Captured from `FormData` via `formData.getAll("images")`.
- **Validation**:
  - Whitelisted MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`.
  - Max file size: 10MB per image.
- **Physical Disk Storage**:
  - Saved to `public/uploads/<randomUUID>.<ext>`.
  - Directory created dynamically via `fs/promises.mkdir(..., { recursive: true })`.
- **Database Abstraction**:
  - Returns `{ url: '/uploads/<filename>', fileType: 'image' }`.
  - Decoupled design: In Step 2, swapping `saveImageFile` to upload to Supabase Storage or an S3 bucket only requires editing this one file.

---

### 5.6 Database Schema & Data Models (`prisma/schema.prisma`)

```prisma
model Problem {
  id              String   @id @default(uuid())
  challengeId     String   @unique @map("challenge_id")
  citizenId       String   @map("citizen_id")

  title           String
  description     String
  category        String?
  district        String
  villageLocality String   @map("village_locality")
  peopleAffected  Int?     @map("people_affected")

  latitude        Float?
  longitude       Float?

  status          String   @default("SUBMITTED")

  evidence        ProblemEvidence[]

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([citizenId])
  @@map("problems")
}

model ProblemEvidence {
  id        String   @id @default(uuid())
  problemId String   @map("problem_id")
  problem   Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)

  fileUrl   String   @map("file_url")
  fileType  String   @map("file_type") // "image" | "video" | "document"

  createdAt DateTime @default(now()) @map("created_at")

  @@index([problemId])
  @@map("problem_evidence")
}
```

#### Key Design Decisions in the Schema:
1. **`status` as a String instead of an Enum**:
   Future phases will introduce workflow statuses such as `AI_ANALYSED`, `DUPLICATE_FLAGGED`, `GOVERNMENT_REVIEW`, `VALIDATED`, `ASSIGNED_TO_UNIVERSITY`, `IN_PROGRESS`, and `RESOLVED`. Using a string prevents having to run database migrations whenever a new workflow state is added.
2. **Separation of `challengeId` and `id`**:
   `id` is an internal UUID used for primary key indexing and relational foreign keys. `challengeId` is a clean public reference for citizens and authorities.
3. **`ProblemEvidence.fileType` Flexibility**:
   While Step 1 UI only uploads images, `fileType` is modeled to support `"video"` and `"document"` without altering the table structure.
4. **Cascade Deletes (`onDelete: Cascade`)**:
   Deleting a problem record automatically purges its associated evidence records.
5. **Index on `citizenId`**:
   Enables fast lookup queries for the `/reports` dashboard.

---

### 5.7 API Endpoint Mechanics (`src/app/api/`)

#### `POST /api/problems` (`src/app/api/problems/route.ts`)
1. Reads `citizenId` via `getCitizenId()`.
2. Extracts fields from `request.formData()`.
3. Validates non-file fields using `problemInputSchema.safeParse`. Returns HTTP 400 with field errors if invalid.
4. Validates and saves each attached file via `saveImageFile(file)`.
5. Executes an atomic transaction:
   - Queries count to generate next `challengeId`.
   - Creates the `Problem` record.
   - Creates nested `ProblemEvidence` records.
6. Returns HTTP 201 with the created problem object.

#### `GET /api/problems` (`src/app/api/problems/route.ts`)
1. Reads `citizenId`.
2. Queries all problems matching `citizenId`, sorted by `createdAt: "desc"`.
3. Includes attached evidence.
4. Returns `{ problems }`.

#### `GET /api/problems/[id]` (`src/app/api/problems/[id]/route.ts`)
1. Reads `citizenId`.
2. Accepts either the internal UUID `id` OR the public `challengeId`.
3. Scopes the lookup strictly to the authenticated `citizenId` (preventing unauthorized citizens from reading other reports).
4. Returns HTTP 404 if not found, or HTTP 200 with `{ problem }`.

---

### 5.8 Server vs. Client Component Rendering Architecture

| Route / File | Type | Rendering Strategy | Rationale |
|---|---|---|---|
| `/` (`src/app/page.tsx`) | Client (`"use client"`) | Dynamic Client-Side | Interactive language toggle that updates context and navigates. |
| `/home` (`src/app/home/page.tsx`) | Client (`"use client"`) | Dynamic Client-Side | Uses `useT()` hook for instantaneous language switching. |
| `/report` (`src/app/report/page.tsx`) | Client (`"use client"`) | Dynamic Client-Side | Complex form state, camera input, GPS APIs, multi-step review navigation. |
| `/report/success/[id]` | Server Component | Dynamic Server-Side (RSC) | Reads server cookies, fetches problem directly via Prisma, streams completed HTML to client. |
| `/reports` (`src/app/reports/page.tsx`) | Server Component | Dynamic Server-Side (RSC) | Queries Prisma directly on server scoped to citizen cookie; zero client JavaScript data-fetching boilerplate. |
| `/reports/[id]` (`src/app/reports/[id]/page.tsx`) | Server Component | Dynamic Server-Side (RSC) | Directly queries problem with evidence relation; renders 404 via `notFound()` if not found. |

---

### 5.9 UI/UX & Accessibility Standards
1. **Target Demographic Considerations**:
   Designed for citizens in Jharkhand across varying digital literacy levels and device capabilities.
2. **Large Touch Targets**:
   Buttons and input elements specify `min-h-14` (56px minimum height) to prevent misclicks on touchscreens.
3. **High-Contrast Brand Color Palette**:
   - `--brand`: `#0f4c3a` (Deep forest green representing Jharkhand's natural identity).
   - `--brand-dark`: `#0a3327`.
   - `--background`: `#f8fafc` (Soft slate for readability).
4. **Accessible Focus Rings**:
   ```css
   :focus-visible {
     outline: 3px solid var(--brand);
     outline-offset: 2px;
   }
   ```
5. **Fail-Safe Fallbacks**:
   GPS is strictly optional. If geolocation permissions are denied or fail to lock, the user is never blocked from reporting.

---

## 6. Verification & Step-by-Step Setup Guide

### Local Environment Setup:
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Database**:
   Set `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/citizen_app?schema=public"
   ```
   Or spin up Prisma dev database:
   ```bash
   npx prisma dev -n citizen-app -d
   ```
3. **Apply Database Migrations**:
   ```bash
   npx prisma migrate dev
   ```
4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## 7. Strategic Extension Points for Step 2+ (Future Milestones)

| Feature Area | Current Step 1 State | Target Step 2+ Implementation | Files to Touch |
|---|---|---|---|
| **Authentication** | Anonymous cookie (`citizen_id`) in `src/proxy.ts` | Supabase Auth / OTP / DigiLocker | Update `src/lib/citizen.ts` and `src/proxy.ts` |
| **Media Storage** | Local disk (`public/uploads`) | Supabase Storage / S3 CDN bucket | Update `src/lib/storage.ts` |
| **AI Triaging** | Status stays `SUBMITTED` | Background worker: LLM categorization, duplicate detection, severity scoring, audio-to-text translation | Hook into `POST /api/problems/route.ts` or a message queue |
| **Government Portal** | Not implemented | Departmental dashboard to review, approve, and allocate budget to challenges | New route group `src/app/admin/` or `src/app/portal/` |
| **Academic / Solver Hub** | Not implemented | Universities & R&D teams browse challenges and submit research proposals / prototypes | New route group `src/app/solver/` |
| **Citizen Notifications** | Placeholder card on `/home` | Push notifications / SMS updates on status transitions (e.g. `IN_PROGRESS`, `RESOLVED`) | Integration with SMS gateway or Web Push API |
