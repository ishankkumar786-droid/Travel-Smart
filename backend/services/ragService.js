/**
 * RAG (Retrieval Augmented Generation) Service
 * Slices the itinerary to provide only relevant context to the chat model.
 */

const getRelevantContext = (itinerary, message) => {
  if (!itinerary || !itinerary.days) return "No itinerary context available.";

  const query = message.toLowerCase();
  
  // 1. Check for specific days (e.g., "Day 1", "first day")
  const dayMatch = query.match(/day\s*(\d+)/i) || query.match(/(first|second|third|fourth|fifth|sixth|seventh)\s*day/i);
  
  if (dayMatch) {
    let dayNum = 1;
    if (dayMatch[1]) dayNum = parseInt(dayMatch[1]);
    else {
      const words = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7 };
      dayNum = words[dayMatch[1].toLowerCase()];
    }

    const dayData = itinerary.days.find(d => d.day === dayNum);
    if (dayData) {
      return `CONTEXT FOR DAY ${dayNum}:
Title: ${dayData.title}
Places: ${dayData.places.map(p => p.name).join(', ')}
Food: ${dayData.food.map(f => f.name).join(', ')}
Stay: ${dayData.stay ? dayData.stay.category : 'N/A'}
Tips: ${dayData.tips.join(' | ')}`;
    }
  }

  // 2. Check for categories (e.g., "food", "hotel", "travel")
  if (query.includes('food') || query.includes('eat') || query.includes('restaurant')) {
    const allFood = itinerary.days.flatMap(d => d.food.map(f => `${f.name} (${f.famousFor})`));
    return `FOOD SUGGESTIONS ACROSS TRIP: ${allFood.join('; ')}`;
  }

  if (query.includes('stay') || query.includes('hotel') || query.includes('sleep')) {
    const allStays = itinerary.days.map(d => `Day ${d.day}: ${d.stay ? d.stay.category : 'N/A'}`);
    return `ACCOMMODATION PLAN: ${allStays.join('; ')}`;
  }

  // 3. Fallback: Compact Summary
  const summary = itinerary.summary || 'A custom travel itinerary.';
  const destination = itinerary.destination || 'your destination';
  const highlights = itinerary.days && itinerary.days.length > 0 
    ? itinerary.days.slice(0, 3).map(d => d.title || `Day ${d.day}`).join(', ') 
    : 'daily exploration';

  return `TRIP OVERVIEW:
Destination: ${destination}
Summary: ${summary}
Total Days: ${itinerary.days ? itinerary.days.length : 'N/A'}
Budget: ${itinerary.budget || 'standard'}
Key Highlights: ${highlights}...`;
};

/**
 * Summarize chat history to keep memory compact
 */
const summarizeHistory = (history) => {
  // Take last 4 messages to maintain recent context without bloating
  return history.slice(-4);
};

module.exports = { getRelevantContext, summarizeHistory };
