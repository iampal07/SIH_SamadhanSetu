"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/report";

    if (code) {
      supabaseClient.auth
        .exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (!error && data?.session) {
            router.replace(next);
          } else {
            router.replace("/login?error=oauth_failed");
          }
        })
        .catch(() => {
          router.replace("/login?error=oauth_failed");
        });
    } else {
      router.replace(next);
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-800" />
      <p className="mt-3 text-sm font-medium text-slate-500">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <CallbackHandler />
    </Suspense>
  );
}
