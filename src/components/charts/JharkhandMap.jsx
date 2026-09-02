import { useState } from 'react';
import { motion } from 'framer-motion';
import { DISTRICTS } from '../../data/constants';
import { cx } from '../../utils/format';

const OUTLINE = 'M18,34 L24,22 L38,16 L52,14 L64,18 L74,12 L86,8 L95,14 L93,26 L96,36 L90,46 L80,50 L78,60 L70,70 L72,80 L62,88 L48,92 L38,86 L30,88 L24,78 L26,66 L20,58 L14,46 Z';

/**
 * District-wise bubble map of Jharkhand.
 * `data` — [{ name, count, critical, projects }]
 */
export default function JharkhandMap({ data = [], selected, onSelect, metric = 'count', height = 380 }) {
  const [hover, setHover] = useState(null);
  const byName = Object.fromEntries(data.map((d) => [d.name, d]));
  const max = Math.max(1, ...data.map((d) => d[metric] ?? 0));

  const colorFor = (v) => {
    const t = v / max;
    if (t === 0) return '#cbd5e1';
    if (t > 0.75) return '#dc2626';
    if (t > 0.5) return '#f97316';
    if (t > 0.25) return '#f59e0b';
    return '#10b981';
  };

  const hoverData = hover ? byName[hover] : null;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox="0 0 110 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="mapfill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="55%" stopColor="#cffafe" />
            <stop offset="100%" stopColor="#d1fae5" />
          </linearGradient>
          <filter id="mapshadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#6366f1" floodOpacity="0.18" />
          </filter>
        </defs>

        <motion.path d={OUTLINE} fill="url(#mapfill)" stroke="#6366f1" strokeWidth="0.6"
          strokeLinejoin="round" filter="url(#mapshadow)"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: '55px 50px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />

        {DISTRICTS.map((d, i) => {
          const rec = byName[d.name];
          const v = rec?.[metric] ?? 0;
          const r = 1.6 + (v / max) * 3.6;
          const on = selected === d.name;
          const hl = hover === d.name;
          return (
            <g key={d.name} onMouseEnter={() => setHover(d.name)} onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(on ? null : d.name)} style={{ cursor: 'pointer' }}>
              {v > 0 && (
                <motion.circle cx={d.x} cy={d.y} r={r * 2.1} fill={colorFor(v)} opacity={0.16}
                  animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.18 }}
                  style={{ transformOrigin: `${d.x}px ${d.y}px` }} />
              )}
              <motion.circle cx={d.x} cy={d.y} r={r} fill={colorFor(v)}
                stroke="#fff" strokeWidth={on || hl ? 0.7 : 0.4}
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: on || hl ? 1.3 : 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05, type: 'spring', stiffness: 260, damping: 18 }}
                style={{ transformOrigin: `${d.x}px ${d.y}px` }} />
              <text x={d.x} y={d.y - r - 1.1} textAnchor="middle"
                style={{ fontSize: 2.3, fontWeight: 700, fill: on || hl ? '#0f172a' : '#64748b' }}>
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>

      {hoverData && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-3 right-3 card px-3 py-2 pointer-events-none">
          <p className="font-display font-bold text-[0.85rem] text-slate-900">{hoverData.name}</p>
          <p className="text-[0.72rem] text-slate-500">{hoverData.count} challenges · {hoverData.projects} projects</p>
          <p className="text-[0.72rem] font-semibold text-rose-600">{hoverData.critical} high priority</p>
        </motion.div>
      )}

      <div className="absolute bottom-2 left-3 flex items-center gap-2.5 text-[0.66rem] font-semibold text-slate-400">
        <span>Low</span>
        {['#10b981', '#f59e0b', '#f97316', '#dc2626'].map((c) => (
          <i key={c} className="w-4 h-1.5 rounded-full" style={{ background: c }} />
        ))}
        <span>High</span>
      </div>
    </div>
  );
}

export function DistrictList({ data = [], selected, onSelect, metric = 'count' }) {
  const max = Math.max(1, ...data.map((d) => d[metric] ?? 0));
  return (
    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
      {data.map((d) => (
        <button key={d.name} onClick={() => onSelect?.(selected === d.name ? null : d.name)}
          className={cx('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition text-left',
            selected === d.name ? 'bg-indigo-50' : 'hover:bg-slate-50')}>
          <span className="text-[0.78rem] font-semibold text-slate-700 w-28 truncate">{d.name}</span>
          <span className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <motion.span className="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
              initial={{ width: 0 }} animate={{ width: `${(d[metric] / max) * 100}%` }} transition={{ duration: 0.8 }} />
          </span>
          <span className="text-[0.72rem] font-bold text-slate-500 w-6 text-right">{d[metric]}</span>
        </button>
      ))}
    </div>
  );
}
