import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    getSurveyTemplates,
    createSurveyFromTemplate,
    getAllSurveys,
    getPublishedSurveys,
    publishSurvey,
    unpublishSurvey,
    submitSurveyResponse,
    getSurveyResults,
    getSurveyResponseDetails,
    deleteSurvey
} from '../controllers/surveyController';

const router = express.Router();

// Public routes (no auth required)
router.get('/templates', getSurveyTemplates);
router.get('/published', getPublishedSurveys);

// Protected routes (auth required)
router.use(authMiddleware);

// HR-only routes
router.get('/all', getAllSurveys);
router.post('/create', createSurveyFromTemplate);
router.put('/:surveyId/publish', publishSurvey);
router.put('/:surveyId/unpublish', unpublishSurvey);
router.get('/:surveyId/results', getSurveyResults);
router.get('/:surveyId/responses/:responseId', getSurveyResponseDetails);
router.delete('/:surveyId', deleteSurvey);

// Employee routes
router.post('/:surveyId/responses', submitSurveyResponse);

export default router;
