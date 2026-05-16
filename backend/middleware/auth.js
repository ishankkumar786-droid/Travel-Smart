const { getAuth } = require('@clerk/express');
const User = require('../models/User');

/**
 * Required authentication middleware using Clerk.
 * Maps Clerk user to local DB user for compatibility.
 */
const auth = async (req, res, next) => {
  try {
    const authData = getAuth(req);
    const userId = authData.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login.',
      });
    }

    // Optional: Sync/Fetch local user from DB using clerkId
    let user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      console.log(`🆕 Auth: Creating new local user for Clerk ID: ${userId}`);
      // Use a unique placeholder email based on clerkId to avoid unique constraint violations
      user = await User.create({
        clerkId: userId,
        email: `user_${userId}@clerk.temp`,
        name: 'Clerk User'
      });
    }

    if (!user || !user._id) {
      console.error('❌ Auth: Failed to resolve local user record');
      return res.status(500).json({ success: false, message: 'User synchronization failed.' });
    }

    req.user = user;
    req.userId = user._id; 
    console.log(`✅ Auth: Authenticated as ${user.email} (${user._id})`);
    next();
  } catch (error) {
    console.error('Clerk Auth Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session.',
    });
  }
};

/**
 * Optional authentication middleware using Clerk.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    
    if (userId) {
      const user = await User.findOne({ clerkId: userId });
      req.user = user;
      req.userId = user ? user._id : null;
    } else {
      req.user = null;
      req.userId = null;
    }
  } catch {
    req.user = null;
    req.userId = null;
  }
  next();
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
};

module.exports = { auth, optionalAuth, admin };
