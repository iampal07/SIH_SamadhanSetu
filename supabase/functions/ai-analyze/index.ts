/**
 * SamadhanSetu — AI analysis edge function.
 *
 * Ports the Gemini pipeline from the jharkhand-portal-backend service into a
 * server-side Supabase Edge Function so the API key never reaches the browser.
 *
 * Pipeline (same stages/weights as the original Node service):
 *   1. language detection + translation to English
 *   2. severity + category extraction  -> criticality score
 *   3. geo/district duplicate detection against existing challenges
 *   4. keyword shortlist -> Gemini ranking of universities and industry partners
 *
 * Every stage degrades to a deterministic heuristic when GEMINI_API_KEY is
 * absent or the API call fails, so the platform never blocks on the model.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const W_PEOPLE = Number(Deno.env.get('WEIGHT_PEOPLE_AFFECTED') ?? '0.45');
const W_SEVERITY = Number(Deno.env.get('WEIGHT_SEVERITY') ?? '0.35');
const W_DUPLICATE = Number(Deno.env.get('WEIGHT_DUPLICATE_COUNT') ?? '0.20');
const SHORTLIST_SIZE = Number(Deno.env.get('SHORTLIST_SIZE') ?? '6');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/* ── Reference data (kept in sync with src/data) ───────────────────────── */
const CATEGORIES = [
  'Water & Sanitation', 'Healthcare', 'Education', 'Agriculture', 'Environment',
  'Rural Development', 'Urban Infrastructure', 'Accessibility', 'Public Services',
];

const UNIVERSITIES = [
  { id: 'u1', name: 'IIT (ISM) Dhanbad', short: 'IIT ISM', district: 'Dhanbad', type: 'Institute of National Importance', nirf: 15,
    domains: ['Water & Sanitation', 'Environment', 'Urban Infrastructure', 'Public Services'],
    departments: ['Environmental Engineering', 'Civil Engineering', 'Computer Science & Engineering', 'Electronics', 'Mining Engineering'],
    research: ['Groundwater modelling', 'IoT sensor networks', 'Geospatial analytics', 'Mine water remediation'], projects: 34 },
  { id: 'u2', name: 'NIT Jamshedpur', short: 'NIT JSR', district: 'Jamshedpur', type: 'National Institute of Technology', nirf: 82,
    domains: ['Urban Infrastructure', 'Public Services', 'Environment', 'Rural Development'],
    departments: ['Civil Engineering', 'Production Engineering', 'Computer Science', 'Electrical Engineering'],
    research: ['Smart mobility', 'Structural health monitoring', 'Waste-to-energy', 'Road safety analytics'], projects: 27 },
  { id: 'u3', name: 'Birsa Agricultural University', short: 'BAU Ranchi', district: 'Ranchi', type: 'State Agricultural University', nirf: 0,
    domains: ['Agriculture', 'Rural Development', 'Water & Sanitation', 'Environment'],
    departments: ['Agronomy', 'Soil Science', 'Agricultural Engineering', 'Horticulture', 'Agri-Informatics'],
    research: ['Micro-irrigation', 'Drought-resilient cropping', 'Soil health mapping', 'Farmer advisory systems'], projects: 41 },
  { id: 'u4', name: 'RIMS Ranchi', short: 'RIMS', district: 'Ranchi', type: 'Medical Institute', nirf: 0,
    domains: ['Healthcare', 'Public Services', 'Accessibility'],
    departments: ['Community Medicine', 'Telemedicine Unit', 'Biomedical Engineering', 'Public Health'],
    research: ['Tele-consultation in tribal belts', 'Maternal health outreach', 'Low-cost diagnostics'], projects: 22 },
  { id: 'u5', name: 'Central University of Jharkhand', short: 'CUJ', district: 'Ranchi', type: 'Central University', nirf: 0,
    domains: ['Education', 'Environment', 'Rural Development', 'Accessibility', 'Public Services'],
    departments: ['Education', 'Environmental Sciences', 'Computer Science', 'Mass Communication', 'Sociology'],
    research: ['Digital pedagogy', 'Tribal language learning tools', 'Community participation models'], projects: 19 },
  { id: 'u6', name: 'BIT Mesra', short: 'BIT Mesra', district: 'Ranchi', type: 'Deemed University', nirf: 51,
    domains: ['Urban Infrastructure', 'Environment', 'Education', 'Healthcare', 'Accessibility'],
    departments: ['Computer Science', 'Electronics & Communication', 'Civil Engineering', 'Bio-engineering', 'Space Engineering'],
    research: ['Assistive technology', 'Remote sensing', 'Embedded systems', 'AI for social good'], projects: 38 },
];

const INDUSTRIES = [
  { id: 'i1', name: 'Tata Steel Foundation', short: 'Tata Steel', type: 'CSR Arm', hq: 'Jamshedpur', capacity: 'High', funding: '₹25 Cr / yr',
    domains: ['Water & Sanitation', 'Rural Development', 'Education', 'Healthcare'],
    tech: ['Water treatment', 'Community infrastructure', 'Skilling'], csr: ['Rural livelihoods', 'Drinking water', 'Tribal education'],
    supports: ['Funding', 'Infrastructure', 'Deployment', 'Mentorship'], projects: 46 },
  { id: 'i2', name: 'HydroSense Technologies', short: 'HydroSense', type: 'Startup', hq: 'Ranchi', capacity: 'Medium', funding: '₹2.5 Cr / yr',
    domains: ['Water & Sanitation', 'Environment', 'Agriculture'],
    tech: ['IoT flow sensors', 'LoRaWAN networks', 'Water quality analytics'], csr: ['Water conservation'],
    supports: ['Technology', 'Prototyping', 'Testing', 'Mentorship'], projects: 12 },
  { id: 'i3', name: 'GreenFields AgriTech', short: 'GreenFields', type: 'MSME', hq: 'Hazaribagh', capacity: 'Medium', funding: '₹1.2 Cr / yr',
    domains: ['Agriculture', 'Rural Development', 'Environment'],
    tech: ['Drip irrigation', 'Soil sensors', 'Farmer advisory apps'], csr: ['Farmer income', 'Sustainable farming'],
    supports: ['Technology', 'Infrastructure', 'Prototyping', 'Deployment'], projects: 18 },
  { id: 'i4', name: 'MediReach Health Systems', short: 'MediReach', type: 'Startup', hq: 'Ranchi', capacity: 'Medium', funding: '₹3.8 Cr / yr',
    domains: ['Healthcare', 'Accessibility', 'Public Services'],
    tech: ['Telemedicine kiosks', 'Portable diagnostics', 'Health records'], csr: ['Rural healthcare access'],
    supports: ['Technology', 'Testing', 'Deployment', 'Mentorship'], projects: 15 },
  { id: 'i5', name: 'UrbanGrid Infra Solutions', short: 'UrbanGrid', type: 'Enterprise', hq: 'Dhanbad', capacity: 'High', funding: '₹9 Cr / yr',
    domains: ['Urban Infrastructure', 'Public Services', 'Environment'],
    tech: ['Smart lighting', 'Drainage engineering', 'Traffic systems'], csr: ['Safe cities'],
    supports: ['Infrastructure', 'Funding', 'Deployment', 'Testing'], projects: 29 },
  { id: 'i6', name: 'EduSpark Learning Labs', short: 'EduSpark', type: 'Startup', hq: 'Ranchi', capacity: 'Medium', funding: '₹1.6 Cr / yr',
    domains: ['Education', 'Accessibility', 'Rural Development'],
    tech: ['Offline learning devices', 'Vernacular content', 'Assessment AI'], csr: ['Digital literacy', 'Girl child education'],
    supports: ['Technology', 'Mentorship', 'Prototyping'], projects: 21 },
  { id: 'i7', name: 'Jharkhand Renewables Ltd.', short: 'JR Renewables', type: 'Enterprise', hq: 'Bokaro', capacity: 'High', funding: '₹12 Cr / yr',
    domains: ['Environment', 'Rural Development', 'Urban Infrastructure', 'Water & Sanitation'],
    tech: ['Solar micro-grids', 'Battery storage', 'Solar pumping'], csr: ['Clean energy access'],
    supports: ['Funding', 'Technology', 'Infrastructure', 'Deployment'], projects: 24 },
  { id: 'i8', name: 'AccessAble Devices', short: 'AccessAble', type: 'MSME', hq: 'Jamshedpur', capacity: 'Low', funding: '₹0.9 Cr / yr',
    domains: ['Accessibility', 'Healthcare', 'Public Services'],
    tech: ['Assistive hardware', '3D printed aids', 'Screen-reader tooling'], csr: ['Divyangjan empowerment'],
    supports: ['Prototyping', 'Technology', 'Mentorship'], projects: 9 },
];

const DISCIPLINE_MAP: Record<string, string[]> = {
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

/* ── Gemini helper ─────────────────────────────────────────────────────── */
async function callGemini(prompt: string): Promise<any | null> {
  if (!GEMINI_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.error('gemini http', res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.error('gemini error', String(e));
    return null;
  }
}

/* ── Deterministic fallbacks (mirrors src/services/aiEngine.js) ────────── */
const KEYWORDS: Record<string, string[]> = {
  'Water & Sanitation': ['water', 'borewell', 'tap', 'pipeline', 'drinking', 'well', 'tank', 'sanitation', 'toilet', 'sewage', 'drain', 'handpump', 'groundwater', 'contaminat', 'fluoride'],
  Healthcare: ['health', 'hospital', 'clinic', 'doctor', 'medicine', 'ambulance', 'phc', 'maternal', 'disease', 'vaccination', 'patient', 'diagnos', 'telemedicine'],
  Education: ['school', 'student', 'teacher', 'classroom', 'education', 'learning', 'library', 'exam', 'literacy', 'dropout', 'anganwadi'],
  Agriculture: ['farm', 'crop', 'irrigation', 'soil', 'harvest', 'seed', 'fertiliser', 'kisan', 'agri', 'paddy', 'mandi', 'yield', 'drought'],
  Environment: ['pollution', 'forest', 'tree', 'air quality', 'waste', 'garbage', 'plastic', 'river', 'climate', 'emission', 'dumping'],
  'Rural Development': ['village', 'panchayat', 'rural', 'livelihood', 'employment', 'migration', 'electrification', 'tribal', 'hamlet'],
  'Urban Infrastructure': ['road', 'street', 'bridge', 'drainage', 'traffic', 'flood', 'streetlight', 'footpath', 'pothole', 'municipal', 'transport', 'bus'],
  Accessibility: ['disab', 'divyang', 'wheelchair', 'ramp', 'blind', 'deaf', 'accessib', 'elderly', 'assistive'],
  'Public Services': ['certificate', 'ration', 'pension', 'documents', 'grievance', 'scheme', 'aadhaar', 'subsidy', 'portal', 'queue'],
};
const URGENT = ['urgent', 'emergency', 'immediately', 'danger', 'death', 'died', 'critical', 'severe', 'crisis', 'collapse', 'outbreak', 'accident', 'months', 'years'];

function heuristicClassify(text: string) {
  const t = text.toLowerCase();
  const scored = CATEGORIES.map((c) => ({
    category: c,
    raw: KEYWORDS[c].reduce((s, k) => s + (t.includes(k) ? (k.length > 6 ? 3 : 2) : 0), 0),
  })).sort((a, b) => b.raw - a.raw);
  const total = scored.reduce((a, b) => a + b.raw, 0) || 1;
  const top = scored[0];
  return {
    category: top.raw === 0 ? 'Public Services' : top.category,
    confidence: top.raw === 0 ? 62 : Math.min(97, Math.round(58 + (top.raw / total) * 44)),
    alternates: scored.slice(1, 4).filter((s) => s.raw > 0)
      .map((s) => ({ category: s.category, confidence: Math.max(5, Math.min(80, Math.round((s.raw / total) * 90))) })),
    keywords: Array.from(new Set((KEYWORDS[top.category] || []).filter((k) => t.includes(k)))).slice(0, 6),
    severity: Math.min(10, 4 + URGENT.filter((w) => t.includes(w)).length * 1.5),
  };
}

const tokenize = (s: string) => (s || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);

function similarity(a: string, b: string) {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  let inter = 0;
  A.forEach((x) => { if (B.has(x)) inter += 1; });
  return inter / (A.size + B.size - inter || 1);
}

/* ── Matching ──────────────────────────────────────────────────────────── */
function shortlistUniversities(category: string, text: string) {
  const q = new Set([...tokenize(category), ...tokenize(text)]);
  return UNIVERSITIES.map((u) => {
    let score = 34;
    const reasons: string[] = [];
    if (u.domains[0] === category) { score += 26; reasons.push(`Primary research domain: ${category}`); }
    else if (u.domains.includes(category)) { score += 20; reasons.push(`Active domain expertise in ${category}`); }
    const resHits = u.research.filter((r) => [...q].some((t) => r.toLowerCase().includes(t)));
    if (resHits.length) { score += 8 * resHits.length; reasons.push(`Ongoing research: ${resHits.join(', ')}`); }
    score += Math.min(12, Math.round(u.projects / 4));
    reasons.push(`${u.projects} completed societal projects`);
    if (u.nirf && u.nirf < 60) score += 6;
    return { id: u.id, name: u.name, short: u.short, district: u.district, type: u.type,
      departments: u.departments, score: Math.max(30, Math.min(97, Math.round(score))), reasons: reasons.slice(0, 3) };
  }).sort((a, b) => b.score - a.score);
}

function shortlistIndustries(category: string, text: string) {
  const q = new Set([...tokenize(category), ...tokenize(text)]);
  return INDUSTRIES.map((f) => {
    let score = 30;
    const reasons: string[] = [];
    if (f.domains[0] === category) { score += 25; reasons.push(`Core business domain: ${category}`); }
    else if (f.domains.includes(category)) { score += 18; reasons.push(`Operates in ${category}`); }
    const techHits = f.tech.filter((tch) => [...q].some((t) => tch.toLowerCase().includes(t)));
    if (techHits.length) { score += 9 * techHits.length; reasons.push(`Technology fit: ${techHits.join(', ')}`); }
    reasons.push(`CSR focus: ${f.csr.join(', ')}`);
    score += f.capacity === 'High' ? 12 : f.capacity === 'Medium' ? 7 : 3;
    score += Math.min(9, Math.round(f.projects / 5));
    return { id: f.id, name: f.name, short: f.short, type: f.type, hq: f.hq, supports: f.supports,
      funding: f.funding, score: Math.max(28, Math.min(96, Math.round(score))), reasons: reasons.slice(0, 3) };
  }).sort((a, b) => b.score - a.score);
}

/* ── Handler ───────────────────────────────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const started = Date.now();

  try {
    const body = await req.json();
    const { challengeCode, title = '', description = '', district = '', village = '', affected = 0 } = body ?? {};
    if (!challengeCode) {
      return new Response(JSON.stringify({ error: 'challengeCode is required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const rawText = `${title}. ${description}`.trim();
    let engine = GEMINI_KEY ? 'gemini' : 'heuristic';
    const fallback = heuristicClassify(rawText);

    /* 1 — language detection + translation */
    let language = { detected_language: 'English', english_translation: rawText, confidence: 0.9 };
    const langOut = await callGemini(
      `You are a linguistic expert in Khortha, Nagpuri, Sadri and Hindi as spoken in Jharkhand, India.
Detect the language/dialect of this citizen complaint and translate it into formal, actionable English.

Complaint: "${rawText}"

Return ONLY JSON: {"detected_language": string, "english_translation": string, "confidence": number 0..1}`,
    );
    if (langOut?.english_translation) language = langOut;

    const englishText = language.english_translation || rawText;

    /* 2 — severity + category */
    let severity = { severity_score: fallback.severity, category: fallback.category, reasoning: 'Keyword-based severity estimate.', confidence: fallback.confidence };
    const sevOut = await callGemini(
      `You are triaging a citizen complaint submitted to a government innovation portal in Jharkhand, India.

Complaint: "${englishText}"
People affected (declared by the citizen): ${affected}
Location: ${village ? village + ', ' : ''}${district}

Assess the qualitative severity from the text alone on a 1-10 scale. Do not estimate the population yourself.
Pick exactly ONE category from: ${CATEGORIES.join(', ')}.
Also list 3-5 technical expertise areas needed to solve it.

Return ONLY JSON:
{"severity_score": number 1-10, "category": string, "confidence": number 0-100,
 "reasoning": "one short sentence", "required_expertise": string[], "keywords": string[]}`,
    );
    if (sevOut?.category && CATEGORIES.includes(sevOut.category)) severity = { ...severity, ...sevOut };
    else if (sevOut) severity = { ...severity, ...sevOut, category: fallback.category };

    const category = severity.category || fallback.category;

    /* 3 — duplicate detection against existing challenges in the same district */
    const { data: existing } = await supabase
      .from('challenges')
      .select('id, code, title, description, district, category, status')
      .neq('code', challengeCode)
      .limit(60);

    const candidates = (existing ?? [])
      .map((c: any) => ({ ...c, sim: similarity(rawText, `${c.title} ${c.description}`) + (c.district === district ? 0.12 : 0) + (c.category === category ? 0.1 : 0) }))
      .sort((a: any, b: any) => b.sim - a.sim)
      .slice(0, 5)
      .filter((c: any) => c.sim > 0.12);

    let duplicates = candidates.map((c: any) => ({
      id: c.code, title: c.title, district: c.district, category: c.category,
      status: c.status, similarity: Math.min(97, Math.round(c.sim * 100)), source: 'lexical',
    }));

    if (candidates.length) {
      const dupOut = await callGemini(
        `You are a deduplication engine for a civic grievance portal in Jharkhand, India.
Decide, for each existing complaint, whether it describes the SAME underlying issue at the same place as the new complaint.
Wording, language and detail level may differ.

New complaint: "${englishText}" (district: ${district}, village: ${village})

Existing complaints:
${candidates.map((c: any, i: number) => `${i + 1}. [${c.code}] ${c.title} — ${c.description.slice(0, 220)} (district: ${c.district})`).join('\n')}

Return ONLY JSON: {"matches":[{"code": string, "is_duplicate": boolean, "similarity": number 0-100, "reasoning": string}]}`,
      );
      if (dupOut?.matches?.length) {
        const byCode: Record<string, any> = {};
        dupOut.matches.forEach((m: any) => { byCode[m.code] = m; });
        duplicates = duplicates.map((d) => {
          const m = byCode[d.id];
          return m ? { ...d, similarity: Math.round(m.similarity ?? d.similarity), reasoning: m.reasoning, isDuplicate: !!m.is_duplicate, source: 'gemini' } : d;
        }).sort((a, b) => b.similarity - a.similarity);
      }
    }
    duplicates = duplicates.filter((d) => d.similarity >= 45).slice(0, 4);

    /* 4 — criticality / priority */
    const peopleNorm = Math.min(1, Math.log10(Math.max(0, Number(affected) || 0) + 1) / 5);
    const severityNorm = Math.min(1, Math.max(0, Number(severity.severity_score || 5) / 10));
    const duplicateNorm = Math.min(1, duplicates.length / 5);
    const criticality = (W_PEOPLE * peopleNorm + W_SEVERITY * severityNorm + W_DUPLICATE * duplicateNorm) * 100;
    const priorityScore = Math.round(criticality);
    const priorityLevel = priorityScore >= 78 ? 'CRITICAL' : priorityScore >= 60 ? 'HIGH' : priorityScore >= 40 ? 'MEDIUM' : 'LOW';

    /* 5 — university + industry matching (keyword shortlist -> Gemini re-rank) */
    const uniShortlist = shortlistUniversities(category, englishText).slice(0, SHORTLIST_SIZE);
    const indShortlist = shortlistIndustries(category, englishText).slice(0, SHORTLIST_SIZE);

    let universityMatches = uniShortlist.slice(0, 5);
    const routeOut = await callGemini(
      `You route validated civic challenges to the best-suited institutions in Jharkhand, India.

Challenge: "${englishText}"
Category: ${category}
District: ${district}

Universities available:
${uniShortlist.map((u) => {
        const full = UNIVERSITIES.find((x) => x.id === u.id)!;
        return `- ${u.id} | ${u.name} (${u.district}) | domains: ${full.domains.join(', ')} | departments: ${full.departments.join(', ')} | research: ${full.research.join(', ')}`;
      }).join('\n')}

Rank the best 3 and justify each in one sentence.
Return ONLY JSON: {"rankings":[{"id": string, "score": number 0-100, "reasoning": string}]}`,
    );
    if (routeOut?.rankings?.length) {
      const ranked = routeOut.rankings
        .map((r: any) => {
          const base = uniShortlist.find((u) => u.id === r.id);
          return base ? { ...base, score: Math.max(30, Math.min(99, Math.round(r.score ?? base.score))), reasons: [r.reasoning, ...base.reasons].filter(Boolean).slice(0, 3) } : null;
        })
        .filter(Boolean);
      const rest = uniShortlist.filter((u) => !ranked.some((r: any) => r.id === u.id));
      universityMatches = [...ranked, ...rest].slice(0, 5) as any;
    }

    let industryMatches = indShortlist.slice(0, 5);
    const indOut = await callGemini(
      `You match validated civic challenges with industry / CSR partners in Jharkhand, India.

Challenge: "${englishText}"
Category: ${category}

Partners available:
${indShortlist.map((f) => {
        const full = INDUSTRIES.find((x) => x.id === f.id)!;
        return `- ${f.id} | ${f.name} (${f.type}, ${f.hq}) | domains: ${full.domains.join(', ')} | tech: ${full.tech.join(', ')} | CSR: ${full.csr.join(', ')} | capacity: ${full.capacity}`;
      }).join('\n')}

Rank the best 3 on domain fit, technology fit, CSR alignment and funding capacity.
Return ONLY JSON: {"rankings":[{"id": string, "score": number 0-100, "reasoning": string}]}`,
    );
    if (indOut?.rankings?.length) {
      const ranked = indOut.rankings
        .map((r: any) => {
          const base = indShortlist.find((f) => f.id === r.id);
          return base ? { ...base, score: Math.max(28, Math.min(99, Math.round(r.score ?? base.score))), reasons: [r.reasoning, ...base.reasons].filter(Boolean).slice(0, 3) } : null;
        })
        .filter(Boolean);
      const rest = indShortlist.filter((f) => !ranked.some((r: any) => r.id === f.id));
      industryMatches = [...ranked, ...rest].slice(0, 5) as any;
    }

    if (!langOut && !sevOut && !routeOut) engine = 'heuristic';

    const analysis = {
      challenge_code: challengeCode,
      engine,
      model: engine === 'gemini' ? GEMINI_MODEL : 'samadhan-heuristic-v1',
      status: 'completed',
      detected_language: language.detected_language,
      english_text: englishText,
      language_confidence: Number(language.confidence ?? 0.9),
      category,
      category_confidence: Math.round(Number(severity.confidence ?? fallback.confidence)),
      alternate_categories: fallback.alternates,
      keywords: severity.keywords ?? fallback.keywords,
      severity_score: Number(severity.severity_score ?? fallback.severity),
      severity_reasoning: severity.reasoning ?? null,
      criticality_score: Math.round(criticality * 100) / 100,
      priority_score: priorityScore,
      priority_level: priorityLevel,
      priority_factors: {
        urgency: Math.round(severityNorm * 100),
        population: Math.round(peopleNorm * 100),
        severity: Math.round(Number(severity.severity_score ?? 5) * 10),
        geographic: Math.round(duplicateNorm * 100),
        feasibility: Math.round(60 + (universityMatches[0]?.score ?? 70) * 0.35),
      },
      duplicates,
      duplicate_count: duplicates.length,
      university_matches: universityMatches,
      industry_matches: industryMatches,
      disciplines: DISCIPLINE_MAP[category] ?? DISCIPLINE_MAP['Public Services'],
      required_expertise: severity.required_expertise ?? DISCIPLINE_MAP[category] ?? [],
      reasoning: severity.reasoning ?? null,
      duration_ms: Date.now() - started,
    };

    // Look up the challenge id so the analysis is properly related
    const { data: ch } = await supabase.from('challenges').select('id').eq('code', challengeCode).maybeSingle();

    await supabase.from('ai_analysis')
      .upsert({ ...analysis, challenge_id: ch?.id ?? null }, { onConflict: 'challenge_code' });

    // Never downgrade a challenge that has already moved down the pipeline —
    // re-running the analysis must not rewind the lifecycle.
    const { data: current } = await supabase.from('challenges').select('status').eq('code', challengeCode).maybeSingle();
    const stayPut = current?.status && current.status !== 'submitted';
    await supabase.from('challenges')
      .update({
        category, priority_score: priorityScore, priority_level: priorityLevel,
        ...(stayPut ? {} : { status: 'ai_analysed' }),
      })
      .eq('code', challengeCode);

    await supabase.from('activity_log').insert({
      challenge_code: challengeCode, stage: 'ai_analysed', actor_role: 'ai', actor_name: `AI Engine (${engine})`,
      action: 'AI analysis completed',
      detail: `${category} · priority ${priorityScore}/100 (${priorityLevel}) · ${duplicates.length} similar · top match ${universityMatches[0]?.short ?? '—'}`,
    });

    return new Response(JSON.stringify({ ok: true, analysis }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('ai-analyze failed', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
