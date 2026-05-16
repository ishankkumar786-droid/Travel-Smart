const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for guest contributions
    },
    city: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['place', 'food', 'tip'],
      required: [true, 'Contribution type is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [1000, 'Content cannot exceed 1000 characters'],
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Stores structured data like { category: 'temple', rating: 4.5 }
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for admin review queries
contributionSchema.index({ status: 1, createdAt: -1 });
contributionSchema.index({ city: 1, status: 1 });

module.exports = mongoose.model('Contribution', contributionSchema);
