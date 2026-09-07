const { callGemini } = require("../geminiClient");

function buildPrompt(text) {
  return `You are a linguistic expert specializing in Magadhan languages, specifically Khortha, Nagpuri, and Sadri dialects spoken in Jharkhand, India. 
Your task is to detect the language or dialect of the following citizen complaint and translate it into formal, actionable English. 

The text may contain code-mixing (e.g., Khortha written in Devanagari or Roman script mixed with Hindi or English). 
Do your best to understand regional nuances. If uncertain, reflect that in the confidence score rather than refusing.

Citizen Complaint: "${text}"

Return ONLY a valid JSON object with this exact shape (no markdown formatting, no backticks):
{
  "detected_language": "String (e.g., 'Khortha (Devanagari)', 'Hindi/Nagpuri mix')",
  "english_translation": "String (Formal English translation)",
  "confidence": Number (0.0 to 1.0)
}`;
}

function mockLanguageResult(text) {
  const isLikelyEnglish = /^[a-zA-Z0-9\s.,!?'"()-]+$/.test(text);
  return {
    detected_language: isLikelyEnglish ? "English" : "Hindi/Khortha (unconfirmed)",
    english_translation: isLikelyEnglish ? text : `[mock translation] ${text}`,
    confidence: isLikelyEnglish ? 0.95 : 0.55
  };
}

async function detectAndTranslate(rawText) {
  return callGemini(buildPrompt(rawText), {
    mockResponse: mockLanguageResult(rawText)
  });
}

module.exports = { detectAndTranslate };