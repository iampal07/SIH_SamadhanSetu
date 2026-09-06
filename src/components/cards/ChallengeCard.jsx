import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { MapPin, Users, ArrowRight, Sparkles } from 'lucide-react';
import { catMeta, ROLES } from '../../data/constants';
import { LifecycleMini, StageBadge } from '../workflow/Lifecycle';
import { Chip } from '../shared/ui';
import { fmtFull, priorityTone, timeAgo, cx } from '../../utils/format';

export default function ChallengeCard({ challenge: c, onOpen, actions, accent = '#4f46e5', index = 0, dense = false }) {
  const cat = catMeta(c.category);
  const CatIcon = Icons[cat.icon] ?? Icons.Circle;
  const p = c.priority ? priorityTone(c.priority.level) : null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="card card-hover p-4 sm:p-5 flex flex-col gap-3 cursor-pointer group"
      onClick={() => onOpen?.(c)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
          style={{ background: `${cat.hex}15`, color: cat.hex }}>
          <CatIcon size={19} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.68rem] font-bold tracking-wide text-slate-400">{c.code}</span>
            {p && (
              <span className="chip" style={{ background: p.bg, color: p.fg }}>
                <i className="w-1.5 h-1.5 rounded-full" style={{ background: p.dot }} />
                {c.priority.level} · {c.priority.score}
              </span>
            )}
            {c.validation?.status === 'pending' && (
              <Chip color="#a16207" bg="#fefce8">Pending validation</Chip>
            )}
          </div>
          <h3 className="font-display font-bold text-[0.95rem] leading-snug text-slate-900 mt-1 group-hover:text-indigo-600 transition line-clamp-2">
            {c.title}
          </h3>
        </div>
      </div>

      {!dense && (
        <p className="text-[0.82rem] text-slate-500 leading-relaxed line-clamp-2">{c.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[0.72rem] text-slate-500 font-medium">
        <span className="inline-flex items-center gap-1"><MapPin size={12} />{c.village}, {c.district}</span>
        {c.affected > 0 && <span className="inline-flex items-center gap-1"><Users size={12} />{fmtFull(c.affected)} affected</span>}
        <span className="inline-flex items-center gap-1"><Icons.Clock size={12} />{timeAgo(c.createdAt)}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Chip color={cat.hex}>{c.category}</Chip>
        {c.ai && <Chip color="#8b5cf6" bg="#f5f3ff"><Sparkles size={10} />AI {c.ai.classification.confidence}%</Chip>}
        {c.university && <Chip color={ROLES.varsity.hex}>{c.university.short}</Chip>}
        {c.partners?.map((pt) => <Chip key={pt.id} color={ROLES.industry.hex}>{pt.short}</Chip>)}
      </div>

      <LifecycleMini status={c.status} />

      {(actions || true) && (
        <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
          <button className="text-[0.75rem] font-bold inline-flex items-center gap-1 opacity-70 group-hover:opacity-100 transition"
            style={{ color: accent }} onClick={() => onOpen?.(c)}>
            Details <ArrowRight size={13} />
          </button>
        </div>
      )}
    </motion.article>
  );
}

export function MiniRow({ challenge: c, onOpen, right }) {
  const cat = catMeta(c.category);
  const CatIcon = Icons[cat.icon] ?? Icons.Circle;
  return (
    <button onClick={() => onOpen?.(c)}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition text-left">
      <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: `${cat.hex}15`, color: cat.hex }}>
        <CatIcon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.82rem] font-semibold text-slate-800 truncate">{c.title}</span>
        <span className="block text-[0.7rem] text-slate-400">{c.district} · {c.code}</span>
      </span>
      {right ?? <StageBadge status={c.status} size="sm" />}
    </button>
  );
}

export { cx };
