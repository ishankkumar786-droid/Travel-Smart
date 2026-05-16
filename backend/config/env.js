const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const requiredVars = ['JWT_SECRET'];
const optionalVars = ['MONGODB_URI', 'GEMINI_API_KEY', 'GOOGLE_MAPS_API_KEY', 'OPENROUTER_API_KEY'];

// Validate required vars
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

// Warn about optional vars
for (const varName of optionalVars) {
  if (!process.env[varName]) {
    console.warn(`⚠️  Missing optional environment variable: ${varName} — related features will be disabled`);
  }
}

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};
