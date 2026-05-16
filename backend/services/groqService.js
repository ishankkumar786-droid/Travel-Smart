const Groq = require('groq-sdk');
const { GROQ_API_KEY } = require('../config/env');

let groq = null;

const initGroq = () => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    console.warn('⚠️  Groq API key not set — Chat features may use fallback');
    return false;
  }
  if (!groq) {
    groq = new Groq({ apiKey: GROQ_API_KEY });
  }
  return true;
};

/**
 * Answer chat using Llama 3.1 8B via Groq
 * @param {string} message - User message
 * @param {string} context - Relevant itinerary context
 * @param {Array} history - Recent chat history for memory
 */
const answerChat = async (message, context, history = []) => {
  if (!initGroq()) {
    throw new Error('Groq API not configured');
  }

  try {
    const messages = [
      {
        role: 'system',
        content: `You are a helpful travel assistant. You are helping a user with their trip itinerary.
        
ITINERARY CONTEXT:
${context}

RULES:
1. Answer based on the itinerary context provided.
2. Be concise and conversational (max 3-4 sentences).
3. If asked about places/food not in the context, use your general knowledge but mention they are "extra suggestions."
4. Use ₹ for costs in ranges.
5. Do NOT try to regenerate the entire itinerary. Just answer the question.`
      },
      ...history,
      { role: 'user', content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 512,
      top_p: 1,
      stream: false,
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error('Groq Error:', error.message);
    throw error;
  }
};

/**
 * Generate a full itinerary via AI using Groq (Llama 3)
 */
const generateGroqItinerary = async (tripParams) => {
  if (!initGroq()) {
    throw new Error('Groq API not configured');
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
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Fast groq model
      messages: [
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    let text = completion.choices[0].message.content.trim();
    
    if (text.includes('\`\`\`json')) {
      text = text.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
    } else if (text.includes('\`\`\`')) {
      text = text.split('\`\`\`')[1].split('\`\`\`')[0].trim();
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Groq Itinerary Gen Error:', error.message);
    throw new Error('Failed to generate itinerary via Groq.');
  }
};

module.exports = { answerChat, generateGroqItinerary };
