const express = require('express');
const router = express.Router();
const { generate } = require('../controllers/itineraryController');
const { optionalAuth } = require('../middleware/auth');
const { validateItinerary } = require('../utils/validators');

router.post('/generate', optionalAuth, validateItinerary, generate);

module.exports = router;
