const { validationResult } = require('express-validator');
const { searchNearbyPlaces } = require('../services/mapsService');
const City = require('../models/City');

const getNearby = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array().map((e) => e.msg) });
    }

    const { latitude, longitude, category, radius } = req.body;

    // Fetch from Google Places API
    let places = await searchNearbyPlaces(latitude, longitude, category || 'tourist_attraction', radius || 3000);

    // Add badges
    places = places.map((p) => ({
      ...p,
      badges: [
        ...(p.rating >= 4.5 ? ['⭐ Highly Rated'] : []),
        ...(p.totalRatings >= 500 ? ['🔥 Popular'] : []),
      ],
    }));

    // Try to merge with curated DB data (if we can identify the city)
    // This is a best-effort enhancement
    try {
      // Reverse geocode or match city — for now, skip complex logic
      // In production, you'd use reverse geocoding
    } catch { /* skip */ }

    res.json({
      success: true,
      data: {
        places,
        total: places.length,
        source: places.length > 0 ? 'google_places' : 'none',
      },
    });
  } catch (error) {
    console.error('Nearby error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch nearby places.' });
  }
};

module.exports = { getNearby };
