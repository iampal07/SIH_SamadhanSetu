import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { ROLES } from '../../data/constants';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, role, loading, isDemoMode } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Verifying secure portal access...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirect to login with return path
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const isOnboarded = isDemoMode || 
    profile?.is_onboarded === true ||
    user?.user_metadata?.is_onboarded === true ||
    Boolean(profile?.role && localStorage.getItem('samadhan_onboarded_' + user.id) === 'true');

  // If authenticated but onboarding not completed, redirect to role onboarding
  if (!role || !isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user role does not match allowed roles for this portal
  if (allowedRoles && !allowedRoles.includes(role)) {
    const userRoleMeta = ROLES[role] || { label: role, hex: '#4f46e5' };
    const targetPortalRole = allowedRoles[0];
    const targetRoleMeta = ROLES[targetPortalRole] || { label: targetPortalRole };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-900">Restricted Portal Access</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              You are currently authenticated as a <b className="text-slate-800">{userRoleMeta.label}</b>, but this section is designated for <b className="text-slate-800">{targetRoleMeta.label}</b> personnel.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to={role === 'govt' ? '/government' : `/${role}`}
              className="btn btn-primary w-full justify-center"
            >
              <LayoutDashboard size={16} /> Go to My {userRoleMeta.label} Workspace
            </Link>
            <Link
              to="/login"
              className="btn btn-ghost w-full justify-center text-slate-500"
            >
              <ArrowLeft size={16} /> Switch Role / Sign In Differently
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
