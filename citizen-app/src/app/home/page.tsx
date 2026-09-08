"use client";

import Link from "next/link";
import { useT } from "@/components/LanguageProvider";
import { useAuth } from "@/components/AuthProvider";
import { Navbar } from "@/components/ui/Navbar";
import {
  PlusCircle,
  FileText,
  Bell,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  GraduationCap,
  MapPin,
} from "lucide-react";

export default function HomePage() {
  const t = useT();
  const { user } = useAuth();

  const citizenName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : null);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col pb-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 px-6 py-10 text-white sm:py-14">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-300 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>SIH 2026 · SamadhanSetu · Jharkhand</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {citizenName ? `${t.welcomeCitizen}, ${citizenName}!` : t.welcomeCitizen}
            </h1>
            <p className="mt-2.5 max-w-2xl text-base text-emerald-100/90 sm:text-lg">
              {t.homeGreeting}
            </p>

            {/* Quick Stakeholder Pills */}
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-emerald-200/90">
              <span className="flex items-center gap-1 rounded-lg bg-emerald-900/60 px-2.5 py-1 border border-emerald-700/50">
                <MapPin className="h-3 w-3 text-emerald-400" /> 24 Jharkhand Districts
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-emerald-900/60 px-2.5 py-1 border border-emerald-700/50">
                <Building2 className="h-3 w-3 text-teal-400" /> District Administration
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-emerald-900/60 px-2.5 py-1 border border-emerald-700/50">
                <GraduationCap className="h-3 w-3 text-cyan-400" /> Universities & R&D
              </span>
            </div>
          </div>
        </section>

        {/* Action Hub Cards */}
        <section className="mx-auto -mt-6 w-full max-w-4xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Report a Problem Card */}
            <Link
              href="/report"
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-600/20 bg-gradient-to-br from-emerald-900 to-teal-900 p-6 text-white shadow-xl shadow-emerald-950/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/30 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 backdrop-blur-md transition group-hover:scale-110 group-hover:bg-white/20">
                  <PlusCircle className="h-8 w-8" />
                </div>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Step 1
                </span>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{t.reportProblem}</span>
                  <ChevronRight className="h-5 w-5 text-emerald-300 transition-transform group-hover:translate-x-1" />
                </h2>
                <p className="mt-1 text-sm text-emerald-100/80">
                  {t.reportProblemHint}
                </p>
              </div>
            </Link>

            {/* My Reports Card */}
            <Link
              href="/reports"
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition-all hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-xl active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 transition group-hover:scale-110 group-hover:bg-emerald-100">
                  <FileText className="h-8 w-8" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Live Tracking
                </span>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <span>{t.myReports}</span>
                  <ChevronRight className="h-5 w-5 text-emerald-700 transition-transform group-hover:translate-x-1" />
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t.myReportsHint}
                </p>
              </div>
            </Link>
          </div>

          {/* Real-time Civic Lifecycle Notification Banner */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t.notifications}</h3>
                <p className="text-xs text-slate-500">{t.notificationsComingSoon}</p>
              </div>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Realtime
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
