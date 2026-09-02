import { useMemo, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Check, X, Users, FileText, Factory, ArrowRight, Sparkles, Plus } from 'lucide-react';
import DashboardLayout from '../../components/navigation/DashboardLayout';
import ChallengeCard from '../../components/cards/ChallengeCard';
import ChallengeDetail, { MilestoneList } from '../../components/shared/ChallengeDetail';
import { MatchList, DisciplineWeb } from '../../components/shared/AIPanel';
import { LifecycleTrack, StageBadge } from '../../components/workflow/Lifecycle';
import { Stat, Chip, Modal, SearchInput, Select, Empty, Avatar, Counter, Bar, ScoreRing, Reveal, Tabs } from '../../components/shared/ui';
import { VBar, FitRadar, CategoryDonut } from '../../components/charts/Charts';
import { usePlatform } from '../../context/PlatformContext';
import { UNIVERSITIES, TALENT_POOL } from '../../data/universities';
import { CATEGORY_KEYS, ROLES, STAGE_INDEX, STAGES, catMeta, SUPPORT_TYPES } from '../../data/constants';
import { suggestDisciplines } from '../../services/aiEngine';
import { timeAgo, fmtFull, cx } from '../../utils/format';

const R = ROLES.varsity;

export default function UniversityDashboard() {
  const { challenges, activeUniversityId } = usePlatform();
  const uni = UNIVERSITIES.find((u) => u.id === activeUniversityId) ?? UNIVERSITIES[0];

  const incoming = useMemo(() => challenges.filter((c) => (
    c.validation.status === 'validated' && !c.university && (c.recommendedTo ?? []).includes(uni.id)
  )), [challenges, uni.id]);

  const mine = useMemo(() => challenges.filter((c) => c.university?.id === uni.id), [challenges, uni.id]);

  const nav = [
    { to: '/university', label: 'Overview', icon: 'LayoutDashboard', end: true },
    { to: '/university/challenges', label: 'Recommended', icon: 'Inbox', badge: incoming.length },
    { to: '/university/projects', label: 'My Projects', icon: 'FolderKanban', badge: mine.length },
    { to: '/university/teams', label: 'Teams & Talent', icon: 'Users' },
    { to: '/university/industry', label: 'Industry Support', icon: 'Handshake' },
    { to: '/university/analytics', label: 'Analytics', icon: 'BarChart3' },
  ];

  return (
    <DashboardLayout role="varsity" nav={nav}
      title={uni.name} subtitle={`${uni.type} · ${uni.district} · ${uni.faculty} faculty · ${uni.students} students`}
      user={{ name: uni.short, meta: 'Innovation Cell' }}
      headerRight={<UniSwitcher />}>
      <Routes>
        <Route index element={<Overview uni={uni} incoming={incoming} mine={mine} />} />
        <Route path="challenges" element={<Incoming uni={uni} incoming={incoming} />} />
        <Route path="projects" element={<Projects uni={uni} mine={mine} />} />
        <Route path="teams" element={<Teams uni={uni} mine={mine} />} />
        <Route path="industry" element={<IndustrySupport mine={mine} />} />
        <Route path="analytics" element={<Analytics uni={uni} mine={mine} />} />
        <Route path="*" element={<Overview uni={uni} incoming={incoming} mine={mine} />} />
      </Routes>
    </DashboardLayout>
  );
}

function UniSwitcher() {
  const { activeUniversityId, dispatch } = usePlatform();
  return (
    <select className="field w-auto text-[0.78rem] py-1.5 hidden sm:block" value={activeUniversityId}
      onChange={(e) => dispatch({ type: 'SET_ACTIVE_UNIVERSITY', id: e.target.value })}>
      {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.short}</option>)}
    </select>
  );
}

/* ── Overview ───────────────────────────────────────────────────────── */
function Overview({ uni, incoming, mine }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(null);
  const active = mine.filter((c) => STAGE_INDEX[c.status] < STAGE_INDEX.deployment);
  const students = mine.reduce((s, c) => s + (c.team?.members.filter((m) => m.role === 'Student').length ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden" style={{ background: `linear-gradient(120deg,${R.hex},${R.deep})` }}>
        <motion.div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/10 anim-float" />
        <div className="relative flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-widest opacity-80">Research to society</p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-1">{incoming.length} new challenges match your expertise</h2>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {uni.domains.map((d) => <span key={d} className="chip bg-white/15 text-white">{d}</span>)}
            </div>
          </div>
          <button className="btn bg-white text-indigo-700 hover:bg-white/90 px-5 py-3 shrink-0" onClick={() => nav('/university/challenges')}>
            <Sparkles size={16} />Review recommendations
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Icons.Inbox} label="AI recommendations" value={incoming.length} color={R.hex} />
        <Stat icon={Icons.FolderKanban} label="Active projects" value={active.length} color="#0891b2" delay={0.08} />
        <Stat icon={Icons.Users} label="Students engaged" value={students} color="#f59e0b" delay={0.16} />
        <Stat icon={Icons.Factory} label="Industry partnerships" value={mine.reduce((s, c) => s + c.partners.length, 0)} color="#059669" delay={0.24} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-bold text-slate-900">Incoming recommended challenges</p>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/university/challenges')}>View all</button>
          </div>
          {incoming.length === 0 ? <Empty icon={Icons.InboxIcon ?? Icons.Inbox} title="Queue is clear" sub="Newly validated challenges matching your domains appear here." />
            : (
              <div className="space-y-3">
                {incoming.slice(0, 3).map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-100 p-3.5 hover:border-indigo-200 transition cursor-pointer" onClick={() => setOpen(c)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display font-bold text-[0.9rem] text-slate-900 truncate">{c.title}</p>
                        <p className="text-[0.72rem] text-slate-400">{c.district} · {fmtFull(c.affected)} affected · {timeAgo(c.createdAt)}</p>
                      </div>
                      <div className="shrink-0 text-center">
                        <ScoreRing value={c.ai?.universityMatches.find((m) => m.id === uni.id)?.score ?? 80} size={46} stroke={4} color={R.hex} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="card p-5">
          <p className="font-display font-bold text-slate-900 mb-1">Project portfolio</p>
          <p className="text-[0.76rem] text-slate-400 mb-3">Live lifecycle status of everything you have accepted</p>
          {mine.length === 0 ? <Empty icon={Icons.FolderOpen} title="No projects yet" sub="Accept a recommended challenge to start a project." />
            : (
              <div className="space-y-3.5">
                {mine.slice(0, 4).map((c) => (
                  <div key={c.id} className="cursor-pointer" onClick={() => setOpen(c)}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-[0.84rem] font-semibold text-slate-800 truncate">{c.title}</p>
                      <StageBadge status={c.status} size="sm" />
                    </div>
                    <Bar value={((STAGE_INDEX[c.status] + 1) / STAGES.length) * 100} color={R.hex} height={6} />
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <div className="card p-5">
        <p className="font-display font-bold text-slate-900 mb-3">Research strengths mapped to societal domains</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <FitRadar data={uni.domains.map((d, i) => ({ axis: d.split(' ')[0], value: 92 - i * 9 }))} color={R.hex} />
          <div className="space-y-2 self-center">
            {uni.research.map((r) => (
              <div key={r} className="flex items-center gap-2 text-[0.82rem] text-slate-600">
                <Icons.FlaskConical size={14} style={{ color: R.hex }} />{r}
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {uni.departments.map((d) => <Chip key={d} color={R.deep} bg={R.soft}>{d}</Chip>)}
            </div>
          </div>
        </div>
      </div>

      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="varsity" />
    </div>
  );
}

/* ── Incoming recommendations ───────────────────────────────────────── */
function Incoming({ uni, incoming }) {
  const { dispatch, toast } = usePlatform();
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const list = incoming.filter((c) => (cat === 'All' || c.category === cat) && c.title.toLowerCase().includes(q.toLowerCase()));

  const accept = (c) => {
    dispatch({ type: 'UNIVERSITY_ACCEPT', id: c.id, universityId: uni.id });
    toast(`${c.code} accepted — form your team next`, 'success');
    setOpen(null);
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search recommended challenges…" className="flex-1 min-w-[220px]" />
        <Select value={cat} onChange={setCat} options={['All', ...CATEGORY_KEYS]} className="w-auto" />
        <Chip color={R.hex} bg={R.soft}>{list.length} recommended by AI</Chip>
      </div>

      {list.length === 0 ? (
        <Empty icon={Icons.Inbox} title="No pending recommendations"
          sub="When the government validates a challenge in your research domains, the AI routes it here automatically." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {list.map((c, i) => (
              <ChallengeCard key={c.id} challenge={c} index={i} onOpen={setOpen} accent={R.hex}
                actions={(
                  <>
                    <button className="btn btn-sm text-white" style={{ background: R.hex }} onClick={() => accept(c)}><Check size={13} />Accept</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'UNIVERSITY_DECLINE', id: c.id, universityId: uni.id })}><X size={13} />Decline</button>
                  </>
                )} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="varsity"
        actions={open && (
          <>
            <button className="btn btn-primary" onClick={() => accept(open)}><Check size={15} />Accept this challenge</button>
            <button className="btn btn-ghost" onClick={() => { dispatch({ type: 'UNIVERSITY_DECLINE', id: open.id, universityId: uni.id }); setOpen(null); }}>Decline</button>
          </>
        )} />
    </div>
  );
}

/* ── Projects ───────────────────────────────────────────────────────── */
function Projects({ uni, mine }) {
  const { dispatch, toast } = usePlatform();
  const [open, setOpen] = useState(null);
  const [teamFor, setTeamFor] = useState(null);
  const [propFor, setPropFor] = useState(null);

  const nextStage = (c) => {
    const order = ['prototype', 'testing', 'pilot', 'deployment', 'impact_measured'];
    const cur = STAGE_INDEX[c.status];
    const next = order.find((s) => STAGE_INDEX[s] > cur);
    return next;
  };

  return (
    <div className="space-y-4">
      {mine.length === 0 ? (
        <Empty icon={Icons.FolderOpen} title="No projects yet" sub="Accept a recommended challenge to create your first project." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mine.map((c, i) => {
            const ns = nextStage(c);
            return (
              <ChallengeCard key={c.id} challenge={c} index={i} onOpen={setOpen} accent={R.hex}
                actions={(
                  <>
                    {!c.team && <button className="btn btn-sm text-white" style={{ background: R.hex }} onClick={() => setTeamFor(c)}><Users size={13} />Form team</button>}
                    {c.team && !c.proposal && <button className="btn btn-sm text-white" style={{ background: R.hex }} onClick={() => setPropFor(c)}><FileText size={13} />Create proposal</button>}
                    {c.proposal && c.partners.length === 0 && <Chip color="#b45309" bg="#fff7ed">Awaiting industry partner</Chip>}
                    {c.proposal && c.partners.length > 0 && ns && (
                      <button className="btn btn-sm text-white" style={{ background: R.hex }}
                        onClick={() => { dispatch({ type: 'ADVANCE', id: c.id, stage: ns }); toast(`${c.code} advanced to ${ns.replace('_', ' ')}`, 'success'); }}>
                        <ArrowRight size={13} />Move to {STAGES[STAGE_INDEX[ns]].short}
                      </button>
                    )}
                  </>
                )} />
            );
          })}
        </div>
      )}

      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="varsity"
        actions={open && (
          <>
            {!open.team && <button className="btn btn-primary" onClick={() => { setTeamFor(open); setOpen(null); }}><Users size={15} />Form multidisciplinary team</button>}
            {open.team && !open.proposal && <button className="btn btn-primary" onClick={() => { setPropFor(open); setOpen(null); }}><FileText size={15} />Create proposal</button>}
          </>
        )} />

      <TeamModal challenge={teamFor} uni={uni} onClose={() => setTeamFor(null)} />
      <ProposalModal challenge={propFor} onClose={() => setPropFor(null)} />
    </div>
  );
}

/* ── Team formation modal ───────────────────────────────────────────── */
function TeamModal({ challenge, uni, onClose }) {
  const { dispatch, toast } = usePlatform();
  const pool = TALENT_POOL[uni.id] ?? [];
  const [picked, setPicked] = useState([]);
  const [name, setName] = useState('');

  const disciplines = challenge ? suggestDisciplines(challenge.category) : [];
  const open = !!challenge;

  const toggle = (m) => setPicked((p) => (p.some((x) => x.id === m.id) ? p.filter((x) => x.id !== m.id) : [...p, m]));

  const autoPick = () => {
    const seen = new Set();
    const auto = [];
    for (const m of pool) {
      if (!seen.has(m.dept)) { seen.add(m.dept); auto.push(m); }
      if (auto.length >= 5) break;
    }
    setPicked(auto);
  };

  const submit = () => {
    dispatch({
      type: 'FORM_TEAM', id: challenge.id,
      team: { name: name.trim() || `${challenge.category.split(' ')[0]} Innovation Cell`, members: picked, disciplines },
    });
    toast(`Team of ${picked.length} formed for ${challenge.code}`, 'success');
    setPicked([]); setName('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} accent={R.hex} width="max-w-3xl"
      title="Form a multidisciplinary team" subtitle={challenge ? `${challenge.code} · ${challenge.title}` : ''}>
      {challenge && (
        <div className="space-y-4">
          <DisciplineWeb disciplines={disciplines} category={challenge.category} />
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="label">Team name</label>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={`${challenge.category.split(' ')[0]} Innovation Cell`} />
            </div>
            <button className="btn btn-ghost" onClick={autoPick}><Sparkles size={14} />AI auto-compose</button>
          </div>
          <div>
            <p className="label">Select faculty, researchers and students ({picked.length} selected)</p>
            <div className="grid sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {pool.map((m) => {
                const on = picked.some((x) => x.id === m.id);
                return (
                  <button key={m.id} onClick={() => toggle(m)}
                    className={cx('flex items-center gap-3 p-2.5 rounded-xl border text-left transition',
                      on ? 'border-transparent ring-2 ring-indigo-500 bg-indigo-50/60' : 'border-slate-100 hover:border-slate-200')}>
                    <Avatar name={m.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.82rem] font-bold text-slate-800 truncate">{m.name}</p>
                      <p className="text-[0.68rem] text-slate-400 truncate">{m.role} · {m.dept}</p>
                    </div>
                    {on && <Check size={15} className="text-indigo-600 shrink-0" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={picked.length < 2} onClick={submit}>
              <Users size={15} />Form team ({picked.length})
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ── Proposal modal ─────────────────────────────────────────────────── */
function ProposalModal({ challenge, onClose }) {
  const { dispatch, toast } = usePlatform();
  const [f, setF] = useState({ title: '', objective: '', approach: '', budget: '₹28,50,000', duration: '9 months' });
  const [needs, setNeeds] = useState(['Funding', 'Technology']);
  const open = !!challenge;

  const submit = () => {
    const base = Date.now();
    dispatch({
      type: 'CREATE_PROPOSAL', id: challenge.id,
      proposal: {
        title: f.title.trim() || `${challenge.category} solution for ${challenge.village}`,
        objective: f.objective.trim() || `Design, prototype and deploy a sustainable community-owned solution for: ${challenge.title}.`,
        approach: f.approach.trim() || 'Baseline field survey → co-design with community → low-cost prototype → supervised pilot → handover with maintenance training.',
        budget: f.budget, duration: f.duration,
      },
      milestones: [
        { title: 'Field survey and baseline data', owner: 'University Team', due: new Date(base + 21 * 86400000).toISOString() },
        { title: 'Solution design freeze', owner: 'University Team', due: new Date(base + 45 * 86400000).toISOString() },
        { title: 'Prototype development', owner: 'University + Industry', due: new Date(base + 90 * 86400000).toISOString() },
        { title: 'Field testing and iteration', owner: 'University Team', due: new Date(base + 120 * 86400000).toISOString() },
        { title: 'Pilot deployment', owner: 'Industry Partner', due: new Date(base + 150 * 86400000).toISOString() },
        { title: 'Handover and impact report', owner: 'All stakeholders', due: new Date(base + 190 * 86400000).toISOString() },
      ],
      needs,
      note: 'Seeking an industry partner for hardware, funding and field deployment.',
    });
    toast(`Proposal published — industry partners notified`, 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} accent={R.hex} width="max-w-2xl"
      title="Create project proposal" subtitle={challenge ? `${challenge.code} · ${challenge.title}` : ''}>
      {challenge && (
        <div className="space-y-4">
          <div>
            <label className="label">Proposal title</label>
            <input className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder={`${challenge.category} solution for ${challenge.village}`} />
          </div>
          <div>
            <label className="label">Objective</label>
            <textarea rows={3} className="field resize-none" value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })}
              placeholder="What will this project deliver and for whom?" />
          </div>
          <div>
            <label className="label">Approach</label>
            <textarea rows={2} className="field resize-none" value={f.approach} onChange={(e) => setF({ ...f, approach: e.target.value })}
              placeholder="Survey → co-design → prototype → pilot → handover" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Estimated budget</label><input className="field" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></div>
            <div><label className="label">Duration</label><input className="field" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Industry support required</label>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORT_TYPES.map((s) => {
                const on = needs.includes(s);
                return (
                  <button key={s} onClick={() => setNeeds((n) => (on ? n.filter((x) => x !== s) : [...n, s]))}
                    className={cx('chip border transition', on ? 'text-white border-transparent' : 'text-slate-500 border-slate-200 hover:border-slate-300')}
                    style={on ? { background: R.hex } : undefined}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-[0.76rem] text-slate-400">
            Six default milestones will be created automatically and the proposal will be broadcast to matching industry partners.
          </p>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}><FileText size={15} />Publish proposal</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ── Teams ──────────────────────────────────────────────────────────── */
function Teams({ uni, mine }) {
  const pool = TALENT_POOL[uni.id] ?? [];
  const teams = mine.filter((c) => c.team);
  const [tab, setTab] = useState('teams');

  return (
    <div className="space-y-4">
      <Tabs tabs={[{ key: 'teams', label: `Active teams (${teams.length})` }, { key: 'pool', label: `Talent pool (${pool.length})` }]}
        active={tab} onChange={setTab} accent={R.hex} />

      {tab === 'teams' && (teams.length === 0
        ? <Empty icon={Icons.Users} title="No teams formed yet" sub="Accept a challenge and compose a multidisciplinary team." />
        : (
          <div className="grid md:grid-cols-2 gap-4">
            {teams.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.06}>
                <div className="card p-5 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-slate-900">{c.team.name}</p>
                      <p className="text-[0.72rem] text-slate-400">{c.code} · formed {timeAgo(c.team.formedAt)}</p>
                    </div>
                    <StageBadge status={c.status} size="sm" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.team.disciplines.map((d) => <Chip key={d} color={R.deep} bg={R.soft}>{d}</Chip>)}
                  </div>
                  <div className="mt-3 space-y-2">
                    {c.team.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2.5">
                        <Avatar name={m.name} size={30} />
                        <div className="min-w-0">
                          <p className="text-[0.8rem] font-semibold text-slate-800 truncate">{m.name}</p>
                          <p className="text-[0.66rem] text-slate-400 truncate">{m.role} · {m.dept}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ))}

      {tab === 'pool' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pool.map((m, i) => (
            <Reveal key={m.id} delay={i * 0.04}>
              <div className="card card-hover p-4 flex items-center gap-3">
                <Avatar name={m.name} size={42} />
                <div className="min-w-0">
                  <p className="text-[0.86rem] font-bold text-slate-900 truncate">{m.name}</p>
                  <p className="text-[0.7rem] text-slate-400">{m.role} · {m.exp}</p>
                  <p className="text-[0.7rem] text-slate-500 truncate">{m.dept}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {m.skills.map((s) => <Chip key={s} color="#64748b">{s}</Chip>)}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Industry support ───────────────────────────────────────────────── */
function IndustrySupport({ mine }) {
  const { dispatch, toast } = usePlatform();
  const [open, setOpen] = useState(null);
  const withProposal = mine.filter((c) => c.proposal);

  return (
    <div className="space-y-4">
      {withProposal.length === 0 ? (
        <Empty icon={Icons.Handshake} title="No proposals published yet" sub="Publish a proposal to request industry mentorship, funding or technology." />
      ) : withProposal.map((c, i) => (
        <Reveal key={c.id} delay={i * 0.06}>
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-bold text-slate-900">{c.title}</p>
                <p className="text-[0.74rem] text-slate-400">{c.code} · {c.proposal.budget} · {c.proposal.duration}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(c.industryNeed?.needs ?? []).map((n) => <Chip key={n} color={ROLES.industry.deep} bg={ROLES.industry.soft}>{n}</Chip>)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.partners.length > 0
                  ? <Chip color="#059669" bg="#ecfdf5"><Check size={11} />{c.partners.length} partner{c.partners.length > 1 ? 's' : ''} joined</Chip>
                  : <Chip color="#b45309" bg="#fff7ed">Open request</Chip>}
                <button className="btn btn-ghost btn-sm" onClick={() => setOpen(c)}>Details</button>
              </div>
            </div>
            {c.partners.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                {c.partners.map((p) => (
                  <div key={p.id} className="rounded-xl bg-slate-50 p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg grid place-items-center text-white font-bold text-xs"
                      style={{ background: `linear-gradient(135deg,${ROLES.industry.hex},#fb923c)` }}>{p.short[0]}</div>
                    <div className="min-w-0">
                      <p className="text-[0.82rem] font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[0.68rem] text-slate-400 truncate">{p.supports.join(' · ')} · {p.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4"><MatchList kind="industry" matches={c.ai?.industryMatches.slice(0, 3) ?? []} /></div>
          </div>
        </Reveal>
      ))}
      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="varsity" />
    </div>
  );
}

/* ── Analytics ──────────────────────────────────────────────────────── */
function Analytics({ uni, mine }) {
  const byCat = useMemo(() => {
    const m = {};
    mine.forEach((c) => { m[c.category] = (m[c.category] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [mine]);

  const byStage = STAGES.map((s) => ({ name: s.short, value: mine.filter((c) => c.status === s.key).length }));
  const completed = mine.filter((c) => STAGE_INDEX[c.status] >= STAGE_INDEX.deployment).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Icons.FolderKanban} label="Total projects" value={mine.length} color={R.hex} />
        <Stat icon={Icons.CheckCircle2} label="Completed" value={completed} color="#059669" delay={0.08} />
        <Stat icon={Icons.Users} label="Team members deployed" value={mine.reduce((s, c) => s + (c.team?.members.length ?? 0), 0)} color="#f59e0b" delay={0.16} />
        <Stat icon={Icons.HeartHandshake} label="Citizens impacted" value={mine.reduce((s, c) => s + (c.impact?.beneficiaries ?? 0), 0)} color="#0891b2" delay={0.24} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="font-display font-bold text-slate-900 mb-2">Projects by lifecycle stage</p>
          <VBar data={byStage} color={R.hex} />
        </div>
        <div className="card p-5">
          <p className="font-display font-bold text-slate-900 mb-2">Projects by domain</p>
          {byCat.length ? <CategoryDonut data={byCat} /> : <Empty icon={Icons.PieChart} title="No project data yet" />}
        </div>
      </div>
      <div className="card p-5">
        <p className="font-display font-bold text-slate-900 mb-3">Institutional capability profile</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="text-center">
            <ScoreRing value={Math.round(uni.rating * 20)} color={R.hex} size={92} label={uni.rating.toFixed(1)} sub="rating" />
            <p className="text-[0.74rem] font-semibold text-slate-500 mt-1">Institutional rating</p>
          </div>
          <div className="sm:col-span-2 space-y-2 self-center">
            {[['Faculty strength', Math.min(100, uni.faculty / 5)], ['Student base', Math.min(100, uni.students / 80)], ['Completed societal projects', Math.min(100, uni.projects * 2.4)], ['Domain coverage', uni.domains.length * 22]].map(([l, v], i) => (
              <div key={l} className="flex items-center gap-2">
                <span className="text-[0.76rem] text-slate-600 w-48">{l}</span>
                <Bar value={v} color={R.hex} height={6} delay={i * 0.08} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
