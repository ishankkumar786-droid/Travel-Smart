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

You can either ANSWER questions about the itinerary, or MUTATE/MODIFY the itinerary if the user requests structural changes (e.g., "move Taj Mahal from day 2 to day 1", "delete Akshardham Temple", "add a restaurant to day 2", "change timing of palace to 9am").

Your response MUST be a JSON object with this exact structure:
{
  "action": "answer" or "update",
  "explanation": "Your conversational text response to the user. Max 3 sentences.",
  "itinerary": null or the fully updated/mutated itinerary JSON object (if action is "update")
}

CRITICAL ANTI-HALLUCINATION RULES:
1. NO FAKE CONFIRMATIONS: If you set "action" to "answer" and "itinerary" to null, you are STRICTLY FORBIDDEN from saying "I have moved", "I have deleted", "I have added", or "Done". You MUST instead reply: "I'm sorry, I could not apply that change directly. Please use the pencil edit icon in the top right to customize your itinerary manually!"
2. TO APPLY AN UPDATE: You must perform the exact mutation requested on the ITINERARY CONTEXT JSON (e.g., for "move from day 2 to day 1", locate the attraction under day 2's places, remove it from day 2, and append it to day 1's places). Set "action" to "update", put a confirmation in "explanation" (e.g. "Done! I have successfully moved Taj Mahal to Day 1."), and return the ENTIRE mutated itinerary JSON object in "itinerary".
3. RETURN VALID JSON ONLY: The "itinerary" key must contain the full, parsed JSON object, maintaining the exact keys and structures of the original context. Do not wrap it in markdown block tags inside the JSON.`;

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

    const content = chatCompletion.choices[0].message.content.trim();
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (e) {
      console.warn('⚠️ Failed to parse LLM response as JSON. Raw output was:', content);
      return {
        action: 'answer',
        explanation: "I'm sorry, I encountered a temporary formatting issue. Please use the pencil edit icon in the top right corner to modify your itinerary manually!",
        itinerary: null
      };
    }
  } catch (error) {
    console.error('Groq Error:', error.message);
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
