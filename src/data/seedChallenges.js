import { STAGES, STAGE_INDEX } from './constants';
import { runAnalysis, suggestDisciplines } from '../services/aiEngine';
import { UNIVERSITIES, TALENT_POOL } from './universities';
import { INDUSTRIES } from './industries';

const DAY = 86400000;
const ago = (d) => new Date(Date.now() - d * DAY).toISOString();
const ahead = (d) => new Date(Date.now() + d * DAY).toISOString();

const RAW = [
  {
    id: 'CH-1042', title: 'Severe drinking water shortage in Barkagaon villages',
    description: 'Three hamlets near Barkagaon have had no functioning handpump for over four months. Families walk 3 km every day to fetch drinking water from a seasonal stream. Groundwater level has dropped sharply and the existing borewell has run dry. Around 2,400 people across 480 households are affected and cases of waterborne illness are rising.',
    district: 'Hazaribagh', village: 'Barkagaon', affected: 2400, stage: 'impact_measured',
    citizen: 'Ramesh Mahto', days: 168, universityId: 'u1', partnerIds: ['i2', 'i1'],
  },
  {
    id: 'CH-1078', title: 'No ambulance access to tribal hamlets during monsoon',
    description: 'The approach road to six tribal hamlets becomes impassable during monsoon. Pregnant women and critical patients cannot reach the primary health centre. Two maternal deaths were reported last year. A telemedicine and emergency response solution is urgently needed for this remote block.',
    district: 'Khunti', village: 'Torpa Block', affected: 5600, stage: 'deployment',
    citizen: 'Sister Elizabeth Kandulna', days: 142, universityId: 'u4', partnerIds: ['i4'],
  },
  {
    id: 'CH-1103', title: 'Irrigation failure destroying paddy crop in Simdega',
    description: 'The lift irrigation scheme has been non functional for two seasons. Farmers depend entirely on rainfall and the crop failed this year. Around 900 farming families have lost their paddy yield. A low cost solar based micro irrigation system with soil moisture monitoring could restore cultivation.',
    district: 'Simdega', village: 'Kolebira', affected: 4300, stage: 'pilot',
    citizen: 'Birsa Munda Kisan Samiti', days: 121, universityId: 'u3', partnerIds: ['i3', 'i7'],
  },
  {
    id: 'CH-1117', title: 'Government school has no digital classroom or library',
    description: 'The upgraded high school serves 640 students from 11 villages but has no computers, no internet and no library. Students in classes 9 to 12 have never used a computer. Dropout rate after class 10 is above 30 percent. An offline digital learning setup would help students prepare for competitive exams.',
    district: 'Gumla', village: 'Bharno', affected: 640, stage: 'testing',
    citizen: 'Sunita Devi', days: 98, universityId: 'u5', partnerIds: ['i6'],
  },
  {
    id: 'CH-1129', title: 'Open garbage dumping and drainage overflow near market road',
    description: 'Municipal waste is dumped in the open next to the vegetable market. The storm water drain is choked with plastic and overflows onto the road after every rain. Shopkeepers and residents face constant stench and mosquito breeding. Nearly 12,000 people use this road every day.',
    district: 'Dhanbad', village: 'Jharia Market Road', affected: 12000, stage: 'prototype',
    citizen: 'Mohd. Iqbal Ansari', days: 76, universityId: 'u2', partnerIds: ['i5'],
  },
  {
    id: 'CH-1145', title: 'Fluoride contamination in village borewell water',
    description: 'Water from the community borewell has a bitter taste and residents report dental staining and joint pain. Laboratory testing by an NGO showed fluoride levels well above the permissible limit. The entire village of 1,800 people depends on this single source of drinking water.',
    district: 'Palamu', village: 'Chainpur', affected: 1800, stage: 'industry_matched',
    citizen: 'Dr. Kavita Prasad', days: 61, universityId: 'u1', partnerIds: ['i2'],
  },
  {
    id: 'CH-1158', title: 'No wheelchair ramps or accessible toilets at block office',
    description: 'The block development office and the adjoining public services centre have steep stairs and no ramp. Elderly citizens and persons with disability cannot access pension, ration and certificate services without being carried. Around 700 divyangjan in the block are affected.',
    district: 'Deoghar', village: 'Madhupur Block', affected: 700, stage: 'proposal_created',
    citizen: 'Anil Kumar Yadav', days: 47, universityId: 'u6', partnerIds: [],
  },
  {
    id: 'CH-1166', title: 'Frequent road accidents at unlit highway junction',
    description: 'The junction on the state highway near the school has no street light and no signage. There have been 14 accidents in the last eight months including two fatalities. Children crossing to reach the school in the morning are at serious risk. An intelligent low cost warning and lighting system is needed.',
    district: 'Bokaro', village: 'Chas Bypass', affected: 8500, stage: 'team_formed',
    citizen: 'Traffic Awareness Committee', days: 33, universityId: 'u2', partnerIds: [],
  },
  {
    id: 'CH-1172', title: 'Air pollution from open coal transport in residential area',
    description: 'Uncovered trucks carrying coal pass through the residential colony throughout the day. Coal dust settles on homes and children are developing respiratory problems. Residents want continuous air quality monitoring and enforcement data to raise with the municipal body.',
    district: 'Dhanbad', village: 'Katras Colony', affected: 9200, stage: 'university_matched',
    citizen: 'Residents Welfare Association', days: 24, universityId: 'u1', partnerIds: [],
  },
  {
    id: 'CH-1180', title: 'Anganwadi centre has no safe drinking water or toilet',
    description: 'The anganwadi centre serving 90 children and 40 mothers has no water connection and no functional toilet. Staff carry water from a well 500 metres away. Hygiene conditions are poor and children fall sick frequently during summer months.',
    district: 'Latehar', village: 'Manika', affected: 130, stage: 'validated',
    citizen: 'Phulmani Kumari', days: 12, universityId: null, partnerIds: [],
  },
  {
    id: 'CH-1184', title: 'Farmers unable to get fair price due to no local mandi data',
    description: 'Farmers in the block sell produce to middlemen because they have no reliable information about mandi rates. Prices vary widely between nearby markets. A simple vernacular price advisory reaching farmers by phone could improve income for around 3,000 farming families.',
    district: 'Chatra', village: 'Simaria', affected: 3000, stage: 'ai_analysed',
    citizen: 'Jharkhand Kisan Federation', days: 6, universityId: null, partnerIds: [],
  },
  {
    id: 'CH-1188', title: 'Street flooding near school road after every rainfall',
    description: 'The road in front of the primary school floods knee deep after every rainfall because the drainage line is blocked and there is no outlet. Children cannot reach school for two or three days at a time and the water stagnates for a week, breeding mosquitoes.',
    district: 'Ranchi', village: 'Kanke School Road', affected: 4100, stage: 'submitted',
    citizen: 'Pooja Kachhap', days: 2, universityId: null, partnerIds: [],
  },
  {
    id: 'CH-1190', title: 'Pension and caste certificate delays at the panchayat office',
    description: 'Applicants have to visit the panchayat office five or six times for a caste certificate or old age pension. There is no way to track application status. Elderly applicants from far villages lose a day of wages on every visit. A transparent status tracking mechanism is requested.',
    district: 'Dumka', village: 'Jarmundi', affected: 2200, stage: 'submitted',
    citizen: 'Suraj Hembrom', days: 1, universityId: null, partnerIds: [],
  },
  {
    id: 'CH-1191', title: 'Handpump running dry in Bagodar village hamlet',
    description: 'The only handpump in our hamlet gives muddy water for a few minutes and then runs dry. Around 300 families have to walk to the next village for drinking water. The groundwater table appears to have fallen after last summer.',
    district: 'Giridih', village: 'Bagodar', affected: 1500, stage: 'ai_analysed',
    citizen: 'Lalita Devi', days: 4, universityId: null, partnerIds: [],
  },
];

const MILESTONE_TEMPLATES = (cat) => [
  { title: 'Field survey and baseline data collection', owner: 'University Team', span: 14 },
  { title: 'Requirement validation with community', owner: 'Citizen + University', span: 24 },
  { title: 'Solution architecture and design freeze', owner: 'University Team', span: 40 },
  { title: 'Prototype development', owner: 'University + Industry', span: 68 },
  { title: 'Lab testing and iteration', owner: 'University Team', span: 92 },
  { title: 'Field pilot deployment', owner: 'Industry Partner', span: 120 },
  { title: 'Government and community validation', owner: 'Government', span: 142 },
  { title: 'Full deployment and handover', owner: 'Industry + Government', span: 168 },
  { title: 'Impact measurement report', owner: 'All stakeholders', span: 190 },
];

const IMPACT_BY_CATEGORY = {
  'Water & Sanitation': (a) => ([
    { label: 'People with safe water access', value: a, unit: '' },
    { label: 'Water saved per year', value: 4200000, unit: ' L' },
    { label: 'Walking distance reduced', value: 2.8, unit: ' km/day' },
    { label: 'Waterborne illness reduction', value: 64, unit: '%' },
  ]),
  Healthcare: (a) => ([
    { label: 'Patients reached', value: a, unit: '' },
    { label: 'Emergency response time cut', value: 46, unit: '%' },
    { label: 'Tele-consultations delivered', value: 3120, unit: '' },
    { label: 'Referral accuracy improvement', value: 38, unit: '%' },
  ]),
  Agriculture: (a) => ([
    { label: 'Farmers benefited', value: a, unit: '' },
    { label: 'Irrigated area restored', value: 340, unit: ' acres' },
    { label: 'Yield improvement', value: 41, unit: '%' },
    { label: 'Income increase per family', value: 18400, unit: ' ₹/yr' },
  ]),
  Education: (a) => ([
    { label: 'Students benefited', value: a, unit: '' },
    { label: 'Digital literacy improvement', value: 72, unit: '%' },
    { label: 'Dropout reduction', value: 26, unit: '%' },
    { label: 'Learning hours added', value: 9600, unit: ' hrs' },
  ]),
  'Urban Infrastructure': (a) => ([
    { label: 'Residents benefited', value: a, unit: '' },
    { label: 'Waterlogging incidents cut', value: 78, unit: '%' },
    { label: 'Waste diverted from open dumping', value: 260, unit: ' T/yr' },
    { label: 'Municipal cost reduction', value: 22, unit: '%' },
  ]),
  default: (a) => ([
    { label: 'Citizens benefited', value: a, unit: '' },
    { label: 'Service turnaround improvement', value: 54, unit: '%' },
    { label: 'Annual cost saving', value: 1450000, unit: ' ₹' },
    { label: 'Satisfaction score', value: 88, unit: '/100' },
  ]),
};

function buildTeam(universityId, category) {
  const pool = TALENT_POOL[universityId] ?? [];
  const disciplines = suggestDisciplines(category);
  return {
    name: `${category.split(' ')[0]} Innovation Cell`,
    disciplines,
    members: pool.slice(0, Math.min(5, pool.length)).map((m) => ({ ...m })),
    formedAt: null,
  };
}

function buildMilestones(category, createdDays, reachedIndex) {
  return MILESTONE_TEMPLATES(category).map((m, i) => {
    const doneCut = Math.round(((reachedIndex - 5) / 6) * 9);
    const status = i < doneCut ? 'completed' : i === doneCut ? 'in_progress' : 'pending';
    return {
      id: `M${i + 1}`,
      title: m.title,
      owner: m.owner,
      due: new Date(Date.now() - createdDays * DAY + m.span * DAY).toISOString(),
      status,
      progress: status === 'completed' ? 100 : status === 'in_progress' ? 35 + ((i * 17) % 45) : 0,
    };
  });
}

export function buildSeedChallenges() {
  const built = [];
  for (const r of RAW) {
    const base = {
      id: r.id, title: r.title, description: r.description,
      district: r.district, village: r.village, affected: r.affected,
      citizen: { name: r.citizen, id: `cit-${r.id}` },
      createdAt: ago(r.days),
      attachments: [
        { name: `${r.village.toLowerCase().replace(/\s+/g, '-')}-photo-1.jpg`, type: 'image', size: '1.4 MB' },
        { name: 'community-signatures.pdf', type: 'doc', size: '320 KB' },
      ],
    };
    const ai = runAnalysis(base, built);
    const reached = STAGE_INDEX[r.stage];
    const category = ai.category;

    const history = STAGES.slice(0, reached + 1).map((s, i) => ({
      stage: s.key,
      at: ago(Math.max(0, r.days - Math.round((i / Math.max(reached, 1)) * r.days * 0.92))),
      by: s.owner,
      note: null,
    }));

    const uni = r.universityId ? UNIVERSITIES.find((u) => u.id === r.universityId) : null;
    const partners = r.partnerIds.map((pid) => {
      const f = INDUSTRIES.find((x) => x.id === pid);
      return {
        id: f.id, name: f.name, short: f.short, type: f.type,
        supports: f.supports.slice(0, 3),
        amount: f.capacity === 'High' ? '₹42,00,000' : f.capacity === 'Medium' ? '₹18,50,000' : '₹6,00,000',
        joinedAt: ago(Math.round(r.days * 0.45)),
      };
    });

    const impactFn = IMPACT_BY_CATEGORY[category] ?? IMPACT_BY_CATEGORY.default;

    built.push({
      ...base,
      code: r.id,
      category,
      status: r.stage,
      // Challenges still at "submitted" have not been through the AI engine yet —
      // the government dashboard can run it on demand.
      ai: reached >= STAGE_INDEX.ai_analysed ? ai : null,
      priority: reached >= STAGE_INDEX.ai_analysed ? ai.priority : null,
      validation: reached >= STAGE_INDEX.validated
        ? { status: 'validated', by: 'District Innovation Cell', at: history[2]?.at, note: 'Field verified by block officer. Genuine and high impact.' }
        : { status: 'pending', by: null, at: null, note: null },
      university: uni && reached >= STAGE_INDEX.university_matched
        ? { id: uni.id, name: uni.name, short: uni.short, district: uni.district, matchScore: ai.universityMatches.find((m) => m.id === uni.id)?.score ?? 88, acceptedAt: history[3]?.at }
        : null,
      recommendedTo: uni ? [uni.id] : ai.universityMatches.slice(0, 3).map((m) => m.id),
      team: reached >= STAGE_INDEX.team_formed && uni
        ? { ...buildTeam(uni.id, category), formedAt: history[4]?.at }
        : null,
      proposal: reached >= STAGE_INDEX.proposal_created
        ? {
            title: `${category} solution for ${r.village}`,
            objective: `Design, prototype and deploy a sustainable, community-owned solution addressing ${r.title.toLowerCase()}.`,
            approach: 'Baseline field survey → co-design with community → low-cost prototype → supervised pilot → handover to panchayat with maintenance training.',
            budget: '₹28,50,000', duration: '9 months', createdAt: history[5]?.at,
          }
        : null,
      industryNeed: reached >= STAGE_INDEX.proposal_created
        ? { open: reached < STAGE_INDEX.industry_matched, needs: ['Funding', 'Technology', 'Deployment'], note: 'Seeking a partner for hardware supply and field deployment support.' }
        : null,
      partners,
      milestones: reached >= STAGE_INDEX.proposal_created ? buildMilestones(category, r.days, reached) : [],
      updates: [],
      impact: reached >= STAGE_INDEX.impact_measured
        ? {
            beneficiaries: r.affected,
            metrics: impactFn(r.affected),
            sustainability: 86,
            durationMonths: 9,
            summary: 'Solution deployed, handed over to the gram panchayat and independently verified by the district administration.',
          }
        : null,
      history,
      upvotes: 40 + ((r.affected / 37) | 0) % 320,
      seeded: true,
    });
  }
  return built;
}

export const SEED_NOTIFICATIONS = [
  { id: 'n-seed-1', role: 'govt', text: '2 new challenges awaiting validation', at: ago(1), read: false, tone: 'info', link: '/government/challenges' },
  { id: 'n-seed-2', role: 'varsity', text: 'AI recommended 3 new challenges matching your research domains', at: ago(2), read: false, tone: 'info', link: '/university/challenges' },
  { id: 'n-seed-3', role: 'industry', text: 'A proposal in Accessibility is seeking industry support', at: ago(2), read: false, tone: 'info', link: '/industry/opportunities' },
  { id: 'n-seed-4', role: 'citizen', text: 'Your challenge CH-1042 completed impact measurement', at: ago(3), read: true, tone: 'success', link: '/citizen/challenges' },
];

export const TREND_DATA = [
  { month: 'Apr', submitted: 62, validated: 41, projects: 18, completed: 6 },
  { month: 'May', submitted: 78, validated: 55, projects: 24, completed: 9 },
  { month: 'Jun', submitted: 96, validated: 70, projects: 31, completed: 12 },
  { month: 'Jul', submitted: 124, validated: 92, projects: 43, completed: 17 },
  { month: 'Aug', submitted: 148, validated: 111, projects: 56, completed: 24 },
  { month: 'Sep', submitted: 173, validated: 134, projects: 68, completed: 33 },
  { month: 'Oct', submitted: 201, validated: 158, projects: 81, completed: 42 },
  { month: 'Nov', submitted: 234, validated: 186, projects: 97, completed: 55 },
];

export const PLATFORM_TOTALS = {
  challenges: 1284, validated: 942, activeProjects: 268, completed: 137,
  universities: 46, industries: 82, students: 5840, faculty: 1120, citizens: 24600,
  districts: 24, beneficiaries: 1860000, fundingMobilised: 214,
};

export { ago, ahead, DAY };
