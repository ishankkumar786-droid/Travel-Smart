const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const journalEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['note', 'expense', 'memory', 'checklist'],
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    synced: {
      type: Boolean,
      default: true,
    },
    localId: {
      type: String, // Client-generated ID for offline entries
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      required: [true, 'Source city is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination city is required'],
      trim: true,
    },
    budget: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: [true, 'Budget level is required'],
    },
    days: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [1, 'Minimum 1 day'],
      max: [15, 'Maximum 15 days'],
    },
    people: {
      type: Number,
      required: [true, 'Number of people is required'],
      min: [1, 'Minimum 1 person'],
      max: [20, 'Maximum 20 people'],
    },
    intent: {
      type: String,
      required: [true, 'Travel intent is required'],
    },
    itinerary: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    mode: {
      type: String,
      enum: ['premium', 'ai-generated'],
      required: true,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    chatHistory: [chatMessageSchema],
    journalEntries: [journalEntrySchema],
  },
  {
    timestamps: true,
  }
);

// Index for efficient user trip queries
tripSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
