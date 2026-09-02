import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { X, Check, Info, AlertTriangle, Search } from 'lucide-react';
import { cx } from '../../utils/format';

/* ── Motion presets ─────────────────────────────────────────────────── */
export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
export const stagger = (s = 0.07) => ({
  hidden: {},
  show: { transition: { staggerChildren: s } },
});

export function Reveal({ children, delay = 0, y = 24, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated counter ───────────────────────────────────────────────── */
export function Counter({ to = 0, decimals = 0, prefix = '', suffix = '', className = '', duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const [txt, setTxt] = useState('0');

  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  useEffect(() => spring.on('change', (v) => {
    setTxt(Number(v).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
  }), [spring, decimals]);

  return <span ref={ref} className={className}>{prefix}{txt}{suffix}</span>;
}

/* ── Chips / badges ─────────────────────────────────────────────────── */
export function Chip({ children, color = '#64748b', bg, className = '', dot = false }) {
  return (
    <span className={cx('chip', className)} style={{ background: bg ?? `${color}15`, color }}>
      {dot && <i className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

/* ── Progress bar ───────────────────────────────────────────────────── */
export function Bar({ value = 0, color = '#4f46e5', height = 8, bg = '#eef2f7', delay = 0 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: bg }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/* ── Score ring ─────────────────────────────────────────────────────── */
export function ScoreRing({ value = 0, size = 72, stroke = 7, color = '#4f46e5', label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (c * Math.max(0, Math.min(100, value))) / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center leading-none">
        <div className="text-center">
          <div className="font-display font-bold" style={{ fontSize: size * 0.26, color }}>
            {label ?? <Counter to={value} suffix="%" duration={1.2} />}
          </div>
          {sub && <div className="text-[9px] text-slate-400 font-semibold mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────────────── */
export function Stat({ icon: Icon, label, value, sub, color = '#4f46e5', decimals = 0, suffix = '', prefix = '', delay = 0 }) {
  return (
    <motion.div
      className="card card-hover p-4 sm:p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.07]" style={{ background: color }} />
      {Icon && (
        <div className="w-9 h-9 rounded-xl grid place-items-center mb-3" style={{ background: `${color}15`, color }}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
      )}
      <div className="text-2xl sm:text-[1.7rem] font-display font-extrabold tracking-tight text-slate-900">
        <Counter to={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </div>
      <div className="text-[0.78rem] font-semibold text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-[0.7rem] text-slate-400 mt-1.5">{sub}</div>}
    </motion.div>
  );
}

/* ── Modal ──────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-2xl', accent = '#4f46e5' }) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className={cx('relative w-full bg-white rounded-2xl shadow-2xl my-auto', width)}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="h-1.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55)` }} />
            <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 sm:px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Toast host ─────────────────────────────────────────────────────── */
export function Toasts({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => onDone?.(), 2800);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  const tone = {
    success: { bg: '#059669', Icon: Check },
    info: { bg: '#4f46e5', Icon: Info },
    warn: { bg: '#d97706', Icon: AlertTriangle },
  }[toast?.tone ?? 'info'];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-xl"
            style={{ background: tone.bg }}
          >
            <tone.Icon size={16} /> {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Search / filter bar ────────────────────────────────────────────── */
export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={cx('relative', className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="field pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select className={cx('field', className)} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  );
}

export function Empty({ icon: Icon, title, sub, action }) {
  return (
    <div className="py-14 text-center">
      {Icon && (
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 grid place-items-center text-slate-300 mb-3">
          <Icon size={26} />
        </div>
      )}
      <p className="font-display font-bold text-slate-700">{title}</p>
      {sub && <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange, accent = '#4f46e5' }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100/80 rounded-xl overflow-x-auto no-scrollbar">
      {tabs.map((t) => {
        const key = typeof t === 'string' ? t : t.key;
        const label = typeof t === 'string' ? t : t.label;
        const on = key === active;
        return (
          <button
            key={key} onClick={() => onChange(key)}
            className={cx('relative px-3.5 py-1.5 text-[0.8rem] font-semibold rounded-lg whitespace-nowrap transition',
              on ? 'text-white' : 'text-slate-500 hover:text-slate-800')}
          >
            {on && (
              <motion.span layoutId={`tab-${accent}`} className="absolute inset-0 rounded-lg"
                style={{ background: accent }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Section heading for landing pages ──────────────────────────────── */
export function SectionHead({ eyebrow, title, sub, center = true, accent = '#4f46e5' }) {
  return (
    <Reveal className={center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
      {eyebrow && (
        <div className="inline-flex items-center gap-2 text-[0.72rem] font-bold tracking-wider uppercase mb-3 px-3 py-1 rounded-full"
          style={{ color: accent, background: `${accent}12` }}>
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-[1.75rem] sm:text-4xl font-extrabold text-slate-900 leading-[1.15]">{title}</h2>
      {sub && <p className="mt-3 text-slate-500 text-[0.95rem] sm:text-base leading-relaxed">{sub}</p>}
    </Reveal>
  );
}

export function Avatar({ name = '?', size = 34, hue }) {
  const h = hue ?? (name.charCodeAt(0) * 7) % 360;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="rounded-full grid place-items-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${h} 70% 58%), hsl(${(h + 40) % 360} 75% 48%))` }}>
      {initials}
    </div>
  );
}

export function Sparkline({ data = [], color = '#4f46e5', w = 120, h = 34 }) {
  if (!data.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * w,
    h - ((d - min) / (max - min || 1)) * (h - 4) - 2,
  ]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <motion.path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="3" fill={color} />
    </svg>
  );
}

export { motion, AnimatePresence, useTransform };
