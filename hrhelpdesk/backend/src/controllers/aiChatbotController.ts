import { Request, Response } from 'express';
import { aiChatbotService } from '../services/aiChatbotService';

export class AIChatbotController {
    /**
     * Ask a question to the AI chatbot
     */
    async askQuestion(req: Request, res: Response) {
        try {
            const { question, language = 'ar', session_id, is_common_question = false, top_k = 5 } = req.body;

            if (!question) {
                return res.status(400).json({ error: 'Question is required' });
            }

            if (!session_id) {
                return res.status(400).json({ error: 'Session ID is required' });
            }

            const response = await aiChatbotService.askQuestion(
                question,
                language,
                session_id,
                is_common_question,
                top_k
            );

            console.log(`Question processed successfully: ${question.substring(0, 50)}...`);
            res.json(response);
        } catch (error) {
            try {
                const errorMessage = error ? String(error) : 'Unknown error';
                console.error(`Error in askQuestion: ${errorMessage}`);
                res.status(500).json({
                    error: 'Failed to process question',
                    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
                });
            } catch (logError) {
                console.error('Error in error handler:', logError);
                res.status(500).json({
                    error: 'Failed to process question',
                    details: process.env.NODE_ENV === 'development' ? 'Internal error' : undefined
                });
            }
        }
    }

    /**
     * Get common questions for the dropdown
     */
    async getCommonQuestions(req: Request, res: Response) {
        try {
            const { language = 'ar' } = req.query;

            const questions = await aiChatbotService.getCommonQuestions(language as 'ar' | 'en');

            console.log(`Common questions retrieved for language: ${language}`);
            res.json({ questions });
        } catch (error) {
            try {
                const errorMessage = error ? String(error) : 'Unknown error';
                console.error(`Error in getCommonQuestions: ${errorMessage}`);
                res.status(500).json({
                    error: 'Failed to retrieve common questions',
                    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
                });
            } catch (logError) {
                console.error('Error in error handler:', logError);
                res.status(500).json({
                    error: 'Failed to retrieve common questions',
                    details: process.env.NODE_ENV === 'development' ? 'Internal error' : undefined
                });
            }
        }
    }

    /**
     * Submit feedback for a question
     */
    async submitFeedback(req: Request, res: Response) {
        try {
            const { question_id, is_good } = req.body;

            if (!question_id || typeof is_good !== 'boolean') {
                return res.status(400).json({ error: 'Question ID and feedback (is_good) are required' });
            }

            const success = await aiChatbotService.submitFeedback({ question_id, is_good });

            if (success) {
                console.log(`Feedback submitted successfully for question: ${question_id}`);
                res.json({ message: 'Feedback submitted successfully' });
            } else {
                res.status(500).json({ error: 'Failed to submit feedback' });
            }
        } catch (error) {
            try {
                const errorMessage = error ? String(error) : 'Unknown error';
                console.error(`Error in submitFeedback: ${errorMessage}`);
                res.status(500).json({
                    error: 'Failed to submit feedback',
                    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
                });
            } catch (logError) {
                console.error('Error in error handler:', logError);
                res.status(500).json({
                    error: 'Failed to submit feedback',
                    details: process.env.NODE_ENV === 'development' ? 'Internal error' : undefined
                });
            }
        }
    }

    /**
     * Check AI chatbot service health
     */
    async checkHealth(req: Request, res: Response) {
        try {
            const isHealthy = await aiChatbotService.checkHealth();

            if (isHealthy) {
                res.json({
                    status: 'healthy',
                    service: 'ai-chatbot',
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(503).json({
                    status: 'unhealthy',
                    service: 'ai-chatbot',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            try {
                const errorMessage = error ? String(error) : 'Unknown error';
                console.error(`Error in checkHealth: ${errorMessage}`);
                res.status(503).json({
                    status: 'error',
                    service: 'ai-chatbot',
                    timestamp: new Date().toISOString()
                });
            } catch (logError) {
                console.error('Error in error handler:', logError);
                res.status(503).json({
                    status: 'error',
                    service: 'ai-chatbot',
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
}

export const aiChatbotController = new AIChatbotController();
