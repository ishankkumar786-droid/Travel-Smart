const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/auth');
const { validateChat } = require('../utils/validators');

router.post('/', chatController.answerChat);
router.post('/ask', chatController.answerChat);

module.exports = router;
