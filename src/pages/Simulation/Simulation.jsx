import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
  Play, Pause, SkipForward, SkipBack, RotateCcw, ArrowLeft, Zap, Check, Users,
  GraduationCap, Factory, Landmark, Sparkles, ArrowRight,
} from 'lucide-react';
import { Logo } from '../../components/navigation/PublicNav';
import { Chip, Counter, Bar, ScoreRing, Modal } from '../../components/shared/ui';
import { usePlatform } from '../../context/PlatformContext';
import { ROLES } from '../../data/constants';
import { cx } from '../../utils/format';

/* ── Script of the simulation ───────────────────────────────────────── */
const SCRIPT = [
  {
    id: 1, actor: 'citizen', title: 'Citizen submits the challenge',
    caption: 'Ramesh Mahto, a farmer in Barkagaon, reports a problem from his phone in under two minutes.',
    kind: 'submission',
  },
  {
    id: 2, actor: 'ai', title: 'AI analyses the challenge',
    caption: 'Classification, priority scoring and duplicate detection run automatically the moment it is submitted.',
    kind: 'ai',
  },
  {
    id: 3, actor: 'govt', title: 'Government validates the problem',
    caption: 'The district innovation cell verifies it in the field and approves it for university matching.',
    kind: 'validate',
  },
  {
    id: 4, actor: 'ai', title: 'AI recommends universities',
    caption: 'Research areas, departments, faculty expertise, past projects and proximity are ranked.',
    kind: 'unimatch',
  },
  {
    id: 5, actor: 'varsity', title: 'University forms a multidisciplinary team',
    caption: 'IIT (ISM) Dhanbad accepts and composes a team across four departments.',
    kind: 'team',
  },
  {
    id: 6, actor: 'varsity', title: 'University publishes the proposal',
    caption: 'Objective, approach, budget, duration and six milestones become the public project record.',
    kind: 'proposal',
  },
  {
    id: 7, actor: 'ai', title: 'AI recommends industry partners',
    caption: 'Domain, technology stack, CSR focus and funding capacity are scored against the proposal.',
    kind: 'indmatch',
  },
  {
    id: 8, actor: 'industry', title: 'Industry joins the project',
    caption: 'HydroSense Technologies commits IoT hardware, prototyping support and ₹18.5 lakh.',
    kind: 'partner',
  },
  { id: 9, actor: 'varsity', title: 'Prototype development', caption: 'Students build solar-powered borewell recharge units with IoT flow sensors.', kind: 'phase', metricLabel: 'Prototype build', progress: 100 },
  { id: 10, actor: 'varsity', title: 'Testing and iteration', caption: 'Lab testing plus community feedback from the three affected hamlets.', kind: 'phase', metricLabel: 'Test cycles completed', progress: 100 },
  { id: 11, actor: 'govt', title: 'Government and community validation', caption: 'Block officer and gram sabha jointly sign off on the pilot results.', kind: 'phase', metricLabel: 'Field pilot', progress: 100 },
  { id: 12, actor: 'industry', title: 'Deployment', caption: 'Full deployment across all three hamlets with a maintenance plan and local training.', kind: 'phase', metricLabel: 'Deployment', progress: 100 },
  { id: 13, actor: 'citizen', title: 'Impact measured and reported back', caption: 'Verified outcomes are published to the citizen who raised the problem and to the district dashboard.', kind: 'impact' },
];

const AI_ANALYSIS = {
  category: 'Water & Sanitation', confidence: 94, priority: 87, level: 'HIGH', district: 'Hazaribagh',
  duplicates: [
    { title: 'Handpump running dry in Bagodar village hamlet', sim: 92 },
    { title: 'Groundwater depletion near Chainpur', sim: 84 },
    { title: 'Village water access in Manika block', sim: 76 },
  ],
  factors: [['Urgency', 91], ['Population affected', 84], ['Severity', 89], ['Geographic impact', 78], ['Feasibility', 86]],
};

const UNI_MATCHES = [
  { name: 'IIT (ISM) Dhanbad', score: 94, why: 'Groundwater modelling + IoT sensor networks · Environmental Engineering' },
  { name: 'Birsa Agricultural University', score: 87, why: 'Micro-irrigation research · Soil & water conservation' },
  { name: 'BIT Mesra', score: 81, why: 'Embedded systems · Remote sensing · AI for social good' },
];

const IND_MATCHES = [
  { name: 'HydroSense Technologies', score: 92, why: 'IoT flow sensors · LoRaWAN · Water quality analytics' },
  { name: 'Tata Steel Foundation', score: 88, why: 'CSR: drinking water & rural livelihoods · ₹25 Cr/yr' },
  { name: 'JR Renewables', score: 79, why: 'Solar pumping · Battery storage · Deployment capacity' },
];

const TEAM = [
  { name: 'Dr. Anjali Mahato', dept: 'Environmental Engineering', role: 'Faculty lead' },
  { name: 'Prof. R. K. Verma', dept: 'Civil Engineering', role: 'Faculty' },
  { name: 'Dr. Suman Oraon', dept: 'Computer Science', role: 'Researcher · IoT' },
  { name: 'Aditya Kumar', dept: 'Electronics', role: 'Student · LoRaWAN' },
  { name: 'Neha Singh', dept: 'Computer Science', role: 'Student · Dashboard' },
];

const IMPACT = [
  { label: 'People with safe water access', value: 2400, unit: '' },
  { label: 'Water saved per year', value: 4200000, unit: ' L' },
  { label: 'Walking distance reduced', value: 2.8, unit: ' km/day' },
  { label: 'Waterborne illness reduction', value: 64, unit: '%' },
  { label: 'Project duration', value: 9, unit: ' months' },
  { label: 'Sustainability score', value: 86, unit: '/100' },
];

const ACTORS = [
  { key: 'citizen', Icon: Users },
  { key: 'govt', Icon: Landmark },
  { key: 'ai', Icon: Sparkles },
  { key: 'varsity', Icon: GraduationCap },
  { key: 'industry', Icon: Factory },
];

export default function Simulation() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const timer = useRef(null);

  const cur = SCRIPT[step];

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setTimeout(() => {
      setStep((s) => {
        if (s >= SCRIPT.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, cur.kind === 'ai' || cur.kind === 'impact' ? 5200 : 3600);
    return () => clearTimeout(timer.current);
  }, [playing, step, cur.kind]);

  const go = (n) => { setPlaying(false); setStep(Math.max(0, Math.min(SCRIPT.length - 1, n))); };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(at 15% 10%, #4f46e5 0px, transparent 42%), radial-gradient(at 85% 25%, #0891b2 0px, transparent 40%), radial-gradient(at 55% 95%, #059669 0px, transparent 45%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {/* header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/" className="btn bg-white/10 text-white border-white/15 btn-sm hover:bg-white/20"><ArrowLeft size={14} />Home</Link>
            <div className="hidden sm:block"><Logo dark /></div>
          </div>
          <div className="flex items-center gap-2">
            <Chip color="#a5b4fc" bg="rgba(255,255,255,.1)">Interactive lifecycle simulation</Chip>
            <button className="btn btn-sm bg-white text-slate-900 hover:bg-white/90" onClick={() => setDemoOpen(true)}>
              <Zap size={13} />Presentation mode
            </button>
          </div>
        </div>

        {/* title */}
        <div className="text-center mt-8 mb-6">
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl sm:text-4xl font-extrabold leading-tight">
            From one villager&apos;s problem to a deployed solution
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="text-slate-300 mt-2 text-[0.92rem] max-w-2xl mx-auto">
            Watch a real challenge — <b className="text-white">“Severe drinking water shortage in Barkagaon villages”</b> — travel through
            every stakeholder in the ecosystem.
          </motion.p>
        </div>

        {/* actor rail */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-6">
          {ACTORS.map((a) => {
            const r = ROLES[a.key];
            const on = cur.actor === a.key;
            return (
              <motion.div key={a.key} className="flex flex-col items-center gap-1.5"
                animate={{ scale: on ? 1.08 : 1, opacity: on ? 1 : 0.42 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                <div className="relative">
                  {on && <span className="absolute inset-0 rounded-2xl anim-ring" style={{ background: `${r.hex}77` }} />}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl grid place-items-center relative"
                    style={{ background: on ? `linear-gradient(135deg,${r.hex},${r.deep})` : 'rgba(255,255,255,.08)', boxShadow: on ? `0 14px 30px -12px ${r.hex}` : 'none' }}>
                    <a.Icon size={20} />
                  </div>
                </div>
                <span className="text-[0.64rem] sm:text-[0.7rem] font-bold">{r.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* progress */}
        <div className="flex items-center gap-1.5 mb-5">
          {SCRIPT.map((s, i) => (
            <button key={s.id} onClick={() => go(i)} className="flex-1 group" aria-label={`Step ${i + 1}`}>
              <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                <motion.div className="h-full rounded-full"
                  style={{ background: ROLES[s.actor].hex }}
                  animate={{ width: i < step ? '100%' : i === step ? '100%' : '0%', opacity: i <= step ? 1 : 0.2 }}
                  transition={{ duration: 0.5 }} />
              </div>
            </button>
          ))}
        </div>

        {/* stage card */}
        <div className="min-h-[430px]">
          <AnimatePresence mode="wait">
            <motion.div key={cur.id}
              initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: 0.99 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <StageCard step={cur} index={step} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* controls */}
        <div className="sticky bottom-4 mt-6">
          <div className="mx-auto max-w-xl rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: 'rgba(255,255,255,.09)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,.14)' }}>
            <div className="text-[0.74rem] font-bold text-slate-300 shrink-0">
              STEP {String(step + 1).padStart(2, '0')} <span className="text-slate-500">/ {SCRIPT.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm bg-white/10 text-white border-white/15 hover:bg-white/20" onClick={() => go(step - 1)} disabled={step === 0}><SkipBack size={14} /></button>
              <button className="btn btn-sm px-4 bg-white text-slate-900 hover:bg-white/90" onClick={() => setPlaying((p) => !p)}>
                {playing ? <><Pause size={14} />Pause</> : <><Play size={14} />{step === SCRIPT.length - 1 ? 'Replay' : 'Play'}</>}
              </button>
              <button className="btn btn-sm bg-white/10 text-white border-white/15 hover:bg-white/20" onClick={() => go(step + 1)} disabled={step === SCRIPT.length - 1}><SkipForward size={14} /></button>
              <button className="btn btn-sm bg-white/10 text-white border-white/15 hover:bg-white/20" onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw size={14} /></button>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 pb-10">
          <p className="text-slate-400 text-[0.86rem]">This is exactly what happens inside the four dashboards.</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {[['/citizen', 'citizen'], ['/university', 'varsity'], ['/industry', 'industry'], ['/government', 'govt']].map(([to, key]) => (
              <Link key={to} to={to} className="btn btn-sm text-white border-white/15" style={{ background: `${ROLES[key].hex}33` }}>
                {ROLES[key].label} dashboard <ArrowRight size={13} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <PresentationMode open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}

/* ── Stage cards ────────────────────────────────────────────────────── */
function StageCard({ step, index }) {
  const r = ROLES[step.actor];
  return (
    <div className="rounded-3xl p-5 sm:p-7 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.13)', backdropFilter: 'blur(16px)' }}>
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl" style={{ background: `${r.hex}44` }} />
      <div className="relative">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl grid place-items-center font-display font-extrabold shrink-0"
            style={{ background: `linear-gradient(135deg,${r.hex},${r.deep})`, boxShadow: `0 16px 34px -14px ${r.hex}` }}>
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="min-w-0 flex-1">
            <span className="chip" style={{ background: `${r.hex}30`, color: '#fff' }}>{r.label}</span>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold mt-1.5">{step.title}</h2>
            <p className="text-slate-300 text-[0.9rem] mt-1 max-w-2xl">{step.caption}</p>
          </div>
        </div>

        <div className="mt-6">
          {step.kind === 'submission' && <Submission />}
          {step.kind === 'ai' && <AIStage />}
          {step.kind === 'validate' && <ValidateStage />}
          {step.kind === 'unimatch' && <MatchStage items={UNI_MATCHES} role="varsity" label="University match score" />}
          {step.kind === 'team' && <TeamStage />}
          {step.kind === 'proposal' && <ProposalStage />}
          {step.kind === 'indmatch' && <MatchStage items={IND_MATCHES} role="industry" label="Industry fit score" />}
          {step.kind === 'partner' && <PartnerStage />}
          {step.kind === 'phase' && <PhaseStage step={step} />}
          {step.kind === 'impact' && <ImpactStage />}
        </div>
      </div>
    </div>
  );
}

const Panel = ({ children, className = '' }) => (
  <div className={cx('rounded-2xl p-4 bg-white/[0.06] border border-white/10', className)}>{children}</div>
);

function Submission() {
  return (
    <div className="grid md:grid-cols-[1.3fr_1fr] gap-4">
      <Panel>
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">Challenge submitted</p>
        <p className="font-display text-lg font-extrabold mt-1">Severe drinking water shortage in Barkagaon villages</p>
        <p className="text-[0.86rem] text-slate-300 mt-2 leading-relaxed">
          “Three hamlets have had no functioning handpump for over four months. Families walk 3 km every day to fetch drinking
          water from a seasonal stream. The borewell has run dry and waterborne illness is rising.”
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {['📍 Barkagaon, Hazaribagh', '👥 2,400 people affected', '📷 2 photographs', '📄 Community signatures'].map((t) => (
            <span key={t} className="chip bg-white/10 text-slate-200">{t}</span>
          ))}
        </div>
      </Panel>
      <Panel className="flex flex-col justify-center items-center text-center">
        <motion.div className="w-16 h-16 rounded-2xl grid place-items-center mb-3"
          style={{ background: `linear-gradient(135deg,${ROLES.citizen.hex},${ROLES.citizen.deep})` }}
          animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
          <Users size={28} />
        </motion.div>
        <p className="font-display font-bold">Ramesh Mahto</p>
        <p className="text-[0.76rem] text-slate-400">Farmer · Barkagaon, Hazaribagh</p>
        <p className="text-[0.74rem] text-slate-400 mt-3">Submission time: <b className="text-white">1 min 48 s</b></p>
      </Panel>
    </div>
  );
}

function AIStage() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Panel>
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">Classification</p>
        <div className="flex items-center gap-3 mt-2">
          <ScoreRing value={AI_ANALYSIS.confidence} size={62} color="#22d3ee" />
          <div>
            <p className="font-display font-extrabold text-cyan-300">{AI_ANALYSIS.category}</p>
            <p className="text-[0.72rem] text-slate-400">confidence · {AI_ANALYSIS.district}</p>
          </div>
        </div>
      </Panel>
      <Panel>
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">Priority score</p>
        <p className="font-display text-3xl font-extrabold mt-1 text-amber-300">
          <Counter to={AI_ANALYSIS.priority} />/100 <span className="text-sm">{AI_ANALYSIS.level}</span>
        </p>
        <div className="space-y-1.5 mt-2">
          {AI_ANALYSIS.factors.map(([l, v], i) => (
            <div key={l} className="flex items-center gap-2">
              <span className="text-[0.68rem] text-slate-400 w-28">{l}</span>
              <Bar value={phase >= 1 ? v : 0} color="#f59e0b" height={4} bg="rgba(255,255,255,.1)" delay={i * 0.06} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">Similar challenges found</p>
        <p className="font-display text-3xl font-extrabold mt-1 text-violet-300">{AI_ANALYSIS.duplicates.length}</p>
        <div className="space-y-2 mt-2">
          {AI_ANALYSIS.duplicates.map((d, i) => (
            <motion.div key={d.title} initial={{ opacity: 0, x: -8 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.12 }}>
              <p className="text-[0.72rem] text-slate-300 truncate">{d.title}</p>
              <div className="flex items-center gap-2">
                <Bar value={d.sim} color="#a78bfa" height={4} bg="rgba(255,255,255,.1)" />
                <span className="text-[0.66rem] font-bold text-slate-400">{d.sim}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ValidateStage() {
  return (
    <div className="grid md:grid-cols-[1fr_1.2fr] gap-4">
      <Panel className="flex flex-col items-center justify-center text-center py-8">
        <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="w-20 h-20 rounded-3xl grid place-items-center mb-3"
          style={{ background: `linear-gradient(135deg,${ROLES.govt.hex},${ROLES.govt.deep})`, boxShadow: `0 20px 40px -16px ${ROLES.govt.hex}` }}>
          <Check size={38} strokeWidth={3} />
        </motion.div>
        <p className="font-display text-xl font-extrabold text-emerald-300">Validated</p>
        <p className="text-[0.78rem] text-slate-400 mt-1">District Innovation Cell, Hazaribagh</p>
      </Panel>
      <Panel>
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">Verification record</p>
        <div className="space-y-2.5 mt-2">
          {[
            ['Field verification by block officer', 'Completed'],
            ['Cross-checked against 3 similar challenges', 'Clustered, not duplicate'],
            ['Department routed', 'Drinking Water & Sanitation'],
            ['Priority confirmed', 'HIGH · 87/100'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 text-[0.8rem]">
              <span className="text-slate-300 flex items-center gap-2"><Check size={13} className="text-emerald-400" strokeWidth={3} />{k}</span>
              <span className="font-bold text-white text-right">{v}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MatchStage({ items, role, label }) {
  const r = ROLES[role];
  return (
    <div className="space-y-3">
      <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {items.map((m, i) => (
        <motion.div key={m.name} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.18 }}>
          <Panel className="flex items-center gap-4">
            <ScoreRing value={m.score} size={58} stroke={5} color={r.hex} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-bold">{m.name}</p>
                {i === 0 && <span className="chip" style={{ background: `${r.hex}30`, color: '#fff' }}>Best match</span>}
              </div>
              <p className="text-[0.78rem] text-slate-400 mt-0.5">{m.why}</p>
            </div>
          </Panel>
        </motion.div>
      ))}
    </div>
  );
}

function TeamStage() {
  return (
    <div className="grid md:grid-cols-[1fr_1.4fr] gap-4">
      <Panel>
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">Disciplines combined</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['Civil Engineering', 'Environmental Science', 'Computer Science', 'IoT / Electronics'].map((d, i) => (
            <motion.span key={d} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.14 }}
              className="chip bg-white/10 text-slate-100">{d}</motion.span>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-4 text-center text-[0.78rem] font-bold px-3 py-2 rounded-xl"
          style={{ background: `linear-gradient(90deg,${ROLES.varsity.hex},#06b6d4)` }}>
          → One multidisciplinary team of 5
        </motion.div>
      </Panel>
      <Panel>
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">Team composition</p>
        <div className="space-y-2 mt-2">
          {TEAM.map((m, i) => (
            <motion.div key={m.name} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }}
              className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full grid place-items-center text-[0.68rem] font-bold"
                style={{ background: `linear-gradient(135deg,${ROLES.varsity.hex},${ROLES.varsity.deep})` }}>
                {m.name.split(' ').slice(-2).map((w) => w[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="text-[0.82rem] font-semibold truncate">{m.name}</p>
                <p className="text-[0.68rem] text-slate-400 truncate">{m.role} · {m.dept}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ProposalStage() {
  const milestones = ['Field survey & baseline', 'Design freeze', 'Prototype development', 'Field testing', 'Pilot deployment', 'Handover & impact report'];
  return (
    <div className="grid md:grid-cols-[1.2fr_1fr] gap-4">
      <Panel>
        <p className="font-display font-bold text-lg">Community-owned borewell recharge & monitoring system</p>
        <p className="text-[0.84rem] text-slate-300 mt-1.5">
          Restore year-round drinking water for three hamlets through rainwater-fed recharge structures
          and IoT monitoring, handed over to the gram panchayat.
        </p>
        <div className="flex flex-wrap gap-4 mt-3 text-[0.78rem]">
          <span className="text-slate-400">Budget <b className="text-white">₹28,50,000</b></span>
          <span className="text-slate-400">Duration <b className="text-white">9 months</b></span>
          <span className="text-slate-400">Milestones <b className="text-white">6</b></span>
        </div>
      </Panel>
      <Panel>
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">Milestone plan</p>
        <div className="space-y-2 mt-2">
          {milestones.map((m, i) => (
            <motion.div key={m} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2.5 text-[0.8rem]">
              <span className="w-5 h-5 rounded-full grid place-items-center text-[0.62rem] font-bold bg-white/10">{i + 1}</span>
              <span className="text-slate-300">{m}</span>
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PartnerStage() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {[
        { name: 'HydroSense Technologies', role: 'Technology & prototyping', detail: 'IoT flow sensors, LoRaWAN gateway, analytics dashboard', hex: ROLES.industry.hex },
        { name: 'Tata Steel Foundation', role: 'CSR funding', detail: '₹18,50,000 committed for hardware and community training', hex: '#0ea5e9' },
        { name: 'Gram Panchayat, Barkagaon', role: 'Ownership & maintenance', detail: 'Two local operators trained for long-term upkeep', hex: ROLES.govt.hex },
      ].map((p, i) => (
        <motion.div key={p.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.16 }}>
          <Panel className="h-full">
            <div className="w-10 h-10 rounded-xl grid place-items-center mb-2" style={{ background: `${p.hex}33` }}>
              <Factory size={18} />
            </div>
            <p className="font-display font-bold">{p.name}</p>
            <p className="text-[0.72rem] font-semibold mt-0.5" style={{ color: p.hex }}>{p.role}</p>
            <p className="text-[0.78rem] text-slate-400 mt-1.5">{p.detail}</p>
          </Panel>
        </motion.div>
      ))}
    </div>
  );
}

function PhaseStage({ step }) {
  const r = ROLES[step.actor];
  const details = {
    9: ['3 recharge structures designed', 'IoT flow sensor board v2', 'Solar power module', 'Panchayat dashboard'],
    10: ['Lab flow calibration', 'Water quality testing', '2 community feedback rounds', 'Firmware iteration v3'],
    11: ['Block officer inspection', 'Gram sabha approval', 'Water quality certification', 'Sustainability audit'],
    12: ['3 hamlets covered', '480 households connected', '2 operators trained', 'Maintenance plan handed over'],
  }[step.id] ?? [];

  return (
    <div className="grid md:grid-cols-[1fr_1.3fr] gap-4">
      <Panel className="flex flex-col justify-center">
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">{step.metricLabel}</p>
        <p className="font-display text-4xl font-extrabold mt-1" style={{ color: r.hex }}>
          <Counter to={step.progress} suffix="%" duration={1.2} />
        </p>
        <div className="mt-2"><Bar value={step.progress} color={r.hex} bg="rgba(255,255,255,.1)" /></div>
      </Panel>
      <Panel>
        <div className="grid sm:grid-cols-2 gap-2">
          {details.map((d, i) => (
            <motion.div key={d} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 text-[0.8rem] text-slate-300">
              <Check size={13} style={{ color: r.hex }} strokeWidth={3} />{d}
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ImpactStage() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {IMPACT.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}>
            <Panel>
              <p className="font-display text-2xl font-extrabold" style={{ color: '#6ee7b7' }}>
                <Counter to={m.value} decimals={m.value % 1 !== 0 ? 1 : 0} suffix={m.unit} />
              </p>
              <p className="text-[0.72rem] text-slate-400 font-semibold mt-0.5">{m.label}</p>
            </Panel>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="mt-4 rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(120deg,#05966955,#0891b255)', border: '1px solid rgba(255,255,255,.14)' }}>
        <p className="font-display font-bold text-lg">One citizen&apos;s problem became a district-level solution.</p>
        <p className="text-[0.84rem] text-slate-300 mt-1">
          Reported by a farmer · validated by government · built by students · funded by industry · owned by the community.
        </p>
      </motion.div>
    </div>
  );
}

/* ── Presentation mode: drives the real shared state ────────────────── */
function PresentationMode({ open, onClose }) {
  const { challenges, dispatch, runDemoScenario } = usePlatform();
  const nav = useNavigate();
  const [target, setTarget] = useState(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(null);

  const candidates = useMemo(
    () => challenges.filter((c) => c.validation.status === 'pending' || c.status === 'submitted' || c.status === 'ai_analysed'),
    [challenges],
  );
  const chosen = challenges.find((c) => c.id === target) ?? candidates[0];

  useEffect(() => () => stopRef.current?.(), []);

  const start = () => {
    if (!chosen) return;
    setRunning(true);
    setProgress(0);
    stopRef.current = runDemoScenario(chosen.id, (i, total) => {
      setProgress(Math.round((i / total) * 100));
      if (i === total) setRunning(false);
    });
  };

  const STEPS = ['AI analysis', 'Government validation', 'University accepts', 'Team formed', 'Proposal published', 'Industry joins', 'Prototype', 'Testing', 'Pilot', 'Deployment', 'Impact measured'];
  const doneCount = Math.round((progress / 100) * STEPS.length);

  return (
    <Modal open={open} onClose={onClose} accent="#4f46e5" width="max-w-2xl"
      title="Presentation mode" subtitle="Run one real challenge through the entire ecosystem — all four dashboards update live">
      <div className="space-y-4 text-slate-800">
        <div>
          <label className="label">Choose a challenge to drive</label>
          <select className="field" value={chosen?.id ?? ''} onChange={(e) => setTarget(e.target.value)} disabled={running}>
            {candidates.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}
          </select>
          {!candidates.length && <p className="text-[0.78rem] text-slate-500 mt-2">All challenges have already progressed. Reset the demo data to run again.</p>}
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.78rem] font-bold text-slate-600">Scenario progress</p>
            <p className="text-[0.78rem] font-bold text-indigo-600">{progress}%</p>
          </div>
          <Bar value={progress} color="#4f46e5" />
          <div className="grid sm:grid-cols-2 gap-1.5 mt-3">
            {STEPS.map((s, i) => (
              <div key={s} className={cx('flex items-center gap-2 text-[0.76rem] transition',
                i < doneCount ? 'text-emerald-600 font-semibold' : 'text-slate-400')}>
                {i < doneCount ? <Check size={12} strokeWidth={3} /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-between">
          <button className="btn btn-ghost" onClick={() => { dispatch({ type: 'RESET' }); setProgress(0); setRunning(false); }}>
            <RotateCcw size={14} />Reset demo data
          </button>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => nav('/government')}>Open Government view</button>
            <button className="btn btn-primary" onClick={start} disabled={running || !chosen}>
              <Zap size={15} />{running ? 'Running…' : 'Run full scenario'}
            </button>
          </div>
        </div>
        <p className="text-[0.74rem] text-slate-500">
          Tip: start the scenario, then switch between dashboards while it runs — every stage appears live in all four workspaces.
        </p>
      </div>
    </Modal>
  );
}
