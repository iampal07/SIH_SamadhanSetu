/**
 * Simulated AI engine.
 * Everything here is deterministic, keyword + weight based scoring that mimics the
 * behaviour of the real NLP / recommendation services described in the solution.
 */
import { CATEGORY_KEYS, districtMeta } from '../data/constants';
import { UNIVERSITIES } from '../data/universities';
import { INDUSTRIES } from '../data/industries';

const KEYWORDS = {
  'Water & Sanitation': ['water', 'borewell', 'bore well', 'tap', 'pipeline', 'drinking', 'well', 'tank', 'sanitation', 'toilet', 'sewage', 'drain', 'handpump', 'hand pump', 'groundwater', 'tubewell', 'contaminat', 'fluoride', 'arsenic'],
  Healthcare: ['health', 'hospital', 'clinic', 'doctor', 'medicine', 'ambulance', 'phc', 'chc', 'maternal', 'disease', 'malaria', 'anaemia', 'vaccination', 'patient', 'diagnos', 'telemedicine'],
  Education: ['school', 'student', 'teacher', 'classroom', 'education', 'learning', 'library', 'exam', 'literacy', 'dropout', 'anganwadi', 'tuition', 'digital class'],
  Agriculture: ['farm', 'crop', 'irrigation', 'soil', 'harvest', 'seed', 'fertiliser', 'fertilizer', 'kisan', 'agri', 'paddy', 'mandi', 'yield', 'livestock', 'drought'],
  Environment: ['pollution', 'forest', 'tree', 'air quality', 'waste', 'garbage', 'plastic', 'river', 'climate', 'emission', 'biodiversity', 'dumping', 'smoke'],
  'Rural Development': ['village', 'panchayat', 'rural', 'livelihood', 'shg', 'employment', 'migration', 'market access', 'electrification', 'tribal', 'hamlet'],
  'Urban Infrastructure': ['road', 'street', 'bridge', 'drainage', 'traffic', 'flood', 'streetlight', 'street light', 'footpath', 'pothole', 'municipal', 'transport', 'bus', 'parking'],
  Accessibility: ['disab', 'divyang', 'wheelchair', 'ramp', 'blind', 'deaf', 'accessib', 'elderly', 'sign language', 'assistive'],
  'Public Services': ['certificate', 'ration', 'pension', 'documents', 'grievance', 'office', 'scheme', 'aadhaar', 'subsidy', 'portal', 'queue', 'corruption'],
};

const URGENT_WORDS = ['urgent', 'emergency', 'immediately', 'danger', 'death', 'died', 'critical', 'severe', 'crisis', 'collapse', 'outbreak', 'accident', 'daily', 'every day', 'months', 'years'];
const SCALE_WORDS = ['village', 'district', 'block', 'thousand', 'families', 'households', 'community', 'panchayat', 'entire', 'all', 'region'];

const clamp = (n, a = 0, b = 100) => Math.round(Math.max(a, Math.min(b, n)));
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

/* ── AI 1 · Classification ───────────────────────────────────────────── */
export function classify(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  const scores = CATEGORY_KEYS.map((cat) => {
    let s = 0;
    for (const kw of KEYWORDS[cat]) {
      if (text.includes(kw)) s += kw.length > 6 ? 3 : 2;
      if (title.toLowerCase().includes(kw)) s += 2;
    }
    return { category: cat, raw: s };
  }).sort((a, b) => b.raw - a.raw);

  const top = scores[0];
  const total = scores.reduce((a, b) => a + b.raw, 0) || 1;
  const confidence = top.raw === 0 ? 62 : clamp(Math.round(58 + (top.raw / total) * 44), 60, 97);

  return {
    category: top.raw === 0 ? 'Public Services' : top.category,
    confidence,
    alternates: scores.slice(1, 4).filter((s) => s.raw > 0).map((s) => ({
      category: s.category,
      confidence: clamp(Math.round((s.raw / total) * 90), 5, 80),
    })),
    keywords: Array.from(new Set(
      (KEYWORDS[top.category] || []).filter((k) => text.includes(k)),
    )).slice(0, 6),
  };
}

/* ── AI 2 · Priority scoring ─────────────────────────────────────────── */
export function priorityScore({ title = '', description = '', category, district = '', affected = 0 }) {
  const text = `${title} ${description}`.toLowerCase();
  const seed = hash(title + district);

  const urgencyHits = URGENT_WORDS.filter((w) => text.includes(w)).length;
  const scaleHits = SCALE_WORDS.filter((w) => text.includes(w)).length;

  const urgency = clamp(48 + urgencyHits * 12 + (seed % 11));
  const population = clamp(affected ? Math.min(96, 34 + Math.log10(Math.max(affected, 10)) * 17) : 46 + scaleHits * 9 + (seed % 13));
  const severity = clamp(45 + urgencyHits * 9 + (['Healthcare', 'Water & Sanitation'].includes(category) ? 16 : 6) + (seed % 9));
  const geographic = clamp(42 + scaleHits * 10 + (seed % 17));
  const feasibility = clamp(56 + ((seed >> 3) % 34));

  const score = Math.round(
    urgency * 0.26 + population * 0.24 + severity * 0.24 + geographic * 0.14 + feasibility * 0.12,
  );
  const level = score >= 78 ? 'CRITICAL' : score >= 65 ? 'HIGH' : score >= 48 ? 'MEDIUM' : 'LOW';
  return { score, level, factors: { urgency, population, severity, geographic, feasibility } };
}

/* ── AI 3 · Duplicate / similarity detection ─────────────────────────── */
const tokenise = (s) => new Set(
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 3 && !['this', 'that', 'have', 'from', 'with', 'been', 'they', 'there', 'their', 'which', 'about', 'very', 'please'].includes(w)),
);

export function findDuplicates(candidate, existing) {
  const a = tokenise(`${candidate.title} ${candidate.description}`);
  return existing
    .filter((c) => c.id !== candidate.id)
    .map((c) => {
      const b = tokenise(`${c.title} ${c.description}`);
      let inter = 0;
      a.forEach((t) => { if (b.has(t)) inter += 1; });
      const jaccard = inter / (a.size + b.size - inter || 1);
      let sim = jaccard * 118;
      if (c.category === candidate.category) sim += 22;
      if (c.district === candidate.district) sim += 16;
      return { id: c.id, title: c.title, district: c.district, category: c.category, status: c.status, similarity: clamp(Math.round(sim), 0, 97) };
    })
    .filter((d) => d.similarity >= 55)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 4);
}

/* ── AI 4 · University matching ──────────────────────────────────────── */
export function matchUniversities(challenge) {
  const { category, district, description = '', title = '' } = challenge;
  const text = `${title} ${description}`.toLowerCase();
  return UNIVERSITIES.map((u) => {
    let score = 34;
    const reasons = [];
    if (u.domains[0] === category) { score += 26; reasons.push(`Primary research domain: ${category}`); }
    else if (u.domains.includes(category)) { score += 20; reasons.push(`Active domain expertise in ${category}`); }
    if (u.district === district) { score += 14; reasons.push(`Located in ${district} — field access`); }
    const resHits = u.research.filter((r) => text.includes(r.split(' ')[0].toLowerCase()));
    if (resHits.length) { score += 8 * resHits.length; reasons.push(`Ongoing research: ${resHits.join(', ')}`); }
    score += Math.min(12, Math.round(u.projects / 4));
    reasons.push(`${u.projects} completed societal projects · ${u.faculty} faculty`);
    score += Math.round((u.rating - 4.3) * 14);
    score += (hash(u.id + category) % 7);
    return {
      id: u.id, name: u.name, short: u.short, district: u.district, type: u.type,
      departments: u.departments, score: clamp(score, 30, 97), reasons: reasons.slice(0, 3),
    };
  }).sort((a, b) => b.score - a.score);
}

/* ── AI 5 · Industry matching ────────────────────────────────────────── */
export function matchIndustries(challenge) {
  const { category, district, title = '', description = '' } = challenge;
  const text = `${title} ${description}`.toLowerCase();
  return INDUSTRIES.map((f) => {
    let score = 30;
    const reasons = [];
    if (f.domains[0] === category) { score += 25; reasons.push(`Core business domain: ${category}`); }
    else if (f.domains.includes(category)) { score += 18; reasons.push(`Operates in ${category}`); }
    const techHits = f.tech.filter((t) => text.includes(t.split(' ')[0].toLowerCase()));
    if (techHits.length) { score += 9 * techHits.length; reasons.push(`Technology fit: ${techHits.join(', ')}`); }
    if (f.csrFocus.some((c) => text.includes(c.split(' ')[0].toLowerCase()))) { score += 10; reasons.push(`CSR focus: ${f.csrFocus[0]}`); }
    else reasons.push(`CSR focus: ${f.csrFocus.join(', ')}`);
    if (f.hq === district) { score += 9; reasons.push(`Headquartered in ${district}`); }
    score += f.capacity === 'High' ? 12 : f.capacity === 'Medium' ? 7 : 3;
    score += Math.min(9, Math.round(f.projects / 5));
    score += (hash(f.id + category) % 6);
    return {
      id: f.id, name: f.name, short: f.short, type: f.type, hq: f.hq,
      supports: f.supports, funding: f.funding, score: clamp(score, 28, 96), reasons: reasons.slice(0, 3),
    };
  }).sort((a, b) => b.score - a.score);
}

/* ── AI 6 · Multidisciplinary team suggestion ────────────────────────── */
export function suggestDisciplines(category) {
  const map = {
    'Water & Sanitation': ['Civil Engineering', 'Environmental Science', 'Computer Science', 'IoT / Electronics'],
    Healthcare: ['Community Medicine', 'Biomedical Engineering', 'Computer Science', 'Public Health'],
    Education: ['Education & Pedagogy', 'Computer Science', 'Design', 'Sociology'],
    Agriculture: ['Agricultural Engineering', 'Soil Science', 'Data Science', 'Agri-Informatics'],
    Environment: ['Environmental Science', 'Remote Sensing', 'Computer Science', 'Policy Studies'],
    'Rural Development': ['Sociology', 'Civil Engineering', 'Economics', 'Computer Science'],
    'Urban Infrastructure': ['Civil Engineering', 'Transport Planning', 'Electronics', 'Data Science'],
    Accessibility: ['Bio-engineering', 'Human-Centred Design', 'Computer Science', 'Rehabilitation Studies'],
    'Public Services': ['Public Administration', 'Computer Science', 'Design', 'Data Science'],
  };
  return map[category] ?? map['Public Services'];
}

/* ── Full analysis pipeline ──────────────────────────────────────────── */
export function runAnalysis(challenge, existing = []) {
  const cls = classify(challenge.title, challenge.description);
  const category = challenge.categoryOverride || cls.category;
  const enriched = { ...challenge, category };
  const priority = priorityScore(enriched);
  return {
    classification: cls,
    category,
    priority,
    duplicates: findDuplicates(enriched, existing),
    universityMatches: matchUniversities(enriched).slice(0, 5),
    industryMatches: matchIndustries(enriched).slice(0, 5),
    disciplines: suggestDisciplines(category),
    coords: districtMeta(challenge.district),
    analysedAt: new Date().toISOString(),
  };
}

export const AI_STEPS = [
  'Tokenising submission text',
  'Running domain classifier',
  'Estimating population impact',
  'Scoring urgency and severity',
  'Searching 12,480 past challenges',
  'Ranking university research fit',
  'Ranking industry capability fit',
  'Composing recommendation',
];
