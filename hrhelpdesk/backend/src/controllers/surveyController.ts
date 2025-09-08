import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SURVEY_TEMPLATES, getSurveyTemplateById } from '../data/surveyTemplates';
import emailService from '../services/emailService';
import logger from '../utils/logger';

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
        const { templateId, title, description, targetAllEmployees = true, targetDepartments = [], targetUsers = [] } = req.body;
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
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
                isAnonymous: false,
                targetAllEmployees,
                targetDepartments: targetDepartments.length > 0 ? targetDepartments : [],
                targetUsers: targetUsers.length > 0 ? targetUsers : [],
                startDate: null,
                endDate: null,
                createdById: userId,
                questions: {
                    create: template.questions.map((question, index) => ({
                        text: question.text,
                        type: question.type,
                        required: question.required,
                        order: index + 1,
                        minValue: question.minValue,
                        maxValue: question.maxValue
                    }))
                }
            },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                },
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
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can view all surveys' });
        }

        // Only get surveys that have questions (properly created from templates)
        const surveys = await prisma.survey.findMany({
            where: {
                questions: {
                    some: {} // Only surveys with questions
                }
            },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                },
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
                status: 'ACTIVE',
                AND: [
                    {
                        OR: [
                            { startDate: null },
                            { startDate: { lte: now } }
                        ]
                    },
                    {
                        OR: [
                            { endDate: null },
                            { endDate: { gte: now } }
                        ]
                    }
                ]
            },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
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
        const surveyId = req.params.surveyId;
        const userId = (req as any).userId;

        if (!surveyId) {
            return res.status(400).json({ error: 'Survey ID is required' });
        }

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can publish surveys' });
        }

        // Set start date to now and end date to one week from now
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds

        const survey = await prisma.survey.update({
            where: { id: surveyId },
            data: {
                status: 'ACTIVE',
                startDate: now,
                endDate: oneWeekFromNow
            },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                },
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

        // Get eligible employee count for notification
        let employeeCount = 0;
        if (survey.targetAllEmployees) {
            employeeCount = await prisma.user.count({
                where: {
                    role: 'EMPLOYEE',
                    status: 'ACTIVE'
                }
            });
        } else {
            const whereClause: any = {
                role: 'EMPLOYEE',
                status: 'ACTIVE'
            };

            if (survey.targetDepartments && survey.targetDepartments.length > 0) {
                whereClause.departmentId = { in: survey.targetDepartments };
            }

            if (survey.targetUsers && survey.targetUsers.length > 0) {
                whereClause.id = { in: survey.targetUsers };
            }

            employeeCount = await prisma.user.count({ where: whereClause });
        }

        // Send notification to HR about survey publication
        try {
            await emailService.sendSurveyPublishedNotification(
                surveyId,
                survey.createdBy.id,
                survey.createdBy.email,
                `${survey.createdBy.firstName} ${survey.createdBy.lastName}`,
                survey.title,
                employeeCount
            );
        } catch (error) {
            logger.error('Failed to send survey published notification', {
                surveyId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        // Send email notifications to all eligible employees
        try {
            let eligibleEmployees: any[] = [];

            if (survey.targetAllEmployees) {
                eligibleEmployees = await prisma.user.findMany({
                    where: {
                        role: 'EMPLOYEE',
                        status: 'ACTIVE'
                    },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                });
            } else {
                const whereClause: any = {
                    role: 'EMPLOYEE',
                    status: 'ACTIVE'
                };

                if (survey.targetDepartments && survey.targetDepartments.length > 0) {
                    whereClause.departmentId = { in: survey.targetDepartments };
                }

                if (survey.targetUsers && survey.targetUsers.length > 0) {
                    whereClause.id = { in: survey.targetUsers };
                }

                eligibleEmployees = await prisma.user.findMany({
                    where: whereClause,
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                });
            }

            // Send survey invitation emails to all eligible employees
            for (const employee of eligibleEmployees) {
                try {
                    await emailService.sendSurveyInvitation(
                        surveyId,
                        employee.id,
                        employee.email,
                        `${employee.firstName} ${employee.lastName}`,
                        survey.title,
                        survey.description || ''
                    );
                } catch (emailError) {
                    logger.error('Failed to send survey invitation email', {
                        surveyId,
                        employeeId: employee.id,
                        employeeEmail: employee.email,
                        error: emailError instanceof Error ? emailError.message : 'Unknown error'
                    });
                }
            }

            logger.info(`Survey invitation emails sent to ${eligibleEmployees.length} employees`, {
                surveyId,
                surveyTitle: survey.title,
                totalEmailsSent: eligibleEmployees.length
            });
        } catch (error) {
            logger.error('Failed to send survey invitation emails to employees', {
                surveyId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        res.json(survey);
    } catch (error) {
        console.error('Publish survey error:', error);
        res.status(500).json({ error: 'Failed to publish survey' });
    }
};

// Unpublish survey (HR only)
export const unpublishSurvey = async (req: Request, res: Response) => {
    try {
        const surveyId = req.params.surveyId;
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can unpublish surveys' });
        }

        const survey = await prisma.survey.update({
            where: { id: surveyId },
            data: { status: 'DRAFT' },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                },
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
        const surveyId = req.params.surveyId;
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

        if (survey.status !== 'ACTIVE') {
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
                userId: userId,
                isComplete: true,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                responses: {
                    create: responses.map((response: any) => ({
                        questionId: response.questionId,
                        value: response.value.toString()
                    }))
                }
            },
            include: {
                responses: {
                    include: {
                        question: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                survey: {
                    include: {
                        createdBy: {
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

        // Send notification to HR about new response
        try {
            const responseCount = await prisma.surveyResponse.count({
                where: { surveyId }
            });

            await emailService.sendResponseNotification(
                surveyId,
                surveyResponse.id,
                surveyResponse.survey.createdBy.id,
                surveyResponse.survey.createdBy.email,
                `${surveyResponse.survey.createdBy.firstName} ${surveyResponse.survey.createdBy.lastName}`,
                `${surveyResponse.user?.firstName} ${surveyResponse.user?.lastName}`,
                surveyResponse.survey.title,
                responseCount
            );
        } catch (error) {
            logger.error('Failed to send response notification', {
                surveyId,
                responseId: surveyResponse.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        res.status(201).json(surveyResponse);
    } catch (error) {
        console.error('Submit survey response error:', error);
        res.status(500).json({ error: 'Failed to submit survey response' });
    }
};

// Get survey results (HR only)
export const getSurveyResults = async (req: Request, res: Response) => {
    try {
        const surveyId = req.params.surveyId;
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
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
                        },
                        questionResponses: {
                            include: {
                                question: true
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

// Get dashboard analytics (HR only)
export const getDashboardAnalytics = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can view dashboard analytics' });
        }

        // Get all active surveys with their responses
        const surveys = await prisma.survey.findMany({
            where: {
                status: 'ACTIVE',
                questions: {
                    some: {}
                }
            },
            include: {
                questions: {
                    include: {
                        responses: true
                    },
                    orderBy: { order: 'asc' }
                },
                responses: {
                    where: {
                        isComplete: true
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                department: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Process data for dashboard
        const analytics = {
            totalResponses: 0,
            totalSurveys: surveys.length,
            questionAnalytics: [] as any[],
            departmentBreakdown: {} as Record<string, number>,
            recentResponses: [] as any[]
        };

        surveys.forEach(survey => {
            analytics.totalResponses += survey.responses.length;

            // Process each question
            survey.questions.forEach(question => {
                const responses = question.responses;
                const responseCounts: Record<string, number> = {};

                responses.forEach(response => {
                    const value = response.value;
                    responseCounts[value] = (responseCounts[value] || 0) + 1;
                });

                analytics.questionAnalytics.push({
                    questionId: question.id,
                    questionText: question.text,
                    questionOrder: question.order,
                    responseCounts,
                    totalResponses: responses.length
                });
            });

            // Department breakdown
            survey.responses.forEach(response => {
                if (response.user?.department) {
                    const dept = response.user.department.name;
                    analytics.departmentBreakdown[dept] = (analytics.departmentBreakdown[dept] || 0) + 1;
                }
            });

            // Recent responses (last 10)
            survey.responses.slice(0, 10).forEach(response => {
                analytics.recentResponses.push({
                    id: response.id,
                    userName: response.user ? `${response.user.firstName} ${response.user.lastName}` : 'Anonymous',
                    department: response.user?.department?.name || 'Unknown',
                    completedAt: response.completedAt,
                    surveyTitle: survey.title
                });
            });
        });

        // Sort recent responses by completion date
        analytics.recentResponses.sort((a, b) =>
            new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
        );

        res.json(analytics);
    } catch (error) {
        console.error('Get dashboard analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
    }
};

// Get individual survey response details (HR only)
export const getSurveyResponseDetails = async (req: Request, res: Response) => {
    try {
        const surveyId = req.params.surveyId;
        const responseId = req.params.responseId;
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can view response details' });
        }

        const response = await prisma.surveyResponse.findUnique({
            where: { id: responseId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        employeeId: true
                    }
                },
                questionResponses: {
                    include: {
                        question: true
                    },
                    orderBy: {
                        question: {
                            order: 'asc'
                        }
                    }
                },
                survey: {
                    select: {
                        id: true,
                        title: true,
                        description: true
                    }
                }
            }
        });

        if (!response) {
            return res.status(404).json({ error: 'Response not found' });
        }

        res.json(response);
    } catch (error) {
        console.error('Get response details error:', error);
        res.status(500).json({ error: 'Failed to fetch response details' });
    }
};

// Delete survey (HR only)
export const deleteSurvey = async (req: Request, res: Response) => {
    try {
        const surveyId = req.params.surveyId;
        const userId = (req as any).userId;

        // Verify user is HR
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can delete surveys' });
        }

        // Check if survey has responses
        const responseCount = await prisma.surveyResponse.count({
            where: { surveyId }
        });

        if (responseCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete survey with responses. Consider unpublishing instead.'
            });
        }

        // Delete survey and related data
        await prisma.survey.delete({
            where: { id: surveyId }
        });

        res.json({ message: 'Survey deleted successfully' });
    } catch (error) {
        console.error('Delete survey error:', error);
        res.status(500).json({ error: 'Failed to delete survey' });
    }
};
