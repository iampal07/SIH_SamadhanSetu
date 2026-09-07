import { useMemo, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { ShieldCheck, X, Sparkles, ArrowRight, AlertTriangle, MapPinned } from 'lucide-react';
import DashboardLayout from '../../components/navigation/DashboardLayout';
import ChallengeCard from '../../components/cards/ChallengeCard';
import ChallengeDetail from '../../components/shared/ChallengeDetail';
import { AIProcessing, MatchList } from '../../components/shared/AIPanel';
import { StageBadge, LifecycleTrack } from '../../components/workflow/Lifecycle';
import { Stat, Chip, Modal, SearchInput, Select, Empty, Counter, Bar, ScoreRing, Reveal, Tabs } from '../../components/shared/ui';
import { TrendArea, CategoryDonut, HBar, VBar } from '../../components/charts/Charts';
import JharkhandMap, { DistrictList } from '../../components/charts/JharkhandMap';
import { usePlatform, useAnalytics } from '../../context/PlatformContext';
import { useShell } from '../../context/AppShellContext';
import { UNIVERSITIES } from '../../data/universities';
import { INDUSTRIES } from '../../data/industries';
import { TREND_DATA } from '../../data/seedChallenges';
import { CATEGORY_KEYS, DISTRICT_NAMES, ROLES, STAGE_INDEX, STAGES, catMeta } from '../../data/constants';
import { timeAgo, fmtFull, cx, priorityTone } from '../../utils/format';

const R = ROLES.govt;

export default function GovernmentDashboard() {
  const a = useAnalytics();
  const { t } = useShell();

  const nav = [
    { to: '/government', key: 'common.overview', label: 'Overview', icon: 'LayoutDashboard', end: true },
    { to: '/government/challenges', key: 'govt.nav.queue', label: 'Validation Queue', icon: 'ShieldCheck', badge: a.pending.length },
    { to: '/government/map', key: 'govt.nav.map', label: 'District Analytics', icon: 'Map' },
    { to: '/government/projects', key: 'govt.nav.projects', label: 'Project Monitoring', icon: 'Activity', badge: a.delayed.length },
    { to: '/government/ecosystem', key: 'govt.nav.ecosystem', label: 'Ecosystem', icon: 'Network' },
    { to: '/government/impact', key: 'govt.nav.impact', label: 'Impact & Outcomes', icon: 'TrendingUp' },
  ];

  return (
    <DashboardLayout role="govt" nav={nav}
      title={t('govt.title')} subtitle={t('govt.sub')}
      user={{ name: 'Nodal Officer', meta: 'State Innovation Mission' }}>
      <Routes>
        <Route index element={<Overview analytics={a} />} />
        <Route path="challenges" element={<Queue />} />
        <Route path="map" element={<MapAnalytics analytics={a} />} />
        <Route path="projects" element={<Monitoring analytics={a} />} />
        <Route path="ecosystem" element={<EcosystemView />} />
        <Route path="impact" element={<ImpactView analytics={a} />} />
        <Route path="*" element={<Overview analytics={a} />} />
      </Routes>
    </DashboardLayout>
  );
}

/* ── Overview ───────────────────────────────────────────────────────── */
function Overview({ analytics: a }) {
  const nav = useNavigate();
  const { t } = useShell();
  const { challenges } = usePlatform();
  const [open, setOpen] = useState(null);
  const critical = challenges.filter((c) => c.priority && c.priority.score >= 75).slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden" style={{ background: `linear-gradient(120deg,${R.hex},#0f766e)` }}>
        <motion.div className="absolute -right-12 -top-16 w-56 h-56 rounded-full bg-white/10 anim-float" />
        <div className="relative flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-widest opacity-80">{t('govt.hero.eyebrow')}</p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-1">{t('govt.awaiting', '', { n: a.pending.length })}</h2>
            <p className="text-white/85 text-[0.9rem] mt-1.5 max-w-lg">
              {t('govt.awaitingSub')}
            </p>
          </div>
          <button className="btn bg-white text-emerald-700 hover:bg-white/90 px-5 py-3 shrink-0" onClick={() => nav('/government/challenges')}>
            <ShieldCheck size={16} />{t('govt.hero.cta')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Icons.Inbox} label={t('Total challenges')} value={a.total} color={R.hex} />
        <Stat icon={Icons.ShieldCheck} label={t('Validated')} value={a.validated} color="#0891b2" delay={0.08} />
        <Stat icon={Icons.Activity} label={t('Active projects')} value={a.active} color="#6366f1" delay={0.16} />
        <Stat icon={Icons.CheckCircle2} label={t('Deployed solutions')} value={a.completed} color="#f59e0b" delay={0.24} />
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <div className="card p-5">
          <p className="font-display font-bold text-slate-900">{t('Platform trend')}</p>
          <p className="text-[0.76rem] text-slate-400 mb-2">{t('Submissions, validations, active projects and completions')}</p>
          <TrendArea data={TREND_DATA} height={250} />
        </div>
        <div className="card p-5">
          <p className="font-display font-bold text-slate-900">{t('Challenges by domain')}</p>
          <p className="text-[0.76rem] text-slate-400">{t('Where problems are concentrated')}</p>
          <CategoryDonut data={a.byCategory.slice(0, 7).map((d) => ({ ...d, name: t(`cat.${d.name}`, d.name), key: d.name }))} height={250} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-bold text-slate-900">{t('High priority challenges')}</p>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/government/challenges')}>{t('common.viewQueue')}</button>
          </div>
          <div className="space-y-2">
            {critical.map((c) => {
              const t = priorityTone(c.priority.level);
              return (
                <button key={c.id} onClick={() => setOpen(c)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition text-left">
                  <span className="w-11 h-11 rounded-xl grid place-items-center font-display font-extrabold shrink-0"
                    style={{ background: t.bg, color: t.fg }}>{c.priority.score}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.84rem] font-semibold text-slate-800 truncate">{c.title}</span>
                    <span className="block text-[0.7rem] text-slate-400">{c.district} · {fmtFull(c.affected)} affected</span>
                  </span>
                  <StageBadge status={c.status} size="sm" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="card p-5">
          <p className="font-display font-bold text-slate-900 mb-1">{t('District hotspots')}</p>
          <p className="text-[0.76rem] text-slate-400 mb-2">{t('Challenge density across Jharkhand')}</p>
          <DistrictList data={a.byDistrict.slice(0, 8)} />
          <button className="btn btn-ghost btn-sm w-full mt-2" onClick={() => nav('/government/map')}>
            <MapPinned size={13} />{t('Open district analytics')}
          </button>
        </div>
      </div>

      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="govt" />
    </div>
  );
}

/* ── Validation queue ───────────────────────────────────────────────── */
function Queue() {
  const { challenges, dispatch, toast, analyseChallenge, aiBusy } = usePlatform();
  const { t } = useShell();
  const [open, setOpen] = useState(null);
  const [validateFor, setValidateFor] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [dist, setDist] = useState('All');
  const [tab, setTab] = useState('pending');

  const filtered = challenges.filter((c) => (
    (cat === 'All' || c.category === cat) && (dist === 'All' || c.district === dist)
    && (c.title + c.description).toLowerCase().includes(q.toLowerCase())
  ));
  const list = tab === 'pending' ? filtered.filter((c) => c.validation.status === 'pending')
    : tab === 'validated' ? filtered.filter((c) => c.validation.status === 'validated')
      : filtered;

  const runAI = async (c) => {
    const res = await analyseChallenge(c.id);
    if (res.ok) {
      toast(`AI analysis complete for ${c.code} · ${res.analysis.category} · ${res.analysis.priority_level}`, 'success');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput value={q} onChange={setQ} placeholder={t('Search all challenges…')} className="flex-1 min-w-[200px]" />
        <Select value={cat} onChange={setCat} className="w-auto"
          options={[{ value: 'All', label: t('common.all') }, ...CATEGORY_KEYS.map((c) => ({ value: c, label: t(`cat.${c}`, c) }))]} />
        <Select value={dist} onChange={setDist} options={['All', ...DISTRICT_NAMES]} className="w-auto" />
      </div>
      <Tabs accent={R.hex} active={tab} onChange={setTab} tabs={[
        { key: 'pending', label: t('tab.pending', '', { n: filtered.filter((c) => c.validation.status === 'pending').length }) },
        { key: 'validated', label: t('tab.validated', '', { n: filtered.filter((c) => c.validation.status === 'validated').length }) },
        { key: 'all', label: t('tab.all', '', { n: filtered.length }) },
      ]} />

      {list.length === 0 ? <Empty icon={Icons.ShieldCheck} title={t('Queue is clear')} sub={t('No challenges match this filter.')} />
        : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {list.map((c, i) => (
                <ChallengeCard key={c.id} challenge={c} index={i} onOpen={setOpen} accent={R.hex}
                  actions={(
                    <>
                      {!c.ai && (
                        <button className="btn btn-sm text-white" style={{ background: '#8b5cf6' }}
                          disabled={!!aiBusy[c.id]} onClick={() => runAI(c)}>
                          <Sparkles size={13} />{aiBusy[c.id] ? t('ai.running', 'Analysing…') : t('govt.runAI')}
                        </button>
                      )}
                      {c.ai && c.validation.status === 'pending' && (
                        <>
                          <button className="btn btn-sm text-white" style={{ background: R.hex }} onClick={() => setValidateFor(c)}><ShieldCheck size={13} />{t('common.validate')}</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { dispatch({ type: 'REJECT_CHALLENGE', id: c.id }); toast(`${c.code} marked as duplicate`, 'warn'); }}><X size={13} />{t('common.reject')}</button>
                        </>
                      )}
                      {c.validation.status === 'validated' && <Chip color={R.deep} bg={R.soft}>{t('Validated')}</Chip>}
                      {c.validation.status === 'rejected' && <Chip color="#b91c1c" bg="#fef2f2">Rejected</Chip>}
                    </>
                  )} />
              ))}
            </AnimatePresence>
          </div>
        )}

      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="govt"
        actions={open && (
          <>
            {!open.ai && (
              <button className="btn btn-primary" disabled={!!aiBusy[open.id]}
                onClick={() => { runAI(open); setOpen(null); }}>
                <Sparkles size={15} />{t('ai.run', 'Run AI analysis')}
              </button>
            )}
            {open.ai && open.validation.status === 'pending' && (
              <button className="btn btn-primary" onClick={() => { setValidateFor(open); setOpen(null); }}><ShieldCheck size={15} />Validate & route</button>
            )}
          </>
        )} />
      <ValidateModal challenge={validateFor} onClose={() => setValidateFor(null)} />
    </div>
  );
}

function ValidateModal({ challenge, onClose }) {
  const { t } = useShell();
  const { dispatch, toast } = usePlatform();
  const [note, setNote] = useState('Field verified by block officer. Genuine and high impact.');
  const open = !!challenge;

  const submit = () => {
    dispatch({ type: 'VALIDATE', id: challenge.id, note });
    toast(`${challenge.code} validated — routed to ${challenge.ai?.universityMatches.slice(0, 3).length ?? 3} universities`, 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} accent={R.hex} width="max-w-2xl"
      title={t('Validate challenge')} subtitle={challenge ? `${challenge.code} · ${challenge.title}` : ''}>
      {challenge && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[0.66rem] font-bold uppercase text-slate-400">{t('AI category')}</p>
              <p className="text-[0.86rem] font-bold" style={{ color: catMeta(challenge.category).hex }}>{challenge.category}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[0.66rem] font-bold uppercase text-slate-400">Priority</p>
              <p className="text-[0.86rem] font-bold text-slate-800">{challenge.priority?.score}/100 · {challenge.priority?.level}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[0.66rem] font-bold uppercase text-slate-400">{t('Similar challenges')}</p>
              <p className="text-[0.86rem] font-bold text-slate-800">{challenge.ai?.duplicates.length ?? 0} found</p>
            </div>
          </div>
          <MatchList kind="university" matches={challenge.ai?.universityMatches.slice(0, 3) ?? []} />
          <div>
            <label className="label">{t('Validation note')}</label>
            <textarea rows={2} className="field resize-none" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}><ShieldCheck size={15} />{t('govt.validateRoute')}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ── District analytics ─────────────────────────────────────────────── */
function MapAnalytics({ analytics: a }) {
  const { challenges } = usePlatform();
  const { t } = useShell();
  const [sel, setSel] = useState(null);
  const [metric, setMetric] = useState('count');
  const [open, setOpen] = useState(null);
  const inDistrict = sel ? challenges.filter((c) => c.district === sel) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Icons.MapPinned} label={t('map.stat.districts')} value={a.byDistrict.length} color={R.hex} />
        <Stat icon={Icons.AlertTriangle} label={t('map.stat.critical')} value={a.byDistrict.reduce((s, d) => s + d.critical, 0)} color="#dc2626" delay={0.08} />
        <Stat icon={Icons.Activity} label={t('map.stat.activeDistricts')} value={a.byDistrict.filter((d) => d.projects > 0).length} color="#6366f1" delay={0.16} />
        <Stat icon={Icons.Layers} label={t('map.stat.domains')} value={a.byCategory.length} color="#0891b2" delay={0.24} />
      </div>

      <div className="grid lg:grid-cols-[1.25fr_1fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <div>
              <p className="font-display font-bold text-slate-900">{t('map.title')}</p>
              <p className="text-[0.76rem] text-slate-400">{t('map.sub')}</p>
            </div>
            <Select value={metric} onChange={setMetric} className="w-auto"
              options={[{ value: 'count', label: t('map.metric.count') }, { value: 'critical', label: t('map.metric.critical') }, { value: 'projects', label: t('map.metric.projects') }]} />
          </div>
          <JharkhandMap data={a.byDistrict} markers={a.markers} selected={sel} onSelect={setSel} metric={metric} height={420} />
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <p className="font-display font-bold text-slate-900 mb-2">{t('District ranking')}</p>
            <DistrictList data={a.byDistrict} selected={sel} onSelect={setSel} metric={metric} />
          </div>
          <div className="card p-5">
            <p className="font-display font-bold text-slate-900 mb-2">{t('Category distribution')}</p>
            <VBar data={a.byCategory.map((d) => ({ ...d, name: t(`cat.${d.name}`, d.name) }))} color={R.hex} height={200} />
          </div>
        </div>
      </div>

      {sel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-bold text-slate-900">{sel} · {inDistrict.length} challenges</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}><X size={13} />Clear</button>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inDistrict.map((c, i) => <ChallengeCard key={c.id} challenge={c} index={i} onOpen={setOpen} accent={R.hex} dense />)}
          </div>
        </motion.div>
      )}
      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="govt" />
    </div>
  );
}

/* ── Project monitoring ─────────────────────────────────────────────── */
function Monitoring({ analytics: a }) {
  const { t } = useShell();
  const { challenges, dispatch, toast } = usePlatform();
  const [open, setOpen] = useState(null);
  const [reviewFor, setReviewFor] = useState(null);
  const [tab, setTab] = useState('active');

  const active = challenges.filter((c) => STAGE_INDEX[c.status] >= STAGE_INDEX.university_matched && STAGE_INDEX[c.status] < STAGE_INDEX.deployment);
  const delayed = a.delayed;
  const completed = challenges.filter((c) => STAGE_INDEX[c.status] >= STAGE_INDEX.deployment);
  const list = tab === 'active' ? active : tab === 'delayed' ? delayed : completed;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Icons.Activity} label={t('Active projects')} value={active.length} color={R.hex} />
        <Stat icon={Icons.AlarmClock} label={t('Delayed milestones')} value={delayed.length} color="#dc2626" delay={0.08} />
        <Stat icon={Icons.CheckCircle2} label={t('Completed')} value={completed.length} color="#6366f1" delay={0.16} />
        <Stat icon={Icons.Percent} label={t('Completion rate')} value={Math.round((completed.length / Math.max(1, a.active)) * 100)} suffix="%" color="#f59e0b" delay={0.24} />
      </div>

      <div className="card p-5">
        <p className="font-display font-bold text-slate-900 mb-2">{t('Pipeline distribution')}</p>
        <VBar data={a.byStage} color={R.hex} height={220} />
      </div>

      <Tabs accent={R.hex} active={tab} onChange={setTab} tabs={[
        { key: 'active', label: t('tab.active', '', { n: active.length }) },
        { key: 'delayed', label: t('tab.delayed', '', { n: delayed.length }) },
        { key: 'completed', label: t('tab.completed', '', { n: completed.length }) },
      ]} />

      {list.length === 0 ? <Empty icon={Icons.Activity} title={t('Nothing here')} sub={t('No projects in this state right now.')} />
        : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((c, i) => (
              <ChallengeCard key={c.id} challenge={c} index={i} onOpen={setOpen} accent={R.hex}
                actions={(
                  <>
                    {c.university && <Chip color={ROLES.varsity.deep} bg={ROLES.varsity.soft}>{c.university.short}</Chip>}
                    {STAGE_INDEX[c.status] >= STAGE_INDEX.prototype && STAGE_INDEX[c.status] < STAGE_INDEX.deployment && (
                      <button className="btn btn-sm text-white" style={{ background: R.hex }}
                        onClick={() => setReviewFor(c)}>
                        <ShieldCheck size={13} />{t('govt.review.cta', 'Review')}
                      </button>
                    )}
                    {STAGE_INDEX[c.status] === STAGE_INDEX.deployment && (
                      <button className="btn btn-sm text-white" style={{ background: R.hex }}
                        onClick={() => { dispatch({ type: 'ADVANCE', id: c.id, stage: 'impact_measured' }); toast(`Impact recorded for ${c.code}`, 'success'); }}>
                        <ArrowRight size={13} />{t('Record impact')}
                      </button>
                    )}
                  </>
                )} />
            ))}
          </div>
        )}
      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="govt" />
      <ReviewModal challenge={reviewFor} onClose={() => setReviewFor(null)} />
    </div>
  );
}

/* ── Government prototype / deployment review ───────────────────────── */
function ReviewModal({ challenge, onClose }) {
  const { t } = useShell();
  const { dispatch, toast } = usePlatform();
  const [note, setNote] = useState('Prototype inspected in the field. Meets the community requirement.');
  const [busy, setBusy] = useState(false);

  const decide = async (decision) => {
    setBusy(true);
    dispatch({
      type: 'GOVERNMENT_REVIEW', id: challenge.id, decision, note,
      reviewer: 'District Innovation Cell',
    });
    toast(decision === 'approved'
      ? `${challenge.code} approved for deployment`
      : `${challenge.code} sent back for changes`, decision === 'approved' ? 'success' : 'warn');
    setBusy(false);
    onClose();
  };

  return (
    <Modal open={!!challenge} onClose={onClose} accent={R.hex} width="max-w-xl"
      title={t('govt.review.title', 'Government review')}
      subtitle={challenge ? `${challenge.code} · ${challenge.title}` : ''}>
      {challenge && (
        <div className="space-y-4">
          <div className="rounded-xl p-3.5" style={{ background: R.soft }}>
            <p className="text-[0.78rem] font-bold" style={{ color: R.deep }}>
              {t('govt.review.stage', 'Current stage')}: {challenge.status}
            </p>
            <p className="text-[0.82rem] text-slate-600 mt-1">
              {challenge.university?.name ?? '—'}
              {challenge.partners?.length ? ` · ${challenge.partners.map((p) => p.short).join(', ')}` : ''}
            </p>
          </div>
          {challenge.prototypeData && (
            <div className="card p-3">
              <p className="font-display font-bold text-[0.9rem] text-slate-900">{challenge.prototypeData.title}</p>
              <p className="text-[0.8rem] text-slate-500 mt-1">{challenge.prototypeData.abstract}</p>
              <p className="text-[0.74rem] text-slate-400 mt-1.5">TRL {challenge.prototypeData.trl}</p>
            </div>
          )}
          <div>
            <label className="label">{t('govt.review.note', 'Review note')}</label>
            <textarea rows={3} className="field resize-none" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => decide('changes_requested')}>
              {t('govt.review.changes', 'Request changes')}
            </button>
            <button className="btn btn-primary" disabled={busy} onClick={() => decide('approved')}>
              <ShieldCheck size={15} />{t('govt.review.approve', 'Approve deployment')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ── Ecosystem ──────────────────────────────────────────────────────── */
function EcosystemView() {
  const { t } = useShell();
  const { challenges } = usePlatform();
  const [tab, setTab] = useState('universities');

  const uniStats = UNIVERSITIES.map((u) => {
    const mine = challenges.filter((c) => c.university?.id === u.id);
    return { ...u, accepted: mine.length, completed: mine.filter((c) => STAGE_INDEX[c.status] >= STAGE_INDEX.deployment).length };
  }).sort((a, b) => b.accepted - a.accepted);

  const firmStats = INDUSTRIES.map((f) => {
    const mine = challenges.filter((c) => c.partners.some((p) => p.id === f.id));
    return { ...f, supported: mine.length, completed: mine.filter((c) => STAGE_INDEX[c.status] >= STAGE_INDEX.deployment).length };
  }).sort((a, b) => b.supported - a.supported);

  return (
    <div className="space-y-4">
      <Tabs accent={R.hex} active={tab} onChange={setTab} tabs={[
        { key: 'universities', label: t('tab.universities', '', { n: UNIVERSITIES.length }) },
        { key: 'industry', label: t('tab.industry', '', { n: INDUSTRIES.length }) },
      ]} />

      {tab === 'universities' && (
        <>
          <div className="card p-5">
            <p className="font-display font-bold text-slate-900 mb-2">{t('University participation')}</p>
            <HBar data={uniStats.map((u) => ({ name: u.short, count: u.accepted }))} color={ROLES.varsity.hex} height={230} />
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {uniStats.map((u, i) => (
              <Reveal key={u.id} delay={i * 0.05}>
                <div className="card card-hover p-4 h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl grid place-items-center text-white font-display font-extrabold shrink-0"
                      style={{ background: `hsl(${u.logoHue} 65% 55%)` }}>{u.short[0]}</div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-[0.9rem] text-slate-900 leading-tight">{u.name}</p>
                      <p className="text-[0.7rem] text-slate-400">{u.type} · {u.district}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    {[['Accepted', u.accepted], ['Completed', u.completed], ['Faculty', u.faculty]].map(([l, v]) => (
                      <div key={l} className="rounded-lg bg-slate-50 py-2">
                        <p className="font-display font-extrabold text-slate-900">{v}</p>
                        <p className="text-[0.62rem] text-slate-400 font-semibold">{l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {u.domains.slice(0, 3).map((d) => <Chip key={d} color={catMeta(d).hex}>{t(`cat.${d}`, d)}</Chip>)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </>
      )}

      {tab === 'industry' && (
        <>
          <div className="card p-5">
            <p className="font-display font-bold text-slate-900 mb-2">{t('Industry engagement')}</p>
            <HBar data={firmStats.map((f) => ({ name: f.short, count: f.supported }))} color={ROLES.industry.hex} height={250} />
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {firmStats.map((f, i) => (
              <Reveal key={f.id} delay={i * 0.05}>
                <div className="card card-hover p-4 h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl grid place-items-center text-white font-display font-extrabold shrink-0"
                      style={{ background: `hsl(${f.hue} 70% 52%)` }}>{f.short[0]}</div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-[0.9rem] text-slate-900 leading-tight">{f.name}</p>
                      <p className="text-[0.7rem] text-slate-400">{f.type} · {f.hq} · {f.funding}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    {[['Supported', f.supported], ['Completed', f.completed], ['Capacity', f.capacity]].map(([l, v]) => (
                      <div key={l} className="rounded-lg bg-slate-50 py-2">
                        <p className="font-display font-extrabold text-slate-900 text-[0.95rem]">{v}</p>
                        <p className="text-[0.62rem] text-slate-400 font-semibold">{l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {f.supports.slice(0, 4).map((s) => <Chip key={s} color={ROLES.industry.deep} bg={ROLES.industry.soft}>{s}</Chip>)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Impact ─────────────────────────────────────────────────────────── */
function ImpactView({ analytics: a }) {
  const { t } = useShell();
  const { challenges } = usePlatform();
  const [open, setOpen] = useState(null);
  const done = challenges.filter((c) => c.impact);
  const total = done.reduce((s, c) => s + c.impact.beneficiaries, 0);
  const avgSustain = done.length ? Math.round(done.reduce((s, c) => s + c.impact.sustainability, 0) / done.length) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: `linear-gradient(120deg,${R.hex},#0891b2)` }}>
        <motion.div className="absolute -right-12 -bottom-16 w-56 h-56 rounded-full bg-white/10 anim-float" />
        <div className="relative grid sm:grid-cols-3 gap-6 items-center">
          <div className="sm:col-span-2">
            <p className="text-[0.72rem] font-bold uppercase tracking-widest opacity-80">{t('Verified social outcomes')}</p>
            <p className="font-display text-4xl font-extrabold mt-1"><Counter to={total} /></p>
            <p className="text-white/90 font-semibold">{t('govt.impactLine', '', { n: new Set(done.map((c) => c.district)).size })}</p>
          </div>
          <div className="flex sm:justify-end">
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold"><Counter to={avgSustain} suffix="%" /></p>
              <p className="text-[0.72rem] font-semibold opacity-85">{t('govt.avgSustain')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Icons.CheckCircle2} label={t('Solutions deployed')} value={done.length} color={R.hex} />
        <Stat icon={Icons.GraduationCap} label={t('Universities contributing')} value={a.universities} color="#6366f1" delay={0.08} />
        <Stat icon={Icons.Factory} label={t('Industry partners engaged')} value={a.partners} color="#f59e0b" delay={0.16} />
        <Stat icon={Icons.Users} label={t('Students involved')} value={a.students} color="#0891b2" delay={0.24} />
      </div>

      {done.length === 0 ? <Empty icon={Icons.TrendingUp} title={t('No measured impact yet')} sub={t('Impact appears once projects reach deployment.')} />
        : (
          <div className="grid md:grid-cols-2 gap-4">
            {done.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.06}>
                <div className="card card-hover p-5 cursor-pointer h-full" onClick={() => setOpen(c)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Chip color={catMeta(c.category).hex}>{c.category}</Chip>
                    <Chip color={R.deep} bg={R.soft}>{c.district}</Chip>
                  </div>
                  <p className="font-display font-bold text-slate-900 mt-2 leading-snug">{c.title}</p>
                  <p className="text-[0.76rem] text-slate-500 mt-1">{c.university?.short} · {c.partners.map((p) => p.short).join(', ')}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {c.impact.metrics.slice(0, 4).map((m) => (
                      <div key={m.label} className="rounded-lg bg-slate-50 p-2.5">
                        <p className="font-display text-[1rem] font-extrabold text-slate-900">
                          <Counter to={m.value} decimals={m.value % 1 !== 0 ? 1 : 0} suffix={m.unit} />
                        </p>
                        <p className="text-[0.64rem] text-slate-500 font-semibold leading-tight">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="govt" />
    </div>
  );
}
