"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabaseClient } from "@/lib/supabaseClient";

// Custom scheme the Android app registers in AndroidManifest.xml so the
// system browser can hand control back to the app once Google/Supabase
// finish the OAuth exchange, instead of leaving the citizen stranded on
// the public website (the bug this file fixes).
const NATIVE_OAUTH_REDIRECT = "samadhansetu://auth-callback";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function syncTokenCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `sb-access-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data } = await supabaseClient.auth.getSession();
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          syncTokenCookie(data.session?.access_token ?? null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      syncTokenCookie(newSession?.access_token ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Native-only: catches the `samadhansetu://auth-callback` link the system
  // browser opens once Google/Supabase finish sign-in, and hands the session
  // back to the app instead of leaving the citizen on the public website.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return;
      }
      if (parsed.protocol !== "samadhansetu:" || parsed.host !== "auth-callback") return;

      const code = parsed.searchParams.get("code");
      const next = parsed.searchParams.get("next") || "/home";

      await Browser.close().catch(() => {});

      if (code) {
        const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          syncTokenCookie(data.session.access_token);
          setSession(data.session);
          setUser(data.session.user);
          router.replace(next);
          return;
        }
      }
      router.replace("/login?error=oauth_failed");
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [router]);

  async function signInWithGoogle(redirectPath = "/report") {
    try {
      if (Capacitor.isNativePlatform()) {
        const redirectTo = `${NATIVE_OAUTH_REDIRECT}?next=${encodeURIComponent(redirectPath)}`;
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });
        if (error) return { error: error as Error };
        if (data?.url) {
          await Browser.open({ url: data.url });
        }
        return { error: null };
      }

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`;
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async function signInWithPassword(email: string, password: string) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error as Error };
      if (data.session) {
        syncTokenCookie(data.session.access_token);
        setSession(data.session);
        setUser(data.session.user);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async function signUpWithPassword(email: string, password: string, fullName?: string) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split("@")[0],
          },
        },
      });
      if (error) return { error: error as Error };
      if (data.session) {
        syncTokenCookie(data.session.access_token);
        setSession(data.session);
        setUser(data.session.user);
      }
      return {
        error: null,
        needsEmailConfirmation: !data.session && !!data.user,
      };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async function signOut() {
    try {
      await supabaseClient.auth.signOut();
    } finally {
      syncTokenCookie(null);
      setSession(null);
      setUser(null);
    }
  }

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
