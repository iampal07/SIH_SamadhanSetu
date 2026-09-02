import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { STAGES, STAGE_INDEX, ROLES, stageMeta } from '../../data/constants';
import { cx, timeAgo } from '../../utils/format';

export function StageBadge({ status, size = 'md' }) {
  const m = stageMeta(status);
  const role = ROLES[m.owner] ?? ROLES.citizen;
  const Icon = Icons[m.icon] ?? Icons.Circle;
  return (
    <span
      className={cx('chip', size === 'sm' && 'text-[0.68rem] px-2 py-0.5')}
      style={{ background: role.soft, color: role.deep }}
    >
      <Icon size={size === 'sm' ? 11 : 13} strokeWidth={2.4} />
      {m.label}
    </span>
  );
}

/* Compact horizontal progress used on cards */
export function LifecycleMini({ status, showLabel = true }) {
  const idx = STAGE_INDEX[status] ?? 0;
  const pct = ((idx + 1) / STAGES.length) * 100;
  const role = ROLES[stageMeta(status).owner];
  return (
    <div>
      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => (
          <motion.div
            key={s.key}
            className="h-1.5 flex-1 rounded-full"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            style={{ background: i <= idx ? role.hex : '#e8edf5' }}
          />
        ))}
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5 text-[0.68rem] font-semibold">
          <span style={{ color: role.deep }}>{stageMeta(status).label}</span>
          <span className="text-slate-400">{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}

/* Full lifecycle track with animated connector */
export function LifecycleTrack({ status, history = [], compact = false }) {
  const idx = STAGE_INDEX[status] ?? 0;
  return (
    <div className="relative overflow-x-auto no-scrollbar pb-2">
      <div className={cx('flex min-w-max', compact ? 'gap-3' : 'gap-4')}>
        {STAGES.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          const role = ROLES[s.owner];
          const Icon = Icons[s.icon] ?? Icons.Circle;
          const h = history.find((x) => x.stage === s.key);
          return (
            <div key={s.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center" style={{ width: compact ? 72 : 92 }}>
                <div className="relative">
                  {current && (
                    <span className="absolute inset-0 rounded-full anim-ring" style={{ background: `${role.hex}55` }} />
                  )}
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.035, type: 'spring', stiffness: 320, damping: 22 }}
                    className={cx('relative grid place-items-center rounded-full border-2 transition-all',
                      compact ? 'w-9 h-9' : 'w-11 h-11')}
                    style={{
                      background: done || current ? role.hex : '#fff',
                      borderColor: done || current ? role.hex : '#e2e8f0',
                      color: done || current ? '#fff' : '#cbd5e1',
                      boxShadow: current ? `0 8px 22px -8px ${role.hex}` : 'none',
                    }}
                  >
                    {done ? <Icons.Check size={compact ? 15 : 18} strokeWidth={3} /> : <Icon size={compact ? 15 : 18} strokeWidth={2.4} />}
                  </motion.div>
                </div>
                <div className={cx('mt-2 text-center font-semibold leading-tight',
                  compact ? 'text-[0.62rem]' : 'text-[0.7rem]')}
                  style={{ color: done || current ? role.deep : '#94a3b8' }}>
                  {s.label}
                </div>
                {h && !compact && <div className="text-[0.6rem] text-slate-400 mt-0.5">{timeAgo(h.at)}</div>}
              </div>
              {i < STAGES.length - 1 && (
                <div className={cx('rounded-full mt-5', compact ? 'w-4 h-0.5' : 'w-6 h-0.5')}
                  style={{ background: i < idx ? ROLES[STAGES[i + 1].owner].hex : '#e2e8f0' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Vertical timeline of what actually happened */
export function HistoryTimeline({ history = [], updates = [] }) {
  const items = [
    ...history.map((h) => ({ kind: 'stage', ...h })),
    ...updates.map((u) => ({ kind: 'update', ...u, at: u.at })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
      {items.map((it, i) => {
        const role = ROLES[it.kind === 'stage' ? it.by : it.role] ?? ROLES.citizen;
        const m = it.kind === 'stage' ? stageMeta(it.stage) : null;
        const Icon = m ? (Icons[m.icon] ?? Icons.Circle) : Icons.MessageSquare;
        return (
          <motion.div
            key={`${it.kind}-${i}`} className="relative pb-5 last:pb-0"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
          >
            <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full grid place-items-center ring-4 ring-white"
              style={{ background: role.hex }}>
              <Icon size={9} color="#fff" strokeWidth={3} />
            </span>
            <div className="text-[0.82rem] font-semibold text-slate-800">
              {it.kind === 'stage' ? m.label : it.text}
            </div>
            <div className="text-[0.72rem] text-slate-400 mt-0.5">
              {it.kind === 'stage' ? `${role.label} · ${timeAgo(it.at)}` : `${it.by} · ${role.label} · ${timeAgo(it.at)}`}
            </div>
            {it.note && <div className="text-[0.75rem] text-slate-500 mt-1 bg-slate-50 rounded-lg px-2.5 py-1.5">{it.note}</div>}
          </motion.div>
        );
      })}
    </div>
  );
}
