/**
 * Seeds Supabase with the demo dataset as REAL database records.
 *
 *   npm run seed          # insert what is missing
 *   npm run seed -- --reset   # wipe lifecycle tables first, then insert
 *
 * The dashboards read only from Supabase, so this is what makes the demo
 * reproducible on a fresh project without any hardcoded UI data.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { buildSeedChallenges } from '../src/data/seedChallenges.js';
import { STAGE_INDEX } from '../src/data/constants.js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) { console.error('Missing Supabase credentials in .env'); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });
const reset = process.argv.includes('--reset');

const LIFECYCLE_TABLES = [
  'citizen_feedback', 'deployments', 'government_reviews', 'industry_support',
  'solutions', 'project_milestones', 'team_members', 'teams', 'project_updates',
  'ai_analysis', 'challenge_media', 'activity_log', 'notifications', 'projects', 'challenges',
];

async function wipe() {
  for (const t of LIFECYCLE_TABLES) {
    const { error } = await db.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.warn(`  ! could not clear ${t}: ${error.message}`);
    else console.log(`  cleared ${t}`);
  }
}

const iso = (d) => (d ? new Date(d).toISOString() : null);

async function main() {
  console.log(`Seeding ${url}`);
  if (reset) { console.log('Resetting lifecycle tables…'); await wipe(); }

  const existing = await db.from('challenges').select('code');
  const have = new Set((existing.data ?? []).map((r) => r.code));

  const seed = buildSeedChallenges();
  let inserted = 0;

  for (const c of seed) {
    if (have.has(c.code)) { console.log(`  skip ${c.code} (already present)`); continue; }
    const reached = STAGE_INDEX[c.status];

    /* challenge */
    const { data: ch, error: chErr } = await db.from('challenges').insert({
      code: c.code, title: c.title, description: c.description, category: c.category,
      district: c.district, village: c.village, affected_population: c.affected,
      citizen_name: c.citizen.name, status: c.status,
      validation_status: c.validation.status, validated_by: c.validation.by,
      validation_notes: c.validation.note,
      priority_score: c.priority?.score ?? 50, priority_level: c.priority?.level ?? 'MEDIUM',
      attachments: [], upvotes: c.upvotes, created_at: iso(c.createdAt),
    }).select().single();
    if (chErr) { console.error(`  ! ${c.code}: ${chErr.message}`); continue; }
    inserted += 1;

    /* media */
    if (c.attachments?.length) {
      await db.from('challenge_media').insert(c.attachments.map((a) => ({
        challenge_id: ch.id, challenge_code: c.code, name: a.name,
        url: a.url ?? `https://images.unsplash.com/photo-1541544181051-e46607bc22a4?w=900&q=70`,
        media_type: a.type ?? 'image', size_label: a.size, uploaded_by_name: c.citizen.name,
      })));
    }

    /* ai analysis */
    if (c.ai) {
      await db.from('ai_analysis').insert({
        challenge_id: ch.id, challenge_code: c.code,
        engine: 'heuristic', model: 'samadhan-heuristic-v1', status: 'completed',
        detected_language: 'English', english_text: `${c.title}. ${c.description}`, language_confidence: 0.95,
        category: c.category, category_confidence: c.ai.classification.confidence,
        alternate_categories: c.ai.classification.alternates, keywords: c.ai.classification.keywords,
        severity_score: Math.round((c.priority.score / 10) * 10) / 10,
        severity_reasoning: 'Seeded baseline analysis from the deterministic engine.',
        criticality_score: c.priority.score,
        priority_score: c.priority.score, priority_level: c.priority.level,
        priority_factors: c.priority.factors,
        duplicates: c.ai.duplicates, duplicate_count: c.ai.duplicates.length,
        university_matches: c.ai.universityMatches, industry_matches: c.ai.industryMatches,
        disciplines: c.ai.disciplines, required_expertise: c.ai.disciplines,
        created_at: iso(c.createdAt),
      });
    }

    /* project */
    let projectId = null;
    if (c.university) {
      const { data: pr, error } = await db.from('projects').insert({
        challenge_id: ch.id, challenge_code: c.code, stage: c.status,
        progress_pct: Math.round(((reached + 1) / 12) * 100),
        university_id: c.university.id, university_name: c.university.name,
        university_short: c.university.short, university_district: c.university.district,
        match_score: c.university.matchScore, accepted_at: iso(c.university.acceptedAt),
        accepted_by: c.university.name,
        proposal: c.proposal ?? {}, industry_need: c.industryNeed ?? {},
        impact: c.impact ?? {}, history: c.history ?? [],
      }).select().single();
      if (error) console.warn(`  ! project ${c.code}: ${error.message}`);
      projectId = pr?.id ?? null;
    }

    /* team */
    if (c.team && projectId) {
      const { data: tm } = await db.from('teams').insert({
        project_id: projectId, challenge_code: c.code, name: c.team.name,
        disciplines: c.team.disciplines, formed_at: iso(c.team.formedAt),
      }).select().single();
      if (tm && c.team.members?.length) {
        await db.from('team_members').insert(c.team.members.map((m) => ({
          team_id: tm.id, member_ref: m.id, name: m.name, member_role: m.role,
          dept: m.dept, experience: m.exp, skills: m.skills ?? [],
        })));
      }
    }

    /* milestones */
    if (c.milestones?.length) {
      await db.from('project_milestones').insert(c.milestones.map((m, i) => ({
        project_id: projectId, challenge_code: c.code, milestone_key: m.id, seq: i + 1,
        title: m.title, owner: m.owner, due: iso(m.due), status: m.status, progress: m.progress,
      })));
    }

    /* industry support */
    if (c.partners?.length) {
      await db.from('industry_support').insert(c.partners.map((p) => ({
        project_id: projectId, challenge_code: c.code, industry_id: p.id,
        industry_name: p.name, industry_short: p.short, industry_type: p.type,
        support_types: p.supports, amount_label: p.amount,
        amount: Number(String(p.amount).replace(/[^0-9]/g, '')) || null,
        status: 'committed', created_at: iso(p.joinedAt),
      })));
    }

    /* solution / prototype for advanced projects */
    if (reached >= STAGE_INDEX.prototype && projectId) {
      await db.from('solutions').insert({
        project_id: projectId, challenge_code: c.code,
        title: `${c.category} solution for ${c.village}`,
        abstract: c.proposal?.objective ?? c.description.slice(0, 240),
        trl: reached >= STAGE_INDEX.deployment ? 8 : 6,
        estimated_funding: 2850000, funding_raised: c.partners.length ? 1850000 : 0,
        integration_requirements: ['Field power supply', 'Community maintenance training'],
        faculty_lead: c.team?.members?.find((m) => m.role === 'Faculty')?.name ?? 'Faculty Lead',
        student_contributors: (c.team?.members ?? []).filter((m) => m.role === 'Student').map((m) => m.name),
        is_industry_ready: true, prototype_ready: true, status: 'published',
        published_at: iso(c.createdAt),
      });
    }

    /* deployment + impact */
    if (c.impact) {
      await db.from('deployments').insert({
        project_id: projectId, challenge_code: c.code, deployed_by: 'District Administration',
        summary: c.impact.summary, beneficiaries: c.impact.beneficiaries,
        metrics: c.impact.metrics, sustainability: c.impact.sustainability,
        duration_months: c.impact.durationMonths,
      });
    }

    /* activity trail */
    if (c.history?.length) {
      await db.from('activity_log').insert(c.history.map((h) => ({
        challenge_code: c.code, stage: h.stage, actor_role: h.by,
        actor_name: h.by === 'ai' ? 'AI Engine' : h.by === 'govt' ? 'District Innovation Cell'
          : h.by === 'varsity' ? (c.university?.name ?? 'University') : h.by === 'industry'
            ? (c.partners[0]?.name ?? 'Industry Partner') : c.citizen.name,
        action: `Stage: ${h.stage}`, detail: h.note, created_at: iso(h.at),
      })));
    }

    console.log(`  + ${c.code} ${c.title.slice(0, 48)}`);
  }

  /* a few starting notifications so the bells are not empty */
  const { count } = await db.from('notifications').select('*', { count: 'exact', head: true });
  if (!count) {
    await db.from('notifications').insert([
      { role: 'govt', text: 'Challenges awaiting validation in your district', tone: 'info', link: '/government/challenges' },
      { role: 'varsity', text: 'AI recommended new challenges matching your research domains', tone: 'info', link: '/university/challenges' },
      { role: 'industry', text: 'A proposal is seeking industry support', tone: 'info', link: '/industry/opportunities' },
      { role: 'citizen', text: 'Your challenge completed impact measurement', tone: 'success', link: '/citizen/challenges' },
    ]);
  }

  console.log(`Done — ${inserted} challenges inserted.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
