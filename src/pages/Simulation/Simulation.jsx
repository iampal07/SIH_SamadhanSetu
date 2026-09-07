import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, SkipBack, RotateCcw, ArrowLeft, Zap, Check, Users,
  GraduationCap, Factory, Landmark, Sparkles, ArrowRight, Camera, Upload, Send,
  ShieldCheck, Wrench, FlaskConical, Rocket, TrendingUp, Brain,
} from 'lucide-react';
import { Logo } from '../../components/navigation/PublicNav';
import { Chip, Counter, Bar, ScoreRing, Modal } from '../../components/shared/ui';
import ShellControls from '../../components/shared/ShellControls';
import { usePlatform } from '../../context/PlatformContext';
import { useShell } from '../../context/AppShellContext';
import { ROLES } from '../../data/constants';
import { cx } from '../../utils/format';

/* ══════════════════════════════════════════════════════════════════════
   Scene script — 9 animated scenes, each: WHO → ACTION → RESULT → NEXT
   ══════════════════════════════════════════════════════════════════════ */
const SCENES = [
  {
    id: 1, key: 'citizen', actor: 'citizen', dur: 7000,
    who: 'Ramesh Mahto · Farmer, Barkagaon',
    action: 'Takes a photo of the dry handpump and reports it from his phone',
    result: 'Challenge CH-1042 created in under 2 minutes',
    next: 'The platform sends it straight to the AI engine',
  },
  {
    id: 2, key: 'ai', actor: 'ai', dur: 8000,
    who: 'SamadhanSetu AI Engine',
    action: 'Reads the report, classifies the domain, scores priority and searches past challenges',
    result: 'Water & Sanitation · Priority 87 HIGH · 3 similar challenges · 94% confidence',
    next: 'Structured problem DNA goes to the district officer',
  },
  {
    id: 3, key: 'govt', actor: 'govt', dur: 6500,
    who: 'District Innovation Cell, Hazaribagh',
    action: 'Reviews the analysed challenge and verifies it in the field',
    result: 'Validated ✓ — routed to the best-matched universities',
    next: 'AI ranks universities by research fit',
  },
  {
    id: 4, key: 'match', actor: 'varsity', dur: 7000,
    who: 'AI Solution Consortium',
    action: 'Ranks universities on research area, departments, faculty expertise and proximity',
    result: 'IIT (ISM) Dhanbad — 94% match, accepts the challenge',
    next: 'The university assembles a multidisciplinary team',
  },
  {
    id: 5, key: 'team', actor: 'varsity', dur: 7500,
    who: 'IIT (ISM) Dhanbad Innovation Cell',
    action: 'Combines four departments into one project team',
    result: 'Civil + Environmental Science + Computer Science + IoT — 5 members',
    next: 'The team publishes a proposal and asks for industry support',
  },
  {
    id: 6, key: 'industry', actor: 'industry', dur: 7000,
    who: 'AI Industry Matching',
    action: 'Scores partners on domain, technology, CSR focus and funding capacity',
    result: 'HydroSense joins — Technology + Mentorship + ₹18.5 L funding',
    next: 'Build begins',
  },
  {
    id: 7, key: 'prototype', actor: 'varsity', dur: 7000,
    who: 'Student team + Industry mentors',
    action: 'Idea → Design → Working prototype',
    result: 'Solar recharge unit with IoT flow sensors, built in 11 weeks',
    next: 'Field testing with the community that raised the problem',
  },
  {
    id: 8, key: 'pilot', actor: 'govt', dur: 7000,
    who: 'Community + Block Officer',
    action: 'Pilot runs in Barkagaon, feedback collected, solution iterated',
    result: 'Gram sabha approval · water quality certified · deployed to 3 hamlets',
    next: 'Impact is measured and verified',
  },
  {
    id: 9, key: 'impact', actor: 'citizen', dur: 9000,
    who: 'Verified social outcome',
    action: 'Beneficiaries, savings and sustainability are measured and reported back',
    result: '2,400 people · 42 lakh litres saved / year · 86/100 sustainability',
    next: 'Ramesh sees the outcome of the problem he reported',
  },
];

const ACTOR_RAIL = [
  { key: 'citizen', Icon: Users },
  { key: 'ai', Icon: Sparkles },
  { key: 'govt', Icon: Landmark },
  { key: 'varsity', Icon: GraduationCap },
  { key: 'industry', Icon: Factory },
];

/* ══════════════════════════════════════════════════════════════════════
   Reusable animated figures
   ══════════════════════════════════════════════════════════════════════ */
function Person({ x = 0, y = 0, color = '#06b6d4', skin = '#f2c69b', scale = 1, arm = 0, label, sub }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* shadow */}
      <ellipse cx="0" cy="62" rx="20" ry="4.5" fill="#0f172a" opacity="0.10" />
      {/* legs */}
      <rect x="-9" y="30" width="7.5" height="30" rx="3.5" fill="#334155" />
      <rect x="1.5" y="30" width="7.5" height="30" rx="3.5" fill="#334155" />
      {/* body */}
      <path d="M-13,-2 Q0,-8 13,-2 L15,32 L-15,32 Z" fill={color} />
      {/* arms */}
      <motion.rect x="-19" y="0" width="6.5" height="24" rx="3.2" fill={color}
        style={{ transformOrigin: '-16px 2px' }} animate={{ rotate: arm }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} />
      <motion.rect x="12.5" y="0" width="6.5" height="24" rx="3.2" fill={color}
        style={{ transformOrigin: '16px 2px' }} animate={{ rotate: -arm }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} />
      {/* head */}
      <circle cx="0" cy="-18" r="11.5" fill={skin} />
      <path d="M-11.5,-21 Q0,-33 11.5,-21 Q6,-27 0,-26 Q-6,-27 -11.5,-21 Z" fill="#1e293b" />
      <circle cx="-4" cy="-18" r="1.3" fill="#1e293b" />
      <circle cx="4" cy="-18" r="1.3" fill="#1e293b" />
      <path d="M-3.5,-13 Q0,-10.5 3.5,-13" stroke="#1e293b" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {label && (
        <>
          <text x="0" y="78" textAnchor="middle" style={{ fontSize: 11, fontWeight: 800, fill: 'currentColor' }}>{label}</text>
          {sub && <text x="0" y="90" textAnchor="middle" style={{ fontSize: 8.5, fontWeight: 600, fill: 'currentColor', opacity: 0.55 }}>{sub}</text>}
        </>
      )}
    </g>
  );
}

function Building({ x = 0, y = 0, color = '#6366f1', kind = 'university', label, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse cx="0" cy="52" rx="42" ry="5" fill="#0f172a" opacity="0.10" />
      {kind === 'university' && (
        <>
          <rect x="-38" y="-4" width="76" height="56" rx="4" fill={color} />
          <path d="M-46,-4 L0,-34 L46,-4 Z" fill={color} opacity="0.85" />
          <rect x="-4" y="-30" width="8" height="10" rx="2" fill="#fff" opacity="0.9" />
          {[-26, -9, 8, 25].map((cx0) => (
            <rect key={cx0} x={cx0} y="10" width="12" height="18" rx="2" fill="#fff" opacity="0.55" />
          ))}
        </>
      )}
      {kind === 'govt' && (
        <>
          <rect x="-40" y="6" width="80" height="46" rx="3" fill={color} />
          <path d="M-46,6 L0,-26 L46,6 Z" fill={color} opacity="0.88" />
          {[-30, -15, 0, 15, 30].map((cx0) => (
            <rect key={cx0} x={cx0 - 4} y="14" width="8" height="30" rx="2" fill="#fff" opacity="0.5" />
          ))}
          <circle cx="0" cy="-30" r="4" fill="#fbbf24" />
        </>
      )}
      {kind === 'industry' && (
        <>
          <rect x="-40" y="8" width="80" height="44" rx="3" fill={color} />
          <path d="M-40,8 L-14,-8 L-14,8 L10,-8 L10,8 L34,-8 L34,8 Z" fill={color} opacity="0.9" />
          <rect x="20" y="-30" width="10" height="26" rx="2" fill={color} opacity="0.75" />
          {[-30, -12, 6, 24].map((cx0) => (
            <rect key={cx0} x={cx0} y="20" width="11" height="14" rx="2" fill="#fff" opacity="0.5" />
          ))}
        </>
      )}
      {label && <text x="0" y="70" textAnchor="middle" style={{ fontSize: 11, fontWeight: 800, fill: 'currentColor' }}>{label}</text>}
    </g>
  );
}

function Phone({ x = 0, y = 0, stage = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
        <rect x="-26" y="-46" width="52" height="92" rx="9" fill="#1e293b" />
        <rect x="-22" y="-42" width="44" height="84" rx="6" fill="#f8fafc" />
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.g key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <rect x="-22" y="-42" width="44" height="84" rx="6" fill="#0f172a" />
              <rect x="-18" y="-30" width="36" height="28" rx="3" fill="#38bdf8" opacity="0.35" />
              <circle cx="0" cy="-16" r="7" fill="none" stroke="#fff" strokeWidth="1.4" />
              <motion.circle cx="0" cy="22" r="7" fill="#fff"
                animate={{ scale: [1, 0.82, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
              <text x="0" y="6" textAnchor="middle" style={{ fontSize: 6, fill: '#fff', fontWeight: 700 }}>CAPTURE</text>
            </motion.g>
          )}
          {stage === 1 && (
            <motion.g key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <rect x="-17" y="-34" width="34" height="22" rx="3" fill="#bae6fd" />
              <path d="M-17,-16 L-8,-25 L-1,-19 L6,-27 L17,-16 Z" fill="#0ea5e9" />
              <circle cx="8" cy="-29" r="3" fill="#fbbf24" />
              <rect x="-17" y="-7" width="34" height="3.4" rx="1.7" fill="#cbd5e1" />
              <rect x="-17" y="-0.5" width="26" height="3.4" rx="1.7" fill="#cbd5e1" />
              <rect x="-17" y="6" width="30" height="3.4" rx="1.7" fill="#cbd5e1" />
              <motion.rect x="-17" y="16" width="34" height="12" rx="4" fill="#06b6d4"
                animate={{ opacity: [0.65, 1, 0.65] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <text x="0" y="24.5" textAnchor="middle" style={{ fontSize: 6, fill: '#fff', fontWeight: 800 }}>REPORT</text>
            </motion.g>
          )}
          {stage >= 2 && (
            <motion.g key="ok" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}>
              <circle cx="0" cy="-8" r="14" fill="#10b981" />
              <path d="M-6,-8 L-2,-3 L6.5,-13" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x="0" y="18" textAnchor="middle" style={{ fontSize: 6.4, fill: '#0f172a', fontWeight: 800 }}>CH-1042</text>
              <text x="0" y="28" textAnchor="middle" style={{ fontSize: 5.4, fill: '#64748b', fontWeight: 600 }}>Submitted</text>
            </motion.g>
          )}
        </AnimatePresence>
      </motion.g>
    </g>
  );
}

/** A data packet flying between two points along an arc. */
function Packet({ from, to, delay = 0, color = '#8b5cf6', label, repeat = Infinity }) {
  const mx = (from[0] + to[0]) / 2;
  const my = Math.min(from[1], to[1]) - 60;
  return (
    <>
      <path d={`M${from[0]},${from[1]} Q${mx},${my} ${to[0]},${to[1]}`} fill="none"
        stroke={color} strokeWidth="1.6" strokeDasharray="5 6" opacity="0.35" />
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['0%', '100%'] }}
        transition={{ duration: 2.1, delay, repeat, repeatDelay: 0.6, ease: 'easeInOut' }}
        style={{ offsetPath: `path("M${from[0]},${from[1]} Q${mx},${my} ${to[0]},${to[1]}")`, offsetRotate: '0deg' }}
      >
        <rect x="-15" y="-9" width="30" height="18" rx="5" fill={color} />
        <text x="0" y="4" textAnchor="middle" style={{ fontSize: 8, fill: '#fff', fontWeight: 800 }}>{label ?? '⬤'}</text>
      </motion.g>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Scene stages
   ══════════════════════════════════════════════════════════════════════ */

/** CSS-transition based reveal — reliable even when JS animation frames are throttled. */
const reveal = (on, { y = 10, x = 0, scale = 1, delay = 0 } = {}) => ({
  opacity: on ? 1 : 0,
  transform: on ? 'translate(0,0) scale(1)' : `translate(${x}px, ${y}px) scale(${scale})`,
  transition: `opacity .45s cubic-bezier(.22,1,.36,1) ${delay}s, transform .5s cubic-bezier(.22,1,.36,1) ${delay}s`,
});

const STAGE_VB = '0 0 900 330';

function useBeat(steps, active, interval = 1500) {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    setBeat(0);
    if (!active) return undefined;
    const id = setInterval(() => setBeat((b) => (b >= steps - 1 ? b : b + 1)), interval);
    return () => clearInterval(id);
  }, [steps, active, interval]);
  return beat;
}

function SceneCitizen({ playing }) {
  const beat = useBeat(4, playing, 1500);
  const captions = ['Sees the problem', 'Takes a photo', 'Fills the report', 'Submitted'];
  return (
    <svg viewBox={STAGE_VB} className="w-full h-full text-slate-700">
      <HandpumpScene x={170} y={188} broken />
      <Person x={400} y={150} color={ROLES.citizen.hex} arm={beat >= 1 ? -68 : 0} label="Ramesh Mahto" sub="Barkagaon, Hazaribagh" />
      <g style={{ opacity: beat >= 1 ? 1 : 0, transition: 'opacity .4s ease' }}>
        <Phone x={492} y={132} stage={Math.max(0, beat - 1)} scale={0.95} />
      </g>
      {beat >= 3 && (
        <g>
          <Packet from={[520, 110]} to={[790, 150]} color={ROLES.citizen.hex} label="CH" repeat={Infinity} />
          <g transform="translate(790,160)">
            <rect x="-52" y="-30" width="104" height="60" rx="12" fill={ROLES.varsity.hex} opacity="0.14" />
            <text x="0" y="-4" textAnchor="middle" style={{ fontSize: 12, fontWeight: 800, fill: 'currentColor' }}>Samadhan</text>
            <text x="0" y="12" textAnchor="middle" style={{ fontSize: 12, fontWeight: 800, fill: 'currentColor' }}>Setu</text>
          </g>
        </g>
      )}
      <SceneCaption text={captions[beat]} />
    </svg>
  );
}

function HandpumpScene({ x, y, broken }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="46" rx="58" ry="9" fill="#0f172a" opacity="0.07" />
      <rect x="-30" y="30" width="60" height="14" rx="4" fill="#94a3b8" />
      <rect x="-6" y="-52" width="12" height="84" rx="3" fill="#64748b" />
      <path d="M6,-46 L34,-40 L34,-30 L6,-36 Z" fill="#475569" />
      <path d="M-6,-30 L-30,-22 L-30,-12 L-6,-20 Z" fill="#475569" />
      {broken && (
        <>
          <motion.g animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
            <circle cx="46" cy="-58" r="15" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.6" />
            <text x="46" y="-53" textAnchor="middle" style={{ fontSize: 15, fontWeight: 900, fill: '#ef4444' }}>!</text>
          </motion.g>
          <text x="0" y="66" textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: '#ef4444' }}>No water · 4 months</text>
        </>
      )}
      {!broken && (
        <>
          <motion.path d="M-30,-14 q-4,14 -2,26" stroke="#38bdf8" strokeWidth="3.4" fill="none" strokeLinecap="round"
            animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.1, repeat: Infinity }} />
          <text x="0" y="66" textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: '#10b981' }}>Water restored</text>
        </>
      )}
    </g>
  );
}

function SceneAI({ playing }) {
  const beat = useBeat(5, playing, 1450);
  const outs = [
    { label: 'Category', value: 'Water & Sanitation', color: '#06b6d4' },
    { label: 'Priority', value: '87 / 100 · HIGH', color: '#f59e0b' },
    { label: 'Location', value: 'Barkagaon, Hazaribagh', color: '#8b5cf6' },
    { label: 'Similar problems', value: '3 found (92%, 84%, 76%)', color: '#ec4899' },
  ];
  return (
    <div className="w-full h-full grid md:grid-cols-[1.05fr_1fr] gap-4 items-center">
      <svg viewBox="0 0 420 300" className="w-full h-full text-slate-700">
        <defs>
          <radialGradient id="aiglow"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx="210" cy="140" r="120" fill="url(#aiglow)" />
        {[86, 104, 122].map((r, i) => (
          <motion.circle key={r} cx="210" cy="140" r={r} fill="none" stroke="#a78bfa" strokeWidth="1" strokeDasharray="4 6"
            animate={{ rotate: i % 2 ? -360 : 360 }} transition={{ duration: 22 + i * 6, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '210px 140px' }} opacity={0.5} />
        ))}
        {/* incoming report */}
        <motion.g animate={{ x: beat >= 1 ? 120 : 0, opacity: beat >= 2 ? 0 : 1, scale: beat >= 1 ? 0.7 : 1 }}
          transition={{ duration: 0.9 }} style={{ transformOrigin: '46px 140px' }}>
          <rect x="10" y="108" width="72" height="64" rx="8" fill="#fff" stroke="#cbd5e1" />
          <rect x="20" y="118" width="52" height="6" rx="3" fill="#94a3b8" />
          <rect x="20" y="130" width="40" height="5" rx="2.5" fill="#cbd5e1" />
          <rect x="20" y="140" width="46" height="5" rx="2.5" fill="#cbd5e1" />
          <rect x="20" y="150" width="34" height="5" rx="2.5" fill="#cbd5e1" />
        </motion.g>
        {/* AI core */}
        <motion.g animate={{ scale: beat >= 2 && beat < 4 ? [1, 1.06, 1] : 1 }} transition={{ duration: 1, repeat: beat >= 2 && beat < 4 ? Infinity : 0 }}
          style={{ transformOrigin: '210px 140px' }}>
          <rect x="164" y="94" width="92" height="92" rx="26" fill="#6d28d9" />
          <g transform="translate(210,140)" fill="#fff">
            <circle cx="0" cy="-14" r="4.6" /><circle cx="-15" cy="4" r="4.6" /><circle cx="15" cy="4" r="4.6" /><circle cx="0" cy="20" r="4.6" />
            <path d="M0,-14 L-15,4 M0,-14 L15,4 M-15,4 L0,20 M15,4 L0,20 M-15,4 L15,4" stroke="#fff" strokeWidth="1.7" />
          </g>
          <text x="210" y="205" textAnchor="middle" style={{ fontSize: 12, fontWeight: 800, fill: 'currentColor' }}>AI Engine</text>
        </motion.g>
        {/* neurons firing */}
        {beat >= 2 && [0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <motion.circle key={i} cx={210 + Math.cos(a) * 86} cy={140 + Math.sin(a) * 86} r="4" fill="#c4b5fd"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }} />
          );
        })}
      </svg>

      <div className="space-y-2.5">
        <p className="text-[0.68rem] font-bold uppercase tracking-widest opacity-60">Problem DNA extracted</p>
        {outs.map((o, i) => (
          <div key={o.label}
            className="rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3"
            style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', ...reveal(beat >= i + 1, { x: 18, y: 0 }) }}>
            <span className="text-[0.74rem] opacity-70">{o.label}</span>
            <span className="text-[0.82rem] font-bold" style={{ color: o.color }}>{o.value}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1" style={reveal(beat >= 4, { y: 6 })}>
          <ScoreRing value={94} size={56} stroke={5} color="#a78bfa" />
          <div>
            <p className="text-[0.8rem] font-bold">Confidence</p>
            <p className="text-[0.7rem] opacity-60">Impact & feasibility score computed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneGovt({ playing }) {
  const beat = useBeat(4, playing, 1500);
  const rows = ['Field verification by block officer', 'Cross-checked against 3 similar reports', 'Routed to Drinking Water & Sanitation', 'Priority confirmed HIGH · 87/100'];
  return (
    <div className="w-full h-full grid md:grid-cols-[1fr_1fr] gap-4 items-center">
      <svg viewBox="0 0 420 300" className="w-full h-full text-slate-700">
        <Building x={140} y={130} color={ROLES.govt.hex} kind="govt" label="District Innovation Cell" scale={1} />
        <Person x={300} y={128} color="#0f766e" arm={beat >= 2 ? -50 : -10} label="Nodal Officer" sub="Hazaribagh" />
        {beat >= 1 && <Packet from={[40, 60]} to={[300, 96]} color={ROLES.citizen.hex} label="CH" repeat={1} />}
        {beat >= 3 && (
          <g style={{ transformOrigin: '340px 60px', ...reveal(true, { y: 0, scale: 0.6 }) }}>
            <circle cx="340" cy="60" r="30" fill={ROLES.govt.hex} />
            <path d="M328,60 l8,9 l17,-19" stroke="#fff" strokeWidth="4.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="340" y="106" textAnchor="middle" style={{ fontSize: 12, fontWeight: 800, fill: ROLES.govt.hex }}>VALIDATED</text>
          </g>
        )}
      </svg>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r} className="flex items-center gap-2.5 text-[0.82rem]" style={reveal(beat >= i, { x: 16, y: 0 })}>
            <span className="w-5 h-5 rounded-full grid place-items-center shrink-0" style={{ background: ROLES.govt.hex }}>
              <Check size={12} color="#fff" strokeWidth={3.5} />
            </span>
            <span className="opacity-85">{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const UNI_MATCHES = [
  { name: 'IIT (ISM) Dhanbad', score: 94, why: 'Groundwater modelling · IoT sensor networks · Environmental Engg.' },
  { name: 'Birsa Agricultural University', score: 87, why: 'Micro-irrigation · Soil & water conservation' },
  { name: 'BIT Mesra', score: 81, why: 'Embedded systems · Remote sensing · AI for social good' },
];

function SceneMatch({ playing }) {
  const beat = useBeat(4, playing, 1450);
  return (
    <div className="w-full h-full grid md:grid-cols-[0.9fr_1.1fr] gap-5 items-center">
      <svg viewBox="0 0 360 300" className="w-full h-full text-slate-700">
        <Building x={180} y={110} color={ROLES.varsity.hex} kind="university" label="IIT (ISM) Dhanbad" />
        {beat >= 1 && <Packet from={[20, 40]} to={[180, 70]} color={ROLES.govt.hex} label="✓" repeat={1} />}
        {beat >= 3 && (
          <g style={reveal(true, { y: 8 })}>
            <rect x="112" y="216" width="136" height="30" rx="15" fill={ROLES.varsity.hex} />
            <text x="180" y="236" textAnchor="middle" style={{ fontSize: 12, fontWeight: 800, fill: '#fff' }}>CHALLENGE ACCEPTED</text>
          </g>
        )}
      </svg>
      <div className="space-y-2.5">
        <p className="text-[0.68rem] font-bold uppercase tracking-widest opacity-60">AI Solution Consortium · university fit</p>
        {UNI_MATCHES.map((m, i) => (
          <div key={m.name}
            className="rounded-2xl px-3.5 py-2.5 flex items-center gap-3.5"
            style={{ background: 'rgba(255,255,255,.07)', border: `1px solid ${i === 0 && beat >= 3 ? ROLES.varsity.hex : 'rgba(255,255,255,.12)'}`, ...reveal(beat >= i, { x: 22, y: 0 }) }}>
            <ScoreRing value={m.score} size={52} stroke={5} color={ROLES.varsity.hex} />
            <div className="min-w-0">
              <p className="font-display font-bold text-[0.88rem] flex items-center gap-2">
                {m.name}
                {i === 0 && <span className="chip" style={{ background: `${ROLES.varsity.hex}33` }}>Best match</span>}
              </p>
              <p className="text-[0.72rem] opacity-60">{m.why}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DISCIPLINES = [
  { name: 'Civil Engineering', color: '#6366f1', x: 90 },
  { name: 'Environmental Science', color: '#10b981', x: 250 },
  { name: 'Computer Science', color: '#06b6d4', x: 410 },
  { name: 'IoT / Electronics', color: '#f59e0b', x: 570 },
];

function SceneTeam({ playing }) {
  const beat = useBeat(6, playing, 1200);
  return (
    <svg viewBox="0 0 660 330" className="w-full h-full text-slate-700">
      {DISCIPLINES.map((d, i) => {
        const shown = beat >= i + 1;
        return (
          <g key={d.name}
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? 'translate(0px, 0px)' : 'translate(0px, -22px)',
              transition: 'opacity .5s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1)',
            }}>
            <Person x={d.x} y={80} color={d.color} scale={0.82} />
            <text x={d.x} y={172} textAnchor="middle" style={{ fontSize: 10.5, fontWeight: 700, fill: 'currentColor' }}>{d.name}</text>
          </g>
        );
      })}
      {DISCIPLINES.map((d) => (
        <path key={`l-${d.name}`} d={`M${d.x},190 Q${d.x},240 330,266`} fill="none" stroke={d.color} strokeWidth="2"
          strokeDasharray="4 5" style={{ opacity: beat >= 4 ? 0.6 : 0, transition: 'opacity .5s ease' }} />
      ))}
      <g style={{ transformOrigin: '330px 282px', opacity: beat >= 5 ? 1 : 0, transform: beat >= 5 ? 'scale(1)' : 'scale(0.7)', transition: 'opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)' }}>
        <rect x="196" y="266" width="268" height="38" rx="19" fill={ROLES.varsity.hex} />
        <text x="330" y="291" textAnchor="middle" style={{ fontSize: 13, fontWeight: 800, fill: '#fff' }}>
          MULTIDISCIPLINARY TEAM · 5 MEMBERS
        </text>
      </g>
      <SceneCaption text={beat >= 5 ? 'One team, four disciplines' : 'Assembling the team…'} y={26} />
    </svg>
  );
}

function SceneIndustry({ playing }) {
  const beat = useBeat(5, playing, 1300);
  const offers = [
    { label: 'Technology', color: '#f59e0b', icon: '⚙' },
    { label: 'Mentorship', color: '#06b6d4', icon: '★' },
    { label: '₹18.5 L Funding', color: '#10b981', icon: '₹' },
  ];
  return (
    <svg viewBox="0 0 780 330" className="w-full h-full text-slate-700">
      <Building x={130} y={110} color={ROLES.industry.hex} kind="industry" label="HydroSense Technologies" />
      <Building x={640} y={110} color={ROLES.varsity.hex} kind="university" label="IIT (ISM) Team" />
      {offers.map((o, i) => {
        const shown = beat >= i + 1;
        return (
          <g key={o.label} style={{
            opacity: shown ? 1 : 0,
            transform: shown ? 'translateX(190px)' : 'translateX(0px)',
            transition: 'opacity .5s ease, transform 1.6s cubic-bezier(.4,0,.2,1)',
          }}>
            <rect x={172} y={70 + i * 46} width="112" height="30" rx="15" fill={o.color} />
            <text x={228} y={90 + i * 46} textAnchor="middle" style={{ fontSize: 11, fontWeight: 800, fill: '#fff' }}>
              {o.icon} {o.label}
            </text>
          </g>
        );
      })}
      <g style={{ opacity: beat >= 4 ? 1 : 0, transition: 'opacity .5s ease' }}>
        <rect x="272" y="252" width="236" height="38" rx="19" fill="#0f766e" />
        <text x="390" y="277" textAnchor="middle" style={{ fontSize: 12.5, fontWeight: 800, fill: '#fff' }}>PARTNERSHIP CONFIRMED</text>
      </g>
      <SceneCaption text="AI matched on domain + technology + CSR focus + funding" y={26} />
    </svg>
  );
}

function ScenePrototype({ playing }) {
  const beat = useBeat(4, playing, 1500);
  const steps = ['Idea', 'Design', 'Prototype'];
  return (
    <svg viewBox="0 0 760 330" className="w-full h-full text-slate-700">
      <Person x={90} y={130} color={ROLES.varsity.hex} scale={0.85} arm={beat >= 1 ? -40 : 0} label="Student team" />
      {steps.map((s, i) => (
        <g key={s} style={{ opacity: beat >= i + 1 ? 1 : 0.22, transition: 'opacity .5s ease' }}>
          <rect x={220 + i * 175} y="92" width="140" height="106" rx="16"
            fill={i <= beat - 1 ? ROLES.varsity.hex : '#94a3b8'} opacity={i <= beat - 1 ? 0.16 : 0.1}
            stroke={i <= beat - 1 ? ROLES.varsity.hex : '#cbd5e1'} strokeWidth="1.6" />
          <g transform={`translate(${290 + i * 175},134)`}>
            {i === 0 && <><circle r="17" fill="#fbbf24" opacity="0.85" /><path d="M-5,6 h10 M-4,11 h8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></>}
            {i === 1 && <><rect x="-19" y="-14" width="38" height="28" rx="3" fill="#38bdf8" opacity="0.85" /><path d="M-12,-6 h24 M-12,2 h16" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></>}
            {i === 2 && (
              <>
                <rect x="-18" y="-6" width="36" height="20" rx="4" fill="#10b981" />
                <rect x="-6" y="-20" width="12" height="14" rx="3" fill="#0ea5e9" />
                <motion.circle cx="0" cy="-26" r="3.6" fill="#fbbf24"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.1, repeat: Infinity }} />
              </>
            )}
          </g>
          <text x={290 + i * 175} y="182" textAnchor="middle" style={{ fontSize: 12, fontWeight: 800, fill: 'currentColor' }}>{s}</text>
          {i < 2 && (
            <path d={`M${365 + i * 175},145 h34`} stroke={ROLES.varsity.hex} strokeWidth="2.4" strokeLinecap="round"
              style={{ opacity: beat >= i + 2 ? 1 : 0, transition: 'opacity .4s ease' }} />
          )}
        </g>
      ))}
      <g transform="translate(380,250)">
        <rect x="-190" y="-14" width="380" height="26" rx="13" fill="#94a3b8" opacity="0.18" />
        <rect x="-190" y="-14" height="26" rx="13" fill={ROLES.varsity.hex}
          width={(beat / 3) * 380} style={{ transition: 'width .8s cubic-bezier(.22,1,.36,1)' }} />
        <text x="0" y="4" textAnchor="middle" style={{ fontSize: 11.5, fontWeight: 800, fill: '#fff' }}>
          {Math.round((beat / 3) * 100)}% · Solar recharge unit + IoT flow sensors
        </text>
      </g>
    </svg>
  );
}

function ScenePilot({ playing }) {
  const beat = useBeat(4, playing, 1500);
  return (
    <svg viewBox="0 0 760 330" className="w-full h-full text-slate-700">
      <HandpumpScene x={140} y={170} broken={beat < 3} />
      <Person x={330} y={140} color={ROLES.varsity.hex} scale={0.78} arm={beat >= 1 ? -30 : 0} label="Team" />
      <Person x={430} y={140} color={ROLES.citizen.hex} scale={0.78} arm={beat >= 2 ? -55 : 0} label="Community" />
      <Person x={530} y={140} color={ROLES.govt.hex} scale={0.78} arm={beat >= 3 ? -55 : 0} label="Block Officer" />
      {[['Pilot running', 1], ['Community feedback', 2], ['Approved & deployed', 3]].map(([label, at], i) => (
        <g key={label} style={{ opacity: beat >= at ? 1 : 0, transition: 'opacity .45s ease' }}>
          <rect x={608} y={70 + i * 52} width="132" height="36" rx="10"
            fill={i === 2 ? ROLES.govt.hex : '#64748b'} opacity={i === 2 ? 1 : 0.22} />
          <text x={674} y={93 + i * 52} textAnchor="middle"
            style={{ fontSize: 11, fontWeight: 800, fill: i === 2 ? '#fff' : 'currentColor' }}>{label}</text>
        </g>
      ))}
      <SceneCaption text={beat >= 3 ? 'Deployed across 3 hamlets · 480 households' : 'Field pilot in Barkagaon'} y={26} />
    </svg>
  );
}

const IMPACT_METRICS = [
  { label: 'People benefited', value: 2400, unit: '' },
  { label: 'Water saved / year', value: 4200000, unit: ' L' },
  { label: 'Walking distance cut', value: 2.8, unit: ' km/day' },
  { label: 'Illness reduction', value: 64, unit: '%' },
  { label: 'Project duration', value: 9, unit: ' months' },
  { label: 'Sustainability', value: 86, unit: '/100' },
];

function SceneImpact({ playing }) {
  const beat = useBeat(3, playing, 1600);
  return (
    <div className="w-full h-full flex flex-col justify-center gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {IMPACT_METRICS.map((m, i) => (
          <motion.div key={m.label} initial={{ y: 18 }} animate={{ y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.45 }}
            className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)' }}>
            <p className="font-display text-2xl font-extrabold" style={{ color: '#6ee7b7' }}>
              <Counter to={m.value} decimals={m.value % 1 !== 0 ? 1 : 0} suffix={m.unit} />
            </p>
            <p className="text-[0.72rem] font-semibold opacity-60 mt-0.5">{m.label}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ y: 12 }} animate={{ y: 0 }} transition={{ delay: 0.8 }}
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'linear-gradient(120deg,#05966955,#0891b255)', border: '1px solid rgba(255,255,255,.14)' }}>
        <svg viewBox="0 0 120 100" className="w-24 h-20 shrink-0 text-white">
          <Person x={60} y={30} color={ROLES.citizen.hex} scale={0.62} arm={-70} />
        </svg>
        <div>
          <p className="font-display font-bold text-lg">Impact verified and reported back to Ramesh.</p>
          <p className="text-[0.84rem] opacity-80 mt-0.5">
            Reported by a farmer · validated by government · built by students · funded by industry · owned by the community.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function SceneCaption({ text, y = 306 }) {
  return (
    <motion.text key={text} x="50%" y={y} textAnchor="middle"
      initial={{ opacity: 0, y: y + 6 }} animate={{ opacity: 0.75, y }}
      style={{ fontSize: 13, fontWeight: 700, fill: 'currentColor' }}>
      {text}
    </motion.text>
  );
}

const SCENE_VIEWS = {
  1: SceneCitizen, 2: SceneAI, 3: SceneGovt, 4: SceneMatch, 5: SceneTeam,
  6: SceneIndustry, 7: ScenePrototype, 8: ScenePilot, 9: SceneImpact,
};

/* ══════════════════════════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════════════════════════ */
export default function Simulation() {
  const { t } = useShell();
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef(null);
  const raf = useRef(null);

  const scene = SCENES[idx];
  const View = SCENE_VIEWS[scene.id];
  const role = ROLES[scene.actor];

  useEffect(() => {
    clearTimeout(timer.current);
    cancelAnimationFrame(raf.current);
    setProgress(0);
    if (!playing) return undefined;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / scene.dur);
      setProgress(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    timer.current = setTimeout(() => {
      setIdx((i) => {
        if (i >= SCENES.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, scene.dur);
    return () => { clearTimeout(timer.current); cancelAnimationFrame(raf.current); };
  }, [playing, idx, scene.dur]);

  const go = useCallback((n) => {
    setIdx(Math.max(0, Math.min(SCENES.length - 1, n)));
  }, []);

  const start = () => { setStarted(true); setIdx(0); setPlaying(true); };
  const restart = () => { setIdx(0); setPlaying(false); setProgress(0); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(idx + 1);
      if (e.key === 'ArrowLeft') go(idx - 1);
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, go]);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#060a14', color: '#e2e8f0' }}>
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(at 12% 8%, #4f46e5 0px, transparent 42%), radial-gradient(at 88% 22%, #0891b2 0px, transparent 40%), radial-gradient(at 52% 96%, #059669 0px, transparent 45%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '52px 52px' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-5 min-h-screen flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/" className="btn btn-sm text-white border-white/15" style={{ background: 'rgba(255,255,255,.1)' }}>
              <ArrowLeft size={14} />{t('nav.home')}
            </Link>
            <div className="hidden sm:block"><Logo dark /></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><ShellControls compact /></div>
            <Chip color="#a5b4fc" bg="rgba(255,255,255,.1)">{t('sim.badge')}</Chip>
            <button className="btn btn-sm bg-white text-slate-900 hover:bg-white/90" onClick={() => setDemoOpen(true)}>
              <Zap size={13} />{t('sim.presentation')}
            </button>
          </div>
        </div>

        {/* actor rail */}
        <div className="flex justify-center gap-2 sm:gap-5 mt-6">
          {ACTOR_RAIL.map((a) => {
            const r = ROLES[a.key];
            const on = scene.actor === a.key || (a.key === 'ai' && scene.key === 'match');
            return (
              <motion.div key={a.key} className="flex flex-col items-center gap-1.5"
                animate={{ scale: on ? 1.1 : 1, opacity: on ? 1 : 0.35 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                <div className="relative">
                  {on && <span className="absolute inset-0 rounded-2xl anim-ring" style={{ background: `${r.hex}77` }} />}
                  <div className="w-11 h-11 rounded-2xl grid place-items-center relative"
                    style={{ background: on ? `linear-gradient(135deg,${r.hex},${r.deep})` : 'rgba(255,255,255,.08)', boxShadow: on ? `0 14px 30px -12px ${r.hex}` : 'none' }}>
                    <a.Icon size={19} />
                  </div>
                </div>
                <span className="text-[0.6rem] sm:text-[0.68rem] font-bold">{t(`role.${a.key}`)}</span>
              </motion.div>
            );
          })}
        </div>

        {/* scene timeline */}
        <div className="flex items-center gap-1 mt-5">
          {SCENES.map((s, i) => (
            <button key={s.id} onClick={() => go(i)} className="flex-1 group" title={`${t('sim.scene')} ${s.id}`}>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.12)' }}>
                <motion.div className="h-full rounded-full" style={{ background: ROLES[s.actor].hex }}
                  animate={{ width: i < idx ? '100%' : i === idx ? `${Math.max(playing ? progress * 100 : 100, 8)}%` : '0%' }}
                  transition={{ duration: playing ? 0.1 : 0.4, ease: 'linear' }} />
              </div>
              <p className="text-[0.55rem] font-bold mt-1 text-center opacity-40 group-hover:opacity-80 transition hidden md:block">
                {String(s.id).padStart(2, '0')}
              </p>
            </button>
          ))}
        </div>

        {/* stage */}
        <div className="flex-1 mt-4 relative">
          {!started ? (
            <motion.div key="intro" initial={{ scale: 0.99 }} animate={{ scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5">
                <motion.h1 initial={{ y: 16 }} animate={{ y: 0 }}
                  className="font-display text-3xl sm:text-5xl font-extrabold max-w-3xl leading-[1.1]">
                  {t('sim.title')}
                </motion.h1>
                <p className="opacity-70 max-w-xl text-[0.95rem]">{t('sim.sub')}</p>
                <motion.button
                  initial={{ y: 10 }} animate={{ y: 0 }} transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={start}
                  className="btn px-7 py-4 text-base font-bold text-white"
                  style={{ background: 'linear-gradient(120deg,#4f46e5,#06b6d4)', boxShadow: '0 22px 50px -18px #4f46e5' }}>
                  <Play size={20} />{t('sim.start')}
                </motion.button>
                <p className="text-[0.72rem] opacity-40">{t('sim.intro.hint', '9 scenes · ~70 seconds · space / arrow keys work too')}</p>
            </motion.div>
          ) : (
            <div key={scene.id} className="scene-enter rounded-3xl p-4 sm:p-6 relative overflow-hidden h-full flex flex-col"
                style={{ background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.12)', backdropFilter: 'blur(14px)' }}>
                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl" style={{ background: `${role.hex}44` }} />

                {/* who / action */}
                <div className="relative flex items-start gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-2xl grid place-items-center font-display font-extrabold shrink-0 text-white"
                    style={{ background: `linear-gradient(135deg,${role.hex},${role.deep})`, boxShadow: `0 16px 34px -14px ${role.hex}` }}>
                    {String(scene.id).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="chip" style={{ background: `${role.hex}30`, color: '#fff' }}>{t(`role.${scene.actor}`)}</span>
                      <span className="text-[0.74rem] font-semibold opacity-60">{t(`sim.${scene.id}.who`, scene.who)}</span>
                    </div>
                    <h2 className="font-display text-lg sm:text-2xl font-extrabold mt-1 leading-tight">{t(`sim.${scene.id}.action`, scene.action)}</h2>
                  </div>
                </div>

                {/* animated stage */}
                <div className="relative flex-1 min-h-[240px] sm:min-h-[300px] mt-3">
                  <View playing={playing} />
                </div>

                {/* result / next */}
                <div className="relative grid sm:grid-cols-[1.5fr_1fr] gap-2.5 mt-3">
                  <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ delay: 0.5 }}
                    className="rounded-2xl px-4 py-2.5" style={{ background: `${role.hex}22`, border: `1px solid ${role.hex}55` }}>
                    <p className="text-[0.62rem] font-bold uppercase tracking-widest opacity-60">{t('sim.result', 'Result')}</p>
                    <p className="text-[0.88rem] font-bold">{t(`sim.${scene.id}.result`, scene.result)}</p>
                  </motion.div>
                  <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ delay: 0.65 }}
                    className="rounded-2xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' }}>
                    <p className="text-[0.62rem] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
                      {t('sim.next', 'Next')} <ArrowRight size={10} />
                    </p>
                    <p className="text-[0.8rem] opacity-85">{t(`sim.${scene.id}.next`, scene.next)}</p>
                  </motion.div>
                </div>
            </div>
          )}
        </div>

        {/* controls */}
        {started && (
          <motion.div initial={{ y: 14 }} animate={{ y: 0 }} className="mt-4 mb-2">
            <div className="mx-auto max-w-2xl rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: 'rgba(255,255,255,.09)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,.14)' }}>
              <div className="text-[0.72rem] font-bold opacity-70 shrink-0">
                {t('sim.step')} {String(idx + 1).padStart(2, '0')} <span className="opacity-50">/ {SCENES.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-sm text-white border-white/15" style={{ background: 'rgba(255,255,255,.1)' }}
                  onClick={() => go(idx - 1)} disabled={idx === 0} title={t('common.previous')}><SkipBack size={14} /></button>
                <button className="btn btn-sm px-4 bg-white text-slate-900 hover:bg-white/90" onClick={() => setPlaying((p) => !p)}>
                  {playing ? <><Pause size={14} />{t('common.pause')}</> : <><Play size={14} />{idx === SCENES.length - 1 ? t('common.replay') : t('common.play')}</>}
                </button>
                <button className="btn btn-sm text-white border-white/15" style={{ background: 'rgba(255,255,255,.1)' }}
                  onClick={() => go(idx + 1)} disabled={idx === SCENES.length - 1} title={t('common.next')}><SkipForward size={14} /></button>
                <button className="btn btn-sm text-white border-white/15" style={{ background: 'rgba(255,255,255,.1)' }}
                  onClick={restart} title={t('common.restart')}><RotateCcw size={14} /></button>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="opacity-50 text-[0.82rem]">{t('sim.footer')}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2.5">
                {[['/citizen', 'citizen'], ['/government', 'govt'], ['/university', 'varsity'], ['/industry', 'industry']].map(([to, key]) => (
                  <Link key={to} to={to} className="btn btn-sm text-white border-white/15" style={{ background: `${ROLES[key].hex}33` }}>
                    {t(`role.${key}`)} <ArrowRight size={13} />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <PresentationMode open={demoOpen} onClose={() => setDemoOpen(false)} />
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

  const STEPS = ['AI analysis', 'Government validation', 'University accepts', 'Team formed', 'Proposal published',
    'Industry joins', 'Prototype', 'Testing', 'Pilot', 'Deployment', 'Impact measured'];
  const doneCount = Math.round((progress / 100) * STEPS.length);

  return (
    <Modal open={open} onClose={onClose} accent="#4f46e5" width="max-w-2xl"
      title="Presentation mode" subtitle="Run one real challenge through the entire ecosystem — all four dashboards update live">
      <div className="space-y-4">
        <div>
          <label className="label">Choose a challenge to drive</label>
          <select className="field" value={chosen?.id ?? ''} onChange={(e) => setTarget(e.target.value)} disabled={running}>
            {candidates.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}
          </select>
          {!candidates.length && <p className="text-[0.78rem] text-slate-500 mt-2">All challenges have already progressed. Reset the demo data to run again.</p>}
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.78rem] font-bold text-slate-600">Scenario progress</p>
            <p className="text-[0.78rem] font-bold text-indigo-500">{progress}%</p>
          </div>
          <Bar value={progress} color="#4f46e5" />
          <div className="grid sm:grid-cols-2 gap-1.5 mt-3">
            {STEPS.map((s, i) => (
              <div key={s} className={cx('flex items-center gap-2 text-[0.76rem] transition',
                i < doneCount ? 'text-emerald-500 font-semibold' : 'text-slate-400')}>
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
