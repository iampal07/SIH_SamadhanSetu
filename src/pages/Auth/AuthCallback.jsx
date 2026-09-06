import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured, fetchUserProfile } from '../../services/supabase';
import { getRolePortalPath } from '../../data/constants';

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

        setStatus('Checking profile onboarding...');
        const profile = await fetchUserProfile(session.user.id);

        const userMeta = session.user?.user_metadata || {};
        const isOnboarded = 
          profile?.is_onboarded === true || 
          userMeta.is_onboarded === true ||
          (profile?.role && localStorage.getItem('samadhan_onboarded_' + session.user.id) === 'true');

        const resolvedRole = profile?.role || userMeta.role;

        if (resolvedRole && isOnboarded) {
          // Send returning user straight to their role workspace
          const destination = getRolePortalPath(resolvedRole);
          navigate(destination, { replace: true });
        } else {
          // First-time or un-onboarded user -> MUST choose role
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
