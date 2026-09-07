import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, Factory, Landmark, Sparkles } from 'lucide-react';
import { ROLES } from '../../data/constants';
import { useShell } from '../../context/AppShellContext';

const NODES = [
  { key: 'citizen', Icon: Users, x: 50, y: 8, label: 'Citizens', sub: 'Report real problems' },
  { key: 'varsity', Icon: GraduationCap, x: 92, y: 50, label: 'Universities', sub: 'Build solutions' },
  { key: 'industry', Icon: Factory, x: 50, y: 92, label: 'Industry', sub: 'Fund & deploy' },
  { key: 'govt', Icon: Landmark, x: 8, y: 50, label: 'Government', sub: 'Validate & scale' },
];

/**
 * Animated 4-stakeholder ecosystem with an AI core.
 * Pure SVG + Framer Motion — no 3D runtime needed, loads instantly on a projector.
 */
export default function Ecosystem({ size = 420, active }) {
  const { t } = useShell();
  const [hover, setHover] = useState(null);
  const cur = hover ?? active;

  return (
    <div className="relative select-none mx-auto w-full"
      style={{ maxWidth: size, aspectRatio: '1 / 1', containerType: 'inline-size' }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <radialGradient id="core-glow">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          {NODES.map((n) => (
            <linearGradient key={n.key} id={`lg-${n.key}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={ROLES[n.key].hex} stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
            </linearGradient>
          ))}
        </defs>

        <circle cx="50" cy="50" r="42" fill="url(#core-glow)" />
        <motion.circle cx="50" cy="50" r="30" fill="none" stroke="#c7d2fe" strokeWidth="0.35"
          strokeDasharray="2 3" className="anim-spin-slow" style={{ transformOrigin: '50px 50px' }} />
        <motion.circle cx="50" cy="50" r="38" fill="none" stroke="#e0e7ff" strokeWidth="0.3" />

        {NODES.map((n, i) => (
          <g key={n.key}>
            <motion.line x1="50" y1="50" x2={n.x} y2={n.y}
              stroke={`url(#lg-${n.key})`} strokeWidth={cur === n.key ? 1.1 : 0.6} strokeLinecap="round"
              initial={{ pathLength: 0.001 }} animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.4 + i * 0.15 }} />
            <motion.g
              animate={{ x: [0, n.x - 50, 0], y: [0, n.y - 50, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, delay: i * 0.85, ease: 'easeInOut' }}>
              <circle cx={50} cy={50} r="1.15" fill={ROLES[n.key].hex} />
            </motion.g>
          </g>
        ))}

        {NODES.map((n, i) => {
          const nx = NODES[(i + 1) % NODES.length];
          return (
            <motion.path key={`arc-${n.key}`}
              d={`M${n.x},${n.y} Q50,50 ${nx.x},${nx.y}`} fill="none"
              stroke={ROLES[n.key].hex} strokeWidth="0.35" strokeOpacity="0.28" strokeDasharray="1.5 2.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.9 + i * 0.1 }} />
          );
        })}
      </svg>

      {/* AI core */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl grid place-items-center text-white shadow-2xl"
        style={{ width: '21cqw', height: '21cqw', background: 'linear-gradient(135deg,#8b5cf6,#4f46e5)', boxShadow: '0 20px 50px -18px #6366f1' }}
        initial={false}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      >
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.4, repeat: Infinity }} className="text-center">
          <span className="block mx-auto" style={{ width: '7cqw', height: '7cqw' }}><Sparkles className="w-full h-full" /></span>
          <div className="font-display font-extrabold mt-0.5" style={{ fontSize: '3.5cqw' }}>AI CORE</div>
        </motion.div>
      </motion.div>

      {NODES.map((n, i) => {
        const r = ROLES[n.key];
        const on = cur === n.key;
        return (
          <motion.div key={n.key}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${n.x}%`, top: `${n.y}%`, width: '31cqw' }}
            initial={{ scale: 0.7 }} animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 240, damping: 18 }}
            onMouseEnter={() => setHover(n.key)} onMouseLeave={() => setHover(null)}
          >
            <motion.div
              className="mx-auto rounded-2xl grid place-items-center text-white shadow-lg cursor-pointer"
              style={{ width: '14cqw', height: '14cqw', background: `linear-gradient(135deg,${r.hex},${r.deep})`, boxShadow: `0 14px 30px -12px ${r.hex}` }}
              animate={on ? { scale: 1.14, y: -3 } : { scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            >
              <span className="block" style={{ width: '5.6cqw', height: '5.6cqw' }}><n.Icon className="w-full h-full" strokeWidth={2.2} /></span>
            </motion.div>
            <div className="font-display font-bold mt-1.5 text-slate-800" style={{ fontSize: '3.7cqw' }}>{t(`role.${n.key}`, n.label)}</div>
            <div className="text-slate-400 font-medium" style={{ fontSize: '2.9cqw' }}>{t(`role.${n.key}.desc`, n.sub)}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
