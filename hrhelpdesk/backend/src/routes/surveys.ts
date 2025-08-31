import { Router } from 'express';
import {
    getSurveyTemplates,
    createSurveyFromTemplate,
    getAllSurveys,
    getPublishedSurveys,
    publishSurvey,
    unpublishSurvey,
    submitSurveyResponse,
    getSurveyResults
} from '../controllers/surveyController';
import { authMiddleware } from '../middleware/authMiddleware';

export const surveyRoutes = Router();

// All survey routes require authentication
surveyRoutes.use(authMiddleware);

// Survey templates (HR only)
surveyRoutes.get('/templates', getSurveyTemplates);

// Survey management (HR only)
surveyRoutes.post('/', createSurveyFromTemplate);
surveyRoutes.get('/all', getAllSurveys);
surveyRoutes.put('/:surveyId/publish', publishSurvey);
surveyRoutes.put('/:surveyId/unpublish', unpublishSurvey);
surveyRoutes.get('/:surveyId/results', getSurveyResults);

// Published surveys (for employees)
surveyRoutes.get('/published', getPublishedSurveys);

// Survey responses (employees)
surveyRoutes.post('/:surveyId/responses', submitSurveyResponse);
