const City = require('../models/City');
const { getDistanceMatrix } = require('./mapsService');

// Budget-based transport suggestions
const TRANSPORT = {
  low: [
    { mode: 'Sleeper Train', costRange: '₹300-₹800' },
    { mode: 'State Bus', costRange: '₹200-₹600' },
    { mode: 'Shared Auto', costRange: '₹50-₹150' },
  ],
  moderate: [
    { mode: 'AC Train (3-Tier)', costRange: '₹800-₹1800' },
    { mode: 'Volvo/AC Bus', costRange: '₹500-₹1500' },
    { mode: 'Auto/Cab', costRange: '₹100-₹400' },
  ],
  high: [
    { mode: 'Flight', costRange: '₹3000-₹8000' },
    { mode: 'Private Taxi', costRange: '₹2000-₹5000' },
    { mode: 'AC Train (2-Tier)', costRange: '₹1200-₹2500' },
  ],
};

// Budget-based stay ranges
const STAY = {
  low: { category: 'Budget Hotel / Dharamshala', priceRange: '₹400-₹1000 per night' },
  moderate: { category: 'Mid-Range Hotel', priceRange: '₹1200-₹3000 per night' },
  high: { category: 'Premium Hotel / Resort', priceRange: '₹4000-₹10000 per night' },
};

// Time-of-day planning logic
const assignTimeSlots = (places, intent) => {
  const slots = { morning: [], afternoon: [], evening: [] };

  // Prioritize based on intent
  const priorityCategories = {
    religious: ['temple', 'religious'],
    chill: ['park', 'lake', 'nature', 'cafe'],
    explore: ['monument', 'fort', 'palace', 'museum', 'historical'],
    adventure: ['adventure', 'nature', 'viewpoint', 'trekking'],
    romantic: ['park', 'lake', 'nature', 'viewpoint', 'cafe'],
    cultural: ['museum', 'monument', 'historical', 'fort', 'palace'],
    foodie: ['market', 'other'],
    other: [],
  };
  // Support comma-separated multi-select intents
  const intentKeys = (typeof intent === 'string' ? intent.split(',') : [intent]).map(s => s.trim());
  const priority = [...new Set(intentKeys.flatMap(k => priorityCategories[k] || []))];

  // Sort: priority categories first
  const sorted = [...places].sort((a, b) => {
    const aP = priority.includes(a.category) ? 0 : 1;
    const bP = priority.includes(b.category) ? 0 : 1;
    return aP - bP;
  });

  sorted.forEach((place, i) => {
    // Use bestTime hint if available
    const bt = (place.bestTime || '').toLowerCase();
    if (bt.includes('morning') || bt.includes('sunrise')) {
      slots.morning.push(place);
    } else if (bt.includes('evening') || bt.includes('sunset') || bt.includes('night')) {
      slots.evening.push(place);
    } else if (bt.includes('afternoon')) {
      slots.afternoon.push(place);
    } else {
      // Auto-assign by index distribution
      if (slots.morning.length <= slots.afternoon.length && slots.morning.length <= slots.evening.length) {
        slots.morning.push(place);
      } else if (slots.afternoon.length <= slots.evening.length) {
        slots.afternoon.push(place);
      } else {
        slots.evening.push(place);
      }
    }
  });

  return slots;
};

/**
 * Build a premium itinerary from curated DB data
 */
const buildPremiumItinerary = async (cityData, tripParams) => {
  const { source, destination, budget, days, people, intent } = tripParams;

  // Get travel distance/time
  let travelInfo = await getDistanceMatrix(source, destination);

  // Select transport based on budget
  const transport = TRANSPORT[budget][0];

  // Filter food by budget
  const allFood = cityData.food || [];
  const budgetFood = allFood.filter((f) => {
    if (budget === 'low') return f.budgetCategory === 'low' || f.budgetCategory === 'moderate';
    if (budget === 'high') return true;
    return f.budgetCategory !== 'high' || true; // moderate gets everything
  });

  // Select hotels based on budget
  const hotels = cityData.hotels?.[budget] || cityData.hotels?.moderate || [];

  // Get all places and assign to time slots
  const allPlaces = cityData.places || [];
  const slots = assignTimeSlots(allPlaces, intent);
  const allSlotted = [...slots.morning, ...slots.afternoon, ...slots.evening];

  // Distribute places across days
  const placesPerDay = Math.max(3, Math.ceil(allSlotted.length / days));
  const foodPerDay = Math.max(2, Math.ceil(budgetFood.length / days));

  // Build day-wise itinerary
  const itineraryDays = [];
  for (let d = 0; d < days; d++) {
    const dayPlaces = allSlotted.slice(d * placesPerDay, (d + 1) * placesPerDay);
    const dayFood = budgetFood.slice(d * foodPerDay, (d + 1) * foodPerDay);

    // Pick local gems for this day
    const localGems = (cityData.localGems || []).slice(d * 1, d * 1 + 2);

    // Build day
    const day = {
      day: d + 1,
      title: d === 0 ? `Arrival in ${destination}` : d === days - 1 ? `Final Day & Departure` : `Day ${d + 1} — Exploring ${destination}`,
      places: dayPlaces.map((p) => ({
        name: p.name,
        bestTime: p.bestTime || 'Anytime',
        duration: p.duration || '1-2 hours',
        category: p.category || 'other',
        description: p.description || '',
        entryFee: p.entryFee || 'Free',
      })),
      food: dayFood.map((f) => ({
        name: f.name,
        type: f.type || 'restaurant',
        famousFor: f.famousFor || '',
        area: f.area || '',
        priceRange: f.priceRange || '',
      })),
      stay: STAY[budget],
      tips: [],
      avoid: [],
      localGems: localGems.map((g) => ({
        name: g.name,
        type: g.type || 'other',
        description: g.description || '',
      })),
    };

    // Add travel info for first day
    if (d === 0) {
      day.travel = {
        mode: transport.mode,
        duration: travelInfo.duration || 'Varies',
        costRange: transport.costRange,
        distance: travelInfo.distance || 'N/A',
      };
    }

    // Add return travel for last day
    if (d === days - 1 && days > 1) {
      day.travel = {
        mode: transport.mode,
        duration: travelInfo.duration || 'Varies',
        costRange: transport.costRange,
        distance: travelInfo.distance || 'N/A',
      };
    }

    itineraryDays.push(day);
  }

  // Distribute tips and avoid across days
  const tips = cityData.tips || [];
  const avoid = cityData.avoid || [];
  itineraryDays.forEach((day, i) => {
    if (tips[i]) day.tips.push(tips[i]);
    if (tips[i + itineraryDays.length]) day.tips.push(tips[i + itineraryDays.length]);
    if (avoid[i]) day.avoid.push(avoid[i]);
  });

  // Ensure each day has at least one tip
  itineraryDays.forEach((day) => {
    if (day.tips.length === 0 && tips.length > 0) {
      day.tips.push(tips[0]);
    }
  });

  return {
    destination,
    source,
    budget,
    summary: `A ${days}-day ${intent} trip to ${destination} from ${source} on a ${budget} budget.`,
    days: itineraryDays,
  };
};

module.exports = { buildPremiumItinerary };
