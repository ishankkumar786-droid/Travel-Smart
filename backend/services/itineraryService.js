const City = require('../models/City');
const { buildPremiumItinerary } = require('./premiumItineraryBuilder');
const { buildAIItinerary } = require('./aiItineraryBuilder');

/**
 * Main itinerary orchestrator.
 * Detects mode (premium vs generic), builds itinerary, optionally formats via AI.
 */
const generateItinerary = async (tripParams) => {
  const { destination } = tripParams;

  // Step 1: Check if destination is a curated premium city
  const cityData = await City.findByNameOrAlias(destination);

  // Step 2: Get travel info (distance/time) from Maps API
  const { getDistanceMatrix } = require('./mapsService');
  const travelInfo = await getDistanceMatrix(tripParams.source, tripParams.destination);

  // Budget-based transport suggestions (same as in premium builder)
  const TRANSPORT = {
    low: { mode: 'Sleeper Train / Bus', costRange: '₹300-₹800' },
    moderate: { mode: 'AC Train / Volvo Bus', costRange: '₹800-₹2000' },
    high: { mode: 'Flight / Private Taxi', costRange: '₹3000-₹8000' },
  };
  const transport = TRANSPORT[tripParams.budget] || TRANSPORT.moderate;

  const travelOverview = {
    distance: travelInfo.distance || 'N/A',
    duration: travelInfo.duration || 'Varies',
    mode: transport.mode,
    costRange: transport.costRange,
  };

  let itinerary;
  let mode;
  let confidenceScore;

  if (cityData) {
    // ===== PREMIUM MODE =====
    mode = 'premium';
    confidenceScore = 90;
    itinerary = await buildPremiumItinerary(cityData, tripParams);
  } else {
    // ===== GENERIC AI MODE =====
    mode = 'ai-generated';
    confidenceScore = 60;

    try {
      itinerary = await buildAIItinerary(tripParams);
    } catch (err) {
      console.error('AI itinerary generation failed:', err.message);
      itinerary = {
        destination: tripParams.destination,
        source: tripParams.source,
        budget: tripParams.budget,
        summary: `A trip to ${tripParams.destination}`,
        days: Array.from({ length: tripParams.days }, (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1} in ${tripParams.destination}`,
          places: [],
          food: [],
          tips: ['AI generation failed. Please try again.'],
          avoid: [],
        })),
      };
      confidenceScore = 10;
    }
  }

  return {
    itinerary: {
      ...itinerary,
      // Merge backend calculated overview with AI overview (prefer AI values if Maps API failed)
      travelOverview: {
        distance: (itinerary.travelOverview?.distance && itinerary.travelOverview.distance !== 'N/A') ? itinerary.travelOverview.distance : travelOverview.distance,
        duration: (itinerary.travelOverview?.duration && itinerary.travelOverview.duration !== 'Varies') ? itinerary.travelOverview.duration : travelOverview.duration,
        mode: itinerary.travelOverview?.mode || travelOverview.mode,
        costRange: itinerary.travelOverview?.costRange || travelOverview.costRange,
      },
      mode,
      confidenceScore,
      disclaimer: mode === 'ai-generated'
        ? 'This itinerary is AI-generated and may vary. Verify details before traveling.'
        : null,
    },
    mode,
    confidenceScore,
  };
};

module.exports = { generateItinerary };
