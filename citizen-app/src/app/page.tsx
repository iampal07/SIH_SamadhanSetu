"use client";

import { useRouter } from "next/navigation";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Shield, Check } from "lucide-react";

export default function LanguageSelectPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  function choose(code: LanguageCode) {
    setLanguage(code);
  }

  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 px-6 py-12 text-white">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 backdrop-blur-md shadow-lg shadow-emerald-950/40 border border-emerald-400/20">
          <Shield className="h-8 w-8" />
        </div>
        <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-emerald-300 border border-emerald-400/30">
          समाधान सेतु · झारखंड
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t.appName}
        </h1>
        <p className="mt-1 text-lg text-emerald-100/90">{t.welcome}</p>
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-white p-7 text-slate-900 shadow-2xl shadow-emerald-950/40 backdrop-blur-md">
        <h2 className="mb-4 text-center text-lg font-bold text-slate-900">
          {t.chooseLanguage}
        </h2>

        <div className="flex flex-col gap-3">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => choose(lang.code)}
                className={`flex min-h-14 items-center justify-between rounded-2xl border-2 px-5 text-lg font-bold transition-all active:scale-[0.99] ${
                  isSelected
                    ? "border-emerald-700 bg-emerald-50/90 text-emerald-900 shadow-xs"
                    : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{lang.label}</span>
                {isSelected && <Check className="h-5 w-5 text-emerald-700" />}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <Button onClick={() => router.push("/home")}>{t.continue}</Button>
        </div>
      </div>
    </main>
  );
}
