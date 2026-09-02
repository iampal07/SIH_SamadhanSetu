import { Outlet, Link } from 'react-router-dom';
import { Sparkles, Mail, MapPin } from 'lucide-react';
import PublicNav from '../../components/navigation/PublicNav';
import { ROLES } from '../../data/constants';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <div className="flex-1"><Outlet /></div>
      <Footer />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-14 pb-8 mt-0">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="font-display font-extrabold text-xl">Samadhan<span className="grad-text">Setu</span></div>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-xs">
              A national digital collaboration platform that turns real societal challenges into
              validated, funded and deployed solutions — built by citizens, universities, industry and government together.
            </p>
            <div className="flex items-center gap-3 mt-4 text-slate-400 text-[0.8rem]">
              <span className="inline-flex items-center gap-1.5"><MapPin size={13} />Jharkhand, India</span>
              <span className="inline-flex items-center gap-1.5"><Mail size={13} />hello@samadhansetu.in</span>
            </div>
          </div>
          <FooterCol title="Platform" links={[
            ['Home', '/'], ['How It Works', '/how-it-works'], ['Live Simulation', '/simulation'], ['About', '/about'],
          ]} />
          <FooterCol title="Dashboards" links={[
            ['Citizen', '/citizen'], ['University', '/university'], ['Industry', '/industry'], ['Government', '/government'],
          ]} />
          <div>
            <p className="font-display font-bold text-sm mb-3">Stakeholders</p>
            <div className="space-y-2">
              {Object.values(ROLES).filter((r) => r.key !== 'ai').map((r) => (
                <div key={r.key} className="flex items-center gap-2 text-[0.82rem] text-slate-400">
                  <i className="w-2 h-2 rounded-full" style={{ background: r.hex }} />{r.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[0.78rem] text-slate-500">
          <p>Smart India Hackathon 2026 · Frontend prototype · Demo data only</p>
          <p className="inline-flex items-center gap-1.5"><Sparkles size={13} /> Built for national civic innovation</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="font-display font-bold text-sm mb-3">{title}</p>
      <div className="space-y-2">
        {links.map(([label, to]) => (
          <Link key={to} to={to} className="block text-[0.82rem] text-slate-400 hover:text-white transition">{label}</Link>
        ))}
      </div>
    </div>
  );
}
