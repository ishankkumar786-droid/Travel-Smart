const { OpenAI } = require('openai');
const { OPENROUTER_API_KEY } = require('../config/env');

let openai = null;

const initOpenRouter = () => {
  if (!OPENROUTER_API_KEY) {
    console.warn('⚠️  OpenRouter API key not set — AI features disabled');
    return false;
  }
  if (!openai) {
    openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: OPENROUTER_API_KEY,
    });
  }
  return true;
};

/**
 * Generate a full itinerary via AI
 * Optimized for Gemma 27B via OpenRouter with Fallback to Gemini 2.5 Flash
 */
const generateAIItinerary = async (tripParams) => {
  if (!initOpenRouter()) {
    throw new Error('OpenRouter API not configured');
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
    const completion = await openai.chat.completions.create({
      // Using Llama 3.3 70B as the primary free model for beta testing
      // Google Gemini does not have a free tier on OpenRouter
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'user', content: prompt }
      ],
      // OpenRouter specific headers
      extra_headers: {
        'HTTP-Referer': 'https://travelsmart.app', 
        'X-Title': 'TravelSmart Beta',
      },
      // Fallback to Llama 3.2 3B Free if the 70B model is busy
      extra_body: {
        models: ['meta-llama/llama-3.3-70b-instruct:free', 'meta-llama/llama-3.2-3b-instruct:free'],
      },
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    let text = completion.choices[0].message.content.trim();
    
    // Extract JSON if AI wrapped it in markdown code blocks
    if (text.includes('\`\`\`json')) {
      text = text.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
    } else if (text.includes('\`\`\`')) {
      text = text.split('\`\`\`')[1].split('\`\`\`')[0].trim();
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('OpenRouter Gen Error:', error.message);
    throw new Error('Failed to generate itinerary. Please try again.');
  }
};

module.exports = { generateAIItinerary };
