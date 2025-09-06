import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import emailService from '../services/emailService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Send survey invitations to all eligible employees
 */
export const sendSurveyInvitations = async (req: Request, res: Response) => {
    try {
        const { surveyId } = req.params;
        const userId = (req as any).userId;

        // Verify user is HR
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can send survey invitations' });
        }

        // Get survey details
        const survey = await prisma.survey.findUnique({
            where: { id: surveyId },
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
        });

        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        if (survey.status !== 'PUBLISHED') {
            return res.status(400).json({ error: 'Survey must be published before sending invitations' });
        }

        // Get eligible employees
        let eligibleEmployees;
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
            // Handle targeted surveys (by department or specific users)
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

        if (eligibleEmployees.length === 0) {
            return res.status(400).json({ error: 'No eligible employees found for this survey' });
        }

        // Send invitations
        const recipients = eligibleEmployees.map(employee => ({
            email: employee.email,
            userId: employee.id,
            name: `${employee.firstName} ${employee.lastName}`
        }));

        const template = {
            type: 'survey_invitation' as const,
            name: 'Survey Invitation'
        };

        const result = await emailService.sendBulkEmails(
            recipients,
            template,
            `Survey Invitation: ${survey.title}`,
            {
                surveyId,
                surveyTitle: survey.title,
                surveyDescription: survey.description,
                surveyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/surveys/${surveyId}`,
                type: 'survey_invitation'
            }
        );

        // Send notification to HR about the invitations
        await emailService.sendSurveyPublishedNotification(
            surveyId,
            survey.createdBy.id,
            survey.createdBy.email,
            `${survey.createdBy.firstName} ${survey.createdBy.lastName}`,
            survey.title,
            eligibleEmployees.length
        );

        logger.info('Survey invitations sent', {
            surveyId,
            totalRecipients: eligibleEmployees.length,
            success: result.success,
            failed: result.failed
        });

        res.json({
            message: 'Survey invitations sent successfully',
            totalRecipients: eligibleEmployees.length,
            success: result.success,
            failed: result.failed
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Send survey invitations error', { error: errorMessage });
        res.status(500).json({ error: 'Failed to send survey invitations' });
    }
};

/**
 * Get email statistics
 */
export const getEmailStats = async (req: Request, res: Response) => {
    try {
        const { days } = req.query;
        const daysNumber = days ? parseInt(days as string) : 30;

        const stats = await emailService.getEmailStats(daysNumber);

        res.json(stats);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Get email stats error', { error: errorMessage });
        res.status(500).json({ error: 'Failed to get email statistics' });
    }
};

/**
 * Get email logs
 */
export const getEmailLogs = async (req: Request, res: Response) => {
    try {
        const { page = '1', limit = '50', status, type } = req.query;
        const pageNumber = parseInt(page as string);
        const limitNumber = parseInt(limit as string);
        const skip = (pageNumber - 1) * limitNumber;

        const whereClause: any = {};
        if (status) whereClause.status = status;
        if (type) whereClause.type = type;

        const [logs, total] = await Promise.all([
            prisma.emailLog.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNumber,
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
            }),
            prisma.emailLog.count({ where: whereClause })
        ]);

        res.json({
            logs,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                pages: Math.ceil(total / limitNumber)
            }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Get email logs error', { error: errorMessage });
        res.status(500).json({ error: 'Failed to get email logs' });
    }
};

/**
 * Resend failed emails
 */
export const resendFailedEmails = async (req: Request, res: Response) => {
    try {
        const { emailLogIds } = req.body;
        const userId = (req as any).userId;

        // Verify user is HR
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'HR') {
            return res.status(403).json({ error: 'Only HR can resend emails' });
        }

        if (!Array.isArray(emailLogIds) || emailLogIds.length === 0) {
            return res.status(400).json({ error: 'Email log IDs are required' });
        }

        const failedLogs = await prisma.emailLog.findMany({
            where: {
                id: { in: emailLogIds },
                status: 'FAILED'
            },
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
        });

        if (failedLogs.length === 0) {
            return res.status(400).json({ error: 'No failed emails found to resend' });
        }

        let successCount = 0;
        let failedCount = 0;

        for (const log of failedLogs) {
            try {
                // Reconstruct email data based on log type
                const emailData = {
                    to: log.email,
                    subject: `Resent: ${log.type.replace(/_/g, ' ').toUpperCase()}`,
                    data: {
                        userId: log.userId,
                        relatedId: log.relatedId,
                        userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'User',
                        type: log.type
                    }
                };

                const template = {
                    type: log.type as any,
                    name: log.type.replace(/_/g, ' ').toUpperCase()
                };

                const success = await emailService.sendEmail(emailData, template);

                if (success) {
                    successCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                failedCount++;
                logger.error('Failed to resend email', {
                    logId: log.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        res.json({
            message: 'Email resend completed',
            total: failedLogs.length,
            success: successCount,
            failed: failedCount
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Resend failed emails error', { error: errorMessage });
        res.status(500).json({ error: 'Failed to resend emails' });
    }
};
