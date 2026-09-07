import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useCallback, useState } from 'react';
import { STAGE_INDEX, STAGES } from '../data/constants';
import { buildSeedChallenges, SEED_NOTIFICATIONS } from '../data/seedChallenges';
import { runAnalysis, matchIndustries, suggestDisciplines } from '../services/aiEngine';
import { UNIVERSITIES, TALENT_POOL } from '../data/universities';
import { INDUSTRIES } from '../data/industries';
import { fetchPlatformState, repo } from '../services/repository';
import { runAiAnalysis } from '../services/aiService';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const PlatformContext = createContext(null);

let seq = 0;
const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${(seq += 1)}`;
const now = () => new Date().toISOString();

const ALL_ROLES = ['citizen', 'varsity', 'industry', 'govt'];

function makeNotifications(roles, text, tone = 'info', challengeId = null) {
  return roles.map((role) => ({
    id: uid('n'), role, text, tone, at: now(), read: false, challengeId,
  }));
}

const initialState = {
  challenges: [],
  notifications: [],
  activity: [],
  source: 'loading',      // 'loading' | 'supabase' | 'offline'
  loadError: null,
  submitFlow: { phase: 'form', code: null, error: null, aiError: null },
  activeUniversityId: 'u1',
  activeIndustryId: 'i2',
  citizenName: 'Pooja Kachhap',
  toast: null,
  demo: { running: false, step: 0, challengeId: null },
};

function push(state, challengeId, patch, notif = []) {
  return {
    ...state,
    challenges: state.challenges.map((c) => (c.id === challengeId ? { ...c, ...patch } : c)),
    notifications: [...notif, ...state.notifications].slice(0, 60),
  };
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

function reducer(state, action) {
  switch (action.type) {
    /* ── Citizen submits ────────────────────────────────────────────── */
    case 'SUBMIT_CHALLENGE': {
      const p = action.payload;
      const id = `CH-${1200 + state.challenges.filter((c) => !c.seeded).length + 1}`;
      const base = {
        id, code: id, title: p.title, description: p.description,
        district: p.district, village: p.village || p.district, affected: Number(p.affected) || 0,
        citizen: { name: state.citizenName, id: 'cit-me' },
        createdAt: now(),
        attachments: p.attachments ?? [],
        categoryOverride: p.category || null,
      };
      const challenge = {
        ...base,
        category: p.category || 'Public Services',
        status: 'submitted',
        ai: null, priority: null,
        validation: { status: 'pending', by: null, at: null, note: null },
        university: null, recommendedTo: [], team: null, proposal: null,
        industryNeed: null, partners: [], milestones: [], updates: [], impact: null,
        history: [{ stage: 'submitted', at: now(), by: 'citizen', note: 'Challenge submitted by citizen' }],
        upvotes: 1, seeded: false, isMine: true,
      };
      return {
        ...state,
        challenges: [challenge, ...state.challenges],
        notifications: [
          ...makeNotifications(['govt'], `New challenge submitted — ${p.title}`, 'info', id),
          ...makeNotifications(['citizen'], `Your challenge ${id} was submitted successfully`, 'success', id),
          ...state.notifications,
        ],
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
        ...makeNotifications(['govt'], `${c.id} analysed — Priority ${ai.priority.score}/100 (${ai.priority.level})`, 'info', c.id),
      ]);
    }

    /* ── Government validates ───────────────────────────────────────── */
    case 'VALIDATE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const matches = c.ai?.universityMatches ?? [];
      return push(state, c.id, {
        validation: { status: 'validated', by: action.by ?? 'District Innovation Cell', at: now(), note: action.note ?? 'Verified and approved for university matching.' },
        recommendedTo: matches.slice(0, 3).map((m) => m.id),
        ...advanceTo(c, 'validated', 'govt', action.note ?? 'Validated by district administration'),
      }, [
        ...makeNotifications(['citizen'], `Your challenge ${c.id} has been validated by the government`, 'success', c.id),
        ...makeNotifications(['varsity'], `New recommended challenge: ${c.title}`, 'info', c.id),
      ]);
    }

    case 'REJECT_CHALLENGE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      return push(state, c.id, {
        validation: { status: 'rejected', by: 'District Innovation Cell', at: now(), note: action.note ?? 'Duplicate of an existing challenge.' },
      }, makeNotifications(['citizen'], `Challenge ${c.id} was marked as duplicate/invalid`, 'warn', c.id));
    }

    /* ── University accepts ─────────────────────────────────────────── */
    case 'UNIVERSITY_ACCEPT': {
      const c = state.challenges.find((x) => x.id === action.id);
      const u = UNIVERSITIES.find((x) => x.id === action.universityId);
      if (!c || !u) return state;
      const score = c.ai?.universityMatches.find((m) => m.id === u.id)?.score ?? 85;
      return push(state, c.id, {
        university: { id: u.id, name: u.name, short: u.short, district: u.district, matchScore: score, acceptedAt: now() },
        ...advanceTo(c, 'university_matched', 'varsity', `${u.name} accepted the challenge`),
      }, [
        ...makeNotifications(['citizen'], `${u.short} has been assigned to your challenge ${c.id}`, 'success', c.id),
        ...makeNotifications(['govt'], `${u.short} accepted ${c.id}`, 'success', c.id),
        ...makeNotifications(['varsity'], `You accepted ${c.id} — form a multidisciplinary team next`, 'info', c.id),
      ]);
    }

    case 'UNIVERSITY_DECLINE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      return push(state, c.id, {
        recommendedTo: (c.recommendedTo ?? []).filter((r) => r !== action.universityId),
      }, makeNotifications(['govt'], `A university declined ${c.id} — re-routing to next best match`, 'warn', c.id));
    }

    /* ── Team formation ─────────────────────────────────────────────── */
    case 'FORM_TEAM': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const team = {
        name: action.team.name,
        disciplines: action.team.disciplines ?? suggestDisciplines(c.category),
        members: action.team.members,
        formedAt: now(),
      };
      return push(state, c.id, {
        team, ...advanceTo(c, 'team_formed', 'varsity', `${team.members.length}-member multidisciplinary team formed`),
      }, [
        ...makeNotifications(['citizen'], `A multidisciplinary team was formed for ${c.id}`, 'success', c.id),
        ...makeNotifications(['govt'], `Team formed for ${c.id} (${team.members.length} members)`, 'info', c.id),
      ]);
    }

    /* ── Proposal ───────────────────────────────────────────────────── */
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
        ...advanceTo(c, 'proposal_created', 'varsity', 'Project proposal published'),
      }, [
        ...makeNotifications(['industry'], `New project seeking support: ${c.title}`, 'info', c.id),
        ...makeNotifications(['govt'], `Proposal created for ${c.id}`, 'info', c.id),
        ...makeNotifications(['citizen'], `A project proposal was created for your challenge ${c.id}`, 'success', c.id),
      ]);
    }

    /* ── Industry ───────────────────────────────────────────────────── */
    case 'INDUSTRY_JOIN': {
      const c = state.challenges.find((x) => x.id === action.id);
      const f = INDUSTRIES.find((x) => x.id === action.industryId);
      if (!c || !f) return state;
      if (c.partners.some((p) => p.id === f.id)) return state;
      const partner = {
        id: f.id, name: f.name, short: f.short, type: f.type,
        supports: action.supports?.length ? action.supports : f.supports.slice(0, 3),
        amount: action.amount || f.funding, joinedAt: now(),
      };
      return push(state, c.id, {
        partners: [...c.partners, partner],
        industryNeed: { ...(c.industryNeed ?? { needs: [], note: '' }), open: false },
        ...advanceTo(c, 'industry_matched', 'industry', `${f.name} joined as an industry partner`),
      }, [
        ...makeNotifications(['citizen', 'govt', 'varsity'], `${f.short} joined ${c.id} as an industry partner`, 'success', c.id),
        ...makeNotifications(['industry'], `You are now supporting ${c.id}`, 'success', c.id),
      ]);
    }

    /* ── Lifecycle progression ──────────────────────────────────────── */
    case 'ADVANCE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const target = action.stage ?? STAGES[Math.min(STAGE_INDEX[c.status] + 1, STAGES.length - 1)].key;
      if (STAGE_INDEX[target] <= STAGE_INDEX[c.status]) return state;
      const meta = STAGES[STAGE_INDEX[target]];
      const patch = { ...advanceTo(c, target, meta.owner, action.note) };

      if (target === 'impact_measured' && !c.impact) {
        patch.impact = {
          beneficiaries: c.affected || 1200,
          metrics: [
            { label: 'Citizens benefited', value: c.affected || 1200, unit: '' },
            { label: 'Service improvement', value: 62, unit: '%' },
            { label: 'Annual saving', value: 1250000, unit: ' ₹' },
            { label: 'Community satisfaction', value: 91, unit: '/100' },
          ],
          sustainability: 84, durationMonths: 9,
          summary: 'Solution deployed and independently verified by the district administration.',
        };
      }
      if (['prototype', 'testing', 'pilot', 'deployment', 'impact_measured'].includes(target)) {
        const cut = { prototype: 4, testing: 5, pilot: 6, deployment: 8, impact_measured: 9 }[target];
        patch.milestones = c.milestones.map((m, i) => ({
          ...m,
          status: i < cut - 1 ? 'completed' : i === cut - 1 ? 'in_progress' : m.status,
          progress: i < cut - 1 ? 100 : i === cut - 1 ? Math.max(m.progress, 45) : m.progress,
        }));
      }
      return push(state, c.id, patch,
        makeNotifications(ALL_ROLES, `${c.id} moved to ${meta.label}`, target === 'impact_measured' ? 'success' : 'info', c.id));
    }

    case 'UPDATE_MILESTONE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const milestones = c.milestones.map((m) => (m.id === action.milestoneId
        ? { ...m, status: action.status, progress: action.status === 'completed' ? 100 : action.status === 'in_progress' ? Math.max(m.progress, 40) : 0 }
        : m));
      return push(state, c.id, { milestones },
        makeNotifications(['citizen', 'govt', 'industry'], `Milestone updated on ${c.id}`, 'info', c.id));
    }

    case 'POST_UPDATE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const update = { id: uid('up'), at: now(), by: action.by, role: action.role, text: action.text };
      return push(state, c.id, { updates: [update, ...(c.updates ?? [])] },
        makeNotifications(ALL_ROLES.filter((r) => r !== action.role), `New update on ${c.id} from ${action.by}`, 'info', c.id));
    }

    case 'UPVOTE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      return push(state, c.id, { upvotes: c.upvotes + 1 });
    }

    case 'REQUEST_INDUSTRY': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      return push(state, c.id, {
        industryNeed: { open: true, needs: action.needs, note: action.note },
      }, makeNotifications(['industry'], `Support requested for ${c.id}: ${action.needs.join(', ')}`, 'info', c.id));
    }

    case 'PUBLISH_PROTOTYPE': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const prototypeData = {
        ...action.prototype,
        publishedAt: now(),
        isIndustryReady: true,
      };
      return push(state, c.id, {
        prototypeData,
        ...advanceTo(c, 'prototype', 'varsity', 'Working prototype published and advertised for industry scaling'),
      }, [
        ...makeNotifications(['industry'], `New scalable prototype published by ${c.university?.short || 'University'}: ${action.prototype.title}`, 'info', c.id),
        ...makeNotifications(['govt'], `Prototype ready for ${c.id} with scaling funding request of ₹${Number(action.prototype.estimatedFunding).toLocaleString('en-IN')}`, 'info', c.id),
        ...makeNotifications(['citizen'], `A working prototype has been built for your challenge ${c.id}`, 'success', c.id),
      ]);
    }

    case 'PLEDGE_SCALING_FUNDING': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const f = INDUSTRIES.find((x) => x.id === action.industryId) || { id: 'i-custom', name: action.industryName || 'Industry Partner', short: action.industryName || 'Industry', type: 'Enterprise' };
      const partner = {
        id: f.id,
        name: f.name,
        short: f.short,
        type: f.type,
        supports: action.supports || ['Funding', 'Mentorship'],
        amount: `₹${Number(action.amount).toLocaleString('en-IN')}`,
        joinedAt: now(),
      };
      const updatedProto = c.prototypeData ? {
        ...c.prototypeData,
        fundingRaised: (c.prototypeData.fundingRaised || 0) + Number(action.amount),
      } : null;

      return push(state, c.id, {
        partners: [...c.partners.filter((p) => p.id !== f.id), partner],
        prototypeData: updatedProto,
        ...advanceTo(c, 'pilot', 'industry', `${f.name} adopted scalable prototype and pledged ₹${Number(action.amount).toLocaleString('en-IN')}`),
      }, [
        ...makeNotifications(['varsity'], `${f.short} adopted your prototype for ${c.id} with ₹${Number(action.amount).toLocaleString('en-IN')} funding!`, 'success', c.id),
        ...makeNotifications(['citizen'], `Industry partner ${f.short} joined to scale the solution for ${c.id}`, 'success', c.id),
        ...makeNotifications(['govt'], `${f.short} funded prototype scaling for ${c.id}`, 'info', c.id),
      ]);
    }

    case 'GOVERNMENT_REVIEW': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const review = { id: uid('rv'), decision: action.decision, note: action.note, by: action.reviewer, at: now() };
      const patch = { reviews: [review, ...(c.reviews ?? [])] };
      if (action.decision === 'approved') {
        Object.assign(patch, advanceTo(c, 'deployment', 'govt', `Deployment approved — ${action.note ?? ''}`));
      }
      return push(state, c.id, patch, makeNotifications(
        ['varsity', 'industry', 'citizen'],
        `Government review on ${c.id}: ${action.decision}`,
        action.decision === 'approved' ? 'success' : 'warn', c.id,
      ));
    }

    case 'CITIZEN_FEEDBACK': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const fb = {
        id: uid('fb'), rating: action.rating, solved: action.solved,
        comment: action.comment, by: action.citizenName, at: now(),
      };
      return push(state, c.id, {
        feedback: [fb, ...(c.feedback ?? [])],
        ...advanceTo(c, 'impact_measured', 'citizen', `Citizen verified the outcome (${action.rating}/5)`),
      }, makeNotifications(['govt', 'varsity', 'industry'],
        `Citizen feedback received on ${c.id} (${action.rating}/5)`, 'success', c.id));
    }

    case 'SUBMIT_FLOW':
      return { ...state, submitFlow: { ...state.submitFlow, ...action.payload } };

    /* ── Data source ────────────────────────────────────────────────── */
    case 'HYDRATE':
      return {
        ...state,
        challenges: action.payload.challenges,
        notifications: action.payload.notifications,
        activity: action.payload.activity ?? [],
        source: 'supabase',
        loadError: null,
      };

    case 'HYDRATE_OFFLINE':
      return {
        ...state,
        challenges: buildSeedChallenges(),
        notifications: SEED_NOTIFICATIONS,
        source: 'offline',
        loadError: action.error ?? null,
      };

    /* Applies a real AI result returned by the ai-analyze edge function. */
    case 'SET_AI': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      const a = action.analysis;
      return push(state, c.id, {
        ai: a,
        category: a.category ?? c.category,
        priority: a.priority,
        recommendedTo: (a.universityMatches ?? []).slice(0, 3).map((m) => m.id),
        ...advanceTo(c, 'ai_analysed', 'ai', `Classified as ${a.category} (${a.classification?.confidence ?? '—'}% confidence) by ${a.engine}`),
      }, makeNotifications(['citizen', 'govt'],
        `AI analysed ${c.id}: ${a.category} · Priority ${a.priority?.level ?? ''}`, 'info', c.id));
    }

    case 'SET_AI_ERROR': {
      const c = state.challenges.find((x) => x.id === action.id);
      if (!c) return state;
      return push(state, c.id, { aiError: action.error });
    }

    /* ── UI plumbing ────────────────────────────────────────────────── */
    case 'SET_ACTIVE_UNIVERSITY': return { ...state, activeUniversityId: action.id };
    case 'SET_ACTIVE_INDUSTRY': return { ...state, activeIndustryId: action.id };
    case 'READ_NOTIFICATIONS':
      return { ...state, notifications: state.notifications.map((n) => (n.role === action.role ? { ...n, read: true } : n)) };
    case 'TOAST': return { ...state, toast: { id: uid('t'), text: action.text, tone: action.tone ?? 'info' } };
    case 'CLEAR_TOAST': return { ...state, toast: null };
    case 'DEMO': return { ...state, demo: { ...state.demo, ...action.payload } };
    case 'RESET': return { ...state, challenges: buildSeedChallenges(), notifications: SEED_NOTIFICATIONS, source: 'offline' };
    default: return state;
  }
}

export function PlatformProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timers = useRef([]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [aiBusy, setAiBusy] = useState({});

  const toast = useCallback((text, tone = 'info') => dispatch({ type: 'TOAST', text, tone }), []);

  /* ── Load everything from Supabase ─────────────────────────────────── */
  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) {
      dispatch({ type: 'HYDRATE_OFFLINE', error: 'Supabase credentials missing (.env)' });
      return;
    }
    try {
      const data = await fetchPlatformState();
      if (data && data.challenges.length) dispatch({ type: 'HYDRATE', payload: data });
      else if (data) dispatch({ type: 'HYDRATE', payload: data });
    } catch (e) {
      console.error('Platform load failed, falling back to local dataset:', e);
      dispatch({ type: 'HYDRATE_OFFLINE', error: e.message });
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  /* ── Realtime: any lifecycle write refreshes every dashboard ───────── */
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let timer = null;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(reload, 400); };
    const channel = supabase.channel('platform-sync');
    ['challenges', 'projects', 'teams', 'team_members', 'project_milestones', 'solutions',
      'industry_support', 'government_reviews', 'deployments', 'citizen_feedback',
      'notifications', 'activity_log', 'project_updates', 'challenge_media', 'ai_analysis']
      .forEach((table) => channel.on('postgres_changes', { event: '*', schema: 'public', table }, refresh));
    channel.subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(channel); };
  }, [reload]);

  /* ── Write-through: every local transition is persisted to Supabase ── */
  const persist = useCallback(async (action) => {
    if (!isSupabaseConfigured || stateRef.current.source !== 'supabase') return;
    const find = (id) => stateRef.current.challenges.find((c) => c.id === id);
    try {
      switch (action.type) {
        case 'VALIDATE': {
          const c = find(action.id); if (!c) return;
          await repo.validate(c.code, {
            by: action.by ?? 'District Innovation Cell',
            note: action.note ?? 'Verified and approved for university matching.',
            matches: c.ai?.universityMatches,
          });
          break;
        }
        case 'REJECT_CHALLENGE': {
          const c = find(action.id); if (!c) return;
          await repo.reject(c.code, { by: 'District Innovation Cell', note: action.note ?? 'Duplicate of an existing challenge.' });
          break;
        }
        case 'UNIVERSITY_ACCEPT': {
          const c = find(action.id); if (!c) return;
          const u = UNIVERSITIES.find((x) => x.id === action.universityId);
          if (!u) return;
          await repo.universityAccept(c.code, {
            challengeDbId: c.dbId,
            university: { id: u.id, name: u.name, short: u.short, district: u.district },
            score: c.ai?.universityMatches?.find((m) => m.id === u.id)?.score ?? 85,
            by: u.name,
          });
          break;
        }
        case 'FORM_TEAM': {
          const c = find(action.id); if (!c) return;
          await repo.formTeam(c.code, {
            projectId: c.projectId,
            name: action.team.name,
            disciplines: action.team.disciplines ?? suggestDisciplines(c.category),
            members: action.team.members,
          });
          break;
        }
        case 'CREATE_PROPOSAL': {
          const c = find(action.id); if (!c) return;
          await repo.createProposal(c.code, {
            projectId: c.projectId,
            proposal: action.proposal,
            milestones: action.milestones,
            needs: action.needs ?? ['Funding', 'Technology'],
            note: action.note ?? 'Seeking industry partner.',
          });
          break;
        }
        case 'INDUSTRY_JOIN': {
          const c = find(action.id); if (!c) return;
          const f = INDUSTRIES.find((x) => x.id === action.industryId);
          if (!f) return;
          await repo.industryJoin(c.code, {
            projectId: c.projectId,
            firm: { id: f.id, name: f.name, short: f.short, type: f.type },
            supports: action.supports?.length ? action.supports : f.supports.slice(0, 3),
            amountLabel: action.amount || f.funding,
            amount: String(action.amount || '').replace(/[^0-9]/g, ''),
          });
          break;
        }
        case 'ADVANCE': {
          const c = find(action.id); if (!c) return;
          const target = action.stage ?? STAGES[Math.min(STAGE_INDEX[c.status] + 1, STAGES.length - 1)].key;
          const updated = stateRef.current.challenges.find((x) => x.id === action.id);
          await repo.advance(c.code, {
            projectId: c.projectId, stage: target,
            actorRole: STAGES[STAGE_INDEX[target]].owner,
            actor: c.university?.name ?? 'Project team',
            impact: updated?.impact,
          });
          break;
        }
        case 'UPDATE_MILESTONE': {
          const c = find(action.id); if (!c) return;
          const m = c.milestones.find((x) => x.id === action.milestoneId);
          if (m?.dbId) await repo.updateMilestone(c.code, m.dbId, action.status);
          break;
        }
        case 'POST_UPDATE': {
          const c = find(action.id); if (!c) return;
          await repo.postUpdate(c.code, { author: action.by, role: action.role, text: action.text });
          break;
        }
        case 'UPVOTE': {
          const c = find(action.id); if (!c) return;
          await repo.upvote(c.code, c.upvotes);
          break;
        }
        case 'PUBLISH_PROTOTYPE': {
          const c = find(action.id); if (!c) return;
          await repo.publishSolution(c.code, { projectId: c.projectId, data: action.prototype });
          break;
        }
        case 'PLEDGE_SCALING_FUNDING': {
          const c = find(action.id); if (!c) return;
          const f = INDUSTRIES.find((x) => x.id === action.industryId)
            ?? { id: 'i-custom', name: action.industryName || 'Industry Partner', short: action.industryName || 'Industry', type: 'Enterprise' };
          await repo.industryJoin(c.code, {
            projectId: c.projectId, firm: f,
            supports: action.supports || ['Funding', 'Mentorship'],
            amountLabel: `Rs ${Number(action.amount).toLocaleString('en-IN')}`,
            amount: action.amount,
          });
          break;
        }
        case 'GOVERNMENT_REVIEW': {
          const c = find(action.id); if (!c) return;
          await repo.governmentReview(c.code, {
            decision: action.decision, note: action.note,
            reviewer: action.reviewer, projectId: c.projectId,
          });
          if (action.decision === 'approved') {
            await repo.advance(c.code, {
              projectId: c.projectId, stage: 'deployment', actorRole: 'govt',
              actor: action.reviewer,
              impact: {
                summary: `Deployment approved by ${action.reviewer}. ${action.note ?? ''}`.trim(),
                beneficiaries: c.affected || 0,
                metrics: [
                  { label: 'Citizens benefited', value: c.affected || 0, unit: '' },
                  { label: 'Service improvement', value: 62, unit: '%' },
                ],
                sustainability: 84, durationMonths: 9,
              },
            });
          }
          break;
        }
        case 'CITIZEN_FEEDBACK': {
          const c = find(action.id); if (!c) return;
          await repo.citizenFeedback(c.code, {
            projectId: c.projectId, citizenId: action.citizenId, citizenName: action.citizenName,
            rating: action.rating, solved: action.solved, comment: action.comment,
          });
          await repo.advance(c.code, {
            projectId: c.projectId, stage: 'impact_measured', actorRole: 'citizen',
            actor: action.citizenName,
          });
          break;
        }
        case 'READ_NOTIFICATIONS':
          await repo.markNotificationsRead(action.role);
          break;
        default:
          break;
      }
    } catch (e) {
      console.error(`Persisting ${action.type} failed:`, e);
      dispatch({ type: 'TOAST', text: `Could not save to database: ${e.message ?? e}`, tone: 'warn' });
    }
  }, []);

  /* Public dispatch: optimistic local update + durable Supabase write. */
  const dispatchAndPersist = useCallback((action) => {
    dispatch(action);
    persist(action);
  }, [persist]);

  /* ── Citizen submission goes to Supabase first (needs a real code) ── */
  const setFlow = useCallback((payload) => dispatch({ type: 'SUBMIT_FLOW', payload }), []);

  const submitChallenge = useCallback(async (payload) => {
    dispatch({ type: 'SUBMIT_FLOW', payload: { phase: 'submitting', error: null, aiError: null } });
    if (!isSupabaseConfigured || stateRef.current.source !== 'supabase') {
      dispatch({ type: 'SUBMIT_CHALLENGE', payload });
      const local = stateRef.current.challenges[0];
      dispatch({ type: 'SUBMIT_FLOW', payload: { phase: 'analysing', code: local?.code } });
      return { ok: true, code: local?.code, offline: true };
    }
    try {
      const { code } = await repo.createChallenge(payload);
      dispatch({ type: 'SUBMIT_FLOW', payload: { phase: 'analysing', code, error: null, aiError: null } });
      await reload();
      dispatch({ type: 'TOAST', text: `Challenge ${code} submitted`, tone: 'success' });
      return { ok: true, code };
    } catch (e) {
      console.error('Challenge submission failed:', e);
      dispatch({ type: 'SUBMIT_FLOW', payload: { phase: 'form', error: e.message ?? String(e) } });
      dispatch({ type: 'TOAST', text: `Submission failed: ${e.message ?? e}`, tone: 'warn' });
      return { ok: false, error: e.message ?? String(e) };
    }
  }, [reload]);

  /* ── Real AI analysis through the edge function ────────────────────── */
  const analyseChallenge = useCallback(async (challengeOrId) => {
    const c = typeof challengeOrId === 'string'
      ? stateRef.current.challenges.find((x) => x.id === challengeOrId)
      : challengeOrId;
    if (!c) return { ok: false, error: 'Challenge not found' };

    setAiBusy((b) => ({ ...b, [c.id]: true }));
    const res = await runAiAnalysis(c);
    setAiBusy((b) => ({ ...b, [c.id]: false }));

    if (!res.ok) {
      dispatch({ type: 'SET_AI_ERROR', id: c.id, error: res.error });
      // Never block the workflow: fall back to the local deterministic engine.
      dispatch({ type: 'RUN_AI', id: c.id });
      dispatch({ type: 'TOAST', text: `AI service unavailable — used local engine (${res.error})`, tone: 'warn' });
      return res;
    }

    const a = res.analysis;
    dispatch({
      type: 'SET_AI',
      id: c.id,
      analysis: {
        engine: a.engine,
        model: a.model,
        analysedAt: new Date().toISOString(),
        durationMs: a.duration_ms,
        detectedLanguage: a.detected_language,
        englishText: a.english_text,
        languageConfidence: a.language_confidence,
        category: a.category,
        classification: {
          category: a.category,
          confidence: a.category_confidence,
          alternates: a.alternate_categories ?? [],
          keywords: a.keywords ?? [],
        },
        severity: { score: a.severity_score, reasoning: a.severity_reasoning },
        criticality: a.criticality_score,
        priority: { score: a.priority_score, level: a.priority_level, factors: a.priority_factors ?? {} },
        duplicates: a.duplicates ?? [],
        universityMatches: a.university_matches ?? [],
        industryMatches: a.industry_matches ?? [],
        disciplines: a.disciplines ?? [],
        requiredExpertise: a.required_expertise ?? [],
        reasoning: a.reasoning,
      },
    });
    if (isSupabaseConfigured) reload();
    return res;
  }, [reload]);

  /* Runs the entire lifecycle end-to-end for the presentation mode. */
  const runDemoScenario = useCallback((challengeId, onStep) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const steps = [
      { d: 400, run: () => analyseChallenge(challengeId) },
      { d: 3200, run: () => dispatchAndPersist({ type: 'VALIDATE', id: challengeId }) },
      { d: 4400, run: () => {
        const c = stateRef.current.challenges.find((x) => x.id === challengeId);
        const best = c?.ai?.universityMatches?.[0]?.id ?? 'u1';
        dispatchAndPersist({ type: 'UNIVERSITY_ACCEPT', id: challengeId, universityId: best });
      } },
      { d: 5600, run: () => dispatchAndPersist({ type: 'FORM_TEAM', id: challengeId, team: { name: 'Rapid Response Innovation Cell', members: TALENT_POOL.u1.slice(0, 5) } }) },
      { d: 6800, run: () => dispatchAndPersist({
        type: 'CREATE_PROPOSAL', id: challengeId,
        proposal: { title: 'Community solution proposal', objective: 'Deploy a sustainable community-owned solution.', approach: 'Survey → co-design → prototype → pilot → handover', budget: '₹24,00,000', duration: '8 months' },
        milestones: [
          { title: 'Field survey', owner: 'University Team', due: new Date(Date.now() + 14 * 86400000).toISOString() },
          { title: 'Prototype build', owner: 'University + Industry', due: new Date(Date.now() + 60 * 86400000).toISOString() },
          { title: 'Field pilot', owner: 'Industry Partner', due: new Date(Date.now() + 110 * 86400000).toISOString() },
          { title: 'Deployment & handover', owner: 'Government', due: new Date(Date.now() + 160 * 86400000).toISOString() },
        ],
        needs: ['Funding', 'Technology', 'Deployment'],
      }) },
      { d: 8000, run: () => {
        const c = stateRef.current.challenges.find((x) => x.id === challengeId);
        const best = c?.ai?.industryMatches?.[0]?.id ?? 'i2';
        dispatchAndPersist({ type: 'INDUSTRY_JOIN', id: challengeId, industryId: best });
      } },
      { d: 9200, run: () => dispatchAndPersist({ type: 'ADVANCE', id: challengeId, stage: 'prototype' }) },
      { d: 10200, run: () => dispatchAndPersist({ type: 'ADVANCE', id: challengeId, stage: 'testing' }) },
      { d: 11200, run: () => dispatchAndPersist({ type: 'ADVANCE', id: challengeId, stage: 'pilot' }) },
      { d: 12200, run: () => dispatchAndPersist({ type: 'ADVANCE', id: challengeId, stage: 'deployment' }) },
      { d: 13400, run: () => dispatchAndPersist({ type: 'ADVANCE', id: challengeId, stage: 'impact_measured' }) },
    ];
    steps.forEach((s, i) => {
      timers.current.push(setTimeout(() => {
        s.run();
        onStep?.(i + 1, steps.length);
      }, s.d));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [analyseChallenge, dispatchAndPersist]);

  const value = useMemo(() => ({
    ...state,
    dispatch: dispatchAndPersist,
    rawDispatch: dispatch,
    toast,
    runDemoScenario,
    reload,
    submitChallenge,
    analyseChallenge,
    aiBusy,
    isSupabaseConfigured,
  }), [state, dispatchAndPersist, toast, runDemoScenario, reload, submitChallenge, analyseChallenge, aiBusy]);
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
    let validated = 0, active = 0, completed = 0, beneficiaries = 0, partners = new Set(), unis = new Set(), students = 0;
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
      c.partners.forEach((p) => partners.add(p.id));
      if (c.university) unis.add(c.university.id);
      students += c.team?.members.filter((m) => m.role === 'Student').length ?? 0;
    }
    return {
      total: challenges.length, validated, active, completed, beneficiaries,
      partners: partners.size, universities: unis.size, students,
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
      delayed: challenges.filter((c) => c.milestones.some((m) => m.status !== 'completed' && new Date(m.due) < new Date())),
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
