"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/components/LanguageProvider";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/report";
  const t = useT();

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/home"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.backToHome}</span>
        </Link>
      </div>

      <div className="my-auto flex w-full flex-col items-center justify-center">
        <AuthCard redirectPath={redirect} />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-emerald-950 text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

