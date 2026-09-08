"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/components/LanguageProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchChallengeDetail, type SubmittedProblem } from "@/lib/problemClient";
import { ArrowLeft, MapPin, Calendar, Tag, AlertCircle } from "lucide-react";

function DetailContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [problem, setProblem] = useState<SubmittedProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No challenge ID specified");
      return;
    }

    let isMounted = true;
    fetchChallengeDetail(id)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setProblem(data);
        } else {
          setError("Challenge not found");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Error fetching details");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-800" />
        <p className="mt-3 text-sm font-medium text-slate-500">{t.loading}</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Record Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">
          The requested report could not be found or you may not have access to it.
        </p>
        <Link
          href="/reports"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.goToMyReports}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold tracking-wider text-slate-700">
          {problem.challengeId}
        </span>
        <StatusBadge status={problem.status} />
      </div>

      <h2 className="text-2xl font-bold text-slate-900">{problem.title}</h2>

      <Row label={t.fieldDescription} value={problem.description} />
      {problem.category && <Row label={t.fieldCategory} value={problem.category} />}
      <Row label={t.fieldDistrict} value={problem.district} />
      <Row label={t.fieldVillage} value={problem.villageLocality} />
      {problem.peopleAffected != null && (
        <Row label={t.fieldPeopleAffected} value={String(problem.peopleAffected)} />
      )}
      <Row
        label={t.fieldLocation}
        value={
          problem.latitude != null && problem.longitude != null
            ? `${problem.latitude.toFixed(5)}, ${problem.longitude.toFixed(5)}`
            : t.locationUnavailable
        }
      />
      <Row
        label={t.submissionDate}
        value={new Date(problem.createdAt).toLocaleString()}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          {t.attachedEvidence}
        </p>
        {problem.evidence.length === 0 ? (
          <p className="text-sm text-slate-400">{t.noEvidence}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {problem.evidence.map((e) => (
              <a
                key={e.id}
                href={e.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-square"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.fileUrl}
                  alt="Evidence"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-xs">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value}</p>
    </div>
  );
}

export default function ReportDetailPage() {
  const t = useT();

  return (
    <main className="flex flex-1 flex-col bg-slate-50 min-h-screen">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3.5 sm:px-6">
        <Link
          href="/reports"
          aria-label="Back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-lg font-bold text-slate-900">{t.reportDetailsTitle}</h1>
      </header>

      <Suspense
        fallback={
          <div className="flex flex-1 flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-800" />
            <p className="mt-3 text-sm font-medium text-slate-500">{t.loading}</p>
          </div>
        }
      >
        <DetailContent />
      </Suspense>
    </main>
  );
}
