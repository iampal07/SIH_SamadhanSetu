import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Landmark, GraduationCap, Factory, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShell } from '../../context/AppShellContext';
import { DISTRICT_NAMES, ROLES, getRolePortalPath } from '../../data/constants';
import { UNIVERSITIES } from '../../data/universities';
import { INDUSTRIES } from '../../data/industries';
import { Logo } from '../../components/navigation/PublicNav';

const ROLE_OPTIONS = [
  {
    id: 'citizen',
    titleKey: 'role.citizen', title: 'Citizen',
    badgeKey: 'onboard.badge.community', badge: 'Community',
    icon: Users,
    color: '#06b6d4',
    bg: '#ecfeff',
    border: 'border-cyan-200',
    descKey: 'onboard.desc.citizen',
    description: 'Report civic issues, vote on local priorities, and track your submitted problems through resolution.',
  },
  {
    id: 'govt',
    titleKey: 'onboard.role.govt', title: 'Government Official',
    badgeKey: 'onboard.badge.administration', badge: 'Administration',
    icon: Landmark,
    color: '#10b981',
    bg: '#ecfdf5',
    border: 'border-emerald-200',
    descKey: 'onboard.desc.govt',
    description: 'Review validation queues, screen duplicates with AI, route problems to institutions, and monitor impact.',
  },
  {
    id: 'varsity',
    titleKey: 'onboard.role.varsity', title: 'University / Academia',
    badgeKey: 'onboard.badge.research', badge: 'Research & Innovation',
    icon: GraduationCap,
    color: '#6366f1',
    bg: '#eef2ff',
    border: 'border-indigo-200',
    descKey: 'onboard.desc.varsity',
    description: 'Accept matched community challenges, assemble student teams, and upload ready prototypes with funding requirements.',
  },
  {
    id: 'industry',
    titleKey: 'onboard.role.industry', title: 'Industry & CSR Partner',
    badgeKey: 'onboard.badge.scaling', badge: 'Scaling & Capital',
    icon: Factory,
    color: '#f59e0b',
    bg: '#fff7ed',
    border: 'border-amber-200',
    descKey: 'onboard.desc.industry',
    description: 'Discover scalable working prototypes built by universities, commit CSR/R&D funds, and deploy at scale.',
  },
];

export default function Onboarding() {
  const { user, completeOnboarding } = useAuth();
  const { t } = useShell();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('citizen');
  const [district, setDistrict] = useState('Ranchi');
  const [organization, setOrganization] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      await completeOnboarding({
        role: selectedRole,
        organizationName: organization,
        district,
      });

      const dest = getRolePortalPath(selectedRole);
      navigate(dest, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || t('onboard.err.save', 'Failed to save your profile. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4" style={{ background: 'var(--bg)' }}>
      <header className="max-w-4xl mx-auto w-full mb-6">
        <Logo />
      </header>

      <main className="max-w-4xl mx-auto w-full rounded-3xl p-6 sm:p-10 shadow-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-3">
            <Sparkles size={13} /> {t('onboard.badge', 'Complete Your Identity Setup')}
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            {t('onboard.title', 'Select Your Role in SamadhanSetu')}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {t('onboard.welcome', 'Welcome,')} <b>{user?.user_metadata?.full_name || user?.email || t('onboard.innovator', 'Innovator')}</b>! {t('onboard.sub', 'Tell us how you will be participating so we can unlock your personalized workspace.')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Role Cards Selection */}
          <div className="grid sm:grid-cols-2 gap-4">
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = selectedRole === opt.id;
              const Icon = opt.icon;

              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    setSelectedRole(opt.id);
                    if (opt.id === 'varsity' && !organization) setOrganization(UNIVERSITIES[0].name);
                    if (opt.id === 'industry' && !organization) setOrganization(INDUSTRIES[0].name);
                  }}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 shadow-md shadow-indigo-500/10'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                  style={{ backgroundColor: isSelected ? opt.bg : undefined }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="w-10 h-10 rounded-xl grid place-items-center font-bold text-white shadow-sm"
                      style={{ background: opt.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className="text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: isSelected ? '#ffffff' : opt.bg, color: opt.color }}
                    >
                      {t(opt.badgeKey, opt.badge)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center gap-2">
                      {t(opt.titleKey, opt.title)}
                      {isSelected && <Check size={16} className="text-indigo-600" strokeWidth={2.8} />}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{t(opt.descKey, opt.description)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role-Specific Additional Info */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
            <h4 className="font-display font-bold text-sm text-slate-800">
              {t('onboard.workspaceFor', 'Workspace Configuration for')} {t(ROLE_OPTIONS.find((r) => r.id === selectedRole)?.titleKey, ROLE_OPTIONS.find((r) => r.id === selectedRole)?.title)}
            </h4>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t('onboard.primaryDistrict', 'Primary District')}</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                >
                  {DISTRICT_NAMES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {selectedRole === 'citizen' && t('onboard.label.citizen', 'Locality / Gram Panchayat')}
                  {selectedRole === 'govt' && t('onboard.label.govt', 'Department / Administrative Unit')}
                  {selectedRole === 'varsity' && t('onboard.label.varsity', 'University / College Name')}
                  {selectedRole === 'industry' && t('onboard.label.industry', 'Company / Enterprise Name')}
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder={
                    selectedRole === 'citizen'
                      ? t('onboard.placeholder.citizen', 'e.g. Barkagaon Panchayat, Kanke')
                      : selectedRole === 'govt'
                      ? t('onboard.placeholder.govt', 'e.g. District Innovation Cell')
                      : selectedRole === 'varsity'
                      ? t('onboard.placeholder.varsity', 'e.g. BIT Mesra Innovation Cell')
                      : t('onboard.placeholder.industry', 'e.g. Tata Steel CSR Division')
                  }
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary px-8 py-3.5 text-sm cursor-pointer disabled:opacity-60"
            >
              {submitting ? t('onboard.saving', 'Saving Profile...') : t('onboard.confirm', 'Confirm Role & Enter Portal')}
            </button>
          </div>
        </form>
      </main>

      <footer className="text-center text-xs text-slate-400 mt-6">
        {t('onboard.footer', 'SamadhanSetu · Smart India Hackathon 2026')}
      </footer>
    </div>
  );
}
