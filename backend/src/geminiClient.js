const { GoogleGenAI } = require("@google/genai");

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const USE_MOCK = process.env.USE_MOCK_GEMINI === "true";

let ai = null;
function getClient() {
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
}

/**
 * The single place every service calls into Gemini through. When
 * USE_MOCK_GEMINI=true, skips the network call entirely and returns the
 * caller-supplied mockResponse — lets the whole pipeline run without an
 * API key or quota usage.
 */
async function callGemini(prompt, { mockResponse } = {}) {
  if (USE_MOCK) return mockResponse;

  const response = await getClient().models.generateContent({
    model: MODEL_NAME,
    contents: prompt
  });

  return JSON.parse(response.text.replace(/```json|```/g, "").trim());
}

module.exports = { callGemini };
