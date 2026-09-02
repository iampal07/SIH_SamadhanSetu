import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Bell, Menu, X, ChevronsLeft, Home, CheckCheck } from 'lucide-react';
import { ROLES } from '../../data/constants';
import { usePlatform, useNotifications } from '../../context/PlatformContext';
import { Logo } from './PublicNav';
import { Avatar } from '../shared/ui';
import { timeAgo, cx } from '../../utils/format';

const SWITCH = [
  { to: '/citizen', role: 'citizen' },
  { to: '/university', role: 'varsity' },
  { to: '/industry', role: 'industry' },
  { to: '/government', role: 'govt' },
];

export default function DashboardLayout({ role, nav, title, subtitle, user, children, headerRight }) {
  const r = ROLES[role];
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { dispatch } = usePlatform();
  const { list, unread } = useNotifications(role);
  const loc = useLocation();

  const Sidebar = (
    <div className={cx('flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-300', collapsed ? 'w-[74px]' : 'w-[248px]')}>
      <div className="p-4 pb-3 flex items-center justify-between">
        {!collapsed ? <Logo /> : (
          <div className="w-9 h-9 rounded-xl grid place-items-center text-white mx-auto"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}><Icons.Network size={17} /></div>
        )}
      </div>

      <div className={cx('mx-3 mb-3 rounded-xl px-3 py-2.5', collapsed && 'px-2')} style={{ background: r.soft }}>
        {collapsed ? (
          <div className="grid place-items-center text-[0.7rem] font-extrabold" style={{ color: r.deep }}>{r.label[0]}</div>
        ) : (
          <>
            <p className="text-[0.62rem] font-bold uppercase tracking-widest" style={{ color: r.hex }}>Workspace</p>
            <p className="font-display font-extrabold text-[0.95rem]" style={{ color: r.deep }}>{r.label}</p>
          </>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {nav.map((n) => {
          const Icon = Icons[n.icon] ?? Icons.Circle;
          return (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cx('relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.84rem] font-semibold transition group',
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId={`side-${role}`} className="absolute inset-0 rounded-xl"
                      style={{ background: `linear-gradient(120deg, ${r.hex}, ${r.deep})`, boxShadow: `0 8px 20px -8px ${r.hex}` }}
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                  )}
                  <Icon size={17} className="relative z-10 shrink-0" strokeWidth={2.2} />
                  {!collapsed && <span className="relative z-10 truncate">{n.label}</span>}
                  {!collapsed && n.badge > 0 && (
                    <span className={cx('relative z-10 ml-auto text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full',
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500')}>{n.badge}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        {!collapsed && <p className="text-[0.6rem] font-bold uppercase tracking-widest text-slate-300 px-2 pb-1">Switch workspace</p>}
        <div className={cx('flex gap-1.5', collapsed && 'flex-col items-center')}>
          {SWITCH.filter((s) => s.role !== role).map((s) => (
            <Link key={s.to} to={s.to} title={ROLES[s.role].label}
              className="flex-1 grid place-items-center h-8 rounded-lg text-[0.68rem] font-bold transition hover:scale-105"
              style={{ background: ROLES[s.role].soft, color: ROLES[s.role].deep }}>
              {collapsed ? ROLES[s.role].label[0] : ROLES[s.role].label}
            </Link>
          ))}
        </div>
        <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.8rem] font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition mt-1">
          <Home size={16} />{!collapsed && 'Back to homepage'}
        </Link>
        <button onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.8rem] font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition w-full">
          <ChevronsLeft size={16} className={cx('transition', collapsed && 'rotate-180')} />{!collapsed && 'Collapse'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#f6f8fc]">
      <aside className="hidden lg:block sticky top-0 h-screen shrink-0">{Sidebar}</aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="lg:hidden fixed left-0 top-0 h-screen z-50"
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-white/60">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(true)}><Menu size={19} /></button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display font-extrabold text-[1.05rem] sm:text-xl text-slate-900 truncate">{title}</h1>
              {subtitle && <p className="text-[0.74rem] text-slate-500 truncate">{subtitle}</p>}
            </div>
            {headerRight}
            <div className="relative">
              <button className="relative p-2.5 rounded-xl hover:bg-white/70 transition" onClick={() => { setBell((b) => !b); }}>
                <Bell size={18} className="text-slate-600" />
                {unread > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[0.6rem] font-bold text-white grid place-items-center"
                    style={{ background: r.hex }}>{unread}</motion.span>
                )}
              </button>
              <AnimatePresence>
                {bell && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setBell(false)} />
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }}
                      className="absolute right-0 top-12 w-[320px] max-w-[88vw] bg-white rounded-2xl shadow-xl border border-slate-100 z-10 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <p className="font-display font-bold text-[0.9rem]">Notifications</p>
                        <button className="text-[0.72rem] font-bold inline-flex items-center gap-1" style={{ color: r.hex }}
                          onClick={() => dispatch({ type: 'READ_NOTIFICATIONS', role })}>
                          <CheckCheck size={13} />Mark all read
                        </button>
                      </div>
                      <div className="max-h-[360px] overflow-y-auto">
                        {list.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Nothing yet.</p>}
                        {list.map((n) => (
                          <div key={n.id} className={cx('px-4 py-3 border-b border-slate-50 last:border-0 flex gap-2.5', !n.read && 'bg-slate-50/70')}>
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                              style={{ background: n.tone === 'success' ? '#10b981' : n.tone === 'warn' ? '#f59e0b' : r.hex, opacity: n.read ? 0.3 : 1 }} />
                            <div className="min-w-0">
                              <p className="text-[0.8rem] text-slate-700 leading-snug">{n.text}</p>
                              <p className="text-[0.66rem] text-slate-400 mt-0.5">{timeAgo(n.at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <Avatar name={user?.name ?? r.label} size={34} />
              <div className="leading-tight">
                <p className="text-[0.8rem] font-bold text-slate-800">{user?.name ?? r.label}</p>
                <p className="text-[0.68rem] text-slate-400">{user?.meta ?? r.label}</p>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main key={loc.pathname}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-4 sm:p-6 max-w-[1400px] mx-auto">
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
