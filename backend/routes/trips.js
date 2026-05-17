const express = require('express');
const router = express.Router();
const { saveTrip, getMyTrips, getTripById, deleteTrip, updateTrip } = require('../controllers/tripController');
const { auth } = require('../middleware/auth');

router.post('/save', auth, saveTrip);
router.get('/', auth, getMyTrips);
router.get('/:id', auth, getTripById);
router.put('/:id', auth, updateTrip);
router.delete('/:id', auth, deleteTrip);

module.exports = router;
