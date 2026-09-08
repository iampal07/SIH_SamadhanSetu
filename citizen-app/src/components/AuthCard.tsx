"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useT } from "@/components/LanguageProvider";
import { Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface AuthCardProps {
  onSuccess?: () => void;
  redirectPath?: string;
  embedded?: boolean;
}

export function AuthCard({ onSuccess, redirectPath = "/report", embedded = false }: AuthCardProps) {
  const t = useT();
  const router = useRouter();
  const { signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setErrorMsg(null);
    const { error } = await signInWithGoogle(redirectPath);
    if (error) {
      setErrorMsg(error.message || t.authError);
      setLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t.errorRequired);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === "signin") {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        setErrorMsg(error.message || t.authError);
        setLoading(false);
      } else {
        setSuccessMsg(t.authSuccess);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(redirectPath);
          }
        }, 500);
      }
    } else {
      const { error, needsEmailConfirmation } = await signUpWithPassword(email, password, fullName);
      if (error) {
        setErrorMsg(error.message || t.authError);
        setLoading(false);
      } else if (needsEmailConfirmation) {
        setSuccessMsg("Account created! Please check your email to verify and sign in.");
        setLoading(false);
      } else {
        setSuccessMsg(t.authSuccess);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(redirectPath);
          }
        }, 500);
      }
    }
  }

  return (
    <div
      className={`w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xl transition-all ${
        embedded ? "mx-auto shadow-emerald-950/5" : ""
      }`}
    >
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {mode === "signin" ? t.signIn : t.signUp}
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          {embedded ? t.authRequiredSubtitle : t.welcome}
        </p>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="mt-6 flex min-h-13 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow active:scale-[0.99] disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{t.continueWithGoogle}</span>
      </button>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="absolute bg-white px-3 text-xs font-medium text-slate-600">
          {t.orContinueWithEmail}
        </span>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErrorMsg(null);
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            mode === "signin"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          {t.signIn}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setErrorMsg(null);
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            mode === "signup"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          {t.signUp}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              {t.fullNameLabel}
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-5 w-5 text-slate-600" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.fullNamePlaceholder}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            {t.emailLabel}
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-5 w-5 text-slate-600" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            {t.passwordLabel}
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-5 w-5 text-slate-600" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 px-6 text-base font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
        >
          <span>{loading ? (mode === "signin" ? t.signingIn : t.signingUp) : mode === "signin" ? t.signIn : t.signUp}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
