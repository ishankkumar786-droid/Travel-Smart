const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const connectDB = async () => {
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set — running without database connection');
    return null;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // Mongoose 8 uses the new URL parser and unified topology by default
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
