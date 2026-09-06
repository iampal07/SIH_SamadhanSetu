import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Reveal, SectionHead, Chip, Stat } from '../../components/shared/ui';
import Ecosystem from '../../components/shared/Ecosystem';
import { ROLES, CATEGORIES } from '../../data/constants';
import { PLATFORM_TOTALS } from '../../data/seedChallenges';

const STACK = [
  ['React 19 + Vite', 'Component architecture and instant HMR'],
  ['React Router', 'Six route groups: public, simulation, four dashboards'],
  ['Context + useReducer', 'One shared state tree — every dashboard reads the same record'],
  ['Framer Motion', 'Page transitions, lifecycle animation, AI processing states'],
  ['Recharts', 'Trends, category mix, district analytics, radar fit'],
  ['Tailwind CSS v4', 'Design tokens, glassmorphism, responsive layout'],
];

const SDG = ['SDG 3 · Good Health', 'SDG 4 · Quality Education', 'SDG 6 · Clean Water', 'SDG 9 · Industry & Innovation', 'SDG 11 · Sustainable Cities', 'SDG 17 · Partnerships'];

export default function About() {
  return (
    <div className="pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow="About" title="Why SamadhanSetu exists"
          sub="Built for Smart India Hackathon 2026 as a working prototype of a national civic innovation network." />

        <div className="grid md:grid-cols-2 gap-8 items-center mt-12">
          <Reveal>
            <div className="space-y-4 text-[0.92rem] text-slate-600 leading-relaxed">
              <p>
                India generates thousands of genuine community problems every day — a dry handpump, an unlit junction,
                a school without a single computer. In parallel, universities run tens of thousands of student projects,
                and industry commits thousands of crores to CSR.
              </p>
              <p>
                These three worlds almost never meet. <b className="text-slate-900">SamadhanSetu</b> is the bridge:
                a structured, AI-assisted mechanism that converts a reported problem into a validated project,
                assigns it to the best-matched university, composes a multidisciplinary team, brings in an industry
                partner, and measures the outcome — with the government watching the whole pipeline.
              </p>
              <p>
                Everything you see here runs entirely in the browser on realistic Jharkhand demo data. There is no backend:
                the AI, the notifications, the matching and the analytics are all simulated so the complete concept can be
                demonstrated end to end in a few minutes.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}><Ecosystem size={360} /></Reveal>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
          <Stat icon={Icons.Layers} label="Societal domains covered" value={CATEGORIES.length} color="#6366f1" />
          <Stat icon={Icons.Workflow} label="Lifecycle stages" value={12} color="#06b6d4" delay={0.08} />
          <Stat icon={Icons.Brain} label="AI capabilities simulated" value={6} color="#8b5cf6" delay={0.16} />
          <Stat icon={Icons.LayoutDashboard} label="Connected dashboards" value={4} color="#10b981" delay={0.24} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Reveal>
            <div className="card p-5 h-full">
              <p className="font-display font-bold text-slate-900">Technical architecture</p>
              <div className="mt-3 space-y-2.5">
                {STACK.map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <Icons.CheckCircle2 size={15} className="text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[0.84rem] font-bold text-slate-800">{k}</p>
                      <p className="text-[0.76rem] text-slate-500">{v}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card p-5 h-full">
              <p className="font-display font-bold text-slate-900">Alignment</p>
              <p className="text-[0.8rem] text-slate-500 mt-1">Directly supports national missions and UN sustainable development goals.</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {SDG.map((s) => <Chip key={s} color="#059669" bg="#ecfdf5">{s}</Chip>)}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[0.78rem] font-bold text-slate-600 mb-2">Ecosystem reach in the demo dataset</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['Universities', PLATFORM_TOTALS.universities], ['Industry partners', PLATFORM_TOTALS.industries], ['Districts', PLATFORM_TOTALS.districts]].map(([l, v]) => (
                    <div key={l}>
                      <p className="font-display text-xl font-extrabold text-slate-900">{v}</p>
                      <p className="text-[0.68rem] text-slate-400 font-semibold">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-12">
          {Object.values(ROLES).filter((r) => r.key !== 'ai').map((r) => (
            <Link key={r.key} to={`/${r.key === 'varsity' ? 'university' : r.key === 'govt' ? 'government' : r.key}`}
              className="btn" style={{ background: r.soft, color: r.deep }}>
              Open {r.label} dashboard
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
