import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { MapPin, Users, Paperclip, Send, CheckCircle2, Circle, Clock } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { catMeta, ROLES, STAGE_INDEX } from '../../data/constants';
import { Modal, Tabs, Chip, Bar, ScoreRing, Avatar, Counter, Empty } from './ui';
import { AIClassification, AIPriority, AIDuplicates, MatchList, DisciplineWeb } from './AIPanel';
import { LifecycleTrack, HistoryTimeline, StageBadge } from '../workflow/Lifecycle';
import { fmtFull, fmtDate, timeAgo, priorityTone, cx } from '../../utils/format';

export default function ChallengeDetail({ challenge, open, onClose, role = 'citizen', actions }) {
  const { dispatch } = usePlatform();
  const [tab, setTab] = useState('overview');
  const [msg, setMsg] = useState('');
  const accent = ROLES[role]?.hex ?? '#4f46e5';

  const tabs = useMemo(() => {
    const t = [{ key: 'overview', label: 'Overview' }];
    if (challenge?.ai) t.push({ key: 'ai', label: 'AI Insights' });
    if (challenge?.team) t.push({ key: 'team', label: 'Team' });
    if (challenge?.proposal) t.push({ key: 'project', label: 'Project & Milestones' });
    if (challenge?.partners?.length) t.push({ key: 'partners', label: 'Partners' });
    if (challenge?.impact) t.push({ key: 'impact', label: 'Impact' });
    t.push({ key: 'timeline', label: 'Timeline' });
    t.push({ key: 'discussion', label: 'Discussion' });
    return t;
  }, [challenge]);

  if (!challenge) return null;
  const c = challenge;
  const cat = catMeta(c.category);
  const CatIcon = Icons[cat.icon] ?? Icons.Circle;
  const p = c.priority ? priorityTone(c.priority.level) : null;
  const activeTab = tabs.some((t) => t.key === tab) ? tab : 'overview';

  const send = () => {
    if (!msg.trim()) return;
    dispatch({
      type: 'POST_UPDATE', id: c.id, role,
      by: role === 'citizen' ? 'Citizen' : role === 'varsity' ? (c.university?.short ?? 'University Team') : role === 'industry' ? 'Industry Partner' : 'District Cell',
      text: msg.trim(),
    });
    setMsg('');
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-4xl" accent={accent}
      title={c.title}
      subtitle={`${c.code} · ${c.village}, ${c.district} · submitted ${timeAgo(c.createdAt)} by ${c.citizen.name}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip color={cat.hex}><CatIcon size={11} />{c.category}</Chip>
          {p && <span className="chip" style={{ background: p.bg, color: p.fg }}>Priority {c.priority.score} · {c.priority.level}</span>}
          <StageBadge status={c.status} />
          {c.validation?.status === 'validated' && <Chip color={ROLES.govt.hex} bg={ROLES.govt.soft}><CheckCircle2 size={11} />Government validated</Chip>}
          {c.university && <Chip color={ROLES.varsity.hex} bg={ROLES.varsity.soft}>{c.university.short}</Chip>}
          {c.partners?.map((pt) => <Chip key={pt.id} color={ROLES.industry.hex} bg={ROLES.industry.soft}>{pt.short}</Chip>)}
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <LifecycleTrack status={c.status} history={c.history} compact />
        </div>

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}

        <Tabs tabs={tabs} active={activeTab} onChange={setTab} accent={accent} />

        <div className="min-h-[160px]">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Problem description</p>
                <p className="text-[0.88rem] text-slate-700 leading-relaxed">{c.description}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Facts label="Location" value={`${c.village}`} sub={c.district} icon={MapPin} />
                <Facts label="People affected" value={fmtFull(c.affected)} sub="reported" icon={Users} />
                <Facts label="Community support" value={fmtFull(c.upvotes)} sub="endorsements" icon={Icons.ThumbsUp} />
                <Facts label="Submitted" value={fmtDate(c.createdAt)} sub={c.citizen.name} icon={Icons.Calendar} />
              </div>
              {c.attachments?.length > 0 && (
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {c.attachments.map((a) => (
                      <span key={a.name} className="inline-flex items-center gap-2 text-[0.75rem] font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                        <Paperclip size={12} className="text-slate-400" />{a.name}
                        <span className="text-slate-300">{a.size}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {c.validation?.note && (
                <div className="rounded-xl p-3" style={{ background: ROLES.govt.soft }}>
                  <p className="text-[0.72rem] font-bold" style={{ color: ROLES.govt.deep }}>
                    Government note · {c.validation.by} · {fmtDate(c.validation.at)}
                  </p>
                  <p className="text-[0.82rem] text-slate-700 mt-1">{c.validation.note}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ai' && c.ai && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-3">
              <AIClassification ai={c.ai} />
              <AIPriority priority={c.priority} />
              <AIDuplicates duplicates={c.ai.duplicates} />
              <DisciplineWeb disciplines={c.ai.disciplines} category={c.category} />
              <div className="md:col-span-2"><MatchList kind="university" matches={c.ai.universityMatches.slice(0, 3)} /></div>
              <div className="md:col-span-2"><MatchList kind="industry" matches={c.ai.industryMatches.slice(0, 3)} /></div>
            </motion.div>
          )}

          {activeTab === 'team' && c.team && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-display font-bold text-slate-900">{c.team.name}</p>
                  <p className="text-[0.72rem] text-slate-400">{c.university?.name} · formed {timeAgo(c.team.formedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.team.disciplines.map((d) => <Chip key={d} color={ROLES.varsity.hex} bg={ROLES.varsity.soft}>{d}</Chip>)}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {c.team.members.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card p-3 flex items-center gap-3">
                    <Avatar name={m.name} size={38} />
                    <div className="min-w-0">
                      <p className="text-[0.84rem] font-bold text-slate-800 truncate">{m.name}</p>
                      <p className="text-[0.7rem] text-slate-400 truncate">{m.role} · {m.dept}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.skills?.slice(0, 2).map((s) => <Chip key={s} color="#64748b">{s}</Chip>)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'project' && c.proposal && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="card p-4">
                <p className="font-display font-bold text-slate-900">{c.proposal.title}</p>
                <p className="text-[0.84rem] text-slate-600 mt-1.5 leading-relaxed">{c.proposal.objective}</p>
                <p className="text-[0.8rem] text-slate-500 mt-2"><b className="text-slate-600">Approach: </b>{c.proposal.approach}</p>
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100 text-[0.78rem]">
                  <span className="text-slate-500">Budget <b className="text-slate-800">{c.proposal.budget}</b></span>
                  <span className="text-slate-500">Duration <b className="text-slate-800">{c.proposal.duration}</b></span>
                  <span className="text-slate-500">Created <b className="text-slate-800">{fmtDate(c.proposal.createdAt)}</b></span>
                </div>
              </div>
              <MilestoneList milestones={c.milestones} challengeId={c.id} editable={role === 'varsity'} />
            </motion.div>
          )}

          {activeTab === 'partners' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-2 gap-3">
              {c.partners.map((pt) => (
                <div key={pt.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl grid place-items-center text-white font-bold"
                      style={{ background: `linear-gradient(135deg,${ROLES.industry.hex},#fb923c)` }}>
                      {pt.short[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[0.88rem] text-slate-900 truncate">{pt.name}</p>
                      <p className="text-[0.7rem] text-slate-400">{pt.type} · joined {timeAgo(pt.joinedAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {pt.supports.map((s) => <Chip key={s} color={ROLES.industry.deep} bg={ROLES.industry.soft}>{s}</Chip>)}
                  </div>
                  <p className="text-[0.78rem] text-slate-500 mt-2">Committed support: <b className="text-slate-800">{pt.amount}</b></p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'impact' && c.impact && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl p-5 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(120deg,#059669,#0891b2)' }}>
                <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10" />
                <p className="text-[0.72rem] font-bold uppercase tracking-widest opacity-80">Measured impact</p>
                <p className="font-display text-3xl font-extrabold mt-1">
                  <Counter to={c.impact.beneficiaries} /> <span className="text-lg font-bold opacity-90">people benefited</span>
                </p>
                <p className="text-[0.84rem] opacity-90 mt-1.5 max-w-lg">{c.impact.summary}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {c.impact.metrics.map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="card p-3.5">
                    <p className="font-display text-xl font-extrabold text-slate-900">
                      <Counter to={m.value} decimals={m.value % 1 !== 0 ? 1 : 0} suffix={m.unit} />
                    </p>
                    <p className="text-[0.7rem] text-slate-500 font-semibold mt-0.5">{m.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="card p-4 flex items-center gap-4">
                <ScoreRing value={c.impact.sustainability} color="#059669" size={68} sub="sustain." />
                <div>
                  <p className="font-display font-bold text-slate-900">Sustainability score</p>
                  <p className="text-[0.78rem] text-slate-500 mt-0.5">
                    Community ownership, maintenance plan, local capacity and recurring cost were assessed after handover.
                    Project duration: <b>{c.impact.durationMonths} months</b>.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <HistoryTimeline history={c.history} updates={c.updates} />
            </motion.div>
          )}

          {activeTab === 'discussion' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex gap-2">
                <input className="field" placeholder="Post an update to all stakeholders…" value={msg}
                  onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
                <button className="btn btn-primary" onClick={send} disabled={!msg.trim()}><Send size={15} />Post</button>
              </div>
              {c.updates?.length ? (
                <div className="space-y-2">
                  {c.updates.map((u) => (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="card p-3 flex gap-3">
                      <Avatar name={u.by} size={32} />
                      <div className="min-w-0">
                        <p className="text-[0.72rem] font-bold" style={{ color: ROLES[u.role]?.deep }}>
                          {u.by} <span className="text-slate-300 font-medium">· {timeAgo(u.at)}</span>
                        </p>
                        <p className="text-[0.85rem] text-slate-700 mt-0.5">{u.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Empty icon={Icons.MessageSquare} title="No updates yet"
                  sub="Stakeholder updates posted here are visible to the citizen, university, industry partner and government." />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function MilestoneList({ milestones = [], challengeId, editable = false }) {
  const { dispatch } = usePlatform();
  if (!milestones.length) return <Empty icon={Icons.ListChecks} title="No milestones yet" sub="Milestones are defined when the university publishes the project proposal." />;
  const done = milestones.filter((m) => m.status === 'completed').length;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-bold text-slate-900">Milestones</p>
        <span className="text-[0.75rem] font-semibold text-slate-500">{done} / {milestones.length} completed</span>
      </div>
      <Bar value={(done / milestones.length) * 100} color="#4f46e5" />
      <div className="mt-4 space-y-2.5">
        {milestones.map((m, i) => {
          const overdue = m.status !== 'completed' && new Date(m.due) < new Date();
          const Icon = m.status === 'completed' ? CheckCircle2 : m.status === 'in_progress' ? Clock : Circle;
          const color = m.status === 'completed' ? '#059669' : overdue ? '#dc2626' : m.status === 'in_progress' ? '#4f46e5' : '#cbd5e1';
          return (
            <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3">
              <Icon size={18} style={{ color }} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cx('text-[0.84rem] font-semibold', m.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800')}>{m.title}</p>
                  {overdue && <Chip color="#dc2626" bg="#fef2f2">Delayed</Chip>}
                </div>
                <p className="text-[0.7rem] text-slate-400">{m.owner} · due {fmtDate(m.due)}</p>
                {m.status === 'in_progress' && <div className="mt-1.5 max-w-xs"><Bar value={m.progress} color="#4f46e5" height={4} /></div>}
              </div>
              {editable && m.status !== 'completed' && (
                <button className="btn btn-ghost btn-sm shrink-0"
                  onClick={() => dispatch({ type: 'UPDATE_MILESTONE', id: challengeId, milestoneId: m.id, status: m.status === 'pending' ? 'in_progress' : 'completed' })}>
                  {m.status === 'pending' ? 'Start' : 'Complete'}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Facts({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1"><Icon size={13} /><span className="text-[0.66rem] font-bold uppercase tracking-wide">{label}</span></div>
      <p className="text-[0.88rem] font-bold text-slate-800 leading-tight">{value}</p>
      {sub && <p className="text-[0.68rem] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
