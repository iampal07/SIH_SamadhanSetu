"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/components/LanguageProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AuthCard } from "@/components/AuthCard";
import { fetchCitizenChallenges, type SubmittedProblem } from "@/lib/problemClient";
import { ArrowLeft, MapPin, Calendar, PlusCircle, Tag } from "lucide-react";

export default function MyReportsPage() {
  const t = useT();
  const { user, loading: authLoading } = useAuth();
  const [problems, setProblems] = useState<SubmittedProblem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    fetchCitizenChallenges(user.id)
      .then((data) => {
        if (isMounted) setProblems(data);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <main className="flex flex-1 flex-col bg-slate-50 min-h-screen">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="truncate text-lg font-bold text-slate-900">{t.myReportsTitle}</h1>
            <p className="text-xs text-slate-500">{problems.length} problem(s) recorded</p>
          </div>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-105 transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{t.reportProblem}</span>
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3.5 px-4 py-6">
        {authLoading || loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-800" />
            <p className="mt-3 text-sm font-medium text-slate-500">{t.loading}</p>
          </div>
        ) : !user ? (
          <div className="mx-auto w-full max-w-md py-8">
            <AuthCard embedded={true} redirectPath="/reports" />
          </div>
        ) : problems.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <PlusCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">{t.noReportsYet}</p>
              <p className="mt-1 text-xs text-slate-500">
                Your submitted societal issues will appear here for live tracking.
              </p>
            </div>
            <Link
              href="/report"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 px-6 py-3 font-semibold text-white shadow-sm hover:brightness-105 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{t.reportProblemCta}</span>
            </Link>
          </div>
        ) : (
          problems.map((p) => (
            <Link
              key={p.id}
              href={`/reports/detail?id=${encodeURIComponent(p.challengeId)}`}
              className="group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-600/40 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    {p.challengeId}
                  </span>
                  <h2 className="mt-1.5 truncate text-lg font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                    {p.title}
                  </h2>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
                {p.category && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Tag className="h-3.5 w-3.5 text-emerald-600" />
                    {p.category}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  {p.district}
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
