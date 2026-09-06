import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured, fetchUserProfile } from '../../services/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Finalizing Google sign-in...');

  useEffect(() => {
    async function handleAuthRedirect() {
      if (!isSupabaseConfigured) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user) {
          console.error('Auth error in callback:', error);
          navigate('/login', { replace: true });
          return;
        }

        setStatus('Retrieving profile and workspace assignment...');
        const profile = await fetchUserProfile(session.user.id);

        if (profile?.role) {
          // Send user straight to their role workspace
          const destination = profile.role === 'govt' ? '/government' : `/${profile.role}`;
          navigate(destination, { replace: true });
        } else {
          // First-time user, route to role selection
          navigate('/onboarding', { replace: true });
        }
      } catch (err) {
        console.error('Error during authentication callback:', err);
        navigate('/login', { replace: true });
      }
    }

    handleAuthRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="text-center space-y-3 p-6 max-w-sm">
        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="font-display font-bold text-slate-800 text-base">Authenticating with Supabase</h3>
        <p className="text-xs text-slate-500">{status}</p>
      </div>
    </div>
  );
}
