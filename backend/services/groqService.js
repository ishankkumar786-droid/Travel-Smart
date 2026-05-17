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

  const itineraryJSON = typeof context === 'object' ? JSON.stringify(context, null, 2) : context;

  try {
    const prompt = `You are a helpful travel assistant. You are helping a user with their trip itinerary.
        
ITINERARY CONTEXT (JSON):
${itineraryJSON}

You can either ANSWER questions about the itinerary, or MUTATE/MODIFY the itinerary if the user requests changes (e.g., "move Taj Mahal from day 1 to day 3", "delete Akshardham Temple", "add a restaurant to day 2", or "change timing of palace to 9am").

Your response MUST be a JSON object with this exact structure:
{
  "action": "answer" or "update",
  "explanation": "Your conversational text response to the user. Max 3 sentences.",
  "itinerary": null or the fully updated/mutated itinerary JSON object (if action is "update")
}

RULES:
1. If the user is just asking a question or chatting, set "action" to "answer", put the response in "explanation", and set "itinerary" to null.
2. If the user requests any modification, perform the edit on the itinerary context, set "action" to "update", put a clear confirmation message in "explanation" (e.g. "Done! I've moved Taj Mahal to Day 3 for you."), and return the fully updated itinerary JSON object in "itinerary".
3. Return ONLY valid JSON.
4. Keep the same structure, keys, and values for the itinerary when mutating, only changing the days/places/food/etc as requested.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        ...history,
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1024,
    });

    const parsed = JSON.parse(chatCompletion.choices[0].message.content.trim());
    return parsed;
  } catch (error) {
    console.error('Groq Error:', error.message);
    // Return backward compatible response on error
    return {
      action: 'answer',
      explanation: 'I encountered an error trying to process your request. Please try again.',
      itinerary: null
    };
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
