import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
  Send, Upload, MapPin, Sparkles, ThumbsUp, X, CheckCircle2, ArrowRight, PlayCircle,
  AlertTriangle, RefreshCw, Star,
} from 'lucide-react';
import DashboardLayout from '../../components/navigation/DashboardLayout';
import ChallengeCard, { MiniRow } from '../../components/cards/ChallengeCard';
import ChallengeDetail from '../../components/shared/ChallengeDetail';
import { AIProcessing, AIClassification, AIPriority, AIDuplicates, MatchList } from '../../components/shared/AIPanel';
import { LifecycleTrack } from '../../components/workflow/Lifecycle';
import { Stat, Counter, Chip, Modal, SearchInput, Select, Empty, Tabs, ScoreRing, Reveal } from '../../components/shared/ui';
import { CategoryDonut } from '../../components/charts/Charts';
import { usePlatform, useAnalytics } from '../../context/PlatformContext';
import { useShell } from '../../context/AppShellContext';
import { useAuth } from '../../context/AuthContext';
import { uploadFileToSupabase } from '../../services/db';
import { CATEGORY_KEYS, DISTRICT_NAMES, ROLES, STAGE_INDEX, catMeta } from '../../data/constants';
import { fmtFull, timeAgo, cx } from '../../utils/format';

const R = ROLES.citizen;

const NAV = [
  { to: '/citizen', key: 'common.overview', label: 'Overview', icon: 'LayoutDashboard', end: true },
  { to: '/citizen/submit', key: 'citizen.nav.submit', label: 'Submit Challenge', icon: 'PlusCircle' },
  { to: '/citizen/challenges', key: 'citizen.nav.mine', label: 'My Challenges', icon: 'FolderKanban' },
  { to: '/citizen/community', key: 'citizen.nav.community', label: 'Community Feed', icon: 'Globe2' },
  { to: '/citizen/impact', key: 'common.impact', label: 'Impact', icon: 'TrendingUp' },
];

export default function CitizenDashboard() {
  const { challenges } = usePlatform();
  const { t } = useShell();
  const { user, profile } = useAuth();
  const mine = useMemo(() => {
    const myId = user?.id;
    const myName = profile?.full_name;
    return challenges.filter((c) => (
      c.isMine
      || (myId && c.citizenId === myId)
      || (myName && c.citizen?.name === myName)
      || c.citizen?.id === 'cit-me'
    ));
  }, [challenges, user?.id, profile?.full_name]);

  const nav = NAV.map((n) => (n.to === '/citizen/challenges' ? { ...n, badge: mine.length } : n));

  return (
    <DashboardLayout role="citizen" nav={nav}
      title={t('citizen.workspace')}
      subtitle={t('citizen.workspace.sub')}
      user={{ name: 'Pooja Kachhap', meta: 'Kanke, Ranchi' }}>
      <Routes>
        <Route index element={<Overview mine={mine} />} />
        <Route path="submit" element={<Submit />} />
        <Route path="challenges" element={<MyChallenges mine={mine} />} />
        <Route path="community" element={<Community />} />
        <Route path="impact" element={<ImpactView />} />
        <Route path="*" element={<Overview mine={mine} />} />
      </Routes>
    </DashboardLayout>
  );
}

/* ── Overview ───────────────────────────────────────────────────────── */
function Overview({ mine }) {
  const { challenges } = usePlatform();
  const { t } = useShell();
  const a = useAnalytics();
  const nav = useNavigate();
  const [open, setOpen] = useState(null);
  const tracked = mine.length ? mine : challenges.slice(0, 3);
  const featured = challenges.find((c) => c.status === 'impact_measured');

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(120deg,${R.hex},#0369a1)` }}>
        <motion.div className="absolute -right-10 -top-14 w-52 h-52 rounded-full bg-white/10 anim-float" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-widest opacity-80">{t('citizen.welcome')}</p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-1">{t('citizen.hero.title')}</h2>
            <p className="text-white/85 text-[0.9rem] mt-1.5 max-w-lg">
              {t('citizen.hero.sub')}
            </p>
          </div>
          <button className="btn bg-white text-cyan-700 hover:bg-white/90 px-5 py-3 shrink-0" onClick={() => nav('/citizen/submit')}>
            <Send size={16} />{t('nav.submitChallenge')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Icons.FileText} label={t('citizen.stat.mine')} value={mine.length} color={R.hex} />
        <Stat icon={Icons.ShieldCheck} label={t('citizen.stat.validated')} value={mine.filter((c) => c.validation.status === 'validated').length} color="#10b981" delay={0.08} />
        <Stat icon={Icons.GraduationCap} label={t('citizen.stat.assigned')} value={mine.filter((c) => c.university).length} color="#6366f1" delay={0.16} />
        <Stat icon={Icons.Users} label={t('citizen.stat.endorsements')} value={mine.reduce((s, c) => s + c.upvotes, 0)} color="#f59e0b" delay={0.24} />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-display font-bold text-slate-900">{t('citizen.track.title')}</p>
              <p className="text-[0.76rem] text-slate-400">{t('citizen.track.sub')}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/citizen/challenges')}>{t('common.viewAll')}</button>
          </div>
          {tracked.length === 0 ? (
            <Empty icon={Icons.Inbox} title={t('citizen.empty.title')}
              sub={t('citizen.empty.sub')}
              action={<button className="btn btn-primary" onClick={() => nav('/citizen/submit')}><Send size={15} />Submit a Challenge</button>} />
          ) : (
            <div className="space-y-4">
              {tracked.slice(0, 3).map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-[0.92rem] text-slate-900 truncate">{c.title}</p>
                      <p className="text-[0.72rem] text-slate-400">{c.code} · {c.district} · {timeAgo(c.createdAt)}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm shrink-0" onClick={() => setOpen(c)}>{t('common.details')}</button>
                  </div>
                  <div className="mt-3"><LifecycleTrack status={c.status} history={c.history} compact /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="font-display font-bold text-slate-900">{t('Challenges by domain')}</p>
            <p className="text-[0.76rem] text-slate-400">{t('Across your district and the platform')}</p>
            <CategoryDonut data={a.byCategory.slice(0, 6).map((d) => ({ ...d, name: t(`cat.${d.name}`, d.name), key: d.name }))} height={220} />
          </div>
          {featured && (
            <div className="card p-5">
              <Chip color="#059669" bg="#ecfdf5"><CheckCircle2 size={11} />{t('Solved in your state')}</Chip>
              <p className="font-display font-bold text-slate-900 mt-2 leading-snug">{featured.title}</p>
              <p className="text-[0.78rem] text-slate-500 mt-1">{featured.impact.summary}</p>
              <div className="flex items-center gap-4 mt-3">
                <ScoreRing value={featured.impact.sustainability} color="#059669" size={56} sub="%" />
                <div>
                  <p className="font-display text-xl font-extrabold text-slate-900"><Counter to={featured.impact.beneficiaries} /></p>
                  <p className="text-[0.7rem] text-slate-400 font-semibold">{t('common.peopleBenefited')}</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm mt-3 w-full" onClick={() => setOpen(featured)}>{t('See the full story')} <ArrowRight size={13} /></button>
            </div>
          )}
        </div>
      </div>

      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="citizen" />
    </div>
  );
}

/* ── Citizen feedback on a deployed solution ────────────────────────── */
function FeedbackModal({ challenge, onClose }) {
  const { t } = useShell();
  const { dispatch, toast } = usePlatform();
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [solved, setSolved] = useState(true);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setBusy(true);
    dispatch({
      type: 'CITIZEN_FEEDBACK', id: challenge.id, rating, solved, comment,
      citizenId: user?.id ?? null, citizenName: profile?.full_name || 'Citizen',
    });
    toast(t('citizen.feedback.thanks', 'Thank you — your feedback was recorded'), 'success');
    setBusy(false);
    onClose();
  };

  return (
    <Modal open={!!challenge} onClose={onClose} accent={R.hex} width="max-w-lg"
      title={t('citizen.feedback.title', 'How well was your problem solved?')}
      subtitle={challenge ? `${challenge.code} · ${challenge.title}` : ''}>
      {challenge && (
        <div className="space-y-4">
          <div>
            <label className="label">{t('citizen.feedback.rating', 'Your rating')}</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}
                  className="w-11 h-11 rounded-xl grid place-items-center transition"
                  style={{
                    background: n <= rating ? 'var(--tint-industry)' : 'var(--surface-2)',
                    color: n <= rating ? 'var(--on-industry)' : 'var(--muted)',
                  }}>
                  <Star size={19} fill={n <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('citizen.feedback.solved', 'Is the original problem actually solved?')}</label>
            <div className="flex gap-2">
              {[[true, t('common.yes', 'Yes')], [false, t('common.no', 'Not fully')]].map(([v, label]) => (
                <button key={String(v)} onClick={() => setSolved(v)}
                  className={cx('btn btn-sm', solved === v ? 'text-white' : 'btn-ghost')}
                  style={solved === v ? { background: R.hex } : undefined}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('citizen.feedback.comment', 'What changed for your community?')}</label>
            <textarea rows={3} className="field resize-none" value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('citizen.feedback.placeholder', 'e.g. we now get clean water within the village itself')} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
            <button className="btn btn-primary" disabled={busy} onClick={submit}>
              <Send size={15} />{t('citizen.feedback.submit', 'Submit feedback')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ── Submit ─────────────────────────────────────────────────────────── */
function Submit() {
  const { challenges, submitChallenge, analyseChallenge, submitFlow, dispatch } = usePlatform();
  const { t } = useShell();
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', district: profile?.district || 'Ranchi', village: '', affected: '' });
  const [fileObjects, setFileObjects] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState({});
  const phase = submitFlow.phase;              // form | submitting | analysing | result
  const newId = submitFlow.code;
  const submitError = submitFlow.error;
  const aiError = submitFlow.aiError;
  const setFlow = (payload) => dispatch({ type: 'SUBMIT_FLOW', payload });

  const created = challenges.find((c) => c.id === newId);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.title.trim().length < 10) er.title = t('citizen.form.err.title');
    if (form.description.trim().length < 40) er.description = t('citizen.form.err.desc');
    if (!form.village.trim()) er.village = t('citizen.form.err.village');
    setErr(er);
    if (Object.keys(er).length) return;

    setUploading(true);

    // 1. Upload evidence to Supabase Storage
    let media = [];
    try {
      media = await Promise.all(fileObjects.map((f) => uploadFileToSupabase(f, 'attachments', user?.id)));
    } catch (uploadErr) {
      console.warn('Attachment upload notice:', uploadErr);
    }

    // 2. Create the challenge row (Supabase assigns the real code)
    const res = await submitChallenge({
      ...form,
      media,
      citizenId: user?.id ?? null,
      citizenName: profile?.full_name || 'Citizen',
    });

    setUploading(false);
    if (!res.ok) return;

    // 3. Run the real AI pipeline on the stored challenge
    const ai = await analyseChallenge(res.code);
    setFlow({ phase: 'result', code: res.code, aiError: ai.ok ? null : ai.error });
  };

  const retryAi = async () => {
    setFlow({ phase: 'analysing' });
    const ai = await analyseChallenge(newId);
    setFlow({ phase: 'result', aiError: ai.ok ? null : ai.error });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {phase === 'form' && (
          <motion.form key="form" onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="space-y-5">
            <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(120deg,${R.hex},#0369a1)` }}>
              <h2 className="font-display text-xl font-extrabold">{t('citizen.form.title')}</h2>
              <p className="text-white/85 text-[0.86rem] mt-1">
                {t('citizen.form.sub')}
              </p>
            </div>

            <div className="card p-5 space-y-4">
              <div>
                <label className="label">{t('citizen.form.titleLabel')} *</label>
                <input className={cx('field', err.title && 'border-rose-300')} value={form.title} onChange={set('title')}
                  placeholder="e.g. Severe drinking water shortage in Barkagaon hamlet" />
                {err.title && <p className="text-[0.72rem] text-rose-600 mt-1">{err.title}</p>}
              </div>
              <div>
                <label className="label">{t('citizen.form.descLabel')} *</label>
                <textarea rows={5} className={cx('field resize-none', err.description && 'border-rose-300')}
                  value={form.description} onChange={set('description')}
                  placeholder="What is the problem, how long has it existed, who is affected and what have you already tried?" />
                <div className="flex justify-between mt-1">
                  {err.description ? <p className="text-[0.72rem] text-rose-600">{err.description}</p> : <span />}
                  <p className="text-[0.7rem] text-slate-400">{form.description.length}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('citizen.form.catLabel')} <span className="font-normal text-slate-400">({t('citizen.form.catHint')})</span></label>
                  <Select value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                    options={[{ value: '', label: t('citizen.form.autoCat') }, ...CATEGORY_KEYS.map((c) => ({ value: c, label: t(`cat.${c}`, c) }))]} />
                </div>
                <div>
                  <label className="label">{t('common.district')} *</label>
                  <Select value={form.district} onChange={(v) => setForm((f) => ({ ...f, district: v }))} options={DISTRICT_NAMES} />
                </div>
                <div>
                  <label className="label">{t('citizen.form.villageLabel')} *</label>
                  <input className={cx('field', err.village && 'border-rose-300')} value={form.village} onChange={set('village')} placeholder="e.g. Kanke School Road" />
                  {err.village && <p className="text-[0.72rem] text-rose-600 mt-1">{err.village}</p>}
                </div>
                <div>
                  <label className="label">{t('citizen.form.affectedLabel')}</label>
                  <input className="field" type="number" min="0" value={form.affected} onChange={set('affected')} placeholder="e.g. 2400" />
                </div>
              </div>

              <div>
                <label className="label">{t('citizen.form.filesLabel')}</label>
                <label className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center block cursor-pointer hover:border-cyan-300 hover:bg-cyan-50/40 transition">
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden"
                    onChange={(e) => {
                      const chosen = Array.from(e.target.files ?? []);
                      setFileObjects((prev) => [...prev, ...chosen]);
                    }} />
                  <Upload size={22} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-[0.82rem] font-semibold text-slate-600">{t('citizen.form.filesCta')}</p>
                  <p className="text-[0.7rem] text-slate-400 mt-0.5">{t('citizen.form.filesHint')}</p>
                </label>
                {fileObjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fileObjects.map((f, i) => (
                      <span key={i} className="chip bg-slate-100 text-slate-600">
                        {f.name} ({(f.size / (1024 * 1024)).toFixed(1)} MB)
                        <button type="button" onClick={() => setFileObjects((arr) => arr.filter((_, idx) => idx !== i))}><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => nav('/citizen')}>{t('common.cancel')}</button>
                <button type="submit" disabled={uploading} className="btn btn-primary px-5">
                  <Sparkles size={16} /> {uploading ? 'Uploading to Supabase...' : 'Submit & run AI analysis'}
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {(phase === 'analysing' || phase === 'submitting') && (
          <motion.div key="ai" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <AIProcessing />
          </motion.div>
        )}

        {phase === 'result' && created && (
          <motion.div key="res" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(120deg,#059669,#0891b2)' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                className="w-12 h-12 rounded-2xl bg-white/20 grid place-items-center mb-3"><CheckCircle2 size={26} /></motion.div>
              <h2 className="font-display text-xl font-extrabold">Challenge {created.code} submitted and analysed</h2>
              <p className="text-white/85 text-[0.88rem] mt-1">
                It is now in the district validation queue. You will be notified at every stage.
              </p>
            </div>

            {aiError && (
              <div className="card p-4 flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--on-critical)' }}>
                <AlertTriangle size={18} style={{ color: 'var(--on-critical)' }} />
                <p className="text-[0.85rem] text-slate-700 flex-1 min-w-[180px]">{aiError}</p>
                <button className="btn btn-ghost btn-sm" onClick={retryAi}>
                  <RefreshCw size={13} />{t('common.retry', 'Retry')}
                </button>
              </div>
            )}

            {created.ai ? (
              <div className="grid md:grid-cols-2 gap-3">
                <AIClassification ai={created.ai} />
                {created.priority && <AIPriority priority={created.priority} />}
                <div className="md:col-span-2"><AIDuplicates duplicates={created.ai.duplicates ?? []} /></div>
                <div className="md:col-span-2">
                  <MatchList kind="university" matches={(created.ai.universityMatches ?? []).slice(0, 3)} />
                </div>
                <div className="md:col-span-2">
                  <MatchList kind="industry" matches={(created.ai.industryMatches ?? []).slice(0, 3)} />
                </div>
              </div>
            ) : (
              <div className="card p-6 text-center">
                <p className="font-display font-bold text-slate-800">{t('ai.pending.title', 'Analysis not available yet')}</p>
                <p className="text-[0.84rem] text-slate-500 mt-1">{t('ai.pending.sub', 'The challenge is saved. Run the AI pipeline again to generate the analysis.')}</p>
                <button className="btn btn-primary mt-3" onClick={retryAi}><Sparkles size={15} />{t('ai.run', 'Run AI analysis')}</button>
              </div>
            )}

            <div className="card p-5">
              <p className="font-display font-bold text-slate-900 mb-3">{t('What happens next')}</p>
              <LifecycleTrack status={created.status} history={created.history} />
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => { setFlow({ phase: 'form', code: null, error: null, aiError: null }); setForm({ title: '', description: '', category: '', district: profile?.district || 'Ranchi', village: '', affected: '' }); setFileObjects([]); }}>
                {t('Submit another')}
              </button>
              <button className="btn btn-ghost" onClick={() => nav('/government/challenges')}>{t('See it in the Government queue')} <ArrowRight size={14} /></button>
              <button className="btn btn-primary" onClick={() => nav('/citizen/challenges')}>{t('Track my challenge')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── My challenges ──────────────────────────────────────────────────── */
function MyChallenges({ mine }) {
  const { t } = useShell();
  const nav = useNavigate();
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const list = mine.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <SearchInput value={q} onChange={setQ} placeholder={t('Search my challenges…')} className="w-full sm:w-72" />
        <button className="btn btn-primary" onClick={() => nav('/citizen/submit')}><Send size={15} />{t('New challenge')}</button>
      </div>
      {list.length === 0 ? (
        <Empty icon={Icons.FolderOpen} title={t('You have not submitted a challenge yet')}
          sub={t('Everything you submit appears here with live status from all four stakeholders.')}
          action={<button className="btn btn-primary" onClick={() => nav('/citizen/submit')}>{t('Submit your first challenge')}</button>} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {list.map((c, i) => <ChallengeCard key={c.id} challenge={c} index={i} onOpen={setOpen} accent={R.hex} />)}
          </AnimatePresence>
        </div>
      )}
      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="citizen" />
    </div>
  );
}

/* ── Community feed ─────────────────────────────────────────────────── */
function Community() {
  const { t } = useShell();
  const { challenges, dispatch } = usePlatform();
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [dist, setDist] = useState('All');

  const list = challenges.filter((c) => (
    (cat === 'All' || c.category === cat)
    && (dist === 'All' || c.district === dist)
    && (c.title + c.description).toLowerCase().includes(q.toLowerCase())
  ));

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput value={q} onChange={setQ} placeholder={t('Search all community challenges…')} className="flex-1 min-w-[220px]" />
        <Select value={cat} onChange={setCat} className="w-auto"
          options={[{ value: 'All', label: t('common.all') }, ...CATEGORY_KEYS.map((c) => ({ value: c, label: t(`cat.${c}`, c) }))]} />
        <Select value={dist} onChange={setDist} options={['All', ...DISTRICT_NAMES]} className="w-auto" />
        <Chip color={R.hex} bg={R.soft}>{list.length} challenges</Chip>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {list.map((c, i) => (
            <ChallengeCard key={c.id} challenge={c} index={i} onOpen={setOpen} accent={R.hex}
              actions={(
                <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'UPVOTE', id: c.id })}>
                  <ThumbsUp size={13} />{fmtFull(c.upvotes)}
                </button>
              )} />
          ))}
        </AnimatePresence>
      </div>
      {list.length === 0 && <Empty icon={Icons.SearchX} title={t('No challenges match your filters')} sub={t('Try a different domain or district.')} />}
      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="citizen" />
    </div>
  );
}

/* ── Impact ─────────────────────────────────────────────────────────── */
function ImpactView() {
  const { t } = useShell();
  const { challenges } = usePlatform();
  const [open, setOpen] = useState(null);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const done = challenges.filter((c) => c.impact);
  const total = done.reduce((s, c) => s + c.impact.beneficiaries, 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(120deg,#059669,#0891b2)' }}>
        <motion.div className="absolute -right-12 -bottom-16 w-56 h-56 rounded-full bg-white/10 anim-float" />
        <p className="text-[0.72rem] font-bold uppercase tracking-widest opacity-80">{t('Community impact')}</p>
        <p className="font-display text-4xl font-extrabold mt-1"><Counter to={total} /></p>
        <p className="text-white/90 font-semibold">{t('citizen.impactLine')}</p>
      </div>

      {done.length === 0 ? (
        <Empty icon={Icons.Sprout} title={t('No completed solutions yet')} sub={t('Impact appears here once a project reaches the final stage.')} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {done.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.07}>
              <div className="card card-hover p-5 cursor-pointer h-full" onClick={() => setOpen(c)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Chip color={catMeta(c.category).hex}>{c.category}</Chip>
                  <Chip color="#059669" bg="#ecfdf5"><CheckCircle2 size={11} />{t('Deployed')}</Chip>
                </div>
                <p className="font-display font-bold text-slate-900 mt-2 leading-snug">{c.title}</p>
                <p className="text-[0.78rem] text-slate-500 mt-1">{c.village}, {c.district} · {c.university?.short} · {c.partners.map((p) => p.short).join(', ')}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  {c.feedback?.length ? (
                    <Chip color="#059669" bg="var(--tint-govt)">
                      <CheckCircle2 size={11} />
                      {t('citizen.feedback.given', 'You rated this')} {c.feedback[0].rating}/5
                    </Chip>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => setFeedbackFor(c)}>
                      <Star size={13} />{t('citizen.feedback.cta', 'Give feedback')}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {c.impact.metrics.slice(0, 4).map((m) => (
                    <div key={m.label} className="rounded-xl bg-slate-50 p-2.5">
                      <p className="font-display text-base font-extrabold text-slate-900">
                        <Counter to={m.value} decimals={m.value % 1 !== 0 ? 1 : 0} suffix={m.unit} />
                      </p>
                      <p className="text-[0.66rem] text-slate-500 font-semibold leading-tight">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="citizen" />
      <FeedbackModal challenge={feedbackFor} onClose={() => setFeedbackFor(null)} />
    </div>
  );
}
