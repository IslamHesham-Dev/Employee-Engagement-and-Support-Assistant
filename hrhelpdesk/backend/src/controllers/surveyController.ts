import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SURVEY_TEMPLATES, getSurveyTemplateById } from '../data/surveyTemplates';

const prisma = new PrismaClient();

// Get all survey templates
export const getSurveyTemplates = async (req: Request, res: Response) => {
    try {
        res.json(SURVEY_TEMPLATES);
    } catch (error) {
        console.error('Get survey templates error:', error);
        res.status(500).json({ error: 'Failed to fetch survey templates' });
    }
};

// Create survey from template (HR only)
export const createSurveyFromTemplate = async (req: Request, res: Response) => {
    try {
        const { templateId, title, description } = req.body;
        const userId = (req as any).userId;

        // Verify user is HR
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can create surveys' });
        }

        const template = getSurveyTemplateById(templateId);
        if (!template) {
            return res.status(404).json({ error: 'Survey template not found' });
        }

        // Create survey
        const survey = await prisma.survey.create({
            data: {
                title: title || template.title,
                description: description || template.description,
                status: 'DRAFT',
                isAnonymous: false, // Always track employee details
                startDate: null,
                endDate: null,
                createdById: userId,
                questions: {
                    create: template.questions.map((question, index) => ({
                        text: question.text,
                        type: question.type,
                        required: question.required,
                        order: index + 1,
                        options: question.options || [],
                        minValue: question.minValue || null,
                        maxValue: question.maxValue || null
                    }))
                }
            },
            include: {
                questions: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        res.status(201).json(survey);
    } catch (error) {
        console.error('Create survey error:', error);
        res.status(500).json({ error: 'Failed to create survey' });
    }
};

// Get all surveys (HR only)
export const getAllSurveys = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Verify user is HR
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can view all surveys' });
        }

        const surveys = await prisma.survey.findMany({
            include: {
                questions: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                responses: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(surveys);
    } catch (error) {
        console.error('Get all surveys error:', error);
        res.status(500).json({ error: 'Failed to fetch surveys' });
    }
};

// Get published surveys (for employees)
export const getPublishedSurveys = async (req: Request, res: Response) => {
    try {
        const now = new Date();

        const surveys = await prisma.survey.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { startDate: null },
                    { startDate: { lte: now } }
                ],
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            },
            include: {
                questions: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(surveys);
    } catch (error) {
        console.error('Get published surveys error:', error);
        res.status(500).json({ error: 'Failed to fetch published surveys' });
    }
};

// Publish survey (HR only)
export const publishSurvey = async (req: Request, res: Response) => {
    try {
        const { surveyId } = req.params;
        const userId = (req as any).userId;

        // Verify user is HR
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can publish surveys' });
        }

        const survey = await prisma.survey.update({
            where: { id: surveyId },
            data: { status: 'PUBLISHED' },
            include: {
                questions: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        res.json(survey);
    } catch (error) {
        console.error('Publish survey error:', error);
        res.status(500).json({ error: 'Failed to publish survey' });
    }
};

// Unpublish survey (HR only)
export const unpublishSurvey = async (req: Request, res: Response) => {
    try {
        const { surveyId } = req.params;
        const userId = (req as any).userId;

        // Verify user is HR
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can unpublish surveys' });
        }

        const survey = await prisma.survey.update({
            where: { id: surveyId },
            data: { status: 'DRAFT' },
            include: {
                questions: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        res.json(survey);
    } catch (error) {
        console.error('Unpublish survey error:', error);
        res.status(500).json({ error: 'Failed to unpublish survey' });
    }
};

// Submit survey response (employees)
export const submitSurveyResponse = async (req: Request, res: Response) => {
    try {
        const { surveyId } = req.params;
        const { responses } = req.body;
        const userId = (req as any).userId;

        // Check if survey exists and is published
        const survey = await prisma.survey.findUnique({
            where: { id: surveyId },
            include: { questions: true }
        });

        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        if (survey.status !== 'PUBLISHED') {
            return res.status(400).json({ error: 'Survey is not published' });
        }

        // Check if user already responded (if not allowing multiple responses)
        if (!survey.allowMultipleResponses) {
            const existingResponse = await prisma.surveyResponse.findFirst({
                where: {
                    surveyId,
                    userId
                }
            });

            if (existingResponse) {
                return res.status(400).json({ error: 'You have already responded to this survey' });
            }
        }

        // Create survey response
        const surveyResponse = await prisma.surveyResponse.create({
            data: {
                surveyId,
                userId: userId, // Always save user ID since we removed anonymous mode
                isComplete: true,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                questionResponses: {
                    create: responses.map((response: any) => ({
                        questionId: response.questionId,
                        value: response.value.toString()
                    }))
                }
            },
            include: {
                questionResponses: {
                    include: {
                        question: true
                    }
                }
            }
        });

        res.status(201).json(surveyResponse);
    } catch (error) {
        console.error('Submit survey response error:', error);
        res.status(500).json({ error: 'Failed to submit survey response' });
    }
};

// Get survey results (HR only)
export const getSurveyResults = async (req: Request, res: Response) => {
    try {
        const { surveyId } = req.params;
        const userId = (req as any).userId;

        // Verify user is HR
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can view survey results' });
        }

        const survey = await prisma.survey.findUnique({
            where: { id: surveyId },
            include: {
                questions: {
                    include: {
                        responses: {
                            include: {
                                response: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                email: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                },
                responses: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Calculate statistics
        const totalResponses = survey.responses.length;
        const questionStats = survey.questions.map(question => {
            const responses = question.responses;
            const values = responses.map(r => parseFloat(r.value)).filter(v => !isNaN(v));

            const stats = {
                questionId: question.id,
                questionText: question.text,
                totalResponses: responses.length,
                average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
                distribution: {} as Record<string, number>
            };

            // Calculate distribution
            responses.forEach(response => {
                const value = response.value;
                stats.distribution[value] = (stats.distribution[value] || 0) + 1;
            });

            return stats;
        });

        res.json({
            survey,
            totalResponses,
            questionStats
        });
    } catch (error) {
        console.error('Get survey results error:', error);
        res.status(500).json({ error: 'Failed to fetch survey results' });
    }
};
