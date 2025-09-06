import { Router } from 'express';
import { aiChatbotController } from '../controllers/aiChatbotController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Health check endpoint (no auth required)
router.get('/health', aiChatbotController.checkHealth);

// Protected routes - require authentication
router.use(authMiddleware);

// Ask a question to the AI chatbot
router.post('/ask', aiChatbotController.askQuestion);

// Get common questions for the dropdown
router.get('/common-questions', aiChatbotController.getCommonQuestions);

// Submit feedback for a question
router.post('/feedback', aiChatbotController.submitFeedback);

export default router;
