const NodeCache = require('node-cache');

// Cache for 1 hour (3600 seconds)
const aiCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * Cache key generator for itineraries
 */
const getItineraryKey = (params) => {
  return `itinerary_${params.destination}_${params.days}_${params.budget}_${params.intent}`;
};

/**
 * Get data from cache
 */
const get = (key) => {
  return aiCache.get(key);
};

/**
 * Set data in cache
 */
const set = (key, value) => {
  return aiCache.set(key, value);
};

module.exports = { get, set, getItineraryKey };
