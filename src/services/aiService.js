/**
 * AI client — talks to the `ai-analyze` Supabase Edge Function.
 *
 * The Gemini key lives only in the function's secrets, never in the bundle.
 * If the function is unreachable the caller gets a structured error so the UI
 * can show a retry state instead of crashing.
 */
import { supabase, isSupabaseConfigured } from './supabase';

export const AI_STAGES = [
  'Detecting language and translating to English',
  'Classifying the societal domain',
  'Scoring severity and population impact',
  'Searching existing challenges for duplicates',
  'Ranking university research fit',
  'Ranking industry capability fit',
  'Composing the recommendation',
];

/** Runs the full AI pipeline for one challenge and persists the result. */
export async function runAiAnalysis(challenge) {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env' };
  }
  try {
    const { data, error } = await supabase.functions.invoke('ai-analyze', {
      body: {
        challengeCode: challenge.code || challenge.id,
        title: challenge.title,
        description: challenge.description,
        district: challenge.district,
        village: challenge.village,
        affected: challenge.affected ?? 0,
      },
    });
    if (error) return { ok: false, error: error.message || 'AI service unreachable' };
    if (!data?.ok) return { ok: false, error: data?.error || 'AI service returned no analysis' };
    return { ok: true, analysis: data.analysis };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

/** Reads a stored analysis (used when opening a challenge that was already analysed). */
export async function fetchAiAnalysis(code) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('ai_analysis').select('*').eq('challenge_code', code).maybeSingle();
  if (error) {
    console.warn('ai_analysis read failed:', error.message);
    return null;
  }
  return data;
}

/** Platform-wide AI statistics for the AI Intelligence dashboard. */
export async function fetchAiStats() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('ai_analysis')
    .select('challenge_code, engine, model, category, category_confidence, priority_score, priority_level, severity_score, duplicate_count, duration_ms, created_at, university_matches, industry_matches, required_expertise, detected_language')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('ai stats read failed:', error.message);
    return null;
  }
  return data ?? [];
}
