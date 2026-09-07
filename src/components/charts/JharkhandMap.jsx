import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, MapPin } from 'lucide-react';
import { DISTRICTS, catMeta } from '../../data/constants';
import { useShell } from '../../context/AppShellContext';
import { cx } from '../../utils/format';

/* Simplified but recognisable Jharkhand state boundary (viewBox 0 0 110 100). */
const OUTLINE = [
  [17, 36], [20, 28], [26, 21], [34, 17], [43, 14.5], [52, 13.5], [60, 16], [66, 13],
  [73, 10], [80, 7.5], [88, 6.5], [95, 10], [97.5, 17], [95, 24], [97, 31], [95, 38],
  [90, 44], [83, 47], [80, 52], [79, 59], [74, 65], [72, 72], [74, 79], [68, 85],
  [60, 89], [51, 92], [43, 89], [37, 86], [31, 88], [26, 82], [25, 74], [27, 66],
  [22, 60], [18, 52], [14.5, 44],
];

const toPath = (pts) => `${pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')} Z`;

/* ── Clip a polygon by the half-plane closer to `a` than to `b` (Voronoi) ── */
function clipHalfPlane(poly, a, b) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // inside: (p - m) · d < 0
  const side = (p) => (p[0] - mx) * dx + (p[1] - my) * dy;
  const out = [];
  for (let i = 0; i < poly.length; i += 1) {
    const cur = poly[i];
    const nxt = poly[(i + 1) % poly.length];
    const sc = side(cur);
    const sn = side(nxt);
    if (sc <= 0) out.push(cur);
    if ((sc < 0 && sn > 0) || (sc > 0 && sn < 0)) {
      const tt = sc / (sc - sn);
      out.push([cur[0] + tt * (nxt[0] - cur[0]), cur[1] + tt * (nxt[1] - cur[1])]);
    }
  }
  return out;
}

/** District cells derived from district centroids clipped to the state boundary. */
function buildCells() {
  return DISTRICTS.map((d) => {
    let poly = OUTLINE;
    for (const o of DISTRICTS) {
      if (o.name === d.name) continue;
      poly = clipHalfPlane(poly, d, o);
      if (poly.length < 3) break;
    }
    const cx0 = poly.reduce((s, p) => s + p[0], 0) / (poly.length || 1);
    const cy0 = poly.reduce((s, p) => s + p[1], 0) / (poly.length || 1);
    // shrink slightly so boundaries read as separate districts
    const shrunk = poly.map(([x, y]) => [cx0 + (x - cx0) * 0.955, cy0 + (y - cy0) * 0.955]);
    return { ...d, path: toPath(shrunk), cx: cx0, cy: cy0 };
  });
}

const HEAT = ['var(--map-empty)', '#a7f3d0', '#5eead4', '#facc15', '#fb923c', '#f43f5e'];

function heatColor(v, max) {
  if (!v) return HEAT[0];
  // With very few data points a purely relative ramp paints everything hot,
  // so fall back to absolute counts until the dataset is large enough.
  if (max <= 4) return HEAT[Math.min(v, 5)];
  const t = v / max;
  if (t > 0.8) return HEAT[5];
  if (t > 0.6) return HEAT[4];
  if (t > 0.4) return HEAT[3];
  if (t > 0.2) return HEAT[2];
  return HEAT[1];
}

/**
 * Interactive district map of Jharkhand.
 * data: [{ name, count, critical, projects, deployed, topCategory }]
 * markers: optional [{ id, district, category, status, title, severity }]
 */
export default function JharkhandMap({
  data = [], markers = [], selected, onSelect, metric = 'count', height = 400, showMarkers = true,
}) {
  const { t } = useShell();
  const [hover, setHover] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  const cells = useMemo(buildCells, []);
  const byName = useMemo(() => Object.fromEntries(data.map((d) => [d.name, d])), [data]);
  const max = Math.max(1, ...data.map((d) => d[metric] ?? 0));
  const active = hover ?? selected;
  const info = active ? byName[active] : null;

  const districtMarkers = useMemo(() => {
    const grouped = {};
    markers.forEach((m) => {
      grouped[m.district] = grouped[m.district] ?? [];
      grouped[m.district].push(m);
    });
    return Object.entries(grouped).flatMap(([dist, list]) => {
      const cell = cells.find((c) => c.name === dist);
      if (!cell) return [];
      return list.slice(0, 5).map((m, i) => {
        const ang = (i / Math.max(1, Math.min(list.length, 5))) * Math.PI * 2;
        return { ...m, x: cell.cx + Math.cos(ang) * 1.9, y: cell.cy + Math.sin(ang) * 1.9 };
      });
    });
  }, [markers, cells]);

  const handleDrag = (_e, i) => setPan((p) => ({ x: p.x + i.delta.x * 0.08, y: p.y + i.delta.y * 0.08 }));

  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <motion.div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        drag={zoom > 1}
        dragMomentum={false}
        onDrag={handleDrag}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.8}
      >
        <motion.svg
          viewBox="0 0 110 100" className="w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet"
          animate={{ scale: zoom, x: pan.x, y: pan.y }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        >
          <defs>
            <linearGradient id="jm-water" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--map-water-a)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--map-water-b)" stopOpacity="0.42" />
            </linearGradient>
            <filter id="jm-shadow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="1.4" stdDeviation="1.3" floodColor="#000" floodOpacity="0.28" />
            </filter>
            <filter id="jm-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="0.9" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id="jm-grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M6 0H0V6" fill="none" stroke="currentColor" strokeWidth="0.12" opacity="0.35" />
            </pattern>
          </defs>

          {/* soft backdrop */}
          <rect x="0" y="0" width="110" height="100" fill="url(#jm-grid)" style={{ color: 'var(--border-strong)' }} />
          <path d={toPath(OUTLINE)} fill="url(#jm-water)" stroke="none" filter="url(#jm-shadow)" />

          {/* district cells */}
          {cells.map((c, i) => {
            const rec = byName[c.name];
            const v = rec?.[metric] ?? 0;
            const on = active === c.name;
            const isSel = selected === c.name;
            return (
              <path
                key={c.name}
                d={c.path}
                fill={heatColor(v, max)}
                stroke={isSel ? '#818cf8' : 'var(--map-stroke)'}
                strokeWidth={isSel ? 0.55 : 0.28}
                style={{
                  transformOrigin: `${c.cx}px ${c.cy}px`,
                  cursor: 'pointer',
                  opacity: on ? 1 : 0.9,
                  transform: on ? 'scale(1.02)' : 'scale(1)',
                  transition: `opacity .3s ease ${(i * 0.02).toFixed(2)}s, transform .3s ease, fill .3s ease`,
                }}
                onMouseEnter={() => setHover(c.name)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect?.(isSel ? null : c.name)}
              />
            );
          })}

          {/* state boundary on top */}
          <path d={toPath(OUTLINE)} fill="none" stroke="var(--map-outline)" strokeWidth="0.5" strokeLinejoin="round" opacity="0.7" />

          {/* problem hotspots */}
          {cells.map((c) => {
            const rec = byName[c.name];
            const critical = rec?.critical ?? 0;
            if (!critical) return null;
            return (
              <g key={`h-${c.name}`} pointerEvents="none">
                <motion.circle
                  cx={c.cx} cy={c.cy} r={1.4 + Math.min(critical, 6) * 0.42}
                  fill="#f43f5e" opacity="0.18"
                  animate={{ scale: [1, 1.55, 1], opacity: [0.22, 0.05, 0.22] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                  style={{ transformOrigin: `${c.cx}px ${c.cy}px` }}
                />
              </g>
            );
          })}

          {/* project / challenge markers */}
          {showMarkers && districtMarkers.map((m, i) => {
            const col = catMeta(m.category).hex;
            const deployed = m.deployed;
            return (
              <g key={`${m.id}-${i}`} pointerEvents="none">
                <motion.path
                  d="M0,0 C-1.15,-1.5 -1.7,-2.3 -1.7,-3.1 A1.7,1.7 0 1,1 1.7,-3.1 C1.7,-2.3 1.15,-1.5 0,0 Z"
                  transform={`translate(${m.x},${m.y})`}
                  fill={col} stroke="#fff" strokeWidth="0.22"
                  animate={deployed ? { y: [0, -0.8, 0] } : {}}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.16 }}
                  filter={deployed ? 'url(#jm-glow)' : undefined}
                />
                <circle cx={m.x} cy={m.y - 3.1} r="0.62" fill="#fff" />
              </g>
            );
          })}

          {/* labels */}
          {cells.map((c) => {
            const on = active === c.name;
            return (
              <text key={`t-${c.name}`} x={c.cx} y={c.cy + 4.4} textAnchor="middle" pointerEvents="none"
                style={{
                  fontSize: on ? 2.5 : 2.1,
                  fontWeight: on ? 800 : 600,
                  fill: 'var(--map-label)',
                  opacity: on ? 1 : 0.78,
                  transition: 'all .18s',
                  paintOrder: 'stroke',
                  stroke: 'var(--map-label-halo)',
                  strokeWidth: 0.5,
                  strokeLinejoin: 'round',
                }}>
                {c.name}
              </text>
            );
          })}
        </motion.svg>
      </motion.div>

      {/* zoom controls */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {[
          { Icon: ZoomIn, fn: () => setZoom((z) => Math.min(2.6, +(z + 0.35).toFixed(2))) },
          { Icon: ZoomOut, fn: () => setZoom((z) => Math.max(1, +(z - 0.35).toFixed(2))) },
          { Icon: Maximize2, fn: reset },
        ].map(({ Icon, fn }, i) => (
          <button key={i} onClick={fn}
            className="w-7 h-7 grid place-items-center rounded-lg border transition hover:scale-105"
            style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--muted)' }}>
            <Icon size={13} />
          </button>
        ))}
      </div>

      {/* hover / selection info card */}
      <AnimatePresence>
        {info && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute top-2 right-2 card px-3.5 py-2.5 pointer-events-none min-w-[168px]">
            <p className="font-display font-bold text-[0.9rem] text-slate-900 flex items-center gap-1.5">
              <MapPin size={13} className="text-indigo-500" />{info.name}
            </p>
            <div className="mt-1.5 space-y-1">
              <Row label={t('map.challenges')} value={info.count ?? 0} color="#6366f1" />
              <Row label={t('map.projects')} value={info.projects ?? 0} color="#0891b2" />
              <Row label={t('map.highPriority')} value={info.critical ?? 0} color="#f43f5e" />
              {info.deployed > 0 && <Row label="deployed" value={info.deployed} color="#10b981" />}
            </div>
            {info.topCategory && (
              <p className="mt-1.5 text-[0.68rem] font-semibold" style={{ color: catMeta(info.topCategory).hex }}>
                {info.topCategory}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* legend */}
      <div className="absolute bottom-1 left-2 flex items-center gap-2 text-[0.64rem] font-semibold" style={{ color: 'var(--muted)' }}>
        <span>{t('map.legend.low')}</span>
        {HEAT.slice(1).map((c) => <i key={c} className="w-5 h-1.5 rounded-full" style={{ background: c }} />)}
        <span>{t('map.legend.high')}</span>
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <p className="text-[0.72rem] flex items-center justify-between gap-3">
      <span className="text-slate-500 capitalize">{label}</span>
      <b style={{ color }}>{value}</b>
    </p>
  );
}

export function DistrictList({ data = [], selected, onSelect, metric = 'count' }) {
  const max = Math.max(1, ...data.map((d) => d[metric] ?? 0));
  return (
    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
      {data.map((d, i) => (
        <motion.button key={d.name} onClick={() => onSelect?.(selected === d.name ? null : d.name)}
          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
          className={cx('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition text-left',
            selected === d.name ? 'ring-1 ring-indigo-400' : 'hover:bg-slate-50')}
          style={selected === d.name ? { background: 'color-mix(in srgb, #6366f1 10%, transparent)' } : undefined}>
          <span className="text-[0.78rem] font-semibold text-slate-700 w-28 truncate">{d.name}</span>
          <span className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
            <motion.span className="block h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${heatColor(d[metric], max)}, #6366f1)` }}
              initial={{ width: 0 }} animate={{ width: `${((d[metric] ?? 0) / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.02 }} />
          </span>
          <span className="text-[0.72rem] font-bold text-slate-500 w-6 text-right">{d[metric] ?? 0}</span>
        </motion.button>
      ))}
    </div>
  );
}
