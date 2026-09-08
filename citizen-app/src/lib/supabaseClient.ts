import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://jsbyehfzerpmjqpiwgou.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_4ap9RTIESkv-zpYDKuNBaA_qQZzLJMn";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

// Browser-safe Supabase client for client components, authentication, and OAuth
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
