const express = require('express');
const router = express.Router();
const { contribute, getPending, approveContribution, rejectContribution } = require('../controllers/contributionController');
const { auth, optionalAuth, admin } = require('../middleware/auth');
const { validateContribution } = require('../utils/validators');

// Public/User: Submit a contribution
router.post('/', optionalAuth, validateContribution, contribute);

// Admin: Manage contributions
router.get('/pending', auth, admin, getPending);
router.post('/:id/approve', auth, admin, approveContribution);
router.post('/:id/reject', auth, admin, rejectContribution);

module.exports = router;
