const express = require('express');
const router = express.Router();
const { signup, login, verifyToken } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../utils/validators');

// POST /api/auth/signup
router.post('/signup', validateSignup, signup);

// POST /api/auth/login
router.post('/login', validateLogin, login);

// GET /api/auth/verify (requires auth)
router.get('/verify', auth, verifyToken);

module.exports = router;
