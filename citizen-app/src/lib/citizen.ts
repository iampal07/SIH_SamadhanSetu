import { cookies, headers } from "next/headers";
import { CITIZEN_ID_COOKIE } from "@/proxy";
import { supabase } from "@/lib/supabaseServer";

// Resolves the citizen identifier.
// 1. Prefers Supabase Auth session if present (reads 'sb-access-token' cookie or Bearer Authorization header).
//    When authenticated, maps user.id to citizenId and ensures a profiles record exists.
// 2. Falls back to the anonymous citizen_id cookie (set by src/proxy.ts) when no active session exists.
export async function getCitizenId(): Promise<string> {
  const store = await cookies();

  // Check for Supabase access token in cookies or Authorization header
  let token = store.get("sb-access-token")?.value;
  if (!token) {
    try {
      const headerList = await headers();
      const authHeader = headerList.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.slice(7).trim();
      }
    } catch {
      // Header inspection failed or not in request context
    }
  }

  if (token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user?.id) {
        const userId = data.user.id;
        // Ensure profiles row exists in database (create/upsert if table exists)
        try {
          await supabase.from("profiles").upsert(
            { id: userId, updated_at: new Date().toISOString() },
            { onConflict: "id" }
          );
        } catch {
          // Ignored if profiles table does not exist in schema
        }
        return userId;
      }
    } catch {
      // Token verification failed; fall back to anonymous cookie
    }
  }

  const id = store.get(CITIZEN_ID_COOKIE)?.value;
  if (!id) {
    throw new Error(
      "Missing citizen identity cookie. Proxy/middleware should have set this."
    );
  }
  return id;
}
