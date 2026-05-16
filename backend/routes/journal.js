const express = require('express');
const router = express.Router();
const { getEntries, addEntry, updateEntry, deleteEntry, syncEntries } = require('../controllers/journalController');
const { auth } = require('../middleware/auth');

// All journal routes require authentication
router.get('/:tripId/journal', auth, getEntries);
router.post('/:tripId/journal', auth, addEntry);
router.put('/:tripId/journal/:entryId', auth, updateEntry);
router.delete('/:tripId/journal/:entryId', auth, deleteEntry);
router.post('/:tripId/journal/sync', auth, syncEntries);

module.exports = router;
