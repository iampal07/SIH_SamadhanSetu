import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, LayoutDashboard } from 'lucide-react';
import { ROLES } from '../../data/constants';
import { cx } from '../../utils/format';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/simulation', label: 'Simulation' },
  { to: '/about', label: 'About' },
];

const DASHBOARDS = [
  { to: '/citizen', role: 'citizen', desc: 'Report and track your challenge' },
  { to: '/university', role: 'varsity', desc: 'Solve challenges with student teams' },
  { to: '/industry', role: 'industry', desc: 'Fund, mentor and deploy solutions' },
  { to: '/government', role: 'govt', desc: 'Validate, monitor and measure impact' },
];

export function Logo({ dark = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0">
      <div className="w-9 h-9 rounded-xl grid place-items-center text-white font-display font-extrabold shadow-lg shadow-indigo-500/25"
        style={{ background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="6" cy="6" r="2.6" fill="#fff" />
          <circle cx="18" cy="6" r="2.6" fill="#fff" fillOpacity=".8" />
          <circle cx="6" cy="18" r="2.6" fill="#fff" fillOpacity=".8" />
          <circle cx="18" cy="18" r="2.6" fill="#fff" />
          <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="1.4" strokeOpacity=".65" />
        </svg>
      </div>
      <div className="leading-none">
        <div className={cx('font-display font-extrabold text-[1.05rem] tracking-tight', dark ? 'text-white' : 'text-slate-900')}>
          Samadhan<span className="grad-text">Setu</span>
        </div>
        <div className={cx('text-[0.6rem] font-semibold tracking-[0.14em] uppercase mt-0.5', dark ? 'text-white/50' : 'text-slate-400')}>
          Problem → Solution Bridge
        </div>
      </div>
    </Link>
  );
}

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 14);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => { setOpen(false); setMenu(false); }, [loc.pathname]);

  return (
    <header className={cx('fixed top-0 inset-x-0 z-50 transition-all duration-300',
      scrolled ? 'py-2' : 'py-4')}>
      <div className={cx('mx-auto max-w-6xl px-4 sm:px-6 transition-all duration-300')}>
        <div className={cx('flex items-center justify-between gap-4 rounded-2xl transition-all duration-300',
          scrolled ? 'glass shadow-lg shadow-slate-900/5 px-4 py-2.5' : 'px-1 py-1')}>
          <Logo />

          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}
                className={({ isActive }) => cx('relative px-3 py-1.5 text-[0.84rem] font-semibold rounded-lg transition',
                  isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900')}>
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-indigo-50 -z-10" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 relative">
            <Link to="/citizen/submit" className="btn btn-ghost">Submit a Challenge</Link>
            <button className="btn btn-primary" onClick={() => setMenu((m) => !m)}>
              <LayoutDashboard size={15} /> Dashboards <ChevronDown size={14} className={cx('transition', menu && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {menu && (
                <>
                  <div className="fixed inset-0 z-0" onClick={() => setMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-10">
                    {DASHBOARDS.map((d) => {
                      const r = ROLES[d.role];
                      return (
                        <Link key={d.to} to={d.to} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                          <span className="w-9 h-9 rounded-lg grid place-items-center font-bold text-white text-xs"
                            style={{ background: `linear-gradient(135deg,${r.hex},${r.deep})` }}>{r.label[0]}</span>
                          <span className="min-w-0">
                            <span className="block text-[0.85rem] font-bold text-slate-800">{r.label}</span>
                            <span className="block text-[0.7rem] text-slate-400 truncate">{d.desc}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden mt-2">
              <div className="glass rounded-2xl p-3 shadow-lg space-y-1">
                {LINKS.map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.to === '/'}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-white/70">{l.label}</NavLink>
                ))}
                <div className="h-px bg-slate-200 my-1.5" />
                {DASHBOARDS.map((d) => (
                  <Link key={d.to} to={d.to} className="block px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ color: ROLES[d.role].deep }}>{ROLES[d.role].label} Dashboard</Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export { DASHBOARDS };
