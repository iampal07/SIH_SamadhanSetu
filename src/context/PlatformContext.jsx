import { createContext, useContext, useMemo, useReducer, useRef, useCallback, useEffect } from 'react';
import { STAGE_INDEX, STAGES, stageMeta } from '../data/constants';
import { buildSeedChallenges, SEED_NOTIFICATIONS } from '../data/seedChallenges';
import { runAnalysis, suggestDisciplines } from '../services/aiEngine';
import { UNIVERSITIES, TALENT_POOL } from '../data/universities';
import { INDUSTRIES } from '../data/industries';
import { isSupabaseConfigured } from '../services/supabase';
import {
  fetchWorkflowSnapshot, fetchNotifications, hydrateChallenges, persistChallenge,
  pushNotifications, pushActivity, pushUpdate, pushGovernmentReview, pushCitizenFeedback,
  markNotificationsRead, subscribeWorkflow, isWorkflowPersistent,
} from '../services/workflow';

const PlatformContext = createContext(null);

let seq = 0;
const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${(seq += 1)}`;
const now = () => new Date().toISOString();

const ALL_ROLES = ['citizen', 'varsity', 'industry', 'govt'];

const ROLE_LINK = {
  citizen: '/citizen/challenges',
  govt: '/government/projects',
  varsity: '/university/projects',
  industry: '/industry/portfolio',
};

function makeNotifications(roles, text, tone = 'info', challengeId = null, link = null) {
  return roles.map((role) => ({
    id: uid('n'), role, text, tone, at: now(), read: false, challengeId,
    link: link || ROLE_LINK[role] || null,
  }));
}

/** Legacy single-record mapper kept for compatibility with existing imports. */
export function mapDbChallengeToClient(rec) {
  return hydrateChallenges({
    challenges: [rec], media: [], projects: [], teams: [], members: [], milestones: [],
    solutions: [], support: [], reviews: [], deployments: [], feedback: [], updates: [], activity: [],
  })[0];
}

const initialState = {
  challenges: buildSeedChallenges(),
  notifications: SEED_NOTIFICATIONS,
  activeUniversityId: 'u1',
  activeIndustryId: 'i2',
  citizenName: 'Pooja Kachhap',
  toast: null,
  loading: true,
  syncError: null,
  demo: { running: false, step: 0, challengeId: null },
  dirty: null,
  pendingNotifs: [],
  pendingActivity: [],
};

function push(state, challengeId, patch, notif = [], activity = []) {
  return {
    ...state,
    challenges: state.challenges.map((c) => (c.id === challengeId ? { ...c, ...patch } : c)),
    notifications: [...notif, ...state.notifications].slice(0, 120),
    pendingNotifs: [...state.pendingNotifs, ...notif],
    pendingActivity: [...state.pendingActivity, ...activity],
    dirty: { id: challengeId, at: Date.now() },
  };
}

function act(c, actorRole, actorName, action, detail = null) {
  return { challengeCode: c.code || c.id, stage: c.status, actorRole, actorName, action, detail };
}

function withHistory(c, stage, by, note) {
  const already = c.history.some((h) => h.stage === stage);
  return already ? c.history : [...c.history, { stage, at: now(), by, note: note ?? null }];
}

function advanceTo(c, stage, by, note) {
  return {
    status: STAGE_INDEX[stage] > STAGE_INDEX[c.status] ? stage : c.status,
    history: withHistory(c, stage, by, note),
  };
}

/** Milestone completion derived from the lifecycle stage (never hardcoded numbers). */
function syncMilestonesToStage(c, targetStage) {
  if (!c.milestones?.length) return c.milestones ?? [];
  const first = STAGE_INDEX.proposal_created;
  const span = Math.max(1, STAGES.length - 1 - first);
  const reached = Math.max(0, STAGE_INDEX[targetStage] - first);
  const cut = Math.round((reached / span) * c.milestones.length);
  return c.milestones.map((m, i) => ({
    ...m,
    status: i < cut ? 'completed' : i === cut ? 'in_progress' : m.status,
    progress: i < cut ? 100 : i === cut ? Math.max(m.progress, 45) : m.progress,
  }));
}

function buildImpact(c) {
  return {
    beneficiaries: c.affected || 1200,
    metrics: [
      { label: 'Citizens benefited', value: c.affected || 1200, unit: '' },
      { label: 'Service improvement', value: 62, unit: '%' },
      { label: 'Annual saving', value: 1250000, unit: ' ₹' },
      { label: 'Community satisfaction', value: 91, unit: '/100' },
    ],
    sustainability: 84,
    durationMonths: 9,
    summary: 'Solution deployed in the field and verified by the district administration.',
  };
}

function reducer(state, action) {
  switch (action.type) {
    /* ── Supabase hydration ─────────────────────────────────────────── */
    case 'HYDRATE': {
      const dbList = action.payload || [];
      const dbCodes = new Set(dbList.map((c) => c.code));
      const remaining = state.challenges.filter((c) => !dbCodes.has(c.code) && !dbCodes.has(c.id));
      return {
        ...state,
        challenges: [...dbList, ...remaining],
        loading: false,
        syncError: null,
      };
    }
    case 'HYDRATE_NOTIFICATIONS':
      return { ...state, notifications: action.payload?.length ? action.payload : state.notifications };
    case 'SYNC_ERROR': return { ...state, loading: false, syncError: action.message };
    case 'LOADED': return { ...state, loading: false };
    case 'FLUSHED': return { ...state, dirty: null, pendingNotifs: [], pendingActivity: [] };

    /* ── Citizen submits ────────────────────────────────────────────── */
    case 'SUBMIT_CHALLENGE': {
      const p = action.payload;
      const id = p.id || `CH-${1200 + state.challenges.filter((c) => !c.seeded).length + 1}`;
      const challenge = {
        id, code: p.code || id, dbId: p.dbId || null,
        title: p.title, description: p.description,
        district: p.district, village: p.village || p.district, affected: Number(p.affected) || 0,
        citizen: p.citizen || { name: state.citizenName, id: 'cit-me' },
        createdAt: now(),
        attachments: p.attachments ?? [],
        categoryOverride: p.category || null,
        category: p.category || 'Public Services',
        status: 'submitted',
        ai: null, priority: null,
        validation: { status: 'pending', by: null, at: null, note: null },
        university: null, recommendedTo: [], team: null, proposal: null,
        industryNeed: null, partners: [], milestones: [], updates: [], impact: null,
        reviews: [], feedback: [], activity: [],
        history: [{ stage: 'submitted', at: now(), by: 'citizen', note: 'Challenge submitted by citizen' }],
        upvotes: 1, seeded: false, isMine: true,
      };
      const notif = [
        ...makeNotifications(['govt'], `New challenge submitted — ${p.title}`, 'info', id, '/government/challenges'),
        ...makeNotifications(['citizen'], `Your challenge ${id} was submitted successfully`, 'success', id),
      ];
      return {
        ...state,
        challenges: [challenge, ...state.challenges.filter((c) => c.id !== id && c.code !== id)],
        notifications: [...notif, ...state.notifications].slice(0, 120),
        pendingNotifs: [...state.pendingNotifs, ...notif],
        pendingActivity: [...state.pendingActivity,
          act(challenge, 'citizen', challenge.citizen.name, 'Challenge submitted', `${p.district} · ${p.village || p.district}`)],
        dirty: { id, at: Date.now() },
        toast: { id: uid('t'), text: `Challenge ${id} submitted`, tone: 'success' },
      };
    }

    /* ── AI analysis ────────────────────────────────────────────────── */
    case 'RUN_AI': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const ai = runAnalysis({ ...c, categoryOverride: c.categoryOverride }, state.challenges.filter((x) => x.id !== c.id));
      return push(state, c.id, {
        ai, category: ai.category, priority: ai.priority,
        recommendedTo: ai.universityMatches.slice(0, 3).map((m) => m.id),
        ...advanceTo(c, 'ai_analysed', 'ai', `Classified as ${ai.category} (${ai.classification.confidence}% confidence)`),
      }, [
        ...makeNotifications(['citizen'], `AI analysed ${c.id}: ${ai.category} · Priority ${ai.priority.level}`, 'info', c.id),
        ...makeNotifications(['govt'], `${c.id} analysed — Priority ${ai.priority.score}/100 (${ai.priority.level})`, 'info', c.id, '/government/challenges'),
      ], [act(c, 'ai', 'SamadhanSetu AI Engine', 'AI analysis completed', `${ai.category} · priority ${ai.priority.score}/100`)]);
    }

    /* ── Government validates ───────────────────────────────────────── */
    case 'VALIDATE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const matches = c.ai?.universityMatches ?? [];
      const by = action.by ?? 'District Innovation Cell';
      const shortlist = matches.slice(0, 3);
      return push(state, c.id, {
        validation: { status: 'validated', by, at: now(), note: action.note ?? 'Verified and approved for university matching.' },
        recommendedTo: shortlist.map((m) => m.id),
        ...advanceTo(c, 'validated', 'govt', action.note ?? 'Validated by district administration'),
      }, [
        ...makeNotifications(['citizen'], `Your challenge ${c.id} has been validated by the government`, 'success', c.id),
        ...makeNotifications(['varsity'], `New recommended challenge for your institution: ${c.title}`, 'info', c.id, '/university/challenges'),
      ], [act(c, 'govt', by, 'Government validated the challenge', `Routed to ${shortlist.length} matched universities`)]);
    }

    case 'REJECT_CHALLENGE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      return push(state, c.id, {
        validation: { status: 'rejected', by: 'District Innovation Cell', at: now(), note: action.note ?? 'Duplicate of an existing challenge.' },
      }, makeNotifications(['citizen'], `Challenge ${c.id} was marked as duplicate/invalid`, 'warn', c.id),
      [act(c, 'govt', 'District Innovation Cell', 'Challenge rejected', action.note ?? 'Duplicate/invalid')]);
    }

    /* ── University accepts ─────────────────────────────────────────── */
    case 'UNIVERSITY_ACCEPT': {
      const c = state.challenges.find((x) => x.id === action.id);
      const u = UNIVERSITIES.find((x) => x.id === action.universityId);
      if (!c || !u) return state;
      if (c.university?.id === u.id) return state;
      const score = c.ai?.universityMatches?.find((m) => m.id === u.id)?.score ?? 85;
      return push(state, c.id, {
        university: { id: u.id, name: u.name, short: u.short, district: u.district, matchScore: score, acceptedAt: now() },
        recommendedTo: [u.id],
        ...advanceTo(c, 'university_matched', 'varsity', `${u.name} accepted the challenge`),
      }, [
        ...makeNotifications(['citizen'], `${u.short} has accepted your challenge ${c.id}`, 'success', c.id),
        ...makeNotifications(['govt'], `${u.short} accepted ${c.id}`, 'success', c.id, '/government/projects'),
        ...makeNotifications(['varsity'], `Build your team for ${c.id} — ${c.title}`, 'warn', c.id, '/university/projects'),
      ], [act(c, 'varsity', u.name, 'University accepted the challenge', `AI match score ${score}%`)]);
    }

    case 'UNIVERSITY_DECLINE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      return push(state, c.id, {
        recommendedTo: (c.recommendedTo ?? []).filter((r) => r !== action.universityId),
      }, makeNotifications(['govt'], `A university declined ${c.id} — re-routing to next best match`, 'warn', c.id, '/government/projects'),
      [act(c, 'varsity', action.universityName || 'University', 'Declined recommendation')]);
    }

    /* ── Team formation ─────────────────────────────────────────────── */
    case 'FORM_TEAM': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const team = {
        name: action.team.name,
        disciplines: action.team.disciplines?.length ? action.team.disciplines : suggestDisciplines(c.category),
        members: action.team.members,
        formedAt: now(),
      };
      const faculty = team.members.filter((m) => m.role !== 'Student').length;
      return push(state, c.id, {
        team, ...advanceTo(c, 'team_formed', 'varsity', `${team.members.length}-member multidisciplinary team formed`),
      }, [
        ...makeNotifications(['citizen'], `A multidisciplinary team is now working on ${c.id}`, 'success', c.id),
        ...makeNotifications(['govt'], `Team formed for ${c.id} (${team.members.length} members)`, 'info', c.id, '/government/projects'),
        ...makeNotifications(['varsity'], `${team.name} created — define the solution plan for ${c.id}`, 'info', c.id, '/university/projects'),
      ], [act(c, 'varsity', c.university?.name || 'University', 'Team formed',
        `${team.name} · ${faculty} faculty/researchers + ${team.members.length - faculty} students`)]);
    }

    /* ── Solution development plan (proposal + milestones) ──────────── */
    case 'CREATE_PROPOSAL': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const milestones = (action.milestones ?? []).map((m, i) => ({
        id: `M${i + 1}`, title: m.title, owner: m.owner || 'University Team',
        due: m.due, status: i === 0 ? 'in_progress' : 'pending', progress: i === 0 ? 20 : 0,
      }));
      return push(state, c.id, {
        proposal: { ...action.proposal, createdAt: now() },
        milestones,
        industryNeed: { open: true, needs: action.needs ?? ['Funding', 'Technology'], note: action.note ?? 'Seeking industry partner.' },
        ...advanceTo(c, 'proposal_created', 'varsity', 'Solution development plan published'),
      }, [
        ...makeNotifications(['industry'], `New solution seeking industry support: ${c.title}`, 'info', c.id, '/industry/opportunities'),
        ...makeNotifications(['govt'], `Solution development started for ${c.id}`, 'info', c.id, '/government/projects'),
        ...makeNotifications(['citizen'], `Work has started on a solution for your challenge ${c.id}`, 'success', c.id),
      ], [act(c, 'varsity', c.university?.name || 'University', 'Solution development plan published',
        `${milestones.length} milestones · ${action.proposal?.budget ?? ''} · ${action.proposal?.duration ?? ''}`)]);
    }

    /* ── Industry support ───────────────────────────────────────────── */
    case 'INDUSTRY_JOIN': {
      const c = state.challenges.find((x) => x.id === action.id);
      const f = INDUSTRIES.find((x) => x.id === action.industryId)
        || { id: action.industryId, name: action.industryName || 'Industry Partner', short: action.industryName || 'Industry', type: 'Enterprise', supports: ['Funding'] };
      if (!c) return state;
      const supports = action.supports?.length ? action.supports : f.supports.slice(0, 3);
      const amountValue = Number(String(action.amount ?? '').replace(/[^0-9.]/g, '')) || 0;
      const partner = {
        id: f.id, name: f.name, short: f.short, type: f.type, supports,
        amount: typeof action.amount === 'string' && action.amount.includes('₹')
          ? action.amount : `₹${(amountValue || 1500000).toLocaleString('en-IN')}`,
        amountValue: amountValue || 1500000,
        note: action.note || null,
        joinedAt: now(),
      };
      const proto = c.prototypeData
        ? { ...c.prototypeData, fundingRaised: (c.prototypeData.fundingRaised || 0) + (amountValue || 1500000) }
        : c.prototypeData;
      return push(state, c.id, {
        partners: [...c.partners.filter((p) => p.id !== f.id), partner],
        prototypeData: proto,
        industryNeed: { ...(c.industryNeed ?? { needs: [], note: '' }), open: false },
        ...advanceTo(c, 'industry_matched', 'industry', `${f.name} joined as an industry partner`),
      }, [
        ...makeNotifications(['varsity'], `${f.short} is supporting ${c.id} with ${supports.join(', ')}`, 'success', c.id, '/university/industry'),
        ...makeNotifications(['citizen', 'govt'], `${f.short} joined ${c.id} as an industry partner`, 'success', c.id),
        ...makeNotifications(['industry'], `You are now supporting ${c.id}`, 'success', c.id, '/industry/portfolio'),
      ], [act(c, 'industry', f.name, 'Industry support committed', `${supports.join(', ')} · ${partner.amount}`)]);
    }

    case 'REQUEST_INDUSTRY': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      return push(state, c.id, {
        industryNeed: { open: true, needs: action.needs, note: action.note },
      }, makeNotifications(['industry'], `Support requested for ${c.id}: ${action.needs.join(', ')}`, 'info', c.id, '/industry/opportunities'),
      [act(c, 'varsity', c.university?.name || 'University', 'Industry support requested', action.needs.join(', '))]);
    }

    /* ── Prototype published / ready ────────────────────────────────── */
    case 'PUBLISH_PROTOTYPE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const prototypeData = { ...action.prototype, publishedAt: now(), isIndustryReady: true, prototypeReady: true };
      const target = 'prototype';
      return push(state, c.id, {
        prototypeData,
        milestones: syncMilestonesToStage(c, target),
        ...advanceTo(c, target, 'varsity', 'Working prototype ready and published for industry scaling'),
      }, [
        ...makeNotifications(['industry'], `Prototype Ready — ${action.prototype.title} (${c.code})`, 'success', c.id, '/industry/scalable-ready'),
        ...makeNotifications(['govt'], `Prototype ready for ${c.id} — government review required`, 'warn', c.id, '/government/review'),
        ...makeNotifications(['citizen'], `A working prototype has been built for your challenge ${c.id}`, 'success', c.id),
      ], [act(c, 'varsity', c.university?.name || 'University', 'Prototype ready',
        `TRL ${action.prototype.trl} · scaling budget ₹${Number(action.prototype.estimatedFunding || 0).toLocaleString('en-IN')}`)]);
    }

    case 'PLEDGE_SCALING_FUNDING':
      return reducer(state, {
        type: 'INDUSTRY_JOIN', id: action.id, industryId: action.industryId,
        industryName: action.industryName, supports: action.supports,
        amount: `₹${Number(action.amount).toLocaleString('en-IN')}`, note: action.notes,
      });

    /* ── Government review → approve / request changes ──────────────── */
    case 'GOVT_REVIEW': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const reviewer = action.reviewer || 'District Innovation Cell';
      const review = { id: uid('rev'), decision: action.decision, note: action.note, reviewer, created_at: now() };
      const reviews = [review, ...(c.reviews ?? [])];

      if (action.decision === 'changes_requested') {
        return push(state, c.id, { reviews }, [
          ...makeNotifications(['varsity'], `Government requested changes on ${c.id}: ${action.note}`, 'warn', c.id, '/university/projects'),
          ...makeNotifications(['industry'], `${c.id} sent back for changes by the government`, 'warn', c.id, '/industry/portfolio'),
        ], [act(c, 'govt', reviewer, 'Changes requested after review', action.note)]);
      }

      return push(state, c.id, {
        reviews,
        milestones: syncMilestonesToStage(c, 'govt_review'),
        ...advanceTo(c, 'govt_review', 'govt', `Government review approved by ${reviewer}`),
      }, [
        ...makeNotifications(['varsity'], `Government approved ${c.id} — cleared for deployment`, 'success', c.id, '/university/projects'),
        ...makeNotifications(['industry'], `${c.id} approved by the government for deployment`, 'success', c.id, '/industry/portfolio'),
        ...makeNotifications(['citizen'], `The solution for ${c.id} has been approved by the government`, 'success', c.id),
      ], [act(c, 'govt', reviewer, 'Government approved the solution', action.note)]);
    }

    /* ── Deployment ─────────────────────────────────────────────────── */
    case 'DEPLOY': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const by = action.by || 'District Administration';
      const impact = c.impact ?? buildImpact(c);
      if (action.summary) impact.summary = action.summary;
      return push(state, c.id, {
        impact,
        deployment: { at: now(), by, summary: impact.summary },
        milestones: syncMilestonesToStage(c, 'deployment'),
        ...advanceTo(c, 'deployment', 'govt', `Solution deployed in ${c.village}, ${c.district}`),
      }, [
        ...makeNotifications(['citizen'], `The solution for ${c.id} is now deployed — share your feedback`, 'success', c.id, '/citizen/solutions'),
        ...makeNotifications(['varsity', 'industry', 'govt'], `${c.id} deployed in ${c.village}, ${c.district}`, 'success', c.id),
      ], [act(c, 'govt', by, 'Solution deployed', `${c.village}, ${c.district}`)]);
    }

    /* ── Citizen feedback ───────────────────────────────────────────── */
    case 'CITIZEN_FEEDBACK': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const entry = {
        id: uid('fb'), rating: action.rating, solved: action.solved,
        comment: action.comment, suggestions: action.suggestions,
        media: action.media ?? [], by: action.by || 'Citizen', at: now(),
      };
      const feedback = [entry, ...(c.feedback ?? [])];
      const avg = Math.round((feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length) * 20);
      const solvedPct = Math.round((feedback.filter((f) => f.solved).length / feedback.length) * 100);
      const impact = c.impact ? {
        ...c.impact,
        metrics: c.impact.metrics.map((m) => (m.label === 'Community satisfaction' ? { ...m, value: avg } : m)),
        communityRating: avg, solvedPct, feedbackCount: feedback.length,
      } : c.impact;

      return push(state, c.id, {
        feedback, impact,
        ...advanceTo(c, 'community_feedback', 'citizen', `Community feedback received (${feedback.length})`),
      }, [
        ...makeNotifications(['varsity', 'industry', 'govt'],
          `New citizen feedback on ${c.id} — ${action.rating}/5${action.solved ? ' · problem solved' : ' · issue remains'}`,
          action.solved ? 'success' : 'warn', c.id),
        ...makeNotifications(['citizen'], `Thank you — your feedback on ${c.id} was recorded`, 'success', c.id),
      ], [act(c, 'citizen', entry.by, 'Citizen feedback submitted',
        `${action.rating}/5 · ${action.solved ? 'solved' : 'not fully solved'}`)]);
    }

    /* ── Lifecycle progression ──────────────────────────────────────── */
    case 'ADVANCE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const target = action.stage ?? STAGES[Math.min(STAGE_INDEX[c.status] + 1, STAGES.length - 1)].key;
      if (STAGE_INDEX[target] <= STAGE_INDEX[c.status]) return state;
      const meta = STAGES[STAGE_INDEX[target]];
      const patch = { ...advanceTo(c, target, meta.owner, action.note) };
      patch.milestones = syncMilestonesToStage(c, target);
      if ((target === 'deployment' || target === 'impact_measured') && !c.impact) patch.impact = buildImpact(c);
      if (target === 'deployment' && !c.deployment) patch.deployment = { at: now(), by: 'District Administration', summary: (patch.impact ?? c.impact)?.summary };

      return push(state, c.id, patch,
        makeNotifications(ALL_ROLES, `${c.id} moved to ${meta.label}`, target === 'impact_measured' ? 'success' : 'info', c.id),
        [act(c, meta.owner, action.by || stageMeta(target).label, `Stage advanced to ${meta.label}`, action.note)]);
    }

    case 'UPDATE_MILESTONE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const target = c.milestones.find((m) => m.id === action.milestoneId);
      const milestones = c.milestones.map((m) => (m.id === action.milestoneId
        ? { ...m, status: action.status, progress: action.status === 'completed' ? 100 : action.status === 'in_progress' ? Math.max(m.progress, 40) : 0 }
        : m));
      const done = milestones.filter((m) => m.status === 'completed').length;
      return push(state, c.id, { milestones },
        makeNotifications(['citizen', 'govt', 'industry'],
          `Milestone ${action.status === 'completed' ? 'completed' : 'started'} on ${c.id}: ${target?.title ?? ''}`, 'info', c.id),
        [act(c, 'varsity', c.university?.name || 'University Team',
          `Milestone ${action.status === 'completed' ? 'completed' : 'started'}`,
          `${target?.title ?? ''} · ${done}/${milestones.length} done`)]);
    }

    case 'POST_UPDATE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const update = { id: uid('up'), at: now(), by: action.by, role: action.role, text: action.text };
      return push(state, c.id, { updates: [update, ...(c.updates ?? [])] },
        makeNotifications(ALL_ROLES.filter((r) => r !== action.role), `New update on ${c.id} from ${action.by}`, 'info', c.id),
        [act(c, action.role, action.by, 'Posted a project update', action.text)]);
    }

    case 'UPVOTE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      return push(state, c.id, { upvotes: c.upvotes + 1 });
    }

    /* ── UI plumbing ────────────────────────────────────────────────── */
    case 'SET_ACTIVE_UNIVERSITY': return { ...state, activeUniversityId: action.id };
    case 'SET_ACTIVE_INDUSTRY': return { ...state, activeIndustryId: action.id };
    case 'READ_NOTIFICATIONS':
      return { ...state, notifications: state.notifications.map((n) => (n.role === action.role ? { ...n, read: true } : n)) };
    case 'TOAST': return { ...state, toast: { id: uid('t'), text: action.text, tone: action.tone ?? 'info' } };
    case 'CLEAR_TOAST': return { ...state, toast: null };
    case 'DEMO': return { ...state, demo: { ...state.demo, ...action.payload } };
    case 'RESET': return { ...initialState, challenges: buildSeedChallenges(), notifications: SEED_NOTIFICATIONS, loading: false };
    default: return state;
  }
}

export function PlatformProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timers = useRef([]);
  const resyncTimer = useRef(null);
  /* Number of Supabase writes still in flight. Re-hydrating mid-write would
     briefly show the pre-write snapshot, so we wait for writes to settle. */
  const inFlight = useRef(0);

  /* ── Hydrate from Supabase + subscribe to Realtime ─────────────────── */
  const sync = useCallback(async () => {
    if (!isSupabaseConfigured) { dispatch({ type: 'LOADED' }); return; }
    try {
      const snap = await fetchWorkflowSnapshot();
      const hydrated = hydrateChallenges(snap);
      dispatch({ type: 'HYDRATE', payload: hydrated });
      const notifs = await fetchNotifications();
      if (notifs?.length) dispatch({ type: 'HYDRATE_NOTIFICATIONS', payload: notifs });
    } catch (err) {
      console.warn('Supabase sync failed:', err);
      dispatch({ type: 'SYNC_ERROR', message: err?.message || 'Could not reach Supabase' });
    }
  }, []);

  const scheduleSync = useCallback(() => {
    clearTimeout(resyncTimer.current);
    resyncTimer.current = setTimeout(function run() {
      if (inFlight.current > 0) { resyncTimer.current = setTimeout(run, 400); return; }
      sync();
    }, 700);
  }, [sync]);

  useEffect(() => {
    sync();
    const unsub = subscribeWorkflow(scheduleSync, scheduleSync);
    return () => { clearTimeout(resyncTimer.current); unsub(); };
  }, [sync, scheduleSync]);

  /* ── Flush every mutation to Supabase ──────────────────────────────── */
  useEffect(() => {
    if (!state.dirty) return;
    const c = state.challenges.find((x) => x.id === state.dirty.id);
    const notifs = state.pendingNotifs;
    const activity = state.pendingActivity;
    dispatch({ type: 'FLUSHED' });
    if (!isSupabaseConfigured) return;
    inFlight.current += 1;
    (async () => {
      try {
        if (c) await persistChallenge(c);
        await pushNotifications(notifs);
        await pushActivity(activity);
      } catch (err) {
        console.warn('Supabase write failed:', err);
      } finally {
        inFlight.current -= 1;
      }
    })();
  }, [state.dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  const toast = useCallback((text, tone = 'info') => dispatch({ type: 'TOAST', text, tone }), []);

  const markRead = useCallback((role) => {
    dispatch({ type: 'READ_NOTIFICATIONS', role });
    markNotificationsRead(role);
  }, []);

  const postUpdate = useCallback((challenge, { by, role, text }) => {
    dispatch({ type: 'POST_UPDATE', id: challenge.id, by, role, text });
    pushUpdate({ challengeCode: challenge.code || challenge.id, author: by, authorRole: role, text });
  }, []);

  const submitReview = useCallback((challenge, { decision, note, reviewer }) => {
    dispatch({ type: 'GOVT_REVIEW', id: challenge.id, decision, note, reviewer });
    pushGovernmentReview({ challengeCode: challenge.code || challenge.id, decision, note, reviewer });
  }, []);

  const submitFeedback = useCallback((challenge, payload) => {
    dispatch({ type: 'CITIZEN_FEEDBACK', id: challenge.id, ...payload });
    pushCitizenFeedback({
      challengeCode: challenge.code || challenge.id,
      citizenId: payload.citizenId, citizenName: payload.by,
      rating: payload.rating, solved: payload.solved,
      comment: payload.comment, suggestions: payload.suggestions, media: payload.media,
    });
  }, []);

  /* Runs the entire lifecycle end-to-end for the presentation mode. */
  const runDemoScenario = useCallback((challengeId, onStep) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const base = Date.now();
    const steps = [
      { d: 400, run: () => dispatch({ type: 'RUN_AI', id: challengeId }) },
      { d: 1600, run: () => dispatch({ type: 'VALIDATE', id: challengeId }) },
      { d: 2800, run: () => dispatch({ type: 'UNIVERSITY_ACCEPT', id: challengeId, universityId: 'u1' }) },
      { d: 4000, run: () => dispatch({ type: 'FORM_TEAM', id: challengeId, team: { name: 'Rapid Response Innovation Cell', members: TALENT_POOL.u1.slice(0, 5) } }) },
      { d: 5200, run: () => dispatch({
        type: 'CREATE_PROPOSAL', id: challengeId,
        proposal: { title: 'Community solution proposal', objective: 'Deploy a sustainable community-owned solution.', approach: 'Survey → co-design → prototype → pilot → handover', budget: '₹24,00,000', duration: '8 months' },
        milestones: [
          { title: 'Field survey', owner: 'University Team', due: new Date(base + 14 * 86400000).toISOString() },
          { title: 'Prototype build', owner: 'University + Industry', due: new Date(base + 60 * 86400000).toISOString() },
          { title: 'Field pilot', owner: 'Industry Partner', due: new Date(base + 110 * 86400000).toISOString() },
          { title: 'Deployment & handover', owner: 'Government', due: new Date(base + 160 * 86400000).toISOString() },
        ],
        needs: ['Funding', 'Technology', 'Deployment'],
      }) },
      { d: 6400, run: () => dispatch({ type: 'INDUSTRY_JOIN', id: challengeId, industryId: 'i2' }) },
      { d: 7600, run: () => dispatch({ type: 'ADVANCE', id: challengeId, stage: 'prototype' }) },
      { d: 8600, run: () => dispatch({ type: 'ADVANCE', id: challengeId, stage: 'testing' }) },
      { d: 9400, run: () => dispatch({ type: 'ADVANCE', id: challengeId, stage: 'pilot' }) },
      { d: 10200, run: () => dispatch({ type: 'GOVT_REVIEW', id: challengeId, decision: 'approved', note: 'Field verified and cleared for deployment.' }) },
      { d: 11000, run: () => dispatch({ type: 'DEPLOY', id: challengeId }) },
      { d: 11800, run: () => dispatch({ type: 'CITIZEN_FEEDBACK', id: challengeId, rating: 5, solved: true, comment: 'The problem is finally solved for our community.', suggestions: '', by: 'Community representative' }) },
      { d: 12600, run: () => dispatch({ type: 'ADVANCE', id: challengeId, stage: 'impact_measured' }) },
    ];
    steps.forEach((s, i) => {
      timers.current.push(setTimeout(() => { s.run(); onStep?.(i + 1, steps.length); }, s.d));
    });
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const value = useMemo(() => ({
    ...state, dispatch, toast, runDemoScenario,
    sync, markRead, postUpdate, submitReview, submitFeedback,
    persistent: isSupabaseConfigured && isWorkflowPersistent(),
  }), [state, toast, runDemoScenario, sync, markRead, postUpdate, submitReview, submitFeedback]);

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside PlatformProvider');
  return ctx;
}

/* ── Derived selectors ─────────────────────────────────────────────── */
export function useAnalytics() {
  const { challenges } = usePlatform();
  return useMemo(() => {
    const byCategory = {};
    const byDistrict = {};
    let validated = 0, active = 0, completed = 0, beneficiaries = 0, students = 0, feedbackCount = 0, ratingSum = 0;
    const partners = new Set(); const unis = new Set();
    for (const c of challenges) {
      byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
      byDistrict[c.district] = byDistrict[c.district] ?? { name: c.district, count: 0, critical: 0, projects: 0, deployed: 0, cats: {} };
      byDistrict[c.district].cats[c.category] = (byDistrict[c.district].cats[c.category] ?? 0) + 1;
      byDistrict[c.district].count += 1;
      if (c.priority?.level === 'CRITICAL' || c.priority?.level === 'HIGH') byDistrict[c.district].critical += 1;
      if (STAGE_INDEX[c.status] >= STAGE_INDEX.validated) validated += 1;
      if (STAGE_INDEX[c.status] >= STAGE_INDEX.university_matched) { active += 1; byDistrict[c.district].projects += 1; }
      if (STAGE_INDEX[c.status] >= STAGE_INDEX.deployment) { completed += 1; byDistrict[c.district].deployed += 1; }
      if (c.impact) beneficiaries += c.impact.beneficiaries;
      (c.partners ?? []).forEach((p) => partners.add(p.id));
      if (c.university) unis.add(c.university.id);
      students += c.team?.members.filter((m) => m.role === 'Student').length ?? 0;
      (c.feedback ?? []).forEach((f) => { feedbackCount += 1; ratingSum += f.rating || 0; });
    }
    return {
      total: challenges.length, validated, active, completed, beneficiaries,
      partners: partners.size, universities: unis.size, students,
      feedbackCount, avgRating: feedbackCount ? +(ratingSum / feedbackCount).toFixed(1) : 0,
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byDistrict: Object.values(byDistrict)
        .map((d) => ({ ...d, topCategory: Object.entries(d.cats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null }))
        .sort((a, b) => b.count - a.count),
      markers: challenges.map((c) => ({
        id: c.id, district: c.district, category: c.category, status: c.status,
        title: c.title, deployed: STAGE_INDEX[c.status] >= STAGE_INDEX.deployment,
      })),
      byStage: STAGES.map((s) => ({ name: s.short, key: s.key, value: challenges.filter((c) => c.status === s.key).length })),
      pending: challenges.filter((c) => c.validation.status === 'pending'),
      delayed: challenges.filter((c) => (c.milestones ?? []).some((m) => m.status !== 'completed' && new Date(m.due) < new Date())),
      awaitingReview: challenges.filter((c) => STAGE_INDEX[c.status] >= STAGE_INDEX.prototype && STAGE_INDEX[c.status] < STAGE_INDEX.deployment),
      deployed: challenges.filter((c) => STAGE_INDEX[c.status] >= STAGE_INDEX.deployment),
    };
  }, [challenges]);
}

export function useNotifications(role) {
  const { notifications } = usePlatform();
  return useMemo(() => {
    const mine = notifications.filter((n) => n.role === role);
    return { list: mine, unread: mine.filter((n) => !n.read).length };
  }, [notifications, role]);
}
