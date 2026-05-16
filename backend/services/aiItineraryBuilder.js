const { generateAIItinerary } = require('./geminiService');
const { generateGroqItinerary } = require('./groqService');

/**
 * Build an AI-generated itinerary for non-curated cities
 */
const buildAIItinerary = async (tripParams) => {
  let result;
  try {
    // Attempt 1: Gemini (Primary, highly reliable 15 RPM free tier)
    console.log('🔄 Attempting to generate itinerary with Gemini...');
    result = await generateAIItinerary(tripParams);
  } catch (err) {
    console.warn(`⚠️ Gemini failed (${err.message}). Falling back to Groq...`);
    // Attempt 2: Groq (Fallback, extremely fast 30 RPM free tier)
    try {
      result = await generateGroqItinerary(tripParams);
    } catch (groqErr) {
      console.error(`❌ Groq also failed: ${groqErr.message}`);
      throw new Error('All AI providers are currently busy. Please try again in a minute.');
    }
  }

  const aiData = result.itinerary || result; // Handle both nested and flat responses

  return {
    destination: tripParams.destination,
    source: tripParams.source,
    budget: tripParams.budget,
    summary: aiData.summary || `A ${tripParams.days}-day trip to ${tripParams.destination}`,
    travelOverview: aiData.travelOverview || null,
    days: (aiData.days || []).map((day) => ({
      day: day.day,
      title: day.title || `Day ${day.day}`,
      travel: day.travel || null,
      places: (day.places || []).map((p) => ({
        name: p.name,
        bestTime: p.bestTime || 'Anytime',
        duration: p.duration || '1-2 hours',
        category: p.category || 'other',
        description: p.description || '',
        entryFee: p.entryFee || '',
      })),
      food: (day.food || []).map((f) => ({
        name: f.name,
        type: f.type || 'restaurant',
        famousFor: f.famousFor || '',
        area: f.area || '',
        priceRange: f.priceRange || '',
      })),
      stay: day.stay || null,
      tips: day.tips || [],
      avoid: day.avoid || [],
      localGems: (day.localGems || []).map((g) => ({
        name: g.name,
        type: g.type || 'other',
        description: g.description || '',
      })),
    })),
  };
};

module.exports = { buildAIItinerary };
