import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Copy, GraduationCap, Factory, Check, Gauge, Layers } from 'lucide-react';
import { AI_STEPS } from '../../services/aiEngine';
import { catMeta, ROLES } from '../../data/constants';
import { Bar, ScoreRing, Chip, Counter } from './ui';
import { priorityTone, cx } from '../../utils/format';

/* ── Animated "AI is thinking" panel ────────────────────────────────── */
export function AIProcessing({ onDone, duration = 2600, compact = false }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const per = duration / AI_STEPS.length;
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= AI_STEPS.length - 1) { clearInterval(t); setTimeout(() => onDone?.(), 420); return s + 1; }
        return s + 1;
      });
    }, per);
    return () => clearInterval(t);
  }, [duration, onDone]);

  return (
    <div className={cx('rounded-2xl p-5 relative overflow-hidden', compact ? '' : 'py-8')}
      style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff 60%,#ecfeff)' }}>
      <motion.div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-2xl"
        style={{ background: '#a78bfa55' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
      <div className="relative flex flex-col items-center text-center gap-3">
        <div className="relative">
          <span className="absolute inset-0 rounded-2xl anim-ring bg-violet-400/40" />
          <motion.div className="w-14 h-14 rounded-2xl grid place-items-center text-white relative"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}
            animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
            <Brain size={26} />
          </motion.div>
        </div>
        <div>
          <p className="font-display font-bold text-slate-900">AI engine analysing challenge</p>
          <p className="text-xs text-slate-500 mt-0.5">Classification · Priority · Duplicates · Matching</p>
        </div>
        <div className="w-full max-w-sm space-y-1.5 mt-1">
          {AI_STEPS.map((s, i) => (
            <AnimatePresence key={s}>
              {i <= step && (
                <motion.div
                  initial={{ opacity: 0, x: -8, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  className="flex items-center gap-2 text-[0.76rem] text-slate-600 font-medium"
                >
                  {i < step
                    ? <Check size={13} className="text-emerald-500 shrink-0" strokeWidth={3} />
                    : <motion.span className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent shrink-0"
                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />}
                  {s}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
        <div className="w-full max-w-sm mt-1">
          <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg,#8b5cf6,#06b6d4)' }}
              animate={{ width: `${((step + 1) / AI_STEPS.length) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Classification result ──────────────────────────────────────────── */
export function AIClassification({ ai }) {
  const cat = catMeta(ai.category);
  return (
    <div className="card p-4">
      <Header icon={Sparkles} title="AI Classification" tag="Model: SamadhanNLP v2.4" />
      <div className="flex items-center gap-4 mt-3">
        <ScoreRing value={ai.classification.confidence} color={cat.hex} size={68} sub="confidence" />
        <div className="min-w-0">
          <div className="font-display text-lg font-extrabold" style={{ color: cat.hex }}>{ai.category}</div>
          <p className="text-[0.72rem] text-slate-500 mt-0.5">Auto-assigned domain from submission text</p>
          {ai.classification.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ai.classification.keywords.map((k) => <Chip key={k} color="#64748b">{k}</Chip>)}
            </div>
          )}
        </div>
      </div>
      {ai.classification.alternates?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wide">Alternate domains considered</p>
          {ai.classification.alternates.map((a) => (
            <div key={a.category} className="flex items-center gap-2">
              <span className="text-[0.75rem] text-slate-600 w-40 truncate">{a.category}</span>
              <Bar value={a.confidence} color={catMeta(a.category).hex} height={5} />
              <span className="text-[0.7rem] font-semibold text-slate-400 w-8 text-right">{a.confidence}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Priority scoring ───────────────────────────────────────────────── */
export function AIPriority({ priority }) {
  const t = priorityTone(priority.level);
  const factors = [
    ['Urgency', priority.factors.urgency],
    ['Population affected', priority.factors.population],
    ['Severity', priority.factors.severity],
    ['Geographic impact', priority.factors.geographic],
    ['Feasibility', priority.factors.feasibility],
  ];
  return (
    <div className="card p-4">
      <Header icon={Gauge} title="AI Priority Score" tag="Weighted multi-factor model" />
      <div className="flex items-center gap-4 mt-3">
        <div className="rounded-2xl px-4 py-3 text-center" style={{ background: t.bg }}>
          <div className="font-display text-3xl font-extrabold" style={{ color: t.fg }}>
            <Counter to={priority.score} />
          </div>
          <div className="text-[0.65rem] font-bold tracking-wider" style={{ color: t.fg }}>/ 100 · {priority.level}</div>
        </div>
        <div className="flex-1 space-y-1.5">
          {factors.map(([label, v], i) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[0.72rem] text-slate-500 w-32 shrink-0">{label}</span>
              <Bar value={v} color={t.dot} height={5} delay={i * 0.08} />
              <span className="text-[0.68rem] font-bold text-slate-400 w-7 text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Duplicate detection ────────────────────────────────────────────── */
export function AIDuplicates({ duplicates = [], onOpen }) {
  return (
    <div className="card p-4">
      <Header icon={Copy} title="Duplicate & Similarity Detection"
        tag={`${duplicates.length} similar challenge${duplicates.length === 1 ? '' : 's'} found`} />
      {duplicates.length === 0 ? (
        <p className="text-[0.8rem] text-slate-400 mt-3">No similar challenge above the 55% similarity threshold. This is a unique submission.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {duplicates.map((d, i) => (
            <motion.button key={d.id} onClick={() => onOpen?.(d.id)}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-left">
              <div className="min-w-0 flex-1">
                <p className="text-[0.8rem] font-semibold text-slate-800 truncate">{d.title}</p>
                <p className="text-[0.68rem] text-slate-400">{d.id} · {d.district}</p>
              </div>
              <div className="w-24 shrink-0">
                <Bar value={d.similarity} color={d.similarity > 85 ? '#ef4444' : d.similarity > 70 ? '#f97316' : '#eab308'} height={5} />
              </div>
              <span className="text-[0.75rem] font-extrabold text-slate-700 w-9 text-right">{d.similarity}%</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Match list (universities / industries) ─────────────────────────── */
export function MatchList({ kind = 'university', matches = [], onSelect, selectedId, actionLabel, disabled }) {
  const role = kind === 'university' ? ROLES.varsity : ROLES.industry;
  const Icon = kind === 'university' ? GraduationCap : Factory;
  return (
    <div className="card p-4">
      <Header icon={Icon} title={kind === 'university' ? 'AI University Recommendations' : 'AI Industry Recommendations'}
        tag={kind === 'university' ? 'Research fit · Departments · Location · Track record' : 'Domain · Technology · CSR · Funding capacity'} />
      <div className="mt-3 space-y-2.5">
        {matches.map((m, i) => (
          <motion.div key={m.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={cx('rounded-xl border p-3 transition', selectedId === m.id ? 'border-transparent ring-2' : 'border-slate-100 hover:border-slate-200')}
            style={selectedId === m.id ? { background: role.soft, boxShadow: `0 0 0 2px ${role.hex}` } : undefined}>
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <ScoreRing value={m.score} size={54} stroke={5} color={role.hex} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-bold text-[0.9rem] text-slate-900">{m.name}</p>
                  {i === 0 && <Chip color={role.hex} bg={role.soft}>Best match</Chip>}
                </div>
                <p className="text-[0.7rem] text-slate-400">{m.type} · {m.district ?? m.hq}</p>
                <ul className="mt-1.5 space-y-0.5">
                  {m.reasons.map((r) => (
                    <li key={r} className="text-[0.72rem] text-slate-500 flex items-start gap-1.5">
                      <Check size={11} className="mt-0.5 shrink-0" style={{ color: role.hex }} strokeWidth={3} />{r}
                    </li>
                  ))}
                </ul>
              </div>
              {onSelect && (
                <button className="btn btn-sm shrink-0 text-white" style={{ background: role.hex }}
                  disabled={disabled} onClick={() => onSelect(m)}>
                  {actionLabel ?? 'Select'}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Multidisciplinary composition visual ───────────────────────────── */
export function DisciplineWeb({ disciplines = [], category }) {
  const cat = catMeta(category);
  return (
    <div className="card p-4">
      <Header icon={Layers} title="AI Multidisciplinary Composition" tag="Recommended disciplines for this problem" />
      <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2">
        {disciplines.map((d, i) => (
          <motion.span key={d}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.09, type: 'spring', stiffness: 260, damping: 20 }}
            className="px-3 py-1.5 rounded-xl text-[0.75rem] font-semibold border"
            style={{ borderColor: `${cat.hex}40`, background: `${cat.hex}0d`, color: cat.hex }}>
            {d}
          </motion.span>
        ))}
      </div>
      <div className="flex items-center justify-center mt-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-[0.7rem] font-bold px-3 py-1.5 rounded-full text-white"
          style={{ background: `linear-gradient(90deg, ${cat.hex}, #6366f1)` }}>
          → One multidisciplinary team
        </motion.div>
      </div>
    </div>
  );
}

function Header({ icon: Icon, title, tag }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#ede9fe,#e0e7ff)', color: '#7c3aed' }}>
        <Icon size={16} strokeWidth={2.3} />
      </div>
      <div className="min-w-0">
        <p className="font-display font-bold text-[0.9rem] text-slate-900 leading-tight">{title}</p>
        {tag && <p className="text-[0.68rem] text-slate-400 mt-0.5">{tag}</p>}
      </div>
    </div>
  );
}
