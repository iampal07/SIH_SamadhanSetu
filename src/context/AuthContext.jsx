import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured, signInWithGoogle, signOutUser, fetchUserProfile, saveUserProfile, signInWithEmail, signUpWithEmail } from '../services/supabase';

const AuthContext = createContext(null);

// Preset demo identities for SIH presentation mode
export const DEMO_USERS = {
  citizen: {
    id: 'demo-citizen-id',
    email: 'citizen.pooja@samadhansetu.gov.in',
    full_name: 'Pooja Kachhap',
    role: 'citizen',
    district: 'Ranchi',
    organization_name: 'Gram Panchayat Kanke',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  govt: {
    id: 'demo-govt-id',
    email: 'officer.sinha@jharkhand.gov.in',
    full_name: 'Rajesh Sinha (IAS)',
    role: 'govt',
    district: 'Ranchi',
    organization_name: 'District Innovation Cell, Govt of Jharkhand',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  varsity: {
    id: 'demo-varsity-id',
    email: 'innovation@bitmesra.ac.in',
    full_name: 'Dr. Ananya Sharma',
    role: 'varsity',
    district: 'Ranchi',
    organization_name: 'BIT Mesra Innovation & Incubation Cell',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  industry: {
    id: 'demo-industry-id',
    email: 'csr.lead@tatasteel.com',
    full_name: 'Vikramaditya Tata',
    role: 'industry',
    district: 'Jamshedpur',
    organization_name: 'Tata Steel Foundation (CSR & Innovation)',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Sync Supabase Auth State
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        // In unconfigured state, start with demo user or allow login page
        const savedDemo = localStorage.getItem('samadhan_demo_user');
        if (savedDemo && DEMO_USERS[savedDemo]) {
          setUser({ id: DEMO_USERS[savedDemo].id, email: DEMO_USERS[savedDemo].email });
          setProfile(DEMO_USERS[savedDemo]);
          setIsDemoMode(true);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted && initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const userProf = await fetchUserProfile(initialSession.user.id);
          setProfile(userProf);
        }
      } catch (err) {
        console.error('Failed to get initial session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        const userProf = await fetchUserProfile(newSession.user.id);
        if (mounted) setProfile(userProf);
      } else {
        if (mounted) setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Quick Demo Login for SIH Presentations
  const loginAsDemoRole = useCallback((roleKey) => {
    const demoUser = DEMO_USERS[roleKey] || DEMO_USERS.citizen;
    setUser({ id: demoUser.id, email: demoUser.email });
    setProfile(demoUser);
    setIsDemoMode(true);
    localStorage.setItem('samadhan_demo_user', roleKey);
  }, []);

  // First-time role onboarding
  const completeOnboarding = useCallback(async ({ role, organizationName, district, phone }) => {
    if (isDemoMode || !isSupabaseConfigured) {
      const updated = {
        id: user?.id || 'demo-user',
        email: user?.email || 'user@samadhansetu.org',
        full_name: user?.user_metadata?.full_name || 'Innovator',
        role,
        organization_name: organizationName,
        district,
        phone,
      };
      setProfile(updated);
      localStorage.setItem('samadhan_demo_user', role);
      return updated;
    }

    if (!user) throw new Error('No authenticated user found to assign role');

    const profileData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url || '',
      role,
      organization_name: organizationName || '',
      district: district || 'Ranchi',
      phone: phone || '',
      is_onboarded: true,
    };

    localStorage.setItem('samadhan_onboarded_' + user.id, 'true');
    const saved = await saveUserProfile(profileData);
    setProfile(saved);
    return saved;
  }, [user, isDemoMode]);

  // Sign out
  const logout = useCallback(async () => {
    localStorage.removeItem('samadhan_demo_user');
    setIsDemoMode(false);
    setUser(null);
    setProfile(null);
    setSession(null);
    if (isSupabaseConfigured) {
      await signOutUser();
    }
  }, []);

  // Email/Password login
  const loginWithPassword = useCallback(async (email, password) => {
    const res = await signInWithEmail(email, password);
    if (res?.user) {
      setUser(res.user);
      const prof = await fetchUserProfile(res.user.id);
      setProfile(prof);
    }
    return res;
  }, []);

  // Email/Password registration
  const registerWithPassword = useCallback(async (email, password, metadata) => {
    const res = await signUpWithEmail(email, password, metadata);
    if (res?.user) {
      setUser(res.user);
      const prof = await fetchUserProfile(res.user.id);
      setProfile(prof);
    }
    return res;
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    role: profile?.role || null,
    loading,
    isDemoMode,
    isSupabaseConfigured,
    signInWithGoogle,
    loginWithPassword,
    registerWithPassword,
    loginAsDemoRole,
    completeOnboarding,
    logout,
  }), [user, session, profile, loading, isDemoMode, loginWithPassword, registerWithPassword, loginAsDemoRole, completeOnboarding, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
