import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { DICT, LANGS } from '../i18n/dictionary';

const AppShellContext = createContext(null);

const THEME_KEY = 'samadhan_theme';
const LANG_KEY = 'samadhan_lang';

function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch { return 'light'; }
}

function initialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANGS.some((l) => l.code === saved) ? saved : 'en';
  } catch { return 'en'; }
}

export function AppShellProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang === 'kho' ? 'hi' : lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
  }, [lang]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  /**
   * t('some.key', 'English fallback', { count: 3 })
   * Falls back: current language → English → provided fallback → the key itself.
   */
  const t = useCallback((key, fallback, vars) => {
    const raw = DICT[lang]?.[key] ?? DICT.en?.[key] ?? fallback ?? key;
    if (!vars) return raw;
    return Object.keys(vars).reduce((s, k) => s.replaceAll(`{${k}}`, vars[k]), raw);
  }, [lang]);

  const value = useMemo(() => ({
    theme, setTheme, toggleTheme, isDark: theme === 'dark',
    lang, setLang, langs: LANGS, t,
  }), [theme, toggleTheme, lang, t]);

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error('useShell must be used inside AppShellProvider');
  return ctx;
}

/** Convenience hook when a component only needs translation. */
export function useT() {
  return useShell().t;
}
