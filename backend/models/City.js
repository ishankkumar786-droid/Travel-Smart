const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['temple', 'monument', 'nature', 'market', 'museum', 'park', 'lake', 'fort', 'palace', 'beach', 'adventure', 'viewpoint', 'religious', 'historical', 'other'],
    default: 'other',
  },
  bestTime: { type: String }, // e.g., "Morning (6 AM - 10 AM)"
  duration: { type: String }, // e.g., "1-2 hours"
  description: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  entryFee: { type: String }, // e.g., "₹20-₹50" or "Free"
  rating: { type: Number, min: 0, max: 5 },
});

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['street-food', 'restaurant', 'cafe', 'sweet-shop', 'dhaba', 'fine-dining', 'bakery', 'other'],
    default: 'other',
  },
  famousFor: { type: String }, // e.g., "Kachori, Chaat"
  area: { type: String },
  budgetCategory: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate',
  },
  priceRange: { type: String }, // e.g., "₹50-₹150"
  description: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  rating: { type: Number, min: 0, max: 5 },
});

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  area: { type: String },
  priceRange: { type: String }, // e.g., "₹800-₹1500 per night"
  amenities: [{ type: String }],
  rating: { type: Number, min: 0, max: 5 },
});

const localGemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['food', 'place', 'experience', 'market', 'viewpoint', 'other'],
    default: 'other',
  },
  description: { type: String, required: true },
  bestTime: { type: String },
  area: { type: String },
});

const citySchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    // Searchable aliases (e.g., "Banaras" for "Varanasi", "Prayag" for "Prayagraj")
    aliases: [{ type: String, lowercase: true, trim: true }],
    places: [placeSchema],
    food: [foodSchema],
    hotels: {
      low: [hotelSchema],
      moderate: [hotelSchema],
      high: [hotelSchema],
    },
    tips: [{ type: String }],
    avoid: [{ type: String }],
    localGems: [localGemSchema],
    // Metadata for scaling
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now },
    contributionCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Text index for search
citySchema.index({ city: 'text', aliases: 'text', state: 'text' });

// Static method to find city by name or alias
citySchema.statics.findByNameOrAlias = async function (name) {
  const normalizedName = name.trim().toLowerCase();
  return this.findOne({
    $or: [
      { city: { $regex: new RegExp(`^${normalizedName}$`, 'i') } },
      { aliases: normalizedName },
    ],
    isActive: true,
  });
};

module.exports = mongoose.model('City', citySchema);
