import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Paperclip, Star, CheckCircle2, AlertTriangle } from 'lucide-react';
import { STAGES, STAGE_INDEX, ROLES, stageMeta, stageProgress } from '../../data/constants';
import { Bar, Chip, ScoreRing, Empty, Avatar } from '../shared/ui';
import { StageBadge, LifecycleTrack } from './Lifecycle';
import { fmtDate, timeAgo, cx } from '../../utils/format';

/* ══════════════════════════════════════════════════════════════════════
   Citizen evidence — the same gallery is reused by every dashboard so the
   photographs/videos uploaded with the challenge stay visible end-to-end.
   ══════════════════════════════════════════════════════════════════════ */
const isVideo = (a) => a.type === 'video' || /\.(mp4|webm|mov|mkv)$/i.test(a.name || '') || (a.url || '').startsWith('data:video');
const isImage = (a) => a.type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(a.name || '') || (a.url || '').startsWith('data:image');

export function EvidenceGallery({ attachments = [], title = 'Citizen evidence', compact = false }) {
  const withUrl = attachments.filter((a) => a.url);
  const videos = withUrl.filter(isVideo);
  const images = withUrl.filter((a) => !isVideo(a) && isImage(a));
  const docs = attachments.filter((a) => !isVideo(a) && !isImage(a));

  if (!attachments.length) {
    return <Empty icon={Icons.ImageOff} title="No evidence attached" sub="The citizen did not attach any photo, video or document to this challenge." />;
  }

  return (
    <div className="space-y-3">
      <p className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-400">
        {title} ({attachments.length})
      </p>

      {videos.length > 0 && (
        <div className={cx('grid gap-3', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}>
          {videos.map((v, i) => (
            <div key={v.url || i} className="rounded-xl overflow-hidden border bg-black aspect-video" style={{ borderColor: 'var(--border)' }}>
              <video src={v.url} controls preload="metadata" className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className={cx('grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3')}>
          {images.map((img, i) => (
            <a key={img.url || i} href={img.url} target="_blank" rel="noreferrer"
              className="group relative rounded-xl overflow-hidden border bg-slate-100 aspect-video block shadow-sm"
              style={{ borderColor: 'var(--border)' }}>
              <img src={img.url} alt={img.name} loading="lazy"
                onError={(e) => { const a = e.target.closest('a'); if (a) a.style.display = 'none'; }}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <span className="absolute inset-0 grid place-items-center bg-slate-900/0 group-hover:bg-slate-900/40 transition">
                <span className="opacity-0 group-hover:opacity-100 text-white text-[0.7rem] font-bold px-2 py-1 rounded bg-black/60 transition">
                  Open full photo
                </span>
              </span>
            </a>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {docs.map((a, i) => (
            <a key={a.name || i} href={a.url || undefined} target={a.url ? '_blank' : undefined} rel="noreferrer"
              className={cx('inline-flex items-center gap-2 text-[0.75rem] font-medium text-slate-600 bg-slate-50 border rounded-lg px-2.5 py-1.5 transition',
                a.url ? 'hover:bg-slate-100' : 'opacity-60 cursor-default')}
              style={{ borderColor: 'var(--border)' }}>
              <Paperclip size={12} className="text-slate-400" />{a.name}
              {a.size && <span className="text-slate-400 font-mono text-[0.68rem]">{a.size}</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Live project progress — stage, %, milestones, what's next
   ══════════════════════════════════════════════════════════════════════ */
export function projectStats(c) {
  const idx = STAGE_INDEX[c.status] ?? 0;
  const ms = c.milestones ?? [];
  const done = ms.filter((m) => m.status === 'completed').length;
  const active = ms.find((m) => m.status === 'in_progress') ?? null;
  const overdue = ms.filter((m) => m.status !== 'completed' && m.due && new Date(m.due) < new Date());
  const stagePct = stageProgress(c.status);
  const msPct = ms.length ? Math.round((done / ms.length) * 100) : null;
  return {
    idx,
    stage: stageMeta(c.status),
    next: idx < STAGES.length - 1 ? STAGES[idx + 1] : null,
    completion: msPct === null ? stagePct : Math.round((stagePct + msPct) / 2),
    stagePct,
    milestonesDone: done,
    milestonesTotal: ms.length,
    activeMilestone: active,
    overdue,
    teamSize: c.team?.members?.length ?? 0,
    partners: c.partners?.length ?? 0,
    feedbackCount: c.feedback?.length ?? 0,
  };
}

export function ProjectProgressCard({ challenge: c, accent = ROLES.varsity.hex, onOpen, actions, showTrack = true }) {
  const s = projectStats(c);
  const role = ROLES[s.stage.owner] ?? ROLES.varsity;

  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.68rem] font-bold tracking-wide text-slate-400">{c.code}</span>
            <StageBadge status={c.status} size="sm" />
            {s.overdue.length > 0 && (
              <Chip color="#dc2626" bg="#fef2f2"><AlertTriangle size={11} />{s.overdue.length} delayed</Chip>
            )}
          </div>
          <p className="font-display font-bold text-[1rem] text-slate-900 mt-1 leading-snug">{c.title}</p>
          <p className="text-[0.72rem] text-slate-400 mt-0.5">
            {c.village}, {c.district}{c.university ? ` · ${c.university.short}` : ''}{c.team ? ` · ${c.team.name}` : ''}
          </p>
        </div>
        <ScoreRing value={s.completion} size={62} stroke={6} color={accent} sub="complete" />
      </div>

      <div>
        <div className="flex items-center justify-between text-[0.72rem] font-semibold mb-1.5">
          <span style={{ color: role.deep }}>Now · {s.stage.label}</span>
          <span className="text-slate-400">{s.next ? `Next · ${s.next.label}` : 'Lifecycle complete'}</span>
        </div>
        <Bar value={s.stagePct} color={accent} height={7} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Metric label="Milestones" value={s.milestonesTotal ? `${s.milestonesDone}/${s.milestonesTotal}` : '—'} icon={Icons.ListChecks} />
        <Metric label="Team" value={s.teamSize || '—'} icon={Icons.Users} />
        <Metric label="Industry" value={s.partners || '—'} icon={Icons.Factory} />
        <Metric label="Feedback" value={s.feedbackCount || '—'} icon={Icons.MessageSquare} />
      </div>

      {s.activeMilestone && (
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
          <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">Team is currently working on</p>
          <p className="text-[0.85rem] font-semibold text-slate-800 mt-0.5">{s.activeMilestone.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Bar value={s.activeMilestone.progress} color={accent} height={5} />
            <span className="text-[0.7rem] font-bold text-slate-500 shrink-0">{s.activeMilestone.progress}%</span>
          </div>
          <p className="text-[0.68rem] text-slate-400 mt-1">{s.activeMilestone.owner} · due {fmtDate(s.activeMilestone.due)}</p>
        </div>
      )}

      {showTrack && (
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
          <LifecycleTrack status={c.status} history={c.history} compact />
        </div>
      )}

      {(actions || onOpen) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {actions}
          {onOpen && (
            <button className="btn btn-ghost btn-sm ml-auto" onClick={() => onOpen(c)}>
              Open project <Icons.ArrowRight size={13} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
        <Icon size={12} /><span className="text-[0.62rem] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-display text-[0.95rem] font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Activity / reports feed
   ══════════════════════════════════════════════════════════════════════ */
export function ActivityFeed({ challenge: c }) {
  const items = [
    ...(c.activity ?? []).map((a) => ({
      at: a.at, title: a.action, detail: a.detail, who: a.actorName, role: a.actorRole,
    })),
    ...(c.history ?? []).map((h) => ({
      at: h.at, title: `Stage · ${stageMeta(h.stage).label}`, detail: h.note, who: ROLES[h.by]?.label ?? h.by, role: h.by,
    })),
    ...(c.updates ?? []).map((u) => ({ at: u.at, title: u.text, detail: null, who: u.by, role: u.role })),
    ...(c.feedback ?? []).map((f) => ({
      at: f.at, title: `Citizen feedback · ${f.rating}/5`, detail: f.comment, who: f.by, role: 'citizen',
    })),
    ...(c.reviews ?? []).map((r) => ({
      at: r.created_at || r.at, title: `Government review · ${r.decision === 'approved' ? 'Approved' : 'Changes requested'}`,
      detail: r.note, who: r.reviewer, role: 'govt',
    })),
  ].filter((i) => i.at).sort((a, b) => new Date(b.at) - new Date(a.at));

  if (!items.length) {
    return <Empty icon={Icons.History} title="No activity recorded yet" sub="Every status change, milestone, decision and feedback will be logged here." />;
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: 'var(--border-strong)' }} />
      {items.map((it, i) => {
        const role = ROLES[it.role] ?? ROLES.citizen;
        return (
          <motion.div key={`${it.at}-${i}`} className="relative pb-4 last:pb-0"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}>
            <span className="absolute -left-6 top-1 w-4 h-4 rounded-full ring-4" style={{ background: role.hex, '--tw-ring-color': 'var(--surface)' }} />
            <p className="text-[0.83rem] font-semibold text-slate-800 leading-snug">{it.title}</p>
            <p className="text-[0.7rem] text-slate-400 mt-0.5">
              {it.who || role.label} · {role.label} · {timeAgo(it.at)}
            </p>
            {it.detail && (
              <p className="text-[0.75rem] text-slate-500 mt-1 rounded-lg px-2.5 py-1.5" style={{ background: 'var(--surface-2)' }}>
                {it.detail}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Community feedback list
   ══════════════════════════════════════════════════════════════════════ */
export function Stars({ value = 0, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? 'text-amber-500' : 'text-slate-200'}
          fill={n <= value ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export function FeedbackList({ challenge: c }) {
  const list = c.feedback ?? [];
  if (!list.length) {
    return <Empty icon={Icons.MessageSquare} title="No community feedback yet" sub="Once the solution is deployed, citizens can rate it and report whether the problem is actually solved." />;
  }
  const avg = (list.reduce((s, f) => s + (f.rating || 0), 0) / list.length).toFixed(1);
  const solved = list.filter((f) => f.solved).length;

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card p-3.5">
          <p className="text-[0.66rem] font-bold uppercase text-slate-400">Average rating</p>
          <p className="font-display text-xl font-extrabold text-slate-900 mt-0.5">{avg}<span className="text-sm text-slate-400">/5</span></p>
          <Stars value={Math.round(avg)} />
        </div>
        <div className="card p-3.5">
          <p className="text-[0.66rem] font-bold uppercase text-slate-400">Problem solved</p>
          <p className="font-display text-xl font-extrabold text-emerald-600 mt-0.5">{Math.round((solved / list.length) * 100)}%</p>
          <p className="text-[0.68rem] text-slate-400">{solved} of {list.length} respondents</p>
        </div>
        <div className="card p-3.5">
          <p className="text-[0.66rem] font-bold uppercase text-slate-400">Responses</p>
          <p className="font-display text-xl font-extrabold text-slate-900 mt-0.5">{list.length}</p>
          <p className="text-[0.68rem] text-slate-400">linked to {c.code}</p>
        </div>
      </div>

      {list.map((f) => (
        <div key={f.id} className="card p-4 flex gap-3">
          <Avatar name={f.by || 'Citizen'} size={34} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[0.82rem] font-bold text-slate-800">{f.by || 'Citizen'}</p>
              <Stars value={f.rating} size={12} />
              {f.solved
                ? <Chip color="#059669" bg="#ecfdf5"><CheckCircle2 size={11} />Problem solved</Chip>
                : <Chip color="#b45309" bg="#fff7ed"><AlertTriangle size={11} />Still an issue</Chip>}
              <span className="text-[0.68rem] text-slate-400">{timeAgo(f.at)}</span>
            </div>
            {f.comment && <p className="text-[0.84rem] text-slate-700 mt-1.5 leading-relaxed">{f.comment}</p>}
            {f.suggestions && (
              <p className="text-[0.78rem] text-slate-500 mt-1.5 rounded-lg px-2.5 py-1.5" style={{ background: 'var(--surface-2)' }}>
                <b className="text-slate-600">Suggestion: </b>{f.suggestions}
              </p>
            )}
            {f.media?.length > 0 && <div className="mt-2"><EvidenceGallery attachments={f.media} title="Follow-up evidence" compact /></div>}
          </div>
        </div>
      ))}
    </div>
  );
}
