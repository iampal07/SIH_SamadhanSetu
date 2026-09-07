import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
  Brain, Sparkles, Gauge, Copy, GraduationCap, Factory, Languages, RefreshCw,
  AlertTriangle, Clock, ArrowRight, CheckCircle2, Cpu, Database,
} from 'lucide-react';
import PublicNav from '../../components/navigation/PublicNav';
import { Footer } from '../Home/PublicLayout';
import { Stat, Chip, Bar, ScoreRing, Counter, Empty, SearchInput, Select, Reveal } from '../../components/shared/ui';
import { CategoryDonut, VBar } from '../../components/charts/Charts';
import { usePlatform } from '../../context/PlatformContext';
import { useShell } from '../../context/AppShellContext';
import { fetchAiStats } from '../../services/aiService';
import { catMeta, CATEGORY_KEYS, ROLES } from '../../data/constants';
import { timeAgo, fmtFull, priorityTone, cx } from '../../utils/format';

/**
 * AI Intelligence — the production view of what the model actually produced.
 * Everything on this page is read back from public.ai_analysis; nothing is
 * invented in the UI.
 */
export default function AIIntelligence() {
  const { challenges, analyseChallenge, aiBusy, source } = usePlatform();
  const { t } = useShell();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAiStats();
      setRows(data ?? []);
      setError(data ? null : 'AI analysis store unavailable');
    } catch (e) {
      setError(e.message ?? String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [challenges.length]);

  const analysed = useMemo(() => challenges.filter((c) => c.ai), [challenges]);
  const unanalysed = useMemo(() => challenges.filter((c) => !c.ai), [challenges]);

  const list = useMemo(() => analysed.filter((c) => (
    (cat === 'All' || c.category === cat)
    && (c.title + c.code).toLowerCase().includes(q.toLowerCase())
  )), [analysed, cat, q]);

  const active = selected ? challenges.find((c) => c.id === selected) : list[0];

  const stats = useMemo(() => {
    const r = rows ?? [];
    const gemini = r.filter((x) => x.engine === 'gemini').length;
    const avgConf = r.length ? Math.round(r.reduce((s, x) => s + (x.category_confidence ?? 0), 0) / r.length) : 0;
    const avgMs = r.length ? Math.round(r.reduce((s, x) => s + (x.duration_ms ?? 0), 0) / r.length) : 0;
    const dupes = r.reduce((s, x) => s + (x.duplicate_count ?? 0), 0);
    const byCat = {};
    r.forEach((x) => { byCat[x.category] = (byCat[x.category] ?? 0) + 1; });
    const byLevel = {};
    r.forEach((x) => { byLevel[x.priority_level] = (byLevel[x.priority_level] ?? 0) + 1; });
    return {
      total: r.length, gemini, avgConf, avgMs, dupes,
      byCategory: Object.entries(byCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byLevel: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((name) => ({ name, value: byLevel[name] ?? 0 })),
      engine: gemini > 0 ? 'Gemini' : 'Deterministic',
      model: r[0]?.model ?? '—',
    };
  }, [rows]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <PublicNav />
      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* header */}
          <div className="rounded-3xl p-5 sm:p-7 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(120deg,#4f46e5,#7c3aed 55%,#0891b2)' }}>
            <motion.div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/10 anim-float" />
            <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[0.7rem] font-bold uppercase tracking-widest">
                  <Cpu size={12} /> {t('ai.section.eyebrow', 'AI Intelligence Layer')}
                </div>
                <h1 className="font-display text-2xl sm:text-4xl font-extrabold mt-2 leading-tight">
                  {t('ai.section.title', 'Every challenge, decoded by the model')}
                </h1>
                <p className="text-white/85 text-[0.92rem] mt-2 max-w-2xl">
                  {t('ai.section.sub', 'Language detection, domain classification, severity and priority scoring, duplicate clustering and stakeholder matching — produced server-side and stored against each challenge.')}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="chip bg-white/15 text-white"><Sparkles size={11} />{stats.engine}</span>
                  <span className="chip bg-white/15 text-white">{stats.model}</span>
                  <span className="chip bg-white/15 text-white"><Database size={11} />public.ai_analysis</span>
                  <span className="chip bg-white/15 text-white">
                    {source === 'supabase' ? t('ai.live', 'Live database') : t('ai.offline', 'Offline dataset')}
                  </span>
                </div>
              </div>
              <button onClick={load} className="btn bg-white text-indigo-700 hover:bg-white/90 shrink-0">
                <RefreshCw size={15} className={cx(loading && 'animate-spin')} />{t('common.refresh', 'Refresh')}
              </button>
            </div>
          </div>

          {/* platform stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <Stat icon={Brain} label={t('ai.stat.analysed', 'Challenges analysed')} value={stats.total} color="#7c3aed" />
            <Stat icon={Gauge} label={t('ai.stat.confidence', 'Mean classification confidence')} value={stats.avgConf} suffix="%" color="#6366f1" delay={0.08} />
            <Stat icon={Copy} label={t('ai.stat.duplicates', 'Duplicate links detected')} value={stats.dupes} color="#f59e0b" delay={0.16} />
            <Stat icon={Clock} label={t('ai.stat.latency', 'Mean pipeline latency')} value={stats.avgMs} suffix=" ms" color="#0891b2" delay={0.24} />
          </div>

          {error && (
            <div className="card p-4 mt-4 flex items-center gap-3" style={{ borderColor: 'var(--on-critical)' }}>
              <AlertTriangle size={18} style={{ color: 'var(--on-critical)' }} />
              <p className="text-[0.86rem] text-slate-700 flex-1">{error}</p>
              <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} />{t('common.retry', 'Retry')}</button>
            </div>
          )}

          {/* distribution */}
          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <div className="card p-5">
              <p className="font-display font-bold text-slate-900">{t('ai.chart.domains', 'Classification output by domain')}</p>
              <p className="text-[0.76rem] text-slate-400 mb-1">{t('ai.chart.domainsSub', 'What the model decided each challenge is about')}</p>
              {stats.byCategory.length
                ? <CategoryDonut data={stats.byCategory.map((d) => ({ ...d, key: d.name, name: t(`cat.${d.name}`, d.name) }))} height={230} />
                : <Empty icon={Icons.PieChart} title={t('ai.empty.title', 'No analyses yet')} />}
            </div>
            <div className="card p-5">
              <p className="font-display font-bold text-slate-900">{t('ai.chart.priority', 'Priority distribution')}</p>
              <p className="text-[0.76rem] text-slate-400 mb-1">{t('ai.chart.prioritySub', 'Criticality score bucketed by level')}</p>
              <VBar data={stats.byLevel.map((d) => ({ ...d, name: t(`priority.${d.name}`, d.name) }))} color="#7c3aed" height={230} />
            </div>
          </div>

          {/* analysis explorer */}
          <div className="card p-4 mt-5 flex flex-wrap gap-3 items-center">
            <SearchInput value={q} onChange={setQ} placeholder={t('ai.search', 'Search analysed challenges…')} className="flex-1 min-w-[220px]" />
            <Select value={cat} onChange={setCat} className="w-auto"
              options={[{ value: 'All', label: t('common.all') }, ...CATEGORY_KEYS.map((c) => ({ value: c, label: t(`cat.${c}`, c) }))]} />
            <Chip color="#7c3aed">{list.length} {t('ai.results', 'results')}</Chip>
          </div>

          <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 mt-4">
            {/* list */}
            <div className="card p-3 max-h-[640px] overflow-y-auto">
              {list.length === 0 && <Empty icon={Brain} title={t('ai.empty.title', 'No analyses yet')} sub={t('ai.empty.sub', 'Submit a challenge to see the model output here.')} />}
              {list.map((c) => {
                const on = active?.id === c.id;
                const tone = c.priority ? priorityTone(c.priority.level) : null;
                return (
                  <button key={c.id} onClick={() => setSelected(c.id)}
                    className={cx('w-full text-left p-3 rounded-xl transition mb-1', on ? 'ring-1 ring-indigo-400' : 'hover:bg-slate-50')}
                    style={on ? { background: 'var(--tint-ai)' } : undefined}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[0.66rem] font-bold text-slate-400">{c.code}</span>
                      {tone && <span className="chip" style={{ background: tone.bg, color: tone.fg }}>{c.priority.score}</span>}
                      <Chip color={catMeta(c.category).hex}>{t(`cat.${c.category}`, c.category)}</Chip>
                    </div>
                    <p className="text-[0.84rem] font-semibold text-slate-800 mt-1 line-clamp-2">{c.title}</p>
                    <p className="text-[0.68rem] text-slate-400 mt-0.5">
                      {c.ai?.engine === 'gemini' ? 'Gemini' : 'Heuristic'} · {timeAgo(c.ai?.analysedAt ?? c.createdAt)}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* detail */}
            <div className="min-w-0">
              {active ? <AnalysisReport c={active} busy={!!aiBusy[active.id]} onRerun={() => analyseChallenge(active.id)} t={t} />
                : <div className="card p-8"><Empty icon={Brain} title={t('ai.empty.title', 'No analyses yet')} /></div>}
            </div>
          </div>

          {/* queue */}
          {unanalysed.length > 0 && (
            <div className="card p-5 mt-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <p className="font-display font-bold text-slate-900">{t('ai.queue.title', 'Awaiting analysis')}</p>
                  <p className="text-[0.76rem] text-slate-400">{t('ai.queue.sub', 'Challenges submitted but not yet processed by the model')}</p>
                </div>
                <Chip color="#f59e0b">{unanalysed.length}</Chip>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {unanalysed.slice(0, 6).map((c) => (
                  <div key={c.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-[0.66rem] font-bold text-slate-400">{c.code}</p>
                    <p className="text-[0.84rem] font-semibold text-slate-800 line-clamp-2">{c.title}</p>
                    <button className="btn btn-primary btn-sm mt-2 w-full" disabled={!!aiBusy[c.id]}
                      onClick={() => analyseChallenge(c.id)}>
                      {aiBusy[c.id]
                        ? <><RefreshCw size={12} className="animate-spin" />{t('ai.running', 'Analysing…')}</>
                        : <><Sparkles size={12} />{t('ai.run', 'Run AI analysis')}</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ── One full analysis report ───────────────────────────────────────────── */
function AnalysisReport({ c, busy, onRerun, t }) {
  const a = c.ai;
  const cat = catMeta(a?.category ?? c.category);
  const tone = c.priority ? priorityTone(c.priority.level) : null;

  return (
    <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold text-slate-400">{c.code} · {c.village}, {c.district}</p>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">{c.title}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Chip color="#7c3aed" bg="var(--tint-ai)">
                <Cpu size={11} />{a?.engine === 'gemini' ? `Gemini · ${a.model}` : (a?.model ?? 'heuristic')}
              </Chip>
              {a?.analysedAt && <Chip color="#64748b"><Clock size={11} />{timeAgo(a.analysedAt)}</Chip>}
              {a?.durationMs != null && <Chip color="#0891b2">{a.durationMs} ms</Chip>}
              <Chip color="#059669"><CheckCircle2 size={11} />{t('ai.status.completed', 'Completed')}</Chip>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm shrink-0" onClick={onRerun} disabled={busy}>
            <RefreshCw size={13} className={cx(busy && 'animate-spin')} />
            {busy ? t('ai.running', 'Analysing…') : t('ai.rerun', 'Re-run analysis')}
          </button>
        </div>
        {c.aiError && (
          <div className="mt-3 rounded-xl px-3 py-2 text-[0.8rem] font-semibold flex items-center gap-2"
            style={{ background: 'var(--tint-critical)', color: 'var(--on-critical)' }}>
            <AlertTriangle size={14} />{c.aiError}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* classification */}
        <div className="card p-4">
          <Head icon={Sparkles} title={t('ai.classification')} tag={t('ai.model')} />
          <div className="flex items-center gap-4 mt-3">
            <ScoreRing value={a?.classification?.confidence ?? 0} color={cat.hex} size={68} sub={t('ai.confidence')} />
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold" style={{ color: cat.hex }}>
                {t(`cat.${a?.category ?? c.category}`, a?.category ?? c.category)}
              </p>
              <p className="text-[0.72rem] text-slate-500">{t('ai.autoDomain')}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(a?.classification?.keywords ?? []).slice(0, 6).map((k) => <Chip key={k} color="#64748b">{k}</Chip>)}
              </div>
            </div>
          </div>
          {(a?.classification?.alternates ?? []).length > 0 && (
            <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wide">{t('ai.alternates')}</p>
              {a.classification.alternates.map((x) => (
                <div key={x.category} className="flex items-center gap-2">
                  <span className="text-[0.74rem] text-slate-600 w-36 truncate">{t(`cat.${x.category}`, x.category)}</span>
                  <Bar value={x.confidence} color={catMeta(x.category).hex} height={5} />
                  <span className="text-[0.7rem] font-bold text-slate-400 w-8 text-right">{x.confidence}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* severity + priority */}
        <div className="card p-4">
          <Head icon={Gauge} title={t('ai.priority')} tag={t('ai.priorityTag')} />
          <div className="flex items-center gap-4 mt-3">
            {tone && (
              <div className="rounded-2xl px-4 py-3 text-center shrink-0" style={{ background: tone.bg }}>
                <p className="font-display text-3xl font-extrabold" style={{ color: tone.fg }}>
                  <Counter to={c.priority.score} />
                </p>
                <p className="text-[0.62rem] font-bold tracking-wider" style={{ color: tone.fg }}>
                  / 100 · {t(`priority.${c.priority.level}`, c.priority.level)}
                </p>
              </div>
            )}
            <div className="flex-1 space-y-1.5 min-w-0">
              {Object.entries(a?.priority?.factors ?? {}).map(([k, v], i) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-[0.7rem] text-slate-500 w-28 capitalize truncate">{t(`ai.f.${k}`, k)}</span>
                  <Bar value={Number(v)} color={tone?.dot ?? '#6366f1'} height={5} delay={i * 0.06} />
                  <span className="text-[0.66rem] font-bold text-slate-400 w-7 text-right">{Math.round(Number(v))}</span>
                </div>
              ))}
            </div>
          </div>
          {a?.severity?.score != null && (
            <p className="text-[0.78rem] text-slate-500 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <b className="text-slate-700">{t('ai.severity', 'Severity')} {a.severity.score}/10.</b>{' '}
              {a.severity.reasoning}
            </p>
          )}
        </div>

        {/* language */}
        <div className="card p-4">
          <Head icon={Languages} title={t('ai.language', 'Language detection & translation')} tag={t('ai.languageTag', 'Khortha · Nagpuri · Sadri · Hindi · English')} />
          <div className="mt-3 space-y-2">
            <Row label={t('ai.detected', 'Detected')} value={a?.detectedLanguage ?? '—'} />
            <Row label={t('ai.confidence')} value={`${Math.round((a?.languageConfidence ?? 0) * 100)}%`} />
          </div>
          {a?.englishText && (
            <p className="mt-2 text-[0.78rem] text-slate-500 rounded-xl p-2.5 line-clamp-4" style={{ background: 'var(--surface-2)' }}>
              {a.englishText}
            </p>
          )}
        </div>

        {/* duplicates */}
        <div className="card p-4">
          <Head icon={Copy} title={t('ai.duplicates')} tag={t('ai.duplicatesTag', '', { n: a?.duplicates?.length ?? 0 })} />
          {(a?.duplicates ?? []).length === 0
            ? <p className="text-[0.8rem] text-slate-400 mt-3">{t('ai.noDuplicates')}</p>
            : (
              <div className="mt-3 space-y-2">
                {a.duplicates.map((d) => (
                  <div key={d.id} className="rounded-xl p-2.5" style={{ background: 'var(--surface-2)' }}>
                    <div className="flex items-center gap-2">
                      <p className="text-[0.78rem] font-semibold text-slate-800 truncate flex-1">{d.title}</p>
                      <span className="text-[0.74rem] font-extrabold text-slate-700">{d.similarity}%</span>
                    </div>
                    <Bar value={d.similarity} color={d.similarity > 85 ? '#ef4444' : d.similarity > 70 ? '#f97316' : '#eab308'} height={4} />
                    {d.reasoning && <p className="text-[0.7rem] text-slate-500 mt-1">{d.reasoning}</p>}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* required expertise */}
      {(a?.requiredExpertise ?? []).length > 0 && (
        <div className="card p-4">
          <Head icon={Icons.Layers} title={t('ai.expertise', 'Required expertise')} tag={t('ai.disciplinesTag')} />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {a.requiredExpertise.map((e) => (
              <span key={e} className="chip" style={{ background: 'var(--tint-ai)', color: 'var(--on-ai)' }}>{e}</span>
            ))}
          </div>
        </div>
      )}

      {/* matches */}
      <div className="grid lg:grid-cols-2 gap-4">
        <MatchPanel title={t('ai.uniMatch')} tag={t('ai.uniMatchTag')} icon={GraduationCap}
          role={ROLES.varsity} items={a?.universityMatches ?? []} t={t} />
        <MatchPanel title={t('ai.indMatch')} tag={t('ai.indMatchTag')} icon={Factory}
          role={ROLES.industry} items={a?.industryMatches ?? []} t={t} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/government/challenges" className="btn btn-ghost btn-sm">
          {t('ai.openGovt', 'Open in validation queue')} <ArrowRight size={13} />
        </Link>
        <Link to="/university/challenges" className="btn btn-ghost btn-sm">
          {t('ai.openVarsity', 'Open in university queue')} <ArrowRight size={13} />
        </Link>
      </div>
    </motion.div>
  );
}

function MatchPanel({ title, tag, icon, role, items, t }) {
  return (
    <div className="card p-4">
      <Head icon={icon} title={title} tag={tag} />
      <div className="mt-3 space-y-2.5">
        {items.length === 0 && <p className="text-[0.8rem] text-slate-400">{t('common.noResults')}</p>}
        {items.slice(0, 3).map((m, i) => (
          <div key={m.id} className="rounded-xl border p-3 flex items-start gap-3"
            style={{ borderColor: i === 0 ? role.hex : 'var(--border)' }}>
            <ScoreRing value={m.score} size={52} stroke={5} color={role.hex} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-bold text-[0.88rem] text-slate-900">{m.name}</p>
                {i === 0 && <Chip color={role.hex} bg={role.soft}>{t('ai.bestMatch')}</Chip>}
              </div>
              <p className="text-[0.7rem] text-slate-400">{m.type} · {m.district ?? m.hq}</p>
              <ul className="mt-1 space-y-0.5">
                {(m.reasons ?? []).slice(0, 2).map((r) => (
                  <li key={r} className="text-[0.72rem] text-slate-500 flex gap-1.5">
                    <CheckCircle2 size={11} className="mt-0.5 shrink-0" style={{ color: role.hex }} />{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Head({ icon: Icon, title, tag }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
        style={{ background: 'var(--tint-ai)', color: 'var(--on-ai)' }}>
        <Icon size={16} strokeWidth={2.3} />
      </div>
      <div className="min-w-0">
        <p className="font-display font-bold text-[0.9rem] text-slate-900 leading-tight">{title}</p>
        {tag && <p className="text-[0.68rem] text-slate-400 mt-0.5">{tag}</p>}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <p className="text-[0.78rem] flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <b className="text-slate-800">{value}</b>
    </p>
  );
}
