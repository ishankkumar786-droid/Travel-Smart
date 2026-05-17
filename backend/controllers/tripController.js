const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Trip = require('../models/Trip');

const saveTrip = async (req, res) => {
  try {
    const { source, destination, budget, days, people, intent, itinerary, mode, confidenceScore } = req.body;
    
    console.log(`💾 Saving trip to ${destination} for user ${req.userId}`);
    
    const trip = await Trip.create({
      userId: req.userId,
      source, destination, budget,
      days: parseInt(days), people: parseInt(people),
      intent, itinerary, mode,
      confidenceScore: confidenceScore || 0,
    });
    // Also push to user's trips array
    req.user.trips.push(trip._id);
    await req.user.save();
    
    console.log('✅ Trip saved successfully:', trip._id);
    res.status(201).json({ success: true, message: 'Trip saved!', data: { trip } });
  } catch (error) {
    console.error('❌ Save trip error:', error);
    // Return detailed error if validation failed
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to save trip.' });
  }
};

const getMyTrips = async (req, res) => {
  try {
    if (!req.userId) {
      console.error('❌ Get trips error: No userId in request');
      return res.status(401).json({ success: false, message: 'User not identified.' });
    }
    
    console.log(`🔍 Fetching trips for userId: ${req.userId} (Type: ${typeof req.userId}, isObjectId: ${req.userId instanceof mongoose.Types.ObjectId})`);
    
    // Explicitly scope by userId to prevent leaks
    const trips = await Trip.find({ userId: { $eq: req.userId } })
      .sort({ createdAt: -1 })
      .select('-chatHistory');
      
    console.log(`📊 Fetched ${trips.length} trips for user ${req.userId}`);
    res.json({ success: true, data: { trips } });
  } catch (error) {
    console.error('❌ Get trips error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trips.' });
  }
};

const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    res.json({ success: true, data: { trip } });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trip.' });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    // Also remove from user's trips array
    req.user.trips = req.user.trips.filter((id) => id.toString() !== req.params.id);
    await req.user.save();

    res.json({ success: true, message: 'Trip deleted successfully.' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete trip.' });
  }
};

const updateTrip = async (req, res) => {
  try {
    const { itinerary } = req.body;
    console.log(`📝 Updating trip ${req.params.id} for user ${req.userId}`);
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { itinerary },
      { new: true }
    );
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    res.json({ success: true, message: 'Trip updated successfully.', data: { trip } });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ success: false, message: 'Failed to update trip.' });
  }
};

module.exports = { saveTrip, getMyTrips, getTripById, deleteTrip, updateTrip };

