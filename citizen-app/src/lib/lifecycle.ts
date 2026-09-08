// Mirrors the 12-stage challenge lifecycle defined by the website
// (SIH_SamadhanSetu `src/data/constants.js` STAGES). Keep stage keys and
// order in sync with that file — this is the single lifecycle definition
// shared by both apps via the `challenges.status` column in Supabase.
export const LIFECYCLE_STAGES = [
  { key: "SUBMITTED", label: "Submitted", color: "bg-amber-100 text-amber-800" },
  { key: "AI_ANALYSED", label: "AI Analysed", color: "bg-indigo-100 text-indigo-800" },
  { key: "VALIDATED", label: "Validated", color: "bg-emerald-100 text-emerald-800" },
  { key: "UNIVERSITY_MATCHED", label: "University Matched", color: "bg-cyan-100 text-cyan-800" },
  { key: "TEAM_FORMED", label: "Team Formed", color: "bg-cyan-100 text-cyan-800" },
  { key: "PROPOSAL_CREATED", label: "Proposal Created", color: "bg-cyan-100 text-cyan-800" },
  { key: "INDUSTRY_MATCHED", label: "Industry Onboard", color: "bg-orange-100 text-orange-800" },
  { key: "PROTOTYPE", label: "Prototype", color: "bg-orange-100 text-orange-800" },
  { key: "TESTING", label: "Testing", color: "bg-orange-100 text-orange-800" },
  { key: "PILOT", label: "Pilot", color: "bg-purple-100 text-purple-800" },
  { key: "DEPLOYMENT", label: "Deployment", color: "bg-emerald-100 text-emerald-800" },
  { key: "IMPACT_MEASURED", label: "Impact Measured", color: "bg-emerald-100 text-emerald-800" },
] as const;

const BY_KEY = new Map<string, (typeof LIFECYCLE_STAGES)[number]>(
  LIFECYCLE_STAGES.map((s) => [s.key, s])
);

export function lifecycleStage(status: string | null | undefined) {
  const key = (status ?? "SUBMITTED").toUpperCase();
  return BY_KEY.get(key) ?? { key, label: humanize(key), color: "bg-slate-100 text-slate-700" };
}

function humanize(key: string) {
  return key
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
