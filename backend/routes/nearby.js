const express = require('express');
const router = express.Router();
const { getNearby } = require('../controllers/nearbyController');
const { validateNearby } = require('../utils/validators');

router.post('/', validateNearby, getNearby);

module.exports = router;
