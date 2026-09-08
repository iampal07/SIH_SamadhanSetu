"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage, useT } from "@/components/LanguageProvider";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n";
import { LogIn, LogOut, Globe, Shield, User as UserIcon } from "lucide-react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = useT();

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link href="/home" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-600 text-white shadow-sm shadow-emerald-900/20 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-base font-bold leading-tight tracking-tight text-slate-900">
              समाधान सेतु
            </span>
            <span className="block text-xs font-medium text-emerald-800">
              {t.appName}
            </span>
          </div>
        </Link>

        {/* Right controls: Language + Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="relative flex items-center">
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    language === lang.code
                      ? "bg-white text-emerald-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title={lang.label}
                >
                  {lang.code === "en" ? "EN" : lang.code === "hi" ? "हिं" : "खो"}
                </button>
              ))}
            </div>
          </div>

          {/* User Auth Pill */}
          {user ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 pl-2.5 pr-1.5 py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white uppercase">
                {user.email ? user.email[0] : "U"}
              </div>
              <span className="hidden text-xs font-medium text-slate-700 md:inline max-w-[120px] truncate">
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-red-600 transition"
                title={t.signOut}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-105 transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{t.signIn}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
