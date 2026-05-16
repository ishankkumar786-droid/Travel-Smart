const { validationResult } = require('express-validator');
const { generateItinerary } = require('../services/itineraryService');
const cacheService = require('../services/cacheService');

const generate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array().map((e) => e.msg) });
    }

    const { source, destination, budget, days, people, intent } = req.body;

    // 1. Check Cache (only for AI mode, premium is fast anyway but we can cache both)
    const cacheKey = cacheService.getItineraryKey({ destination, budget, days, intent });
    const cachedData = cacheService.get(cacheKey);
    
    if (cachedData) {
      console.log('💎 Serving itinerary from cache');
      return res.json({
        success: true,
        data: cachedData
      });
    }

    const result = await generateItinerary({ source, destination, budget, days: parseInt(days), people: parseInt(people), intent });

    // 2. Save to Cache
    cacheService.set(cacheKey, result);

    res.json({
      success: true,
      data: {
        itinerary: result.itinerary,
        mode: result.mode,
        confidenceScore: result.confidenceScore,
      },
    });
  } catch (error) {
    console.error('Itinerary generation error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate itinerary. Please try again.' });
  }
};

module.exports = { generate };
