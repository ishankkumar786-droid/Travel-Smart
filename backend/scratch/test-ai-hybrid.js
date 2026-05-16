/**
 * Diagnostic script for Hybrid AI Architecture
 * Tests Gemini Generation and Groq (Llama) Chat
 */
const gemini = require('../services/geminiService');
const groq = require('../services/groqService');
const rag = require('../services/ragService');

async function runDiagnostics() {
  console.log('🧪 Starting Hybrid AI Diagnostics...');

  // 1. Test Gemini Itinerary Generation
  console.log('\n📡 Testing Gemini (Itinerary Generation)...');
  try {
    const tripParams = { destination: 'Paris', days: 3, budget: 'moderate', people: 2, intent: 'romantic' };
    const itinerary = await gemini.generateAIItinerary(tripParams);
    console.log('✅ Gemini Success! Summary:', itinerary.summary);
    
    // 2. Test RAG Context Retrieval
    console.log('\n📂 Testing RAG (Context Retrieval)...');
    const question = "What should I eat on Day 1?";
    const context = rag.getRelevantContext(itinerary, question);
    console.log('✅ RAG Result:', context.substring(0, 100) + '...');

    // 3. Test Groq (Llama Chat)
    console.log('\n💬 Testing Groq (Llama Chat)...');
    try {
      const answer = await groq.answerChat(question, context);
      console.log('✅ Groq Success! Response:', answer);
    } catch (err) {
      console.warn('❌ Groq Failed (Key probably not set yet):', err.message);
    }

  } catch (err) {
    console.error('❌ Gemini Failed:', err.message);
  }

  console.log('\n🏁 Diagnostics Complete.');
}

runDiagnostics();
