const Trip = require('../models/Trip');

/**
 * Get all journal entries for a trip
 */
const getEntries = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, userId: req.userId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const entries = trip.journalEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: { entries } });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch entries.' });
  }
};

/**
 * Add a single journal entry
 */
const addEntry = async (req, res) => {
  try {
    const { type, content, localId } = req.body;
    if (!type || !content) {
      return res.status(400).json({ success: false, message: 'Type and content are required.' });
    }

    const trip = await Trip.findOne({ _id: req.params.tripId, userId: req.userId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const entry = { type, content, synced: true, localId: localId || null };
    trip.journalEntries.push(entry);
    await trip.save();

    // Return the newly created entry (last one pushed)
    const newEntry = trip.journalEntries[trip.journalEntries.length - 1];
    res.status(201).json({ success: true, data: { entry: newEntry } });
  } catch (error) {
    console.error('Add journal entry error:', error);
    res.status(500).json({ success: false, message: 'Failed to add entry.' });
  }
};

/**
 * Update a journal entry
 */
const updateEntry = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, userId: req.userId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const entry = trip.journalEntries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    // Update content fields
    if (req.body.content) entry.content = { ...entry.content, ...req.body.content };
    if (req.body.type) entry.type = req.body.type;
    entry.synced = true;

    await trip.save();
    res.json({ success: true, data: { entry } });
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ success: false, message: 'Failed to update entry.' });
  }
};

/**
 * Delete a journal entry
 */
const deleteEntry = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, userId: req.userId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const entry = trip.journalEntries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    entry.deleteOne();
    await trip.save();

    res.json({ success: true, message: 'Entry deleted.' });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete entry.' });
  }
};

/**
 * Sync multiple entries from offline (bulk upsert)
 */
const syncEntries = async (req, res) => {
  try {
    const { entries } = req.body;
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: 'Entries array is required.' });
    }

    const trip = await Trip.findOne({ _id: req.params.tripId, userId: req.userId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const syncedIds = [];

    for (const entry of entries) {
      // Check if entry with this localId already exists
      const existing = entry.localId
        ? trip.journalEntries.find((e) => e.localId === entry.localId)
        : null;

      if (existing) {
        // Update existing
        existing.content = entry.content;
        existing.type = entry.type;
        existing.synced = true;
        syncedIds.push(existing._id.toString());
      } else {
        // Add new
        trip.journalEntries.push({
          type: entry.type,
          content: entry.content,
          synced: true,
          localId: entry.localId || null,
        });
        syncedIds.push(entry.localId);
      }
    }

    await trip.save();
    res.json({ success: true, message: `${syncedIds.length} entries synced.`, data: { syncedIds } });
  } catch (error) {
    console.error('Sync journal entries error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync entries.' });
  }
};

module.exports = { getEntries, addEntry, updateEntry, deleteEntry, syncEntries };
