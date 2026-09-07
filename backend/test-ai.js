require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runTest() {
  console.log("🚀 Starting Gemini AI Pipeline Test...\n");

  const rawKhorthaText = "हमार गांव के चापाकल दू महीना से खराब हई, पानी के भारी दिक्कत हे";
  console.log(`📝 Raw Input: "${rawKhorthaText}"\n`);

  // --- TASK 1: TRANSLATION ---
  console.log("⏳ Task 1: Translating...");
  const translationResponse = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `Translate this regional Jharkhand complaint into formal English. Return ONLY the English translation: "${rawKhorthaText}"`,
  });
  const englishText = translationResponse.text.trim();
  console.log(`✅ Translation: "${englishText}"\n`);

  // --- TASK 2: CRITICALITY SCORING ---
  console.log("⏳ Task 2: Calculating Criticality...");
  const criticalityResponse = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: `Analyze the severity of this civic issue: "${englishText}". Return ONLY a valid JSON object with a "score" (1 to 10) and a concise "reasoning". Do not use markdown backticks.`,
  });
  const criticalityData = JSON.parse(criticalityResponse.text.replace(/```json|```/g, "").trim());
  console.log(`✅ Criticality Score: ${criticalityData.score}/10`);
  console.log(`✅ Reasoning: ${criticalityData.reasoning}\n`);

  // --- TASK 3: INSTITUTE ROUTING & RANKING ---
  console.log("⏳ Task 3: Routing to Universities...");
  const routingPrompt = `You are an AI allocation engine for Jharkhand. Route this challenge to the top 2 HEIs.
  Issue: "${englishText}"
  
  Candidate HEIs:
  1. ID: 101 | Name: IIT ISM Dhanbad | Domains: Mining, Water Resources, Heavy Machinery
  2. ID: 102 | Name: NIT Jamshedpur | Domains: Manufacturing, Metallurgy, Urban Planning
  3. ID: 103 | Name: BIT Mesra | Domains: IT, AI, Software Platforms, Data Analytics
  
  Return ONLY a valid JSON array of the top 2 matches containing "institute_id", "rank", "score", and a 1-sentence "reasoning". Do not use markdown backticks.`;

  const routingResponse = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: routingPrompt,
  });
  const routingData = JSON.parse(routingResponse.text.replace(/```json|```/g, "").trim());
  console.dir(routingData, { depth: null, colors: true });

  console.log("\n✅ AI Pipeline Test Complete!");
}

runTest().catch(console.error);