const User = require('../models/User');

/**
 * Migration Note: Signup and Login are now handled by Clerk on the frontend.
 * This controller now primarily handles session verification and syncing.
 */


/**
 * GET /api/auth/verify
 * Verify Clerk session and return local user info.
 * The 'auth' middleware already handles lookup/creation.
 */
const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed.',
    });
  }
};

module.exports = { 
  signup: (req, res) => res.status(405).json({ success: false, message: 'Use Clerk for signup' }),
  login: (req, res) => res.status(405).json({ success: false, message: 'Use Clerk for login' }),
  verifyToken 
};
