const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API key found in .env');
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const result = await genAI.listModels();
    console.log('Available Models:');
    result.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

listModels();
