import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
  ArrowRight, PlayCircle, Send, Sparkles, Users, GraduationCap, Factory, Landmark,
  AlertTriangle, Link2, Target, ShieldCheck, TrendingUp, Brain, Copy, Gauge, Layers, Network,
} from 'lucide-react';
import Ecosystem from '../../components/shared/Ecosystem';
import { Reveal, SectionHead, Counter, Stat, Chip, Bar } from '../../components/shared/ui';
import { TrendArea, CategoryDonut } from '../../components/charts/Charts';
import JharkhandMap from '../../components/charts/JharkhandMap';
import { STAGES, ROLES, CATEGORIES } from '../../data/constants';
import { TREND_DATA, PLATFORM_TOTALS } from '../../data/seedChallenges';
import { useAnalytics } from '../../context/PlatformContext';
import { useShell } from '../../context/AppShellContext';

export default function Home() {
  const a = useAnalytics();

  return (
    <div className="overflow-x-hidden">
      <Hero />
      <Problem />
      <Solution />
      <Flow />
      <Stakeholders />
      <AISection />
      <Innovations />
      <Collaboration />
      <Impact />
      <AnalyticsPreview analytics={a} />
      <FinalCTA />
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────── */
function Hero() {
  const { t } = useShell();
  return (
    <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 mesh overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(to bottom, var(--bg) 0%, color-mix(in srgb, var(--bg) 55%, transparent) 45%, var(--bg) 100%)' }} />
      <motion.div className="absolute top-20 -left-24 w-72 h-72 rounded-full bg-indigo-300/20 blur-3xl anim-float" />
      <motion.div className="absolute bottom-0 -right-20 w-80 h-80 rounded-full bg-cyan-300/20 blur-3xl anim-float" style={{ animationDelay: '2s' }} />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 grid lg:grid-cols-[1.05fr_minmax(0,1fr)] gap-10 lg:gap-6 items-center">
        <div className="min-w-0">
          <motion.div initial={{ y: 14 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-indigo-100 text-[0.74rem] font-bold text-indigo-600">
            <Sparkles size={13} /> {t('home.badge')}
          </motion.div>

          <motion.h1 initial={{ y: 20 }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: 0.08 }}
            className="font-display text-[2rem] xs:text-[2.4rem] sm:text-[3rem] lg:text-[3.4rem] leading-[1.08] font-extrabold text-slate-900 mt-5 break-words">
            {t('home.hero.title1')} <span className="grad-text">{t('home.hero.title2')}</span><br />{t('home.hero.title3')}
          </motion.h1>

          <motion.p initial={{ y: 18 }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-5 text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
            {t('home.hero.sub')}
          </motion.p>

          <motion.div initial={{ y: 18 }} animate={{ y: 0 }} transition={{ duration: 0.7, delay: 0.28 }}
            className="flex flex-wrap gap-2.5 mt-7">
            <Link to="/citizen/submit" className="btn btn-primary text-[0.9rem] px-5 py-3"><Send size={16} />{t('nav.submitChallenge')}</Link>
            <Link to="/simulation" className="btn btn-ghost text-[0.9rem] px-5 py-3"><PlayCircle size={16} />{t('home.cta.workflow')}</Link>
            <Link to="/government" className="btn btn-ghost text-[0.9rem] px-5 py-3">{t('home.cta.explore')} <ArrowRight size={15} /></Link>
          </motion.div>

          <motion.div initial={{ y: 10 }} animate={{ y: 0 }} transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-3 mt-9 max-w-md">
            {[
              [t('home.stat.routed'), PLATFORM_TOTALS.challenges, ''],
              [t('home.stat.lives'), PLATFORM_TOTALS.beneficiaries / 100000, ' L'],
              [t('home.stat.institutions'), PLATFORM_TOTALS.universities + PLATFORM_TOTALS.industries, '+'],
            ].map(([label, v, suf]) => (
              <div key={label}>
                <div className="font-display text-2xl font-extrabold text-slate-900">
                  <Counter to={v} decimals={suf === ' L' ? 1 : 0} suffix={suf} />
                </div>
                <div className="text-[0.72rem] font-semibold text-slate-400">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex justify-center min-w-0 w-full">
          <Ecosystem size={430} />
        </div>
      </div>
    </section>
  );
}

/* ── Problem ────────────────────────────────────────────────────────── */
const PAINS = [
  { icon: 'MessageSquareOff', title: 'Problems go unheard', text: 'A villager reports a dry handpump to three offices and nothing is tracked, escalated or resolved.' },
  { icon: 'Unlink', title: 'No bridge to expertise', text: 'Universities run thousands of student projects a year — almost none are connected to a real, verified community need.' },
  { icon: 'CircleDollarSign', title: 'CSR money without pipelines', text: 'Industry and CSR funds exist, but there is no trusted pipeline of validated, ready-to-fund social projects.' },
  { icon: 'FileX2', title: 'No measurement', text: 'Even when something is built, nobody measures whether the original problem was actually solved.' },
];

function Problem() {
  const { t } = useShell();
  return (
    <section className="py-16 sm:py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow={t('home.problem.eyebrow')} accent="#dc2626"
          title={t('home.problem.title')}
          sub={t('home.problem.sub')} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {PAINS.map((p, i) => {
            const Icon = Icons[p.icon] ?? AlertTriangle;
            return (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="card card-hover p-5 h-full">
                  <div className="w-10 h-10 rounded-xl grid place-items-center bg-rose-50 text-rose-500 mb-3"><Icon size={19} /></div>
                  <p className="font-display font-bold text-slate-900">{p.title}</p>
                  <p className="text-[0.84rem] text-slate-500 mt-1.5 leading-relaxed">{p.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Solution ───────────────────────────────────────────────────────── */
function Solution() {
  const { t } = useShell();
  const points = [
    { icon: Link2, title: 'One connected pipeline', text: 'Challenge → AI analysis → validation → university → team → industry → prototype → deployment → impact. Every stakeholder sees the same live record.' },
    { icon: Brain, title: 'AI does the matching', text: 'Classification, priority scoring, duplicate detection and stakeholder matching happen automatically the moment a citizen presses submit.' },
    { icon: Target, title: 'Nothing gets lost', text: 'Each challenge carries an auditable timeline. Delays are visible to the district administration in real time.' },
    { icon: TrendingUp, title: 'Impact is measured', text: 'Every deployed solution reports beneficiaries, savings and a sustainability score back to the citizen who raised it.' },
  ];
  return (
    <section className="py-16 sm:py-24" style={{ background: 'var(--bg-2)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow={t('home.solution.eyebrow')} title={t('home.solution.title')}
          sub={t('home.solution.sub')} />
        <div className="grid md:grid-cols-2 gap-4 mt-10">
          {points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="card card-hover p-5 flex gap-4 h-full">
                <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0 text-white"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}><p.icon size={20} /></div>
                <div>
                  <p className="font-display font-bold text-slate-900">{p.title}</p>
                  <p className="text-[0.86rem] text-slate-500 mt-1.5 leading-relaxed">{p.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 12-stage flow ──────────────────────────────────────────────────── */
function Flow() {
  const { t } = useShell();
  return (
    <section className="py-16 sm:py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow={t('home.flow.eyebrow')} title={t('home.flow.title')}
          sub={t('home.flow.sub')} />
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STAGES.map((s, i) => {
            const r = ROLES[s.owner];
            const Icon = Icons[s.icon] ?? Icons.Circle;
            return (
              <Reveal key={s.key} delay={i * 0.04}>
                <div className="card card-hover p-4 h-full relative overflow-hidden">
                  <span className="absolute right-3 top-2 font-display text-3xl font-extrabold text-slate-100">{String(i + 1).padStart(2, '0')}</span>
                  <div className="w-9 h-9 rounded-xl grid place-items-center text-white mb-2.5"
                    style={{ background: `linear-gradient(135deg,${r.hex},${r.deep})` }}><Icon size={17} /></div>
                  <p className="font-display font-bold text-[0.92rem] text-slate-900">{s.label}</p>
                  <p className="text-[0.72rem] font-semibold mt-1" style={{ color: r.deep }}>{r.label}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={0.2}>
          <div className="text-center mt-8">
            <Link to="/simulation" className="btn btn-primary px-5 py-3"><PlayCircle size={16} />{t('home.flow.cta')}</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Stakeholders ───────────────────────────────────────────────────── */
const HOLDERS = [
  { role: 'citizen', Icon: Users, to: '/citizen', title: 'Citizens & Communities',
    points: ['Submit a challenge with photos and location', 'See the AI category and priority instantly', 'Track it through every stage', 'See the measured impact at the end'] },
  { role: 'varsity', Icon: GraduationCap, to: '/university', title: 'Universities & HEIs',
    points: ['Receive AI-recommended challenges in your domain', 'Form multidisciplinary student + faculty teams', 'Publish proposals and milestones', 'Request industry support'] },
  { role: 'industry', Icon: Factory, to: '/industry', title: 'Industry, MSMEs & CSR',
    points: ['See a live pipeline of validated projects', 'Offer funding, technology or infrastructure', 'Mentor student teams', 'Track your CSR portfolio impact'] },
  { role: 'govt', Icon: Landmark, to: '/government', title: 'Government & Districts',
    points: ['Validate and route incoming challenges', 'Monitor district-wise problem heatmaps', 'Track delayed projects', 'Report verified social outcomes'] },
];

function Stakeholders() {
  const { t } = useShell();
  return (
    <section className="py-16 sm:py-24" style={{ background: 'var(--bg-2)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow={t('home.holders.eyebrow')} title={t('home.holders.title')}
          sub={t('home.holders.sub')} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {HOLDERS.map((h, i) => {
            const r = ROLES[h.role];
            return (
              <Reveal key={h.role} delay={i * 0.08}>
                <Link to={h.to} className="card card-hover p-5 h-full flex flex-col group relative overflow-hidden">
                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg,${r.hex},${r.deep})` }} />
                  <div className="w-11 h-11 rounded-2xl grid place-items-center text-white mb-3"
                    style={{ background: `linear-gradient(135deg,${r.hex},${r.deep})`, boxShadow: `0 12px 26px -12px ${r.hex}` }}>
                    <h.Icon size={21} />
                  </div>
                  <p className="font-display font-bold text-slate-900 leading-tight">{h.title}</p>
                  <ul className="mt-3 space-y-1.5 flex-1">
                    {h.points.map((p) => (
                      <li key={p} className="text-[0.79rem] text-slate-500 flex gap-1.5 leading-snug">
                        <Icons.Check size={12} className="mt-0.5 shrink-0" style={{ color: r.hex }} strokeWidth={3} />{p}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-4 text-[0.78rem] font-bold inline-flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: r.deep }}>
                    {t('home.holders.open')} <ArrowRight size={13} />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── AI section ─────────────────────────────────────────────────────── */
const AI_FEATURES = [
  { Icon: Sparkles, title: 'Smart classification', text: 'Raw citizen text is classified into one of nine societal domains with a confidence score.', tag: '94% avg confidence' },
  { Icon: Gauge, title: 'Priority scoring', text: 'Urgency, population affected, severity, geographic spread and feasibility become one 0–100 score.', tag: '5-factor model' },
  { Icon: Copy, title: 'Duplicate detection', text: 'Similar challenges across districts are clustered so one solution can serve many communities.', tag: 'Similarity ≥ 55%' },
  { Icon: GraduationCap, title: 'University matching', text: 'Research areas, departments, faculty expertise, past projects and proximity are ranked.', tag: 'Top-5 ranked' },
  { Icon: Factory, title: 'Industry matching', text: 'Domain, technology stack, CSR focus, funding capacity and implementation reach are scored.', tag: 'CSR-aware' },
  { Icon: Layers, title: 'Team composition', text: 'The right mix of disciplines is proposed — civil + environmental + CS + electronics, for example.', tag: 'Multidisciplinary' },
];

function AISection() {
  const { t } = useShell();
  return (
    <section className="py-16 sm:py-24 surface-ink relative overflow-hidden">
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'radial-gradient(at 20% 20%, #4f46e5 0px, transparent 45%), radial-gradient(at 80% 70%, #0891b2 0px, transparent 45%)' }} />
      <div className="max-w-6xl mx-auto px-5 sm:px-6 relative">
        <Reveal className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[0.72rem] font-bold tracking-wider uppercase text-violet-200 mb-3">
            {t('home.ai.eyebrow')}
          </div>
          <h2 className="font-display text-[1.75rem] sm:text-4xl font-extrabold leading-tight">
            {t('home.ai.title')}
          </h2>
          <p className="mt-3 text-slate-300 text-[0.95rem]">
            {t('home.ai.sub')}
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {AI_FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07}>
              <div className="rounded-2xl p-5 h-full bg-white/[0.06] border border-white/10 backdrop-blur hover:bg-white/[0.1] transition">
                <div className="w-10 h-10 rounded-xl grid place-items-center mb-3"
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)' }}><f.Icon size={19} /></div>
                <p className="font-display font-bold">{f.title}</p>
                <p className="text-[0.83rem] text-slate-300 mt-1.5 leading-relaxed">{f.text}</p>
                <span className="inline-block mt-3 text-[0.68rem] font-bold px-2 py-1 rounded-full bg-violet-500/20 text-violet-200">{f.tag}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ── Key innovations ────────────────────────────────────────────────── */
const INNOVATIONS = [
  {
    icon: 'Dna', title: 'Problem DNA', tag: 'Structured intelligence',
    text: 'Every raw citizen report is decoded into structured fields — domain, severity, population, geography, feasibility — so it can be routed, ranked and matched by machine.',
    color: '#8b5cf6',
    chips: ['Category', 'Priority', 'Location', 'Similar cases', 'Impact score'],
  },
  {
    icon: 'Network', title: 'AI Solution Consortium', tag: 'The right combination',
    text: 'The engine does not just pick one university. It composes a consortium: institution + faculty + students + industry + government department, each scored on real capability.',
    color: '#6366f1',
    chips: ['University', 'Faculty', 'Students', 'Industry', 'Government'],
  },
  {
    icon: 'Gauge', title: 'Impact & Feasibility Score', tag: 'Why this problem first',
    text: 'A transparent 0–100 score explains why one challenge is prioritised over another — urgency, population, severity, geographic spread and how buildable the solution is.',
    color: '#f59e0b',
    chips: ['Urgency', 'Population', 'Severity', 'Geography', 'Feasibility'],
  },
  {
    icon: 'BadgeCheck', title: 'Impact Verification', tag: 'Closing the loop',
    text: 'After deployment the community that raised the problem verifies the outcome. Nothing is marked solved on the word of the builder alone.',
    color: '#10b981',
    chips: ['Community feedback', 'Government sign-off', 'Sustainability score'],
  },
  {
    icon: 'Map', title: 'District Innovation Heatmap', tag: 'Where problems and solutions live',
    text: 'Live district-level intelligence: where problems concentrate, which domains dominate, which districts have active projects and where solutions are already deployed.',
    color: '#06b6d4',
    chips: ['Problem density', 'Hotspots', 'Active projects', 'Deployed solutions'],
  },
];

function Innovations() {
  const { t } = useShell();
  return (
    <section className="py-16 sm:py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow="Key Innovations" accent="#8b5cf6"
          title={t('Five ideas that make this more than a complaint portal')}
          sub={t('Each one is visible and usable inside the dashboards — not a slide.')} />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {INNOVATIONS.map((n, i) => {
            const Icon = Icons[n.icon] ?? Icons.Sparkles;
            return (
              <Reveal key={n.title} delay={i * 0.07}>
                <div className="card card-hover p-5 h-full relative overflow-hidden">
                  <span className="absolute right-0 top-0 w-24 h-24 rounded-full blur-2xl opacity-[0.14]" style={{ background: n.color }} />
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl grid place-items-center text-white mb-3"
                      style={{ background: `linear-gradient(135deg, ${n.color}, ${n.color}bb)`, boxShadow: `0 12px 26px -14px ${n.color}` }}>
                      <Icon size={20} />
                    </div>
                    <p className="text-[0.64rem] font-bold uppercase tracking-widest" style={{ color: n.color }}>{n.tag}</p>
                    <p className="font-display font-bold text-slate-900 text-lg leading-tight mt-0.5">{n.title}</p>
                    <p className="text-[0.84rem] text-slate-500 mt-2 leading-relaxed">{n.text}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {n.chips.map((c) => <Chip key={c} color={n.color}>{c}</Chip>)}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
          <Reveal delay={0.35}>
            <div className="card card-hover p-5 h-full flex flex-col justify-center items-start gap-3"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#0891b2)', border: 'none' }}>
              <Network size={26} className="text-white" />
              <p className="font-display font-bold text-white text-lg leading-tight">See all five working on one real challenge</p>
              <p className="text-[0.84rem] text-white/80">The simulation walks through them in under 90 seconds.</p>
              <Link to="/simulation" className="btn bg-white text-indigo-700 hover:bg-white/90 mt-1">
                <PlayCircle size={15} />{t('home.final.cta')}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Collaboration workflow ─────────────────────────────────────────── */
function Collaboration() {
  const { t } = useShell();
  const chain = [
    { role: 'citizen', label: 'Citizen reports', text: '“Water shortage in Barkagaon”' },
    { role: 'ai', label: 'AI analyses', text: 'Water & Sanitation · Priority 87 · 3 duplicates' },
    { role: 'govt', label: 'Government validates', text: 'Field verified by block officer' },
    { role: 'varsity', label: 'University builds', text: 'IIT ISM · 5-member multidisciplinary team' },
    { role: 'industry', label: 'Industry deploys', text: 'HydroSense · IoT sensors + ₹18.5 L' },
    { role: 'citizen', label: 'Community benefits', text: '2,400 people · 42 lakh L water saved / yr' },
  ];
  return (
    <section className="py-16 sm:py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow={t('home.collab.eyebrow')} title={t('home.collab.title')}
          sub={t('home.collab.sub')} />
        <div className="mt-10 relative">
          <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-cyan-400 via-indigo-400 to-emerald-400 md:hidden" />
          <div className="grid md:grid-cols-6 gap-4">
            {chain.map((c, i) => {
              const r = ROLES[c.role];
              return (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="flex md:flex-col items-start md:items-center gap-3 md:text-center relative">
                    <div className="w-14 h-14 rounded-2xl grid place-items-center text-white font-display font-extrabold shrink-0 relative z-10"
                      style={{ background: `linear-gradient(135deg,${r.hex},${r.deep})`, boxShadow: `0 14px 28px -14px ${r.hex}` }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-[0.85rem] text-slate-900">{c.label}</p>
                      <p className="text-[0.74rem] text-slate-500 mt-0.5 leading-snug">{c.text}</p>
                      <span className="inline-block mt-1.5 text-[0.64rem] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: r.soft, color: r.deep }}>{r.label}</span>
                    </div>
                    {i < chain.length - 1 && (
                      <div className="hidden md:block absolute top-7 -right-2 w-4 h-0.5 bg-slate-200" />
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Impact ─────────────────────────────────────────────────────────── */
function Impact() {
  const { t } = useShell();
  const totals = PLATFORM_TOTALS;
  return (
    <section className="py-16 sm:py-24" style={{ background: 'var(--bg-2)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow={t('home.impact.eyebrow')} accent="#059669" title={t('home.impact.title')}
          sub={t('home.impact.sub')} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          <Stat icon={Icons.HeartHandshake} label={t('Citizens impacted')} value={totals.beneficiaries / 100000} decimals={1} suffix=" Lakh" color="#059669" />
          <Stat icon={Icons.CheckCircle2} label={t('Solutions deployed')} value={totals.completed} color="#4f46e5" delay={0.08} />
          <Stat icon={Icons.IndianRupee} label={t('CSR & funding mobilised')} value={totals.fundingMobilised} suffix=" Cr" color="#f59e0b" delay={0.16} />
          <Stat icon={Icons.MapPinned} label={t('Districts covered')} value={totals.districts} color="#06b6d4" delay={0.24} />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <Stat icon={Icons.GraduationCap} label={t('Universities on board')} value={totals.universities} color="#6366f1" />
          <Stat icon={Icons.Factory} label={t('Industry partners')} value={totals.industries} color="#f59e0b" delay={0.08} />
          <Stat icon={Icons.Users} label={t('Students engaged')} value={totals.students} color="#0891b2" delay={0.16} />
          <Stat icon={Icons.UserCheck} label={t('Faculty & researchers')} value={totals.faculty} color="#7c3aed" delay={0.24} />
        </div>
      </div>
    </section>
  );
}

/* ── Analytics preview ──────────────────────────────────────────────── */
function AnalyticsPreview({ analytics }) {
  const { t } = useShell();
  return (
    <section className="py-16 sm:py-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow={t('home.analytics.eyebrow')} title={t('home.analytics.title')}
          sub={t('home.analytics.sub')} />
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-4 mt-10">
          <Reveal>
            <div className="card p-5">
              <p className="font-display font-bold text-slate-900">{t('District-wise challenge density')}</p>
              <p className="text-[0.76rem] text-slate-400 mb-1">Jharkhand · live demo data</p>
              <JharkhandMap data={analytics.byDistrict} markers={analytics.markers} height={340} />
            </div>
          </Reveal>
          <div className="space-y-4">
            <Reveal delay={0.1}>
              <div className="card p-5">
                <p className="font-display font-bold text-slate-900">{t('Platform growth')}</p>
                <p className="text-[0.76rem] text-slate-400 mb-2">{t('Challenges, validations and projects over time')}</p>
                <TrendArea data={TREND_DATA} height={190} />
              </div>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="card p-5">
                <p className="font-display font-bold text-slate-900">{t('Challenges by domain')}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CATEGORIES.slice(0, 6).map((c) => <Chip key={c.key} color={c.hex}>{c.key}</Chip>)}
                </div>
                <div className="mt-3 space-y-2">
                  {analytics.byCategory.slice(0, 5).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className="text-[0.74rem] text-slate-600 w-40 truncate">{c.name}</span>
                      <Bar value={(c.value / Math.max(1, analytics.byCategory[0].value)) * 100}
                        color={CATEGORIES.find((x) => x.key === c.name)?.hex ?? '#6366f1'} height={6} delay={i * 0.06} />
                      <span className="text-[0.72rem] font-bold text-slate-400 w-5 text-right">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ──────────────────────────────────────────────────────── */
function FinalCTA() {
  const { t } = useShell();
  return (
    <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(120deg,#4f46e5,#0891b2 55%,#059669)' }}>
      <motion.div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-white/10 blur-2xl anim-float" />
      <motion.div className="absolute -bottom-28 right-0 w-80 h-80 rounded-full bg-white/10 blur-2xl anim-float" style={{ animationDelay: '1.5s' }} />
      <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center relative text-white">
        <Reveal>
          <Network size={34} className="mx-auto mb-4 opacity-90" />
          <h2 className="font-display text-[1.9rem] sm:text-4xl font-extrabold leading-tight">
            {t('home.final.title')}
          </h2>
          <p className="mt-4 text-white/85 text-base">
            {t('home.final.sub')}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 mt-7">
            <Link to="/citizen/submit" className="btn bg-white text-indigo-700 px-5 py-3 hover:bg-white/90"><Send size={16} />{t('nav.submitChallenge')}</Link>
            <Link to="/simulation" className="btn bg-white/15 text-white border-white/30 px-5 py-3 hover:bg-white/25"><PlayCircle size={16} />{t('home.final.cta')}</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
