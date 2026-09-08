"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  dictionaries,
  type Dictionary,
  type LanguageCode,
} from "@/lib/i18n";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Dictionary;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Reading localStorage must happen post-mount to avoid an SSR/client
    // hydration mismatch (the server always renders the default language).
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && stored in dictionaries) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguageState(stored as LanguageCode);
      }
    } catch {
      // localStorage unavailable — fall back to default language silently.
    }
    setReady(true);
  }, []);

  function setLanguage(lang: LanguageCode) {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Non-fatal: language just won't persist across visits.
    }
    // Also mirror to a cookie so server-rendered pages (e.g. the success
    // screen) can read the chosen language without a client round-trip.
    document.cookie = `${LANGUAGE_STORAGE_KEY}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: dictionaries[language],
    ready,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
