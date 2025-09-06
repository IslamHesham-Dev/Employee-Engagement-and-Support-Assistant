import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { emailRateLimiter } from '../middleware/emailMiddleware';
import {
    sendSurveyInvitations,
    getEmailStats,
    getEmailLogs,
    resendFailedEmails
} from '../controllers/notificationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply rate limiting to email sending routes
router.use('/send-invitations/:surveyId', emailRateLimiter);

// Send survey invitations to employees (HR only)
router.post('/send-invitations/:surveyId', sendSurveyInvitations);

// Get email statistics (HR only)
router.get('/stats', getEmailStats);

// Get email logs with pagination and filtering (HR only)
router.get('/logs', getEmailLogs);

// Resend failed emails (HR only)
router.post('/resend-failed', resendFailedEmails);

export default router;
