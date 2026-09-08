"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/components/LanguageProvider";
import { CheckCircle2, FileText, Home } from "lucide-react";

function SuccessContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("id") || "JH-SUBMITTED";

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
        <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900">{t.successTitle}</h1>
      <p className="mt-2 text-sm text-slate-500">{t.successMessage}</p>

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t.challengeIdLabel}
        </p>
        <p className="mt-1 text-xl font-mono font-bold tracking-wider text-emerald-800">
          {challengeId}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t.statusLabel}
        </p>
        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          {t.statusSubmitted}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/reports"
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:brightness-105 transition"
        >
          <FileText className="h-4 w-4" />
          {t.goToMyReports}
        </Link>
        <Link
          href="/home"
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Home className="h-4 w-4" />
          {t.backToHome}
        </Link>
      </div>
    </div>
  );
}

export default function SubmissionSuccessPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-12 min-h-screen">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-800" />
            <p className="text-sm font-medium text-slate-500">Loading receipt...</p>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  );
}
