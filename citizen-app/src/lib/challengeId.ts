import { supabase } from "@/lib/supabaseServer";

// Generates a human-readable Challenge ID (e.g. JH-2026-000123)
// Queries the Supabase challenges table directly.
export async function generateChallengeId(
  year = new Date().getFullYear()
): Promise<string> {
  const prefix = `JH-${year}-`;
  try {
    const { count, error } = await supabase
      .from("challenges")
      .select("code", { count: "exact", head: true })
      .ilike("code", `${prefix}%`);

    if (error) {
      // If query fails, fall back to random code
      const fallbackSeq = String(Math.floor(1000 + Math.random() * 9000));
      return `CH-${fallbackSeq}`;
    }

    const sequence = String((count ?? 0) + 1).padStart(6, "0");
    return `${prefix}${sequence}`;
  } catch {
    const fallbackSeq = String(Math.floor(1000 + Math.random() * 9000));
    return `CH-${fallbackSeq}`;
  }
}
