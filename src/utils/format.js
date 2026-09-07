export const fmtNum = (n) => {
  const v = Number(n) || 0;
  if (v >= 10000000) return `${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(2)} L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return `${Math.round(v)}`;
};

export const fmtFull = (n) => (Number(n) || 0).toLocaleString('en-IN');

export const timeAgo = (iso) => {
  if (!iso) return '—';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

export const fmtDate = (iso) => (iso
  ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—');

/* Priority tones resolve through CSS variables so they work in both themes. */
export const priorityTone = (level) => ({
  CRITICAL: { bg: 'var(--tint-critical)', fg: 'var(--on-critical)', dot: '#ef4444' },
  HIGH: { bg: 'var(--tint-high)', fg: 'var(--on-high)', dot: '#f97316' },
  MEDIUM: { bg: 'var(--tint-medium)', fg: 'var(--on-medium)', dot: '#eab308' },
  LOW: { bg: 'var(--tint-low)', fg: 'var(--on-low)', dot: '#22c55e' },
}[level] ?? { bg: 'var(--surface-2)', fg: 'var(--muted)', dot: '#94a3b8' });

export const cx = (...a) => a.filter(Boolean).join(' ');
