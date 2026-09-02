import { useMemo, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Handshake, Check, ArrowRight, Sparkles, IndianRupee } from 'lucide-react';
import DashboardLayout from '../../components/navigation/DashboardLayout';
import ChallengeCard from '../../components/cards/ChallengeCard';
import ChallengeDetail, { MilestoneList } from '../../components/shared/ChallengeDetail';
import { MatchList } from '../../components/shared/AIPanel';
import { StageBadge } from '../../components/workflow/Lifecycle';
import { Stat, Chip, Modal, SearchInput, Select, Empty, Counter, Bar, ScoreRing, Reveal, Tabs } from '../../components/shared/ui';
import { VBar, CategoryDonut, FitRadar } from '../../components/charts/Charts';
import { usePlatform } from '../../context/PlatformContext';
import { INDUSTRIES } from '../../data/industries';
import { CATEGORY_KEYS, ROLES, STAGE_INDEX, STAGES, SUPPORT_TYPES, catMeta } from '../../data/constants';
import { matchIndustries } from '../../services/aiEngine';
import { timeAgo, fmtFull, cx } from '../../utils/format';

const R = ROLES.industry;

export default function IndustryDashboard() {
  const { challenges, activeIndustryId } = usePlatform();
  const firm = INDUSTRIES.find((f) => f.id === activeIndustryId) ?? INDUSTRIES[0];

  const opportunities = useMemo(() => challenges
    .filter((c) => c.proposal && !c.partners.some((p) => p.id === firm.id))
    .map((c) => ({ c, score: matchIndustries(c).find((m) => m.id === firm.id)?.score ?? 40 }))
    .sort((a, b) => b.score - a.score), [challenges, firm.id]);

  const portfolio = useMemo(() => challenges.filter((c) => c.partners.some((p) => p.id === firm.id)), [challenges, firm.id]);

  const nav = [
    { to: '/industry', label: 'Overview', icon: 'LayoutDashboard', end: true },
    { to: '/industry/opportunities', label: 'Opportunities', icon: 'Sparkles', badge: opportunities.filter((o) => o.c.industryNeed?.open).length },
    { to: '/industry/portfolio', label: 'My Portfolio', icon: 'Briefcase', badge: portfolio.length },
    { to: '/industry/milestones', label: 'Milestones', icon: 'ListChecks' },
    { to: '/industry/impact', label: 'CSR Impact', icon: 'TrendingUp' },
  ];

  return (
    <DashboardLayout role="industry" nav={nav}
      title={firm.name} subtitle={`${firm.type} · ${firm.hq} · Funding capacity ${firm.funding}`}
      user={{ name: firm.short, meta: 'CSR & Innovation' }}
      headerRight={<FirmSwitcher />}>
      <Routes>
        <Route index element={<Overview firm={firm} opportunities={opportunities} portfolio={portfolio} />} />
        <Route path="opportunities" element={<Opportunities firm={firm} opportunities={opportunities} />} />
        <Route path="portfolio" element={<Portfolio firm={firm} portfolio={portfolio} />} />
        <Route path="milestones" element={<Milestones portfolio={portfolio} />} />
        <Route path="impact" element={<ImpactView firm={firm} portfolio={portfolio} />} />
        <Route path="*" element={<Overview firm={firm} opportunities={opportunities} portfolio={portfolio} />} />
      </Routes>
    </DashboardLayout>
  );
}

function FirmSwitcher() {
  const { activeIndustryId, dispatch } = usePlatform();
  return (
    <select className="field w-auto text-[0.78rem] py-1.5 hidden sm:block" value={activeIndustryId}
      onChange={(e) => dispatch({ type: 'SET_ACTIVE_INDUSTRY', id: e.target.value })}>
      {INDUSTRIES.map((f) => <option key={f.id} value={f.id}>{f.short}</option>)}
    </select>
  );
}

/* ── Overview ───────────────────────────────────────────────────────── */
function Overview({ firm, opportunities, portfolio }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(null);
  const beneficiaries = portfolio.reduce((s, c) => s + (c.impact?.beneficiaries ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden" style={{ background: `linear-gradient(120deg,${R.hex},#c2410c)` }}>
        <motion.div className="absolute -right-12 -top-16 w-56 h-56 rounded-full bg-white/10 anim-float" />
        <div className="relative flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-widest opacity-80">CSR & innovation pipeline</p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-1">
              {opportunities.filter((o) => o.c.industryNeed?.open).length} validated projects need your support
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {firm.domains.map((d) => <span key={d} className="chip bg-white/15 text-white">{d}</span>)}
            </div>
          </div>
          <button className="btn bg-white text-orange-700 hover:bg-white/90 px-5 py-3 shrink-0" onClick={() => nav('/industry/opportunities')}>
            <Sparkles size={16} />View AI recommendations
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Icons.Sparkles} label="Matched opportunities" value={opportunities.length} color={R.hex} />
        <Stat icon={Icons.Briefcase} label="Projects supported" value={portfolio.length} color="#6366f1" delay={0.08} />
        <Stat icon={Icons.CheckCircle2} label="Deployed solutions" value={portfolio.filter((c) => STAGE_INDEX[c.status] >= STAGE_INDEX.deployment).length} color="#059669" delay={0.16} />
        <Stat icon={Icons.HeartHandshake} label="Lives impacted" value={beneficiaries} color="#0891b2" delay={0.24} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-bold text-slate-900">Top AI-recommended projects</p>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/industry/opportunities')}>View all</button>
          </div>
          {opportunities.length === 0 ? <Empty icon={Icons.Sparkles} title="No open projects right now" sub="New university proposals appear here automatically." />
            : (
              <div className="space-y-3">
                {opportunities.slice(0, 3).map(({ c, score }) => (
                  <div key={c.id} className="rounded-xl border border-slate-100 p-3.5 hover:border-amber-200 transition cursor-pointer" onClick={() => setOpen(c)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display font-bold text-[0.9rem] text-slate-900 truncate">{c.title}</p>
                        <p className="text-[0.72rem] text-slate-400">{c.university?.short} · {c.proposal?.budget} · {c.district}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(c.industryNeed?.needs ?? []).map((n) => <Chip key={n} color={R.deep} bg={R.soft}>{n}</Chip>)}
                        </div>
                      </div>
                      <ScoreRing value={score} size={46} stroke={4} color={R.hex} />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="card p-5">
          <p className="font-display font-bold text-slate-900 mb-1">Capability profile</p>
          <p className="text-[0.76rem] text-slate-400 mb-2">How the AI scores your fit against incoming projects</p>
          <FitRadar color={R.hex} data={[
            { axis: 'Domain', value: 92 },
            { axis: 'Technology', value: 86 },
            { axis: 'CSR focus', value: 88 },
            { axis: 'Funding', value: firm.capacity === 'High' ? 94 : firm.capacity === 'Medium' ? 72 : 48 },
            { axis: 'Deployment', value: firm.supports.includes('Deployment') ? 90 : 58 },
          ]} />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {firm.tech.map((t) => <Chip key={t} color={R.deep} bg={R.soft}>{t}</Chip>)}
          </div>
        </div>
      </div>

      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="industry" />
    </div>
  );
}

/* ── Opportunities ──────────────────────────────────────────────────── */
function Opportunities({ firm, opportunities }) {
  const [open, setOpen] = useState(null);
  const [joinFor, setJoinFor] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [onlyOpen, setOnlyOpen] = useState(true);

  const list = opportunities.filter(({ c }) => (
    (cat === 'All' || c.category === cat)
    && (!onlyOpen || c.industryNeed?.open)
    && c.title.toLowerCase().includes(q.toLowerCase())
  ));

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Search university projects…" className="flex-1 min-w-[220px]" />
        <Select value={cat} onChange={setCat} options={['All', ...CATEGORY_KEYS]} className="w-auto" />
        <button className={cx('btn btn-sm', onlyOpen ? 'text-white' : 'btn-ghost')} style={onlyOpen ? { background: R.hex } : undefined}
          onClick={() => setOnlyOpen((o) => !o)}>Needs support only</button>
        <Chip color={R.hex} bg={R.soft}>{list.length} projects</Chip>
      </div>

      {list.length === 0 ? (
        <Empty icon={Icons.Sparkles} title="Nothing matches right now" sub="Try clearing the filters or another domain." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {list.map(({ c, score }, i) => (
              <ChallengeCard key={c.id} challenge={c} index={i} onOpen={setOpen} accent={R.hex}
                actions={(
                  <>
                    <Chip color={R.deep} bg={R.soft}>AI fit {score}%</Chip>
                    {c.industryNeed?.open
                      ? <button className="btn btn-sm text-white" style={{ background: R.hex }} onClick={() => setJoinFor(c)}><Handshake size={13} />Support</button>
                      : <Chip color="#059669" bg="#ecfdf5"><Check size={11} />Partner joined</Chip>}
                  </>
                )} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="industry"
        actions={open && open.industryNeed?.open && (
          <button className="btn btn-primary" onClick={() => { setJoinFor(open); setOpen(null); }}><Handshake size={15} />Offer support</button>
        )} />
      <JoinModal challenge={joinFor} firm={firm} onClose={() => setJoinFor(null)} />
    </div>
  );
}

function JoinModal({ challenge, firm, onClose }) {
  const { dispatch, toast } = usePlatform();
  const [supports, setSupports] = useState(firm.supports.slice(0, 3));
  const [amount, setAmount] = useState('₹18,50,000');
  const open = !!challenge;

  const submit = () => {
    dispatch({ type: 'INDUSTRY_JOIN', id: challenge.id, industryId: firm.id, supports, amount });
    toast(`${firm.short} joined ${challenge.code}`, 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} accent={R.hex} width="max-w-xl"
      title="Offer industry support" subtitle={challenge ? `${challenge.code} · ${challenge.title}` : ''}>
      {challenge && (
        <div className="space-y-4">
          <div className="rounded-xl p-3.5" style={{ background: R.soft }}>
            <p className="text-[0.78rem] font-bold" style={{ color: R.deep }}>University request</p>
            <p className="text-[0.82rem] text-slate-600 mt-1">{challenge.industryNeed?.note}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(challenge.industryNeed?.needs ?? []).map((n) => <Chip key={n} color={R.deep} bg="#fff">{n}</Chip>)}
            </div>
          </div>
          <div>
            <label className="label">What will you provide?</label>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORT_TYPES.map((s) => {
                const on = supports.includes(s);
                return (
                  <button key={s} onClick={() => setSupports((x) => (on ? x.filter((y) => y !== s) : [...x, s]))}
                    className={cx('chip border transition', on ? 'text-white border-transparent' : 'text-slate-500 border-slate-200 hover:border-slate-300')}
                    style={on ? { background: R.hex } : undefined}>{s}</button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label">Committed support value</label>
            <input className="field" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!supports.length} onClick={submit}><Handshake size={15} />Confirm partnership</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ── Portfolio ──────────────────────────────────────────────────────── */
function Portfolio({ firm, portfolio }) {
  const { dispatch, toast } = usePlatform();
  const [open, setOpen] = useState(null);

  const nextStage = (c) => ['pilot', 'deployment'].find((s) => STAGE_INDEX[s] > STAGE_INDEX[c.status]);

  return (
    <div className="space-y-4">
      {portfolio.length === 0 ? (
        <Empty icon={Icons.Briefcase} title="Your portfolio is empty" sub="Support a validated university project to build your CSR portfolio." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {portfolio.map((c, i) => {
            const ns = nextStage(c);
            return (
              <ChallengeCard key={c.id} challenge={c} index={i} onOpen={setOpen} accent={R.hex}
                actions={(
                  <>
                    <Chip color={R.deep} bg={R.soft}>{c.partners.find((p) => p.id === firm.id)?.amount}</Chip>
                    {ns && STAGE_INDEX[c.status] >= STAGE_INDEX.testing && (
                      <button className="btn btn-sm text-white" style={{ background: R.hex }}
                        onClick={() => { dispatch({ type: 'ADVANCE', id: c.id, stage: ns }); toast(`${c.code} advanced to ${STAGES[STAGE_INDEX[ns]].label}`, 'success'); }}>
                        <ArrowRight size={13} />{STAGES[STAGE_INDEX[ns]].short}
                      </button>
                    )}
                  </>
                )} />
            );
          })}
        </div>
      )}
      <ChallengeDetail challenge={open} open={!!open} onClose={() => setOpen(null)} role="industry" />
    </div>
  );
}

/* ── Milestones ─────────────────────────────────────────────────────── */
function Milestones({ portfolio }) {
  const withM = portfolio.filter((c) => c.milestones.length);
  if (!withM.length) return <Empty icon={Icons.ListChecks} title="No milestones to track" sub="Milestones appear once you support a project with a published proposal." />;
  return (
    <div className="space-y-4">
      {withM.map((c, i) => (
        <Reveal key={c.id} delay={i * 0.06}>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display font-bold text-slate-900">{c.title}</p>
              <StageBadge status={c.status} size="sm" />
            </div>
            <MilestoneList milestones={c.milestones} challengeId={c.id} />
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ── CSR impact ─────────────────────────────────────────────────────── */
function ImpactView({ firm, portfolio }) {
  const done = portfolio.filter((c) => c.impact);
  const beneficiaries = done.reduce((s, c) => s + c.impact.beneficiaries, 0);
  const byCat = useMemo(() => {
    const m = {};
    portfolio.forEach((c) => { m[c.category] = (m[c.category] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [portfolio]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: `linear-gradient(120deg,${R.hex},#b45309)` }}>
        <motion.div className="absolute -right-12 -bottom-16 w-56 h-56 rounded-full bg-white/10 anim-float" />
        <p className="text-[0.72rem] font-bold uppercase tracking-widest opacity-80">Verified CSR impact</p>
        <p className="font-display text-4xl font-extrabold mt-1"><Counter to={beneficiaries} /></p>
        <p className="text-white/90 font-semibold">people reached through {done.length} deployed solution{done.length === 1 ? '' : 's'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Icons.Briefcase} label="Projects in portfolio" value={portfolio.length} color={R.hex} />
        <Stat icon={Icons.Rocket} label="Reached pilot or beyond" value={portfolio.filter((c) => STAGE_INDEX[c.status] >= STAGE_INDEX.pilot).length} color="#6366f1" delay={0.08} />
        <Stat icon={Icons.GraduationCap} label="University partners" value={new Set(portfolio.map((c) => c.university?.id).filter(Boolean)).size} color="#0891b2" delay={0.16} />
        <Stat icon={Icons.MapPinned} label="Districts served" value={new Set(portfolio.map((c) => c.district)).size} color="#059669" delay={0.24} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="font-display font-bold text-slate-900 mb-2">Portfolio by domain</p>
          {byCat.length ? <CategoryDonut data={byCat} /> : <Empty icon={Icons.PieChart} title="No portfolio data yet" />}
        </div>
        <div className="card p-5">
          <p className="font-display font-bold text-slate-900 mb-2">Impact metrics from deployed solutions</p>
          {done.length === 0 ? <Empty icon={Icons.TrendingUp} title="No deployed solutions yet" sub="Impact metrics appear after deployment." />
            : (
              <div className="space-y-4">
                {done.map((c) => (
                  <div key={c.id}>
                    <p className="text-[0.84rem] font-bold text-slate-800">{c.title}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {c.impact.metrics.map((m) => (
                        <div key={m.label} className="rounded-lg bg-slate-50 p-2">
                          <p className="font-display text-[0.95rem] font-extrabold text-slate-900">
                            <Counter to={m.value} decimals={m.value % 1 !== 0 ? 1 : 0} suffix={m.unit} />
                          </p>
                          <p className="text-[0.62rem] text-slate-500 font-semibold leading-tight">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
