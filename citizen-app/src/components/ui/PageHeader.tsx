"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3.5 sm:px-6 shadow-xs">
      <button
        type="button"
        aria-label="Back"
        onClick={onBack ?? (() => router.back())}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
    </header>
  );
}
