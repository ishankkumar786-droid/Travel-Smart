const { validationResult } = require('express-validator');
const groqService = require('../services/groqService');
const ragService = require('../services/ragService');

const chat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array().map((e) => e.msg) });
    }

    const { message, context, history = [] } = req.body;

    // 1. Get relevant context chunk (RAG)
    const relevantContext = ragService.getRelevantContext(context, message);
    
    // 2. Summarize history
    const compactHistory = ragService.summarizeHistory(history);

    // 3. Get response from Groq (Llama)
    const result = await groqService.answerChat(message, relevantContext, compactHistory);
    
    res.json({ 
      success: true, 
      data: { 
        answer: result.explanation || result.answer || '',
        action: result.action || 'answer',
        itinerary: result.itinerary || null
      } 
    });
  } catch (error) {
    console.error('Chat Controller Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get answer from AI Assistant' });
  }
};

module.exports = {
  chat,
  answerChat: chat, // Alias
};
