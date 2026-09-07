/**
 * Repository layer — Supabase is the single source of truth.
 *
 * Reads the normalised lifecycle tables and assembles them into the challenge
 * shape the dashboards already consume, and writes every stage transition back.
 * The UI never talks to Supabase directly; it goes through PlatformContext,
 * which goes through here.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import { STAGE_INDEX, STAGES } from '../data/constants';

const nowIso = () => new Date().toISOString();

/** Demo/presentation identities are not auth.users rows, so their ids are not
 *  UUIDs — never send those to a uuid column. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asUuid = (v) => (typeof v === 'string' && UUID_RE.test(v) ? v : null);

/* ── helpers ───────────────────────────────────────────────────────────── */
function group(rows, key) {
  const out = {};
  (rows ?? []).forEach((r) => {
    const k = r[key];
    (out[k] = out[k] ?? []).push(r);
  });
  return out;
}

function aiRowToUi(row) {
  if (!row) return null;
  return {
    engine: row.engine,
    model: row.model,
    status: row.status,
    analysedAt: row.created_at,
    durationMs: row.duration_ms,
    detectedLanguage: row.detected_language,
    englishText: row.english_text,
    languageConfidence: row.language_confidence,
    category: row.category,
    classification: {
      category: row.category,
      confidence: row.category_confidence ?? 70,
      alternates: row.alternate_categories ?? [],
      keywords: row.keywords ?? [],
    },
    severity: { score: row.severity_score, reasoning: row.severity_reasoning },
    criticality: row.criticality_score,
    priority: {
      score: row.priority_score ?? 50,
      level: row.priority_level ?? 'MEDIUM',
      factors: row.priority_factors ?? {},
    },
    duplicates: row.duplicates ?? [],
    universityMatches: row.university_matches ?? [],
    industryMatches: row.industry_matches ?? [],
    disciplines: row.disciplines ?? [],
    requiredExpertise: row.required_expertise ?? [],
    reasoning: row.reasoning,
  };
}

/** Assembles one UI challenge object from all its related rows. */
function assemble(ch, ctx) {
  const code = ch.code;
  const project = ctx.projects[code]?.[0] ?? null;
  const team = ctx.teams[code]?.[0] ?? null;
  const members = team ? (ctx.members[team.id] ?? []) : [];
  const milestones = (ctx.milestones[code] ?? []).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const solution = ctx.solutions[code]?.[0] ?? null;
  const support = ctx.support[code] ?? [];
  const media = ctx.media[code] ?? [];
  const updates = ctx.updates[code] ?? [];
  const deployment = ctx.deployments[code]?.[0] ?? null;
  const feedback = ctx.feedback[code] ?? [];
  const reviews = ctx.reviews[code] ?? [];
  const activity = ctx.activity[code] ?? [];
  const ai = aiRowToUi(ctx.ai[code]?.[0]);

  const stage = project?.stage && STAGE_INDEX[project.stage] > STAGE_INDEX[ch.status]
    ? project.stage
    : ch.status;

  return {
    id: code,
    code,
    dbId: ch.id,
    title: ch.title,
    description: ch.description,
    category: ch.category,
    district: ch.district,
    village: ch.village || ch.district,
    affected: ch.affected_population ?? 0,
    location: (ch.latitude != null && ch.longitude != null)
      ? { lat: ch.latitude, lng: ch.longitude, accuracy: ch.location_accuracy_m ?? null }
      : null,
    citizen: { name: ch.citizen_name || 'Citizen', id: ch.citizen_id || `cit-${code}` },
    citizenId: ch.citizen_id,
    createdAt: ch.created_at,
    attachments: media.length
      ? media.map((m) => ({ id: m.id, name: m.name, url: m.url, type: m.media_type, size: m.size_label }))
      : (ch.attachments ?? []),
    status: stage,
    ai,
    priority: ai?.priority ?? (ch.priority_score
      ? { score: ch.priority_score, level: ch.priority_level, factors: {} }
      : null),
    validation: {
      status: ch.validation_status ?? 'pending',
      by: ch.validated_by,
      at: ch.validated_by ? ch.created_at : null,
      note: ch.validation_notes,
    },
    university: project?.university_id
      ? {
          id: project.university_id,
          name: project.university_name,
          short: project.university_short,
          district: project.university_district,
          matchScore: project.match_score ?? 85,
          acceptedAt: project.accepted_at,
        }
      : null,
    projectId: project?.id ?? null,
    recommendedTo: ai?.universityMatches?.slice(0, 3).map((m) => m.id) ?? [],
    team: team
      ? {
          id: team.id,
          name: team.name,
          disciplines: team.disciplines ?? [],
          formedAt: team.formed_at,
          members: members.map((m) => ({
            id: m.member_ref || m.id,
            name: m.name,
            role: m.member_role,
            dept: m.dept,
            exp: m.experience,
            skills: m.skills ?? [],
          })),
        }
      : null,
    proposal: project?.proposal && Object.keys(project.proposal).length ? project.proposal : null,
    industryNeed: project?.industry_need && Object.keys(project.industry_need).length ? project.industry_need : null,
    partners: support.map((s) => ({
      id: s.industry_id,
      name: s.industry_name,
      short: s.industry_short,
      type: s.industry_type,
      supports: s.support_types ?? [],
      amount: s.amount_label || (s.amount ? `₹${Number(s.amount).toLocaleString('en-IN')}` : '—'),
      joinedAt: s.created_at,
    })),
    milestones: milestones.map((m) => ({
      id: m.milestone_key || m.id,
      dbId: m.id,
      title: m.title,
      owner: m.owner,
      due: m.due,
      status: m.status,
      progress: m.progress ?? 0,
    })),
    prototypeData: solution
      ? {
          id: solution.id,
          title: solution.title,
          abstract: solution.abstract,
          trl: solution.trl,
          demoUrl: solution.demo_url,
          videoDemoUrl: solution.video_demo_url,
          estimatedFunding: solution.estimated_funding,
          fundingRaised: solution.funding_raised ?? 0,
          integrationRequirements: solution.integration_requirements ?? [],
          facultyLead: solution.faculty_lead,
          studentContributors: solution.student_contributors ?? [],
          isIndustryReady: solution.is_industry_ready,
          publishedAt: solution.published_at,
        }
      : null,
    updates: updates.map((u) => ({
      id: u.id, at: u.created_at, by: u.author, role: u.author_role, text: u.text,
    })),
    reviews: reviews.map((r) => ({ id: r.id, decision: r.decision, note: r.note, by: r.reviewer, at: r.created_at })),
    feedback: feedback.map((f) => ({
      id: f.id, rating: f.rating, solved: f.solved, comment: f.comment,
      by: f.citizen_name, at: f.created_at,
    })),
    impact: deployment
      ? {
          beneficiaries: deployment.beneficiaries ?? 0,
          metrics: deployment.metrics ?? [],
          sustainability: deployment.sustainability ?? 80,
          durationMonths: deployment.duration_months ?? 9,
          summary: deployment.summary,
          deployedAt: deployment.deployed_at,
        }
      : (project?.impact && Object.keys(project.impact).length ? project.impact : null),
    history: (project?.history?.length ? project.history : activity
      .filter((a) => a.stage)
      .map((a) => ({ stage: a.stage, at: a.created_at, by: a.actor_role, note: a.detail }))),
    activity: activity.map((a) => ({
      id: a.id, at: a.created_at, stage: a.stage, actorRole: a.actor_role,
      actor: a.actor_name, action: a.action, detail: a.detail,
    })),
    upvotes: ch.upvotes ?? 1,
  };
}

/* ── read ──────────────────────────────────────────────────────────────── */
export async function fetchPlatformState() {
  if (!isSupabaseConfigured) return null;

  const q = (table, order = 'created_at', asc = false) =>
    supabase.from(table).select('*').order(order, { ascending: asc });

  const [
    challenges, projects, teams, members, milestones, solutions,
    support, media, updates, deployments, feedback, reviews,
    notifications, activity, ai,
  ] = await Promise.all([
    q('challenges'), q('projects'), q('teams'), q('team_members'),
    supabase.from('project_milestones').select('*').order('seq', { ascending: true }),
    q('solutions', 'published_at'), q('industry_support'), q('challenge_media'), q('project_updates'),
    q('deployments', 'deployed_at'), q('citizen_feedback'), q('government_reviews'),
    q('notifications'), q('activity_log'), q('ai_analysis'),
  ]);

  const firstError = [challenges, projects, teams, members, milestones, solutions, support, media,
    updates, deployments, feedback, reviews, notifications, activity, ai].find((r) => r.error);
  if (firstError?.error) {
    console.error('Supabase load failed:', firstError.error.message);
    throw new Error(firstError.error.message);
  }

  const ctx = {
    projects: group(projects.data, 'challenge_code'),
    teams: group(teams.data, 'challenge_code'),
    members: group(members.data, 'team_id'),
    milestones: group(milestones.data, 'challenge_code'),
    solutions: group(solutions.data, 'challenge_code'),
    support: group(support.data, 'challenge_code'),
    media: group(media.data, 'challenge_code'),
    updates: group(updates.data, 'challenge_code'),
    deployments: group(deployments.data, 'challenge_code'),
    feedback: group(feedback.data, 'challenge_code'),
    reviews: group(reviews.data, 'challenge_code'),
    activity: group(activity.data, 'challenge_code'),
    ai: group(ai.data, 'challenge_code'),
  };

  return {
    challenges: (challenges.data ?? []).map((ch) => assemble(ch, ctx)),
    notifications: (notifications.data ?? []).map((n) => ({
      id: n.id, role: n.role, text: n.text, tone: n.tone, read: n.read,
      at: n.created_at, challengeId: n.challenge_code, link: n.link,
    })),
    activity: (activity.data ?? []).map((a) => ({
      id: a.id, at: a.created_at, code: a.challenge_code, stage: a.stage,
      actorRole: a.actor_role, actor: a.actor_name, action: a.action, detail: a.detail,
    })),
  };
}

/* ── write ─────────────────────────────────────────────────────────────── */
async function log(code, { stage = null, role, actor, action, detail = null }) {
  if (!isSupabaseConfigured) return;
  await supabase.from('activity_log').insert({
    challenge_code: code, stage, actor_role: role, actor_name: actor, action, detail,
  });
}

async function notify(roles, text, { tone = 'info', code = null, link = null } = {}) {
  if (!isSupabaseConfigured) return;
  await supabase.from('notifications').insert(
    roles.map((role) => ({ role, text, tone, challenge_code: code, link, read: false })),
  );
}

export const repo = {
  log,
  notify,

  async nextChallengeCode() {
    if (!isSupabaseConfigured) return `CH-${Date.now().toString().slice(-4)}`;
    const { data } = await supabase.from('challenges').select('code').order('created_at', { ascending: false }).limit(200);
    const nums = (data ?? []).map((r) => parseInt(String(r.code).replace(/\D/g, ''), 10)).filter(Number.isFinite);
    return `CH-${Math.max(1200, ...(nums.length ? nums : [1200])) + 1}`;
  },

  async createChallenge(payload) {
    const code = await this.nextChallengeCode();
    const record = {
      code,
      title: payload.title,
      description: payload.description,
      category: payload.category || 'Public Services',
      district: payload.district,
      village: payload.village || payload.district,
      affected_population: Number(payload.affected) || 0,
      latitude: Number.isFinite(payload.location?.lat) ? payload.location.lat : null,
      longitude: Number.isFinite(payload.location?.lng) ? payload.location.lng : null,
      location_accuracy_m: Number.isFinite(payload.location?.accuracy) ? payload.location.accuracy : null,
      citizen_id: asUuid(payload.citizenId),
      citizen_name: payload.citizenName || 'Citizen',
      status: 'submitted',
      validation_status: 'pending',
      priority_score: 50,
      priority_level: 'MEDIUM',
      attachments: [],
      upvotes: 1,
    };
    const { data, error } = await supabase.from('challenges').insert(record).select().single();
    if (error) throw error;

    if (payload.media?.length) {
      await supabase.from('challenge_media').insert(payload.media.map((m) => ({
        challenge_id: data.id, challenge_code: code, name: m.name, url: m.url,
        storage_path: m.path ?? null, media_type: m.type ?? 'image', size_label: m.size ?? null,
        uploaded_by: asUuid(payload.citizenId), uploaded_by_name: payload.citizenName ?? null,
      })));
    }

    await log(code, { stage: 'submitted', role: 'citizen', actor: record.citizen_name, action: 'Challenge submitted', detail: `${record.title} · ${record.district}` });
    await notify(['govt'], `New challenge submitted — ${record.title}`, { code, link: '/government/challenges' });
    await notify(['citizen'], `Your challenge ${code} was submitted successfully`, { tone: 'success', code, link: '/citizen/challenges' });
    return { code, id: data.id };
  },

  async validate(code, { by, note, matches }) {
    await supabase.from('challenges').update({
      validation_status: 'validated', validated_by: by, validation_notes: note, status: 'validated',
    }).eq('code', code);
    await log(code, { stage: 'validated', role: 'govt', actor: by, action: 'Challenge validated', detail: note });
    await notify(['citizen'], `Your challenge ${code} has been validated by the government`, { tone: 'success', code, link: '/citizen/challenges' });
    await notify(['varsity'], `New recommended challenge routed to you (${code})`, {
      code, link: '/university/challenges',
    });
    if (matches?.length) {
      await log(code, { stage: null, role: 'ai', actor: 'AI Engine', action: 'Universities recommended', detail: matches.slice(0, 3).map((m) => `${m.short ?? m.name} ${m.score}%`).join(' · ') });
    }
  },

  async reject(code, { by, note }) {
    await supabase.from('challenges').update({ validation_status: 'rejected', validated_by: by, validation_notes: note }).eq('code', code);
    await log(code, { role: 'govt', actor: by, action: 'Challenge rejected', detail: note });
    await notify(['citizen'], `Challenge ${code} was marked as duplicate/invalid`, { tone: 'warn', code });
  },

  async universityAccept(code, { challengeDbId, university, score, by }) {
    const { data, error } = await supabase.from('projects').insert({
      challenge_id: challengeDbId ?? null,
      challenge_code: code,
      stage: 'university_matched',
      progress_pct: 30,
      university_id: university.id,
      university_name: university.name,
      university_short: university.short,
      university_district: university.district,
      match_score: score ?? 85,
      accepted_at: nowIso(),
      accepted_by: by,
    }).select().single();
    if (error) throw error;
    await supabase.from('challenges').update({ status: 'university_matched' }).eq('code', code);
    await log(code, { stage: 'university_matched', role: 'varsity', actor: university.name, action: 'University accepted the challenge', detail: `Match score ${score ?? 85}%` });
    await notify(['citizen', 'govt'], `${university.short} accepted ${code}`, { tone: 'success', code });
    return data;
  },

  async formTeam(code, { projectId, name, disciplines, members }) {
    const { data: team, error } = await supabase.from('teams').insert({
      project_id: projectId ?? null, challenge_code: code, name, disciplines, formed_at: nowIso(),
    }).select().single();
    if (error) throw error;
    if (members?.length) {
      await supabase.from('team_members').insert(members.map((m) => ({
        team_id: team.id, member_ref: m.id, name: m.name, member_role: m.role,
        dept: m.dept, experience: m.exp, skills: m.skills ?? [],
      })));
    }
    await this.setStage(code, projectId, 'team_formed', 40);
    await log(code, { stage: 'team_formed', role: 'varsity', actor: name, action: 'Multidisciplinary team formed', detail: `${members?.length ?? 0} members · ${(disciplines ?? []).join(', ')}` });
    await notify(['citizen', 'govt'], `A multidisciplinary team was formed for ${code}`, { tone: 'success', code });
    return team;
  },

  async createProposal(code, { projectId, proposal, milestones, needs, note }) {
    await supabase.from('projects').update({
      proposal, industry_need: { open: true, needs, note }, stage: 'proposal_created',
      progress_pct: 50, updated_at: nowIso(),
    }).eq('challenge_code', code);
    if (milestones?.length) {
      await supabase.from('project_milestones').insert(milestones.map((m, i) => ({
        project_id: projectId ?? null, challenge_code: code, milestone_key: `M${i + 1}`, seq: i + 1,
        title: m.title, owner: m.owner, due: m.due, status: i === 0 ? 'in_progress' : 'pending',
        progress: i === 0 ? 20 : 0,
      })));
    }
    await supabase.from('challenges').update({ status: 'proposal_created' }).eq('code', code);
    await log(code, { stage: 'proposal_created', role: 'varsity', actor: proposal?.title ?? 'University Team', action: 'Proposal published', detail: `${proposal?.budget ?? ''} · ${proposal?.duration ?? ''}` });
    await notify(['industry'], `New project seeking support (${code})`, { code, link: '/industry/opportunities' });
    await notify(['citizen', 'govt'], `A project proposal was created for ${code}`, { tone: 'success', code });
  },

  async industryJoin(code, { projectId, firm, supports, amountLabel, amount }) {
    const { error } = await supabase.from('industry_support').insert({
      project_id: projectId ?? null, challenge_code: code, industry_id: firm.id,
      industry_name: firm.name, industry_short: firm.short, industry_type: firm.type,
      support_types: supports, amount: Number(amount) || null, amount_label: amountLabel,
      status: 'committed',
    });
    if (error) throw error;
    await supabase.from('projects').update({
      stage: 'industry_matched', progress_pct: 58,
      industry_need: { open: false, needs: supports, note: 'Partner onboarded' }, updated_at: nowIso(),
    }).eq('challenge_code', code);
    await supabase.from('challenges').update({ status: 'industry_matched' }).eq('code', code);
    await log(code, { stage: 'industry_matched', role: 'industry', actor: firm.name, action: 'Industry partner joined', detail: `${supports.join(', ')} · ${amountLabel}` });
    await notify(['citizen', 'govt', 'varsity'], `${firm.short} joined ${code} as an industry partner`, { tone: 'success', code });
  },

  async setStage(code, projectId, stage, progress) {
    const patch = { stage, updated_at: nowIso() };
    if (progress != null) patch.progress_pct = progress;
    await supabase.from('projects').update(patch).eq('challenge_code', code);
    await supabase.from('challenges').update({ status: stage }).eq('code', code);
  },

  async advance(code, { projectId, stage, actorRole = 'varsity', actor = 'Project team', impact }) {
    const idx = STAGE_INDEX[stage] ?? 0;
    const progress = Math.round(((idx + 1) / STAGES.length) * 100);
    await this.setStage(code, projectId, stage, progress);

    if (stage === 'deployment' || stage === 'impact_measured') {
      const existing = await supabase.from('deployments').select('id').eq('challenge_code', code).maybeSingle();
      if (!existing.data && impact) {
        await supabase.from('deployments').insert({
          project_id: projectId ?? null, challenge_code: code, deployed_by: actor,
          summary: impact.summary, beneficiaries: impact.beneficiaries,
          metrics: impact.metrics, sustainability: impact.sustainability,
          duration_months: impact.durationMonths,
        });
      }
    }
    await log(code, { stage, role: actorRole, actor, action: `Moved to ${STAGES[idx].label}`, detail: null });
    await notify(['citizen', 'govt', 'varsity', 'industry'], `${code} moved to ${STAGES[idx].label}`,
      { tone: stage === 'impact_measured' ? 'success' : 'info', code });
  },

  async updateMilestone(code, milestoneDbId, status) {
    await supabase.from('project_milestones').update({
      status, progress: status === 'completed' ? 100 : status === 'in_progress' ? 45 : 0, updated_at: nowIso(),
    }).eq('id', milestoneDbId);
    await log(code, { role: 'varsity', actor: 'Project team', action: 'Milestone updated', detail: status });
  },

  async postUpdate(code, { author, role, text }) {
    await supabase.from('project_updates').insert({ challenge_code: code, author, author_role: role, text });
    await log(code, { role, actor: author, action: 'Posted a project update', detail: text.slice(0, 120) });
    await notify(['citizen', 'govt', 'varsity', 'industry'].filter((r) => r !== role), `New update on ${code}`, { code });
  },

  async publishSolution(code, { projectId, data }) {
    const { error } = await supabase.from('solutions').insert({
      project_id: projectId ?? null, challenge_code: code, title: data.title, abstract: data.abstract,
      trl: Number(data.trl) || 6, demo_url: data.demoUrl || null, video_demo_url: data.videoDemoUrl || null,
      estimated_funding: Number(data.estimatedFunding) || 0,
      integration_requirements: data.integrationRequirements ?? [],
      faculty_lead: data.facultyLead, student_contributors: data.studentContributors ?? [],
      is_industry_ready: true, prototype_ready: true, status: 'published', published_at: nowIso(),
    });
    if (error) throw error;
    await log(code, { role: 'varsity', actor: data.facultyLead || 'University Team', action: 'Prototype published to industry', detail: `TRL ${data.trl}` });
    await notify(['industry'], `New scalable prototype available (${code})`, { code, link: '/industry/scalable-ready' });
  },

  async governmentReview(code, { decision, note, reviewer, projectId }) {
    await supabase.from('government_reviews').insert({
      project_id: projectId ?? null, challenge_code: code, decision, note, reviewer,
    });
    await log(code, { role: 'govt', actor: reviewer, action: `Government review: ${decision}`, detail: note });
    await notify(['varsity', 'industry', 'citizen'], `Government review on ${code}: ${decision}`,
      { tone: decision === 'approved' ? 'success' : 'warn', code });
  },

  async citizenFeedback(code, { projectId, citizenId, citizenName, rating, solved, comment }) {
    const { error } = await supabase.from('citizen_feedback').insert({
      project_id: projectId ?? null, challenge_code: code, citizen_id: asUuid(citizenId),
      citizen_name: citizenName, rating, solved, comment,
    });
    if (error) throw error;
    await log(code, { role: 'citizen', actor: citizenName, action: 'Citizen feedback submitted', detail: `${rating}/5 · ${solved ? 'resolved' : 'not resolved'}` });
    await notify(['govt', 'varsity', 'industry'], `Citizen feedback received on ${code} (${rating}/5)`, { tone: 'success', code });
  },

  async upvote(code, current) {
    await supabase.from('challenges').update({ upvotes: (current ?? 1) + 1 }).eq('code', code);
  },

  async markNotificationsRead(role) {
    await supabase.from('notifications').update({ read: true }).eq('role', role).eq('read', false);
  },
};

export { assemble };
