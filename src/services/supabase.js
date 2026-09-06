import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// True if real Supabase credentials are configured in .env
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-ref')
);

// Fallback dummy client if no env provided yet so app never crashes
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: async () => ({ data: null, error: new Error('Supabase credentials not configured in .env') }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
      }),
    };

/**
 * Initiates Google OAuth Sign-in through Supabase
 */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase credentials are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Signs up a new user with Email & Password and stores role & account info in user metadata
 */
export async function signUpWithEmail(email, password, metadata = {}) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials are missing in .env file.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: metadata.full_name || '',
        role: metadata.role || 'citizen',
        district: metadata.district || 'Ranchi',
        organization_name: metadata.organization_name || '',
      },
    },
  });

  if (error) throw error;

  // Also create/update public.profiles entry immediately
  if (data?.user) {
    await saveUserProfile({
      id: data.user.id,
      email: data.user.email,
      full_name: metadata.full_name || data.user.email.split('@')[0],
      role: metadata.role || 'citizen',
      district: metadata.district || 'Ranchi',
      organization_name: metadata.organization_name || '',
    }).catch((err) => console.warn('Profile sync fallback:', err));
  }

  return data;
}

/**
 * Signs in an existing user with Email & Password
 */
export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials are missing in .env file.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Signs out the currently authenticated user
 */
export async function signOutUser() {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Fetches user profile from public.profiles
 */
export async function fetchUserProfile(userId) {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching profile:', error);
  }
  return data || null;
}

/**
 * Creates or updates user profile with selected role and metadata
 */
export async function saveUserProfile(profileData) {
  if (!isSupabaseConfigured) return profileData;
  const payload = {
    ...profileData,
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from('profiles')
    .upsert(payload)
    .select()
    .single();

  // If Supabase schema cache hasn't loaded 'is_onboarded' or it doesn't exist yet, retry without it
  if (error && (error.message?.includes('is_onboarded') || error.details?.includes('is_onboarded') || error.code === 'PGRST204')) {
    console.warn("Retrying profile upsert without 'is_onboarded' column:", error.message);
    const fallbackPayload = { ...payload };
    delete fallbackPayload.is_onboarded;

    const retry = await supabase
      .from('profiles')
      .upsert(fallbackPayload)
      .select()
      .single();

    if (retry.error) throw retry.error;
    data = { ...retry.data, is_onboarded: true };
  } else if (error) {
    throw error;
  }

  return data;
}
