const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');

let genAI = null;
let model = null;

const initGemini = () => {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  Gemini API key not set — AI features disabled');
    return false;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
      }
    });
  }
  return true;
};

/**
 * Generate a full itinerary via AI
 * Optimized for Gemini 1.5 Flash
 */
const generateAIItinerary = async (tripParams) => {
  if (!initGemini()) {
    throw new Error('Gemini API not configured');
  }

  const prompt = `You are an expert travel planner. Generate a detailed day-wise travel itinerary.
  
DESTINATION: ${tripParams.destination}
DETAILS: ${tripParams.days} days, ${tripParams.budget} budget, ${tripParams.people} people, intent is ${tripParams.intent}.

Return a JSON object with this structure:
{
  "summary": "2-sentence overview",
  "days": [
    {
      "day": 1,
      "title": "string",
      "travel": { "mode": "string", "duration": "string", "costRange": "string" },
      "places": [{ "name": "string", "category": "nature|historical|etc", "description": "string", "entryFee": "string" }],
      "food": [{ "name": "string", "priceRange": "string" }],
      "stay": { "category": "string", "priceRange": "string" },
      "tips": ["string"],
      "avoid": ["string"],
      "localGems": [{ "name": "string", "description": "string" }]
    }
  ]
}

RULES:
1. Return ONLY valid JSON.
2. Use ₹ for all price ranges.
3. Be EXTREMELY realistic about travel times. (e.g., Delhi to Mumbai is ~1400km and takes 24h+ by cab, 16h+ by train, 2h by flight).
4. If you are unsure about the distance or time, do not guess — just omit the travel field or mark it as "Varies".
5. Ensure the mode of transport matches the budget (e.g., no flights for "low" budget).`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Extract JSON if AI wrapped it in markdown code blocks
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini Gen Error:', error.message);
    throw new Error('Failed to generate itinerary. Please try again.');
  }
};

module.exports = { generateAIItinerary };
