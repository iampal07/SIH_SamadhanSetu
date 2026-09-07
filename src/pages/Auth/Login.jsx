import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Sparkles, Building2, Users, Landmark, Factory,
  GraduationCap, ArrowRight, AlertCircle, Mail, Lock, User, MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DISTRICT_NAMES, ROLES, getRolePortalPath } from '../../data/constants';
import { Logo } from '../../components/navigation/PublicNav';
import ShellControls from '../../components/shared/ShellControls';

const ROLE_OPTIONS = [
  { id: 'citizen', label: 'Citizen', icon: Users, desc: 'Report issues' },
  { id: 'govt', label: 'Government', icon: Landmark, desc: 'Validate & route' },
  { id: 'varsity', label: 'University', icon: GraduationCap, desc: 'Build prototypes' },
  { id: 'industry', label: 'Industry', icon: Factory, desc: 'Fund & scale' },
];

export default function Login() {
  const { signInWithGoogle, loginWithPassword, registerWithPassword, loginAsDemoRole, isSupabaseConfigured } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState('citizen');
  const [district, setDistrict] = useState('Ranchi');
  const [organization, setOrganization] = useState('');

  const redirectTo = searchParams.get('redirect');

  const routeUserByRole = (roleKey) => {
    const target = redirectTo || getRolePortalPath(roleKey);
    navigate(target, { replace: true });
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google sign-in could not be initiated.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await loginWithPassword(email, password);
        const userRole = res?.user?.user_metadata?.role || 'citizen';
        routeUserByRole(userRole);
      } else {
        // Register
        await registerWithPassword(email, password, {
          full_name: fullName,
          role: selectedRole,
          district,
          organization_name: organization,
        });

        setSuccessMsg('Account created successfully! Entering your workspace...');
        setTimeout(() => {
          routeUserByRole(selectedRole);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (roleKey) => {
    loginAsDemoRole(roleKey);
    routeUserByRole(roleKey);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-800" style={{ background: 'var(--bg)' }}>
      {/* Top Header */}
      <header className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <ShellControls compact />
          <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1.5">
            Back to Public Site <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="max-w-4xl w-full grid md:grid-cols-[1.2fr_1fr] rounded-3xl shadow-xl border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          
          {/* Left Panel: Auth Action */}
          <div className="p-6 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[0.72rem] font-bold mb-3">
                <Sparkles size={13} /> SIH 2026 Unified Portal Access
              </div>

              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {tab === 'login' ? 'Welcome back to ' : 'Create your account on '}
                <span className="grad-text">SamadhanSetu</span>
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
                Connect seamlessly as a Citizen, Government Officer, University Researcher, or Industry Partner.
              </p>

              {/* Mode Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl mt-5 mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(null); }}
                  className={`flex-1 py-2 rounded-lg transition ${tab === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(null); }}
                  className={`flex-1 py-2 rounded-lg transition ${tab === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Create Account (Select Role)
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div className="leading-snug">{error}</div>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-start gap-2">
                  <Sparkles size={15} className="shrink-0 mt-0.5" />
                  <div className="leading-snug">{successMsg}</div>
                </div>
              )}

              {/* Continue with Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition shadow-xs font-semibold text-slate-700 text-xs sm:text-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer mb-4"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-[0.68rem] uppercase font-bold text-slate-400">or with email credentials</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {tab === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Dr. Rajesh Verma"
                        className="field pl-9 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.gov.in"
                      className="field pl-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="field pl-9 text-xs"
                    />
                  </div>
                </div>

                {tab === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Your Stakeholder Role *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ROLE_OPTIONS.map((opt) => {
                          const isSel = selectedRole === opt.id;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedRole(opt.id)}
                              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                                isSel ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              <Icon size={16} className={isSel ? 'text-indigo-600' : 'text-slate-400'} />
                              <div className="leading-tight">
                                <p className="text-xs">{opt.label}</p>
                                <p className="text-[0.62rem] text-slate-400">{opt.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[0.7rem] font-bold text-slate-600 mb-1">District</label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="field text-xs py-2"
                        >
                          {DISTRICT_NAMES.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[0.7rem] font-bold text-slate-600 mb-1">Organization / Panchayat</label>
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="e.g. BIT Mesra / Tata Steel"
                          className="field text-xs py-2"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full justify-center py-3 text-xs sm:text-sm font-bold mt-2 cursor-pointer disabled:opacity-60"
                >
                  {loading
                    ? 'Authenticating...'
                    : tab === 'login'
                    ? 'Sign In to Workspace'
                    : 'Create Account & Open Portal'}
                </button>
              </form>

              {/* Demo Roles Section for SIH Rapid Testing */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[0.68rem] font-bold tracking-wider uppercase text-slate-400">
                    Quick Presentation & Demo Login
                  </span>
                  <span className="text-[0.62rem] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    1-Click Bypass
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDemoLogin('citizen')}
                    className="p-2.5 rounded-xl border border-cyan-100 bg-cyan-50/50 hover:bg-cyan-50 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-cyan-600" />
                      <span className="text-xs font-bold text-cyan-900">Citizen</span>
                    </div>
                    <p className="text-[0.65rem] text-cyan-700/80 truncate">Upload & Track</p>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('govt')}
                    className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Landmark size={14} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-900">Government</span>
                    </div>
                    <p className="text-[0.65rem] text-emerald-700/80 truncate">Validate & Route</p>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('varsity')}
                    className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-900">University</span>
                    </div>
                    <p className="text-[0.65rem] text-indigo-700/80 truncate">Showcase Prototypes</p>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('industry')}
                    className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Factory size={14} className="text-amber-600" />
                      <span className="text-xs font-bold text-amber-900">Industry</span>
                    </div>
                    <p className="text-[0.65rem] text-amber-700/80 truncate">Scale Ready Projects</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-[0.7rem] text-slate-400 text-center">
              Secured with Supabase Row Level Security & Google OAuth 2.0
            </div>
          </div>

          {/* Right Panel: Role Portal Overview */}
          <div
            className="p-6 sm:p-10 text-white flex flex-col justify-between hidden md:flex"
            style={{ background: 'linear-gradient(135deg, #4338ca 0%, #0891b2 100%)' }}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center mb-4">
                <Shield size={20} className="text-white" />
              </div>
              <h2 className="font-display font-extrabold text-2xl tracking-tight leading-snug">
                One Platform.<br />Four Connected Portals.
              </h2>
              <p className="text-white/80 text-xs mt-2 leading-relaxed">
                Every account holds its own role information, opening its distinct operational workspace:
              </p>

              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">1. Citizen Workspace</p>
                    <p className="text-[0.7rem] text-white/75">Submit community grievances and watch them journey from review to solution.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">2. District Innovation Cell</p>
                    <p className="text-[0.7rem] text-white/75">Verify problems, screen duplicates with AI, and assign challenges to leading institutions.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-indigo-300 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">3. University & Incubation Hub</p>
                    <p className="text-[0.7rem] text-white/75">Form faculty-student teams, construct working prototypes, and specify required funding.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">4. Industry & CSR Portal</p>
                    <p className="text-[0.7rem] text-white/75">Adopt ready-to-scale prototypes, fund commercial integration, and record ESG impact.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[0.7rem] text-white/60 pt-6">
              Department of Higher & Technical Education · Govt of Jharkhand
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        SamadhanSetu © 2026 · Smart India Hackathon Innovation Platform
      </footer>
    </div>
  );
}
