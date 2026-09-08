import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://jsbyehfzerpmjqpiwgou.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_4ap9RTIESkv-zpYDKuNBaA_qQZzLJMn";

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

// Server-side Supabase client for data access, storage uploads, and auth resolution.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
