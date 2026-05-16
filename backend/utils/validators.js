const { body, param, query } = require('express-validator');

const validateSignup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const validateItinerary = [
  body('source')
    .trim()
    .notEmpty().withMessage('Source city is required'),
  body('destination')
    .trim()
    .notEmpty().withMessage('Destination city is required'),
  body('budget')
    .notEmpty().withMessage('Budget level is required')
    .isIn(['low', 'moderate', 'high']).withMessage('Budget must be low, moderate, or high'),
  body('days')
    .notEmpty().withMessage('Number of days is required')
    .isInt({ min: 1, max: 15 }).withMessage('Days must be between 1 and 15'),
  body('people')
    .notEmpty().withMessage('Number of people is required')
    .isInt({ min: 1, max: 20 }).withMessage('People must be between 1 and 20'),
  body('intent')
    .notEmpty().withMessage('Travel intent is required')
    .custom((value) => {
      const validIntents = ['religious', 'chill', 'explore', 'adventure', 'romantic', 'cultural', 'foodie', 'other'];
      const intents = value.split(',').map((s) => s.trim());
      const allValid = intents.every((i) => validIntents.includes(i));
      if (!allValid) throw new Error('Invalid travel intent');
      return true;
    }),
];

const validateChat = [
  body('question')
    .trim()
    .notEmpty().withMessage('Question is required')
    .isLength({ max: 500 }).withMessage('Question too long (max 500 chars)'),
  body('itineraryContext')
    .notEmpty().withMessage('Itinerary context is required'),
];

const validateContribution = [
  body('city')
    .trim()
    .notEmpty().withMessage('City name is required'),
  body('type')
    .notEmpty().withMessage('Contribution type is required')
    .isIn(['place', 'food', 'tip']).withMessage('Type must be place, food, or tip'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 1000 }).withMessage('Content too long (max 1000 chars)'),
];

const validateNearby = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('category')
    .optional()
    .isIn(['food', 'hotels', 'attractions', 'cafes', 'local-gems']).withMessage('Invalid category'),
  body('radius')
    .optional()
    .isInt({ min: 500, max: 5000 }).withMessage('Radius must be 500-5000 meters'),
];

module.exports = {
  validateSignup,
  validateLogin,
  validateItinerary,
  validateChat,
  validateContribution,
  validateNearby,
};
