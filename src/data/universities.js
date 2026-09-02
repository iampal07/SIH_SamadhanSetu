export const UNIVERSITIES = [
  {
    id: 'u1', name: 'IIT (ISM) Dhanbad', short: 'IIT ISM', district: 'Dhanbad', type: 'Institute of National Importance',
    domains: ['Water & Sanitation', 'Environment', 'Urban Infrastructure', 'Public Services'],
    departments: ['Environmental Engineering', 'Civil Engineering', 'Computer Science & Engineering', 'Electronics', 'Mining Engineering'],
    research: ['Groundwater modelling', 'IoT sensor networks', 'Geospatial analytics', 'Mine water remediation'],
    faculty: 412, students: 6200, projects: 34, rating: 4.8, logoHue: 232,
  },
  {
    id: 'u2', name: 'NIT Jamshedpur', short: 'NIT JSR', district: 'Jamshedpur', type: 'National Institute of Technology',
    domains: ['Urban Infrastructure', 'Public Services', 'Environment', 'Rural Development'],
    departments: ['Civil Engineering', 'Production Engineering', 'Computer Science', 'Electrical Engineering'],
    research: ['Smart mobility', 'Structural health monitoring', 'Waste-to-energy', 'Road safety analytics'],
    faculty: 268, students: 4100, projects: 27, rating: 4.7, logoHue: 262,
  },
  {
    id: 'u3', name: 'Birsa Agricultural University', short: 'BAU Ranchi', district: 'Ranchi', type: 'State Agricultural University',
    domains: ['Agriculture', 'Rural Development', 'Water & Sanitation', 'Environment'],
    departments: ['Agronomy', 'Soil Science', 'Agricultural Engineering', 'Horticulture', 'Agri-Informatics'],
    research: ['Micro-irrigation', 'Drought-resilient cropping', 'Soil health mapping', 'Farmer advisory systems'],
    faculty: 190, students: 2800, projects: 41, rating: 4.6, logoHue: 142,
  },
  {
    id: 'u4', name: 'RIMS Ranchi', short: 'RIMS', district: 'Ranchi', type: 'Medical Institute',
    domains: ['Healthcare', 'Public Services', 'Accessibility'],
    departments: ['Community Medicine', 'Telemedicine Unit', 'Biomedical Engineering', 'Public Health'],
    research: ['Tele-consultation in tribal belts', 'Maternal health outreach', 'Low-cost diagnostics'],
    faculty: 320, students: 1900, projects: 22, rating: 4.5, logoHue: 350,
  },
  {
    id: 'u5', name: 'Central University of Jharkhand', short: 'CUJ', district: 'Ranchi', type: 'Central University',
    domains: ['Education', 'Environment', 'Rural Development', 'Accessibility', 'Public Services'],
    departments: ['Education', 'Environmental Sciences', 'Computer Science', 'Mass Communication', 'Sociology'],
    research: ['Digital pedagogy', 'Tribal language learning tools', 'Community participation models'],
    faculty: 240, students: 3400, projects: 19, rating: 4.4, logoHue: 200,
  },
  {
    id: 'u6', name: 'BIT Mesra', short: 'BIT Mesra', district: 'Ranchi', type: 'Deemed University',
    domains: ['Urban Infrastructure', 'Environment', 'Education', 'Healthcare', 'Accessibility'],
    departments: ['Computer Science', 'Electronics & Communication', 'Civil Engineering', 'Bio-engineering', 'Space Engineering'],
    research: ['Assistive technology', 'Remote sensing', 'Embedded systems', 'AI for social good'],
    faculty: 380, students: 7200, projects: 38, rating: 4.7, logoHue: 285,
  },
];

export const universityById = (id) => UNIVERSITIES.find((u) => u.id === id);

export const TALENT_POOL = {
  u1: [
    { id: 'p1', name: 'Dr. Anjali Mahato', role: 'Faculty', dept: 'Environmental Engineering', skills: ['Groundwater modelling', 'Hydrology'], exp: '14 yrs' },
    { id: 'p2', name: 'Prof. R. K. Verma', role: 'Faculty', dept: 'Civil Engineering', skills: ['Structures', 'Water networks'], exp: '19 yrs' },
    { id: 'p3', name: 'Dr. Suman Oraon', role: 'Researcher', dept: 'Computer Science & Engineering', skills: ['IoT', 'Edge ML'], exp: '8 yrs' },
    { id: 'p4', name: 'Aditya Kumar', role: 'Student', dept: 'Electronics', skills: ['LoRaWAN', 'PCB design'], exp: 'B.Tech IV' },
    { id: 'p5', name: 'Neha Singh', role: 'Student', dept: 'Computer Science & Engineering', skills: ['React', 'Data visualisation'], exp: 'B.Tech III' },
    { id: 'p6', name: 'Rohit Tirkey', role: 'Student', dept: 'Environmental Engineering', skills: ['Water quality testing'], exp: 'M.Tech I' },
  ],
  u2: [
    { id: 'p7', name: 'Dr. Meera Sinha', role: 'Faculty', dept: 'Civil Engineering', skills: ['Transport planning'], exp: '12 yrs' },
    { id: 'p8', name: 'Prof. A. Bhattacharya', role: 'Faculty', dept: 'Production Engineering', skills: ['Lean systems', 'Manufacturing'], exp: '21 yrs' },
    { id: 'p9', name: 'Kunal Mahto', role: 'Student', dept: 'Computer Science', skills: ['Computer vision', 'Python'], exp: 'B.Tech IV' },
    { id: 'p10', name: 'Shreya Das', role: 'Student', dept: 'Electrical Engineering', skills: ['Power electronics'], exp: 'B.Tech III' },
    { id: 'p25', name: 'Dr. Nilesh Kumar', role: 'Researcher', dept: 'Computer Science', skills: ['Sensor fusion'], exp: '7 yrs' },
  ],
  u3: [
    { id: 'p11', name: 'Dr. Bipin Kachhap', role: 'Faculty', dept: 'Agricultural Engineering', skills: ['Micro-irrigation', 'Farm machinery'], exp: '16 yrs' },
    { id: 'p12', name: 'Dr. Priya Kujur', role: 'Faculty', dept: 'Soil Science', skills: ['Soil health', 'Nutrient mapping'], exp: '11 yrs' },
    { id: 'p13', name: 'Manoj Munda', role: 'Student', dept: 'Agri-Informatics', skills: ['GIS', 'Remote sensing'], exp: 'M.Sc II' },
    { id: 'p14', name: 'Kavita Devi', role: 'Researcher', dept: 'Agronomy', skills: ['Cropping systems'], exp: '6 yrs' },
    { id: 'p26', name: 'Sunil Mahto', role: 'Student', dept: 'Agricultural Engineering', skills: ['Drip systems', 'CAD'], exp: 'B.Tech IV' },
  ],
  u4: [
    { id: 'p15', name: 'Dr. S. P. Mishra', role: 'Faculty', dept: 'Community Medicine', skills: ['Epidemiology', 'Field surveys'], exp: '18 yrs' },
    { id: 'p16', name: 'Dr. Farheen Ansari', role: 'Faculty', dept: 'Telemedicine Unit', skills: ['Tele-consultation'], exp: '9 yrs' },
    { id: 'p17', name: 'Rahul Gope', role: 'Student', dept: 'Biomedical Engineering', skills: ['Device prototyping'], exp: 'B.Tech IV' },
    { id: 'p27', name: 'Dr. Ritu Prakash', role: 'Researcher', dept: 'Public Health', skills: ['Health analytics'], exp: '5 yrs' },
  ],
  u5: [
    { id: 'p18', name: 'Dr. Nutan Lakra', role: 'Faculty', dept: 'Education', skills: ['Curriculum design', 'Pedagogy'], exp: '13 yrs' },
    { id: 'p19', name: 'Dr. Amit Ranjan', role: 'Faculty', dept: 'Environmental Sciences', skills: ['Air quality', 'Ecology'], exp: '10 yrs' },
    { id: 'p20', name: 'Sanjana Horo', role: 'Student', dept: 'Computer Science', skills: ['Flutter', 'Offline-first apps'], exp: 'MCA II' },
    { id: 'p28', name: 'Prakash Mundu', role: 'Student', dept: 'Sociology', skills: ['Field research'], exp: 'MA II' },
  ],
  u6: [
    { id: 'p21', name: 'Dr. Vikram Sahu', role: 'Faculty', dept: 'Electronics & Communication', skills: ['Embedded systems', 'Sensors'], exp: '15 yrs' },
    { id: 'p22', name: 'Dr. Leena Toppo', role: 'Faculty', dept: 'Bio-engineering', skills: ['Assistive devices'], exp: '9 yrs' },
    { id: 'p23', name: 'Harsh Agarwal', role: 'Student', dept: 'Computer Science', skills: ['Machine learning', 'Backend'], exp: 'B.Tech IV' },
    { id: 'p24', name: 'Ayesha Khan', role: 'Student', dept: 'Space Engineering', skills: ['Satellite imagery'], exp: 'M.Tech I' },
  ],
};
