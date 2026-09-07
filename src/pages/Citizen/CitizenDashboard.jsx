import { useMemo, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
  Send, Upload, MapPin, Sparkles, ThumbsUp, X, CheckCircle2, ArrowRight, PlayCircle,
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
import { uploadFileToSupabase, insertChallengeInDb } from '../../services/db';
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
  const { user, profile } = useAuth();
  const { t } = useShell();
  const mine = useMemo(
    () => challenges.filter((c) => c.isMine || c.citizen?.id === 'cit-me' || (user?.id && c.citizen?.id === user.id)),
    [challenges, user]
  );

  const nav = NAV.map((n) => (n.to === '/citizen/challenges' ? { ...n, badge: mine.length } : n));

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Citizen';
  const displayDistrict = profile?.district || 'Ranchi';

  return (
    <DashboardLayout role="citizen" nav={nav}
      title={t('citizen.workspace')}
      subtitle={t('citizen.workspace.sub')}
      user={{ name: displayName, meta: `${displayDistrict}, Jharkhand` }}>
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
                    <button className="btn btn-ghost btn-sm shrink-0" onClick={() => setOpen(c)}>Details</button>
                  </div>
                  <div className="mt-3"><LifecycleTrack status={c.status} history={c.history} compact /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="font-display font-bold text-slate-900">Challenges by domain</p>
            <p className="text-[0.76rem] text-slate-400">Across your district and the platform</p>
            <CategoryDonut data={a.byCategory.slice(0, 6)} height={220} />
          </div>
          {featured && (
            <div className="card p-5">
              <Chip color="#059669" bg="#ecfdf5"><CheckCircle2 size={11} />Solved in your state</Chip>
              <p className="font-display font-bold text-slate-900 mt-2 leading-snug">{featured.title}</p>
              <p className="text-[0.78rem] text-slate-500 mt-1">{featured.impact.summary}</p>
              <div className="flex items-center gap-4 mt-3">
                <ScoreRing value={featured.impact.sustainability} color="#059669" size={56} sub="sustain." />
                <div>
                  <p className="font-display text-xl font-extrabold text-slate-900"><Counter to={featured.impact.beneficiaries} /></p>
                  <p className="text-[0.7rem] text-slate-400 font-semibold">people benefited</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm mt-3 w-full" onClick={() => setOpen(featured)}>See the full story <ArrowRight size={13} /></button>
            </div>
          )}
        </div>
      </div>

      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="citizen" />
    </div>
  );
}

/* ── Submit ─────────────────────────────────────────────────────────── */
function Submit() {
  const { dispatch, challenges } = usePlatform();
  const { t } = useShell();
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', district: profile?.district || 'Ranchi', village: '', affected: '' });
  const [fileObjects, setFileObjects] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState('form'); // form | analysing | result
  const [newId, setNewId] = useState(null);
  const [err, setErr] = useState({});

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
    const id = `CH-${1200 + challenges.filter((c) => !c.seeded).length + 1}`;

    // Upload files to Supabase Storage (with durable base64 fallback)
    const uploadedAttachments = await Promise.all(
      fileObjects.map((f) => uploadFileToSupabase(f, 'attachments', user?.id))
    );

    const challengePayload = {
      ...form,
      id,
      code: id,
      attachments: uploadedAttachments,
      citizen: {
        id: user?.id || 'cit-me',
        name: profile?.full_name || user?.user_metadata?.full_name || 'Citizen',
      },
    };

    // Save to Supabase Database
    try {
      const dbRes = await insertChallengeInDb(challengePayload);
      if (dbRes?.dbId) {
        challengePayload.dbId = dbRes.dbId;
      }
    } catch (dbErr) {
      console.warn('Supabase DB save warning:', dbErr);
    }

    dispatch({
      type: 'SUBMIT_CHALLENGE',
      payload: challengePayload,
    });

    setUploading(false);
    setNewId(id);
    setPhase('analysing');
  };

  const finishAI = () => {
    dispatch({ type: 'RUN_AI', id: newId });
    setPhase('result');
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
                  <p className="text-[0.7rem] text-slate-400">{form.description.length} characters</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('citizen.form.catLabel')} <span className="font-normal text-slate-400">({t('citizen.form.catHint')})</span></label>
                  <Select value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                    options={[{ value: '', label: t('citizen.form.autoCat') }, ...CATEGORY_KEYS.map((c) => ({ value: c, label: c }))]} />
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
                <label className="label">Photographs / documents (Stores in Supabase Storage)</label>
                <label className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center block cursor-pointer hover:border-cyan-300 hover:bg-cyan-50/40 transition">
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden"
                    onChange={(e) => {
                      const chosen = Array.from(e.target.files ?? []);
                      setFileObjects((prev) => [...prev, ...chosen]);
                    }} />
                  <Upload size={22} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-[0.82rem] font-semibold text-slate-600">{t('citizen.form.filesCta')}</p>
                  <p className="text-[0.7rem] text-slate-400 mt-0.5">Uploaded files are securely saved to your Supabase Storage bucket</p>
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

        {phase === 'analysing' && (
          <motion.div key="ai" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <AIProcessing onDone={finishAI} />
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

            <div className="grid md:grid-cols-2 gap-3">
              <AIClassification ai={created.ai} />
              <AIPriority priority={created.priority} />
              <div className="md:col-span-2"><AIDuplicates duplicates={created.ai.duplicates} /></div>
              <div className="md:col-span-2"><MatchList kind="university" matches={created.ai.universityMatches.slice(0, 3)} /></div>
            </div>

            <div className="card p-5">
              <p className="font-display font-bold text-slate-900 mb-3">What happens next</p>
              <LifecycleTrack status={created.status} history={created.history} />
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => { setPhase('form'); setForm({ title: '', description: '', category: '', district: 'Ranchi', village: '', affected: '' }); setFiles([]); }}>
                Submit another
              </button>
              <button className="btn btn-ghost" onClick={() => nav('/government/challenges')}>See it in the Government queue <ArrowRight size={14} /></button>
              <button className="btn btn-primary" onClick={() => nav('/citizen/challenges')}>Track my challenge</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── My challenges ──────────────────────────────────────────────────── */
function MyChallenges({ mine }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const list = mine.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <SearchInput value={q} onChange={setQ} placeholder="Search my challenges…" className="w-full sm:w-72" />
        <button className="btn btn-primary" onClick={() => nav('/citizen/submit')}><Send size={15} />New challenge</button>
      </div>
      {list.length === 0 ? (
        <Empty icon={Icons.FolderOpen} title="You have not submitted a challenge yet"
          sub="Everything you submit appears here with live status from all four stakeholders."
          action={<button className="btn btn-primary" onClick={() => nav('/citizen/submit')}>Submit your first challenge</button>} />
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
        <SearchInput value={q} onChange={setQ} placeholder="Search all community challenges…" className="flex-1 min-w-[220px]" />
        <Select value={cat} onChange={setCat} options={['All', ...CATEGORY_KEYS]} className="w-auto" />
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
      {list.length === 0 && <Empty icon={Icons.SearchX} title="No challenges match your filters" sub="Try a different domain or district." />}
      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="citizen" />
    </div>
  );
}

/* ── Impact ─────────────────────────────────────────────────────────── */
function ImpactView() {
  const { challenges } = usePlatform();
  const [open, setOpen] = useState(null);
  const done = challenges.filter((c) => c.impact);
  const total = done.reduce((s, c) => s + c.impact.beneficiaries, 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(120deg,#059669,#0891b2)' }}>
        <motion.div className="absolute -right-12 -bottom-16 w-56 h-56 rounded-full bg-white/10 anim-float" />
        <p className="text-[0.72rem] font-bold uppercase tracking-widest opacity-80">Community impact</p>
        <p className="font-display text-4xl font-extrabold mt-1"><Counter to={total} /></p>
        <p className="text-white/90 font-semibold">people benefited from solutions delivered through this platform</p>
      </div>

      {done.length === 0 ? (
        <Empty icon={Icons.Sprout} title="No completed solutions yet" sub="Impact appears here once a project reaches the final stage." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {done.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.07}>
              <div className="card card-hover p-5 cursor-pointer h-full" onClick={() => setOpen(c)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Chip color={catMeta(c.category).hex}>{c.category}</Chip>
                  <Chip color="#059669" bg="#ecfdf5"><CheckCircle2 size={11} />Deployed</Chip>
                </div>
                <p className="font-display font-bold text-slate-900 mt-2 leading-snug">{c.title}</p>
                <p className="text-[0.78rem] text-slate-500 mt-1">{c.village}, {c.district} · {c.university?.short} · {c.partners.map((p) => p.short).join(', ')}</p>
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
    </div>
  );
}
