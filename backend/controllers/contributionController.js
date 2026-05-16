const { validationResult } = require('express-validator');
const Contribution = require('../models/Contribution');
const City = require('../models/City');
const User = require('../models/User');

const contribute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array().map((e) => e.msg) });
    }

    const { city, type, content, details } = req.body;
    const contribution = await Contribution.create({
      userId: req.userId || null,
      city: city.trim(),
      type,
      content: content.trim(),
      details: details || {},
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your contribution! It will be reviewed soon.',
      data: { contribution },
    });
  } catch (error) {
    console.error('Contribution error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit contribution.' });
  }
};

/**
 * Admin: Get all pending contributions
 */
const getPending = async (req, res) => {
  try {
    const contributions = await Contribution.find({ status: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { contributions } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
};

/**
 * Admin: Approve and Merge
 */
const approveContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) return res.status(404).json({ success: false, message: 'Not found' });

    // 1. Find the city to merge into
    const city = await City.findOne({ 
      $or: [
        { city: { $regex: new RegExp(`^${contribution.city}$`, 'i') } },
        { aliases: contribution.city.toLowerCase() }
      ]
    });

    if (city) {
      // 2. Prepare the data to merge with correct mapping
      const newData = {
        name: contribution.details?.name || 'New Spot',
        description: contribution.content,
        category: contribution.details?.category || 'other',
        type: contribution.type === 'food' ? (contribution.details?.type || 'restaurant') : undefined,
        budgetCategory: contribution.details?.budgetCategory || 'moderate',
        rating: contribution.details?.rating || 4.0
      };

      // 3. Push to correct category array in City model
      if (contribution.type === 'place') city.places.push(newData);
      if (contribution.type === 'food') city.food.push(newData);
      if (contribution.type === 'tip') city.tips.push(contribution.content);
      
      await city.save();
    }

    // 4. Update Contribution status
    contribution.status = 'approved';
    contribution.reviewedAt = new Date();
    await contribution.save();

    // 5. Award Points to User
    if (contribution.userId) {
      await User.findByIdAndUpdate(contribution.userId, { $inc: { points: 50 } });
    }

    res.json({ success: true, message: 'Contribution approved and merged!' });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve.' });
  }
};

/**
 * Admin: Reject
 */
const rejectContribution = async (req, res) => {
  try {
    await Contribution.findByIdAndUpdate(req.params.id, { 
      status: 'rejected', 
      reviewedAt: new Date() 
    });
    res.json({ success: true, message: 'Contribution rejected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject.' });
  }
};

module.exports = { contribute, getPending, approveContribution, rejectContribution };
