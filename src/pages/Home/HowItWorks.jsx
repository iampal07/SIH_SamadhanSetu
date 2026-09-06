import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { Reveal, SectionHead, Chip } from '../../components/shared/ui';
import { DisciplineWeb } from '../../components/shared/AIPanel';
import { STAGES, ROLES } from '../../data/constants';

const DETAIL = {
  submitted: 'A citizen, community group or government office files the problem with a title, description, category, location and photographs. It takes under two minutes on a phone.',
  ai_analysed: 'The AI engine classifies the domain, computes a 0–100 priority score from five factors, and searches every past challenge for duplicates and similar cases.',
  validated: 'The district innovation cell sees the analysed challenge in its queue, verifies it in the field and either validates, rejects as duplicate, or routes it to the right department.',
  university_matched: 'The engine ranks universities by research area, department fit, faculty expertise, past projects and distance. Top matches receive the challenge in their dashboard.',
  team_formed: 'The accepting university assembles a multidisciplinary team — faculty, researchers and students across departments — using the AI-suggested discipline mix.',
  proposal_created: 'The team publishes a proposal: objective, approach, budget, duration and milestones. This becomes the public project record.',
  industry_matched: 'Industry, MSMEs, startups and CSR arms are ranked on domain, technology, CSR focus and funding capacity. A partner joins with a defined support commitment.',
  prototype: 'The student team builds the first working prototype with industry mentorship and hardware support.',
  testing: 'The prototype is tested in the lab and with the community that raised the problem, and iterated on the feedback.',
  pilot: 'A supervised field pilot runs in the actual location, with the industry partner handling deployment logistics.',
  deployment: 'After government and community sign-off, the solution is deployed at full scale and handed over with a maintenance plan.',
  impact_measured: 'Beneficiaries, savings, service improvement and a sustainability score are recorded and reported back to the citizen who raised the problem.',
};

export default function HowItWorks() {
  return (
    <div className="pt-28 pb-20 mesh">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <SectionHead eyebrow="How It Works" title="The complete twelve-stage lifecycle"
          sub="Every challenge on SamadhanSetu follows the same transparent path. Each stage names exactly who acts and what happens next." />

        <div className="mt-12 relative">
          <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-cyan-400 via-indigo-400 to-emerald-400 opacity-40" />
          <div className="space-y-4">
            {STAGES.map((s, i) => {
              const r = ROLES[s.owner];
              const Icon = Icons[s.icon] ?? Icons.Circle;
              return (
                <Reveal key={s.key} delay={i * 0.04}>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl grid place-items-center text-white shrink-0 relative z-10"
                      style={{ background: `linear-gradient(135deg,${r.hex},${r.deep})`, boxShadow: `0 12px 26px -14px ${r.hex}` }}>
                      <Icon size={20} />
                    </div>
                    <div className="card p-4 flex-1 card-hover">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.68rem] font-extrabold text-slate-300">STEP {String(i + 1).padStart(2, '0')}</span>
                        <p className="font-display font-bold text-slate-900">{s.label}</p>
                        <Chip color={r.deep} bg={r.soft}>{r.label} acts</Chip>
                      </div>
                      <p className="text-[0.86rem] text-slate-500 mt-1.5 leading-relaxed">{DETAIL[s.key]}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-12">
          <Reveal><DisciplineWeb disciplines={['Civil Engineering', 'Environmental Science', 'Computer Science', 'IoT / Electronics']} category="Water & Sanitation" /></Reveal>
          <Reveal delay={0.1}>
            <div className="card p-5 h-full flex flex-col justify-center">
              <p className="font-display font-bold text-lg text-slate-900">Want to see it move?</p>
              <p className="text-[0.86rem] text-slate-500 mt-1.5">
                The simulation page runs a real challenge through all twelve stages with play, pause and step controls —
                and every step updates the four dashboards live.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link to="/simulation" className="btn btn-primary"><PlayCircle size={15} />Run simulation</Link>
                <Link to="/citizen/submit" className="btn btn-ghost">Submit your own <ArrowRight size={14} /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
