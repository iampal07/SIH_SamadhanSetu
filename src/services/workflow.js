/**
 * workflow.js — the single Supabase persistence layer for the connected
 * Citizen → Government → University → Industry → Deployment → Feedback lifecycle.
 *
 * The reducer in PlatformContext stays the synchronous source of truth for the UI;
 * every workflow mutation is mirrored here into normalised Supabase tables
 * (projects / teams / milestones / solutions / industry_support / deployments /
 * citizen_feedback / notifications / activity_log) and read back through Realtime,
 * so every dashboard sees the same project state after a refresh or role switch.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import { uploadFileToSupabase } from './db';
import { runAnalysis } from './aiEngine';
import { STAGE_INDEX, STAGES } from '../data/constants';

/* Flipped to false the first time a workflow table is missing so the app degrades
   gracefully (pure local mode) instead of spamming the console on every action. */
let workflowTablesReady = isSupabaseConfigured;
export const isWorkflowPersistent = () => workflowTablesReady;

function noteMissing(err, where) {
  if (!err) return false;
  const msg = `${err.message || ''} ${err.details || ''}`;
  if (err.code === '42P01' || /does not exist|schema cache/i.test(msg)) {
    if (workflowTablesReady) {
      console.warn(
        `[SamadhanSetu] Workflow tables not found (${where}). Run supabase_workflow_schema.sql in the Supabase SQL editor to enable shared persistence. Running in local mode for now.`
      );
    }
    workflowTablesReady = false;
    return true;
  }
  console.warn(`[SamadhanSetu] Supabase notice (${where}):`, err.message || err);
  return false;
}

const nowIso = () => new Date().toISOString();
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const parseAmount = (v) => num(String(v ?? '').replace(/[^0-9.]/g, ''));

/* ══════════════════════════════════════════════════════════════════════
   READ — full workflow snapshot
   ══════════════════════════════════════════════════════════════════════ */
const WORKFLOW_TABLES = [
  ['media', 'challenge_media'],
  ['projects', 'projects'],
  ['teams', 'teams'],
  ['members', 'team_members'],
  ['milestones', 'project_milestones'],
  ['solutions', 'solutions'],
  ['support', 'industry_support'],
  ['reviews', 'government_reviews'],
  ['deployments', 'deployments'],
  ['feedback', 'citizen_feedback'],
  ['updates', 'project_updates'],
  ['activity', 'activity_log'],
];

export async function fetchWorkflowSnapshot() {
  const empty = {
    challenges: [], media: [], projects: [], teams: [], members: [], milestones: [],
    solutions: [], support: [], reviews: [], deployments: [], feedback: [], updates: [], activity: [],
  };
  if (!isSupabaseConfigured) return empty;

  const snap = { ...empty };

  const ch = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
  if (ch.error) { noteMissing(ch.error, 'challenges'); return snap; }
  snap.challenges = ch.data || [];

  if (!workflowTablesReady) return snap;

  const results = await Promise.all(
    WORKFLOW_TABLES.map(([, table]) => supabase.from(table).select('*'))
  );
  results.forEach((res, i) => {
    const [key, table] = WORKFLOW_TABLES[i];
    if (res.error) { noteMissing(res.error, table); return; }
    snap[key] = res.data || [];
  });
  return snap;
}

export async function fetchNotifications(limit = 120) {
  if (!isSupabaseConfigured || !workflowTablesReady) return null;
  const { data, error } = await supabase
    .from('notifications').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) { noteMissing(error, 'notifications'); return null; }
  return (data || []).map((n) => ({
    id: n.id, role: n.role, text: n.text, tone: n.tone || 'info',
    at: n.created_at, read: !!n.read, challengeId: n.challenge_code, link: n.link,
  }));
}

/* ══════════════════════════════════════════════════════════════════════
   HYDRATE — DB rows → the client challenge shape the dashboards already use
   ══════════════════════════════════════════════════════════════════════ */
function groupBy(rows, key) {
  const m = new Map();
  for (const r of rows) {
    const k = r[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

export function hydrateChallenges(snap, allForAi = []) {
  const mediaBy = groupBy(snap.media, 'challenge_code');
  const projectBy = new Map(snap.projects.map((p) => [p.challenge_code, p]));
  const teamBy = new Map(snap.teams.map((t) => [t.challenge_code, t]));
  const membersBy = groupBy(snap.members, 'team_id');
  const msBy = groupBy(snap.milestones, 'challenge_code');
  const solutionBy = new Map(snap.solutions.map((s) => [s.challenge_code, s]));
  const supportBy = groupBy(snap.support, 'challenge_code');
  const reviewsBy = groupBy(snap.reviews, 'challenge_code');
  const deployBy = new Map(snap.deployments.map((d) => [d.challenge_code, d]));
  const feedbackBy = groupBy(snap.feedback, 'challenge_code');
  const updatesBy = groupBy(snap.updates, 'challenge_code');
  const activityBy = groupBy(snap.activity, 'challenge_code');

  const built = [...allForAi];

  return snap.challenges.map((rec) => {
    const code = rec.code || rec.id;
    const proj = projectBy.get(code) || null;
    const team = teamBy.get(code) || null;
    const sol = solutionBy.get(code) || null;
    const dep = deployBy.get(code) || null;

    let attachments = [];
    if (Array.isArray(rec.attachments)) attachments = rec.attachments;
    else if (typeof rec.attachments === 'string') { try { attachments = JSON.parse(rec.attachments); } catch { attachments = []; } }
    const mediaRows = mediaBy.get(code) || [];
    for (const m of mediaRows) {
      if (!attachments.some((a) => a.url && a.url === m.url)) {
        attachments.push({ name: m.name, url: m.url, size: m.size_label, type: m.media_type, storagePath: m.storage_path });
      }
    }

    const c = {
      id: code,
      code,
      dbId: rec.id,
      title: rec.title,
      description: rec.description,
      category: rec.category || 'Public Services',
      district: rec.district || 'Ranchi',
      village: rec.village || rec.district,
      affected: num(rec.affected_population),
      citizen: { name: rec.citizen_name || 'Citizen', id: rec.citizen_id || 'cit-me' },
      createdAt: rec.created_at || nowIso(),
      attachments,
      status: STAGE_INDEX[rec.status] !== undefined ? rec.status : 'submitted',
      upvotes: num(rec.upvotes) || 1,
      priority: rec.priority_score ? { score: rec.priority_score, level: rec.priority_level || 'MEDIUM' } : null,
      validation: {
        status: rec.validation_status || 'pending',
        by: rec.validated_by || null,
        at: rec.validated_by ? rec.created_at : null,
        note: rec.validation_notes || null,
      },
      history: [],
      partners: [],
      milestones: [],
      updates: [],
      recommendedTo: [],
      seeded: false,
      fromSupabase: true,
    };

    /* Self-healing: a challenge cannot be past "validated" without a project
       record behind it. This repairs rows left half-advanced by older writes
       so the lifecycle tracker never claims a stage the data cannot back up. */
    if (!proj) {
      const cap = c.validation.status === 'validated'
        ? STAGE_INDEX.validated
        : (rec.priority_score ? STAGE_INDEX.ai_analysed : STAGE_INDEX.submitted);
      if ((STAGE_INDEX[c.status] ?? 0) > cap) c.status = STAGES[cap].key;
    }

    try {
      const ai = runAnalysis(c, built);
      c.ai = STAGE_INDEX[c.status] >= STAGE_INDEX.ai_analysed ? ai : null;
      // Rows written before the AI ran carry the placeholder 50/MEDIUM score.
      const placeholder = rec.priority_score === 50 && (rec.priority_level ?? 'MEDIUM') === 'MEDIUM';
      if (c.ai && (!c.priority || placeholder)) c.priority = ai.priority;
      if (c.ai && rec.category !== ai.category && !rec.category) c.category = ai.category;
      c.recommendedTo = ai.universityMatches?.slice(0, 3).map((m) => m.id) || [];
      built.push(c);
    } catch { /* AI is best-effort */ }

    /* ── project record ── */
    if (proj) {
      if (STAGE_INDEX[proj.stage] > STAGE_INDEX[c.status]) c.status = proj.stage;
      c.projectId = proj.id;
      if (proj.university_id) {
        c.university = {
          id: proj.university_id, name: proj.university_name, short: proj.university_short,
          district: proj.university_district, matchScore: proj.match_score ?? 88, acceptedAt: proj.accepted_at,
        };
        if (!c.recommendedTo.includes(proj.university_id)) c.recommendedTo = [proj.university_id, ...c.recommendedTo];
      }
      c.proposal = proj.proposal || null;
      c.industryNeed = proj.industry_need || null;
      c.impact = proj.impact || null;
      if (Array.isArray(proj.history) && proj.history.length) c.history = proj.history;
    }

    if (!c.history.length) {
      c.history = STAGES.slice(0, STAGE_INDEX[c.status] + 1).map((s) => ({
        stage: s.key, at: c.createdAt, by: s.owner, note: null,
      }));
    }

    /* ── team ── */
    if (team) {
      c.team = {
        id: team.id,
        name: team.name,
        disciplines: team.disciplines || [],
        formedAt: team.formed_at,
        members: (membersBy.get(team.id) || []).map((m) => ({
          id: m.member_ref || m.id, name: m.name, role: m.member_role, dept: m.dept,
          exp: m.experience, skills: m.skills || [],
        })),
      };
    } else c.team = null;

    /* ── milestones ── */
    const ms = (msBy.get(code) || []).sort((a, b) => a.seq - b.seq);
    c.milestones = ms.map((m) => ({
      id: m.milestone_key, title: m.title, owner: m.owner, due: m.due,
      status: m.status, progress: num(m.progress),
    }));

    /* ── solution / prototype ── */
    if (sol) {
      c.prototypeData = {
        id: sol.id,
        title: sol.title, abstract: sol.abstract, trl: sol.trl,
        demoUrl: sol.demo_url, videoDemoUrl: sol.video_demo_url,
        estimatedFunding: num(sol.estimated_funding), fundingRaised: num(sol.funding_raised),
        integrationRequirements: sol.integration_requirements || [],
        facultyLead: sol.faculty_lead, studentContributors: sol.student_contributors || [],
        isIndustryReady: sol.is_industry_ready !== false,
        prototypeReady: !!sol.prototype_ready,
        publishedAt: sol.published_at,
      };
    } else c.prototypeData = null;

    /* ── industry support ── */
    c.partners = (supportBy.get(code) || []).map((s) => ({
      id: s.industry_id, name: s.industry_name, short: s.industry_short || s.industry_name,
      type: s.industry_type || 'Enterprise', supports: s.support_types || [],
      amount: s.amount_label || `₹${num(s.amount).toLocaleString('en-IN')}`,
      amountValue: num(s.amount), note: s.note, joinedAt: s.created_at,
    }));

    /* ── government reviews / deployment / feedback ── */
    c.reviews = (reviewsBy.get(code) || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (dep) {
      c.deployment = { at: dep.deployed_at, by: dep.deployed_by, summary: dep.summary };
      if (!c.impact) {
        c.impact = {
          beneficiaries: num(dep.beneficiaries), metrics: dep.metrics || [],
          sustainability: num(dep.sustainability), durationMonths: num(dep.duration_months),
          summary: dep.summary,
        };
      }
    }
    c.feedback = (feedbackBy.get(code) || []).map((f) => ({
      id: f.id, rating: f.rating, solved: f.solved, comment: f.comment,
      suggestions: f.suggestions, media: f.media || [], by: f.citizen_name, at: f.created_at,
    })).sort((a, b) => new Date(b.at) - new Date(a.at));

    c.updates = (updatesBy.get(code) || []).map((u) => ({
      id: u.id, at: u.created_at, by: u.author, role: u.author_role, text: u.text,
    })).sort((a, b) => new Date(b.at) - new Date(a.at));

    c.activity = (activityBy.get(code) || []).map((a) => ({
      id: a.id, at: a.created_at, stage: a.stage, actorRole: a.actor_role,
      actorName: a.actor_name, action: a.action, detail: a.detail,
    })).sort((a, b) => new Date(b.at) - new Date(a.at));

    return c;
  });
}

/* ══════════════════════════════════════════════════════════════════════
   WRITE — snapshot the local challenge back into Supabase
   ══════════════════════════════════════════════════════════════════════ */
export async function ensureChallengeRow(c) {
  if (!isSupabaseConfigured || !c) return null;
  const record = {
    code: c.code || c.id,
    title: c.title,
    description: c.description,
    category: c.category || 'Public Services',
    district: c.district,
    village: c.village || c.district,
    affected_population: num(c.affected),
    citizen_name: c.citizen?.name || 'Citizen',
    status: c.status || 'submitted',
    validation_status: c.validation?.status || 'pending',
    validated_by: c.validation?.by || null,
    validation_notes: c.validation?.note || null,
    priority_score: c.priority?.score ?? 50,
    priority_level: c.priority?.level || 'MEDIUM',
    attachments: c.attachments || [],
    upvotes: num(c.upvotes) || 1,
  };
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.citizen?.id || '');
  if (isUuid) record.citizen_id = c.citizen.id;

  const { data, error } = await supabase
    .from('challenges').upsert(record, { onConflict: 'code' }).select('id').single();
  if (error) { noteMissing(error, 'challenges upsert'); return c.dbId || null; }
  return data?.id ?? null;
}

/**
 * Persists the full relational snapshot of one challenge/project.
 * Safe to call after every workflow action — all writes are upserts keyed by code.
 */
export async function persistChallenge(c) {
  if (!isSupabaseConfigured || !c) return null;
  try {
    const challengeId = await ensureChallengeRow(c);
    if (!workflowTablesReady) return challengeId;

    /* Media rows (relational metadata; the files themselves live in Storage). */
    const durableMedia = (c.attachments || []).filter((a) => a.url && !a.url.startsWith('blob:'));
    if (durableMedia.length) {
      const existing = await supabase.from('challenge_media').select('url').eq('challenge_code', c.code);
      if (!existing.error) {
        const known = new Set((existing.data || []).map((m) => m.url));
        const fresh = durableMedia.filter((a) => !known.has(a.url)).map((a) => ({
          challenge_id: challengeId, challenge_code: c.code, name: a.name, url: a.url,
          storage_path: a.storagePath || null, media_type: a.type || 'image',
          size_label: a.size || null, uploaded_by_name: c.citizen?.name || null,
        }));
        if (fresh.length) await supabase.from('challenge_media').insert(fresh);
      } else noteMissing(existing.error, 'challenge_media');
    }

    /* No project yet → nothing further to store. */
    if (!c.university) return challengeId;

    const projectRow = {
      challenge_id: challengeId,
      challenge_code: c.code,
      stage: c.status,
      progress_pct: Math.round(((STAGE_INDEX[c.status] ?? 0) + 1) / STAGES.length * 100),
      university_id: c.university.id,
      university_name: c.university.name,
      university_short: c.university.short,
      university_district: c.university.district,
      match_score: num(c.university.matchScore),
      accepted_at: c.university.acceptedAt || nowIso(),
      accepted_by: c.university.name,
      proposal: c.proposal || null,
      industry_need: c.industryNeed || null,
      impact: c.impact || null,
      history: c.history || [],
      updated_at: nowIso(),
    };
    const pj = await supabase.from('projects').upsert(projectRow, { onConflict: 'challenge_code' }).select('id').single();
    if (pj.error) { noteMissing(pj.error, 'projects'); return challengeId; }
    const projectId = pj.data.id;

    /* Team + members */
    if (c.team) {
      const tm = await supabase.from('teams').upsert({
        project_id: projectId, challenge_code: c.code, name: c.team.name,
        disciplines: c.team.disciplines || [], formed_at: c.team.formedAt || nowIso(),
      }, { onConflict: 'challenge_code' }).select('id').single();
      if (!tm.error && tm.data) {
        const teamId = tm.data.id;
        await supabase.from('team_members').delete().eq('team_id', teamId);
        const rows = (c.team.members || []).map((m) => ({
          team_id: teamId, member_ref: String(m.id), name: m.name,
          member_role: m.role, dept: m.dept, experience: m.exp, skills: m.skills || [],
        }));
        if (rows.length) await supabase.from('team_members').insert(rows);
      } else noteMissing(tm.error, 'teams');
    }

    /* Milestones */
    if (c.milestones?.length) {
      const rows = c.milestones.map((m, i) => ({
        project_id: projectId, challenge_code: c.code, milestone_key: m.id, seq: i,
        title: m.title, owner: m.owner, due: m.due, status: m.status,
        progress: num(m.progress), updated_at: nowIso(),
      }));
      const r = await supabase.from('project_milestones').upsert(rows, { onConflict: 'challenge_code,milestone_key' });
      if (r.error) noteMissing(r.error, 'project_milestones');
    }

    /* Solution / prototype */
    if (c.prototypeData) {
      const p = c.prototypeData;
      const r = await supabase.from('solutions').upsert({
        project_id: projectId, challenge_code: c.code,
        title: p.title, abstract: p.abstract, trl: num(p.trl) || 6,
        demo_url: p.demoUrl, video_demo_url: p.videoDemoUrl,
        estimated_funding: num(p.estimatedFunding), funding_raised: num(p.fundingRaised),
        integration_requirements: p.integrationRequirements || [],
        faculty_lead: p.facultyLead, student_contributors: p.studentContributors || [],
        is_industry_ready: p.isIndustryReady !== false,
        prototype_ready: STAGE_INDEX[c.status] >= STAGE_INDEX.prototype,
        updated_at: nowIso(),
      }, { onConflict: 'challenge_code' });
      if (r.error) noteMissing(r.error, 'solutions');
    }

    /* Industry support */
    if (c.partners?.length) {
      const rows = c.partners.map((p) => ({
        project_id: projectId, challenge_code: c.code, industry_id: p.id,
        industry_name: p.name, industry_short: p.short, industry_type: p.type,
        support_types: p.supports || ['Funding'],
        amount: p.amountValue ?? parseAmount(p.amount),
        amount_label: typeof p.amount === 'string' ? p.amount : `₹${num(p.amount).toLocaleString('en-IN')}`,
        note: p.note || null,
      }));
      const r = await supabase.from('industry_support').upsert(rows, { onConflict: 'challenge_code,industry_id' });
      if (r.error) noteMissing(r.error, 'industry_support');
    }

    /* Deployment */
    if (STAGE_INDEX[c.status] >= STAGE_INDEX.deployment && c.impact) {
      const r = await supabase.from('deployments').upsert({
        project_id: projectId, challenge_code: c.code,
        deployed_at: c.deployment?.at || nowIso(),
        deployed_by: c.deployment?.by || 'District Administration',
        summary: c.impact.summary, beneficiaries: num(c.impact.beneficiaries),
        metrics: c.impact.metrics || [], sustainability: num(c.impact.sustainability),
        duration_months: num(c.impact.durationMonths),
      }, { onConflict: 'challenge_code' });
      if (r.error) noteMissing(r.error, 'deployments');
    }

    return challengeId;
  } catch (err) {
    console.warn('[SamadhanSetu] persistChallenge failed:', err?.message || err);
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════════════
   Append-only writes
   ══════════════════════════════════════════════════════════════════════ */
export async function pushNotifications(list = []) {
  if (!isSupabaseConfigured || !workflowTablesReady || !list.length) return;
  const rows = list.map((n) => ({
    role: n.role, text: n.text, tone: n.tone || 'info',
    challenge_code: n.challengeId || null, link: n.link || null, read: false,
  }));
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) noteMissing(error, 'notifications insert');
}

export async function markNotificationsRead(role) {
  if (!isSupabaseConfigured || !workflowTablesReady) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('role', role).eq('read', false);
  if (error) noteMissing(error, 'notifications read');
}

export async function pushActivity(list = []) {
  if (!isSupabaseConfigured || !workflowTablesReady || !list.length) return;
  const rows = list.map((a) => ({
    challenge_code: a.challengeCode, stage: a.stage || null,
    actor_role: a.actorRole || null, actor_name: a.actorName || null,
    action: a.action, detail: a.detail || null,
  }));
  const { error } = await supabase.from('activity_log').insert(rows);
  if (error) noteMissing(error, 'activity_log');
}

export async function pushUpdate({ challengeCode, author, authorRole, text }) {
  if (!isSupabaseConfigured || !workflowTablesReady) return;
  const { error } = await supabase.from('project_updates')
    .insert({ challenge_code: challengeCode, author, author_role: authorRole, text });
  if (error) noteMissing(error, 'project_updates');
}

export async function pushGovernmentReview({ challengeCode, decision, note, reviewer }) {
  if (!isSupabaseConfigured || !workflowTablesReady) return;
  const { data } = await supabase.from('projects').select('id').eq('challenge_code', challengeCode).maybeSingle();
  const { error } = await supabase.from('government_reviews').insert({
    project_id: data?.id ?? null, challenge_code: challengeCode, decision, note, reviewer,
  });
  if (error) noteMissing(error, 'government_reviews');
}

export async function pushCitizenFeedback(payload) {
  if (!isSupabaseConfigured || !workflowTablesReady) return null;
  const { data: proj } = await supabase.from('projects')
    .select('id, challenge_id').eq('challenge_code', payload.challengeCode).maybeSingle();
  const row = {
    project_id: proj?.id ?? null,
    challenge_id: proj?.challenge_id ?? null,
    challenge_code: payload.challengeCode,
    citizen_name: payload.citizenName || 'Citizen',
    rating: Math.max(1, Math.min(5, num(payload.rating) || 5)),
    solved: payload.solved !== false,
    comment: payload.comment || '',
    suggestions: payload.suggestions || '',
    media: payload.media || [],
  };
  if (/^[0-9a-f-]{36}$/i.test(payload.citizenId || '')) row.citizen_id = payload.citizenId;
  const { data, error } = await supabase.from('citizen_feedback').insert(row).select().single();
  if (error) { noteMissing(error, 'citizen_feedback'); return null; }
  return data;
}

/* ══════════════════════════════════════════════════════════════════════
   Storage — citizen evidence
   ══════════════════════════════════════════════════════════════════════ */
export async function uploadEvidence(files = [], userId = 'anon') {
  const out = [];
  for (const f of files) {
    // eslint-disable-next-line no-await-in-loop
    out.push(await uploadFileToSupabase(f, 'attachments', userId));
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════════════
   Realtime
   ══════════════════════════════════════════════════════════════════════ */
const REALTIME_TABLES = [
  'challenges', 'projects', 'teams', 'team_members', 'project_milestones',
  'solutions', 'industry_support', 'government_reviews', 'deployments',
  'citizen_feedback', 'project_updates', 'challenge_media',
];

export function subscribeWorkflow(onChange, onNotification) {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase.channel('samadhansetu-workflow');
  REALTIME_TABLES.forEach((table) => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange);
  });
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onNotification);
  channel.subscribe();
  return () => { try { supabase.removeChannel(channel); } catch { /* noop */ } };
}
