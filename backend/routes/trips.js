const express = require('express');
const router = express.Router();
const { saveTrip, getMyTrips, getTripById, deleteTrip } = require('../controllers/tripController');
const { auth } = require('../middleware/auth');

router.post('/save', auth, saveTrip);
router.get('/', auth, getMyTrips);
router.get('/:id', auth, getTripById);
router.delete('/:id', auth, deleteTrip);

module.exports = router;
