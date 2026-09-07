import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Languages, Check } from 'lucide-react';
import { useShell } from '../../context/AppShellContext';
import { cx } from '../../utils/format';

export function ThemeToggle({ compact = false, className = '' }) {
  const { theme, toggleTheme, t } = useShell();
  const dark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      title={dark ? t('nav.theme.light') : t('nav.theme.dark')}
      aria-label={dark ? t('nav.theme.light') : t('nav.theme.dark')}
      className={cx(
        'relative grid place-items-center rounded-xl border transition-colors overflow-hidden shrink-0',
        compact ? 'w-9 h-9' : 'w-10 h-10',
        className,
      )}
      style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--ink)' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 14, opacity: 0, rotate: -35 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 35 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 grid place-items-center"
        >
          {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-500" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function LanguageSwitch({ compact = false, align = 'right' }) {
  const { lang, setLang, langs, t } = useShell();
  const [open, setOpen] = useState(false);
  const active = langs.find((l) => l.code === lang) ?? langs[0];

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        title={t('nav.language')}
        aria-label={t('nav.language')}
        className={cx('inline-flex items-center gap-1.5 rounded-xl border font-semibold transition-colors',
          compact ? 'h-9 px-2.5 text-[0.72rem]' : 'h-10 px-3 text-[0.78rem]')}
        style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--ink)' }}
      >
        <Languages size={15} className="opacity-70" />
        <span>{active.short}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className={cx('absolute top-11 w-44 rounded-2xl border p-1.5 z-50 shadow-xl', align === 'right' ? 'right-0' : 'left-0')}
              style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)' }}
            >
              <p className="px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                {t('nav.language')}
              </p>
              {langs.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-[0.84rem] font-semibold transition hover:bg-slate-50"
                  style={{ color: l.code === lang ? '#6366f1' : 'var(--ink)' }}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-[0.7rem] font-bold opacity-60">{l.short}</span>
                    {l.native}
                  </span>
                  {l.code === lang && <Check size={14} strokeWidth={3} />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShellControls({ compact = false }) {
  return (
    <div className="flex items-center gap-2">
      <LanguageSwitch compact={compact} />
      <ThemeToggle compact={compact} />
    </div>
  );
}
