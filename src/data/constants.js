export const STAGES = [
  { key: 'submitted',          label: 'Submitted',          short: 'Submitted',  owner: 'citizen',  icon: 'Send' },
  { key: 'ai_analysed',        label: 'AI Analysed',        short: 'AI',         owner: 'ai',       icon: 'Sparkles' },
  { key: 'validated',          label: 'Validated',          short: 'Validated',  owner: 'govt',     icon: 'ShieldCheck' },
  { key: 'university_matched', label: 'University Matched', short: 'Matched',    owner: 'varsity',  icon: 'GraduationCap' },
  { key: 'team_formed',        label: 'Team Formed',        short: 'Team',       owner: 'varsity',  icon: 'Users' },
  { key: 'proposal_created',   label: 'Proposal Created',   short: 'Proposal',   owner: 'varsity',  icon: 'FileText' },
  { key: 'industry_matched',   label: 'Industry Onboard',   short: 'Industry',   owner: 'industry', icon: 'Factory' },
  { key: 'prototype',          label: 'Prototype',          short: 'Prototype',  owner: 'varsity',  icon: 'Wrench' },
  { key: 'testing',            label: 'Testing',            short: 'Testing',    owner: 'varsity',  icon: 'FlaskConical' },
  { key: 'pilot',              label: 'Pilot',              short: 'Pilot',      owner: 'industry', icon: 'Rocket' },
  { key: 'deployment',         label: 'Deployment',         short: 'Deployed',   owner: 'govt',     icon: 'CheckCircle2' },
  { key: 'impact_measured',    label: 'Impact Measured',    short: 'Impact',     owner: 'citizen',  icon: 'TrendingUp' },
];

export const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));
export const stageMeta = (k) => STAGES[STAGE_INDEX[k]] ?? STAGES[0];
export const stageAfter = (k) => STAGES[Math.min(STAGE_INDEX[k] + 1, STAGES.length - 1)].key;

export const ROLES = {
  citizen:  { key: 'citizen',  label: 'Citizen',    color: 'citizen',  hex: '#06b6d4', soft: '#ecfeff', deep: '#0e7490', grad: 'from-cyan-500 to-sky-500' },
  varsity:  { key: 'varsity',  label: 'University', color: 'varsity',  hex: '#6366f1', soft: '#eef2ff', deep: '#4338ca', grad: 'from-indigo-500 to-violet-500' },
  industry: { key: 'industry', label: 'Industry',   color: 'industry', hex: '#f59e0b', soft: '#fff7ed', deep: '#b45309', grad: 'from-amber-500 to-orange-500' },
  govt:     { key: 'govt',     label: 'Government', color: 'govt',     hex: '#10b981', soft: '#ecfdf5', deep: '#047857', grad: 'from-emerald-500 to-teal-500' },
  ai:       { key: 'ai',       label: 'AI Engine',  color: 'varsity',  hex: '#8b5cf6', soft: '#f5f3ff', deep: '#6d28d9', grad: 'from-violet-500 to-fuchsia-500' },
};

export const CATEGORIES = [
  { key: 'Water & Sanitation',  hex: '#06b6d4', icon: 'Droplets' },
  { key: 'Healthcare',          hex: '#ef4444', icon: 'HeartPulse' },
  { key: 'Education',           hex: '#6366f1', icon: 'BookOpen' },
  { key: 'Agriculture',         hex: '#22c55e', icon: 'Sprout' },
  { key: 'Environment',         hex: '#10b981', icon: 'Leaf' },
  { key: 'Rural Development',   hex: '#f59e0b', icon: 'Home' },
  { key: 'Urban Infrastructure',hex: '#8b5cf6', icon: 'Building2' },
  { key: 'Accessibility',       hex: '#ec4899', icon: 'Accessibility' },
  { key: 'Public Services',     hex: '#0ea5e9', icon: 'Landmark' },
];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
export const catMeta = (k) => CATEGORIES.find((c) => c.key === k) ?? CATEGORIES[0];

/* Jharkhand districts with normalised map coordinates (0-100 viewbox space) */
export const DISTRICTS = [
  { name: 'Ranchi',      x: 46, y: 56 },
  { name: 'Dhanbad',     x: 74, y: 38 },
  { name: 'Bokaro',      x: 64, y: 43 },
  { name: 'Jamshedpur',  x: 66, y: 74 },
  { name: 'Hazaribagh',  x: 55, y: 36 },
  { name: 'Deoghar',     x: 82, y: 26 },
  { name: 'Giridih',     x: 70, y: 27 },
  { name: 'Palamu',      x: 22, y: 32 },
  { name: 'Gumla',       x: 27, y: 64 },
  { name: 'Simdega',     x: 30, y: 80 },
  { name: 'Dumka',       x: 88, y: 38 },
  { name: 'Sahibganj',   x: 92, y: 16 },
  { name: 'Khunti',      x: 45, y: 70 },
  { name: 'Latehar',     x: 30, y: 44 },
  { name: 'Chatra',      x: 42, y: 27 },
  { name: 'West Singhbhum', x: 50, y: 84 },
];
export const DISTRICT_NAMES = DISTRICTS.map((d) => d.name);
export const districtMeta = (n) => DISTRICTS.find((d) => d.name === n) ?? DISTRICTS[0];

export const SUPPORT_TYPES = ['Mentorship', 'Funding', 'Technology', 'Infrastructure', 'Prototyping', 'Testing', 'Deployment'];
