import sgMail from '@sendgrid/mail';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { EmailTemplate, EmailData, EmailLogData } from '../types/emailTypes';
import { generateEmailTemplate } from './emailTemplates';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Initialize SendGrid
sgMail.setApiKey(config.sendGridApiKey);

export class EmailService {
    private static instance: EmailService;
    private retryAttempts: number;
    private retryDelay: number;

    constructor() {
        this.retryAttempts = config.emailRetryAttempts;
        this.retryDelay = config.emailRetryDelay;
    }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * Send email with retry mechanism
     */
    async sendEmail(emailData: EmailData, template: EmailTemplate): Promise<boolean> {
        const { to, subject, data } = emailData;

        try {
            // Generate HTML content from template
            const htmlContent = generateEmailTemplate(template, data);

            // Prepare email message
            const msg = {
                to,
                from: {
                    email: config.sendGridFromEmail,
                    name: config.sendGridFromName
                },
                subject,
                html: htmlContent,
                trackingSettings: {
                    clickTracking: {
                        enable: true,
                        enableText: true
                    },
                    openTracking: {
                        enable: true
                    }
                }
            };

            // Send email with retry mechanism
            let lastError: Error | null = null;

            for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
                try {
                    const response = await sgMail.send(msg);

                    // Log successful email
                    await this.logEmail({
                        type: template.type,
                        userId: data.userId,
                        relatedId: data.relatedId,
                        email: to,
                        status: 'SENT',
                        sendGridResponse: response[0]
                    });

                    logger.info(`Email sent successfully to ${to}`, {
                        template: template.type,
                        attempt,
                        messageId: response[0]?.headers['x-message-id']
                    });

                    return true;
                } catch (error) {
                    lastError = error as Error;
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                    logger.warn(`Email send attempt ${attempt} failed for ${to}`, {
                        template: template.type,
                        error: errorMessage,
                        attempt
                    });

                    // Log failed attempt
                    await this.logEmail({
                        type: template.type,
                        userId: data.userId,
                        relatedId: data.relatedId,
                        email: to,
                        status: 'FAILED',
                        error: errorMessage
                    });

                    // Wait before retry (except on last attempt)
                    if (attempt < this.retryAttempts) {
                        await this.delay(this.retryDelay);
                    }
                }
            }

            // All attempts failed
            logger.error(`All email send attempts failed for ${to}`, {
                template: template.type,
                error: lastError?.message || 'Unknown error',
                attempts: this.retryAttempts
            });

            return false;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Email service error', {
                to,
                template: template.type,
                error: errorMessage
            });
            return false;
        }
    }

    /**
     * Send survey invitation to employees
     */
    async sendSurveyInvitation(
        surveyId: string,
        userId: string,
        userEmail: string,
        userName: string,
        surveyTitle: string,
        surveyDescription?: string
    ): Promise<boolean> {
        const emailData: EmailData = {
            to: userEmail,
            subject: `Survey Invitation: ${surveyTitle}`,
            data: {
                userId,
                relatedId: surveyId,
                userName,
                surveyTitle,
                surveyDescription,
                surveyUrl: `${config.frontendUrl}/surveys/${surveyId}`,
                type: 'survey_invitation'
            }
        };

        const template: EmailTemplate = {
            type: 'survey_invitation',
            name: 'Survey Invitation'
        };

        return this.sendEmail(emailData, template);
    }

    /**
     * Send survey published notification to HR
     */
    async sendSurveyPublishedNotification(
        surveyId: string,
        hrUserId: string,
        hrEmail: string,
        hrName: string,
        surveyTitle: string,
        employeeCount: number
    ): Promise<boolean> {
        const emailData: EmailData = {
            to: hrEmail,
            subject: `Survey Published: ${surveyTitle}`,
            data: {
                userId: hrUserId,
                relatedId: surveyId,
                userName: hrName,
                surveyTitle,
                employeeCount,
                surveyUrl: `${config.frontendUrl}/hr/surveys/${surveyId}`,
                type: 'survey_published'
            }
        };

        const template: EmailTemplate = {
            type: 'survey_published',
            name: 'Survey Published Notification'
        };

        return this.sendEmail(emailData, template);
    }

    /**
     * Send survey closed notification to HR
     */
    async sendSurveyClosedNotification(
        surveyId: string,
        hrUserId: string,
        hrEmail: string,
        hrName: string,
        surveyTitle: string,
        responseCount: number
    ): Promise<boolean> {
        const emailData: EmailData = {
            to: hrEmail,
            subject: `Survey Closed: ${surveyTitle}`,
            data: {
                userId: hrUserId,
                relatedId: surveyId,
                userName: hrName,
                surveyTitle,
                responseCount,
                surveyUrl: `${config.frontendUrl}/hr/surveys/${surveyId}/results`,
                type: 'survey_closed'
            }
        };

        const template: EmailTemplate = {
            type: 'survey_closed',
            name: 'Survey Closed Notification'
        };

        return this.sendEmail(emailData, template);
    }

    /**
     * Send employee response notification to HR
     */
    async sendResponseNotification(
        surveyId: string,
        responseId: string,
        hrUserId: string,
        hrEmail: string,
        hrName: string,
        employeeName: string,
        surveyTitle: string,
        responseCount: number
    ): Promise<boolean> {
        const emailData: EmailData = {
            to: hrEmail,
            subject: `New Survey Response: ${surveyTitle}`,
            data: {
                userId: hrUserId,
                relatedId: surveyId,
                userName: hrName,
                employeeName,
                surveyTitle,
                responseCount,
                surveyUrl: `${config.frontendUrl}/hr/surveys/${surveyId}/results`,
                responseUrl: `${config.frontendUrl}/hr/surveys/${surveyId}/responses/${responseId}`,
                type: 'response_notification'
            }
        };

        const template: EmailTemplate = {
            type: 'response_notification',
            name: 'Response Notification'
        };

        return this.sendEmail(emailData, template);
    }

    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(
        userId: string,
        userEmail: string,
        userName: string,
        userRole: string
    ): Promise<boolean> {
        const emailData: EmailData = {
            to: userEmail,
            subject: `Welcome to ${config.companyName} HR HelpDesk`,
            data: {
                userId,
                userName,
                userRole,
                loginUrl: config.frontendUrl,
                type: 'welcome'
            }
        };

        const template: EmailTemplate = {
            type: 'welcome',
            name: 'Welcome Email'
        };

        return this.sendEmail(emailData, template);
    }

    /**
     * Send bulk emails to multiple recipients
     */
    async sendBulkEmails(
        recipients: Array<{ email: string; userId: string; name: string }>,
        template: EmailTemplate,
        subject: string,
        data: any
    ): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        // Send emails in batches to avoid rate limiting
        const batchSize = 10;
        const batches = this.chunkArray(recipients, batchSize);

        for (const batch of batches) {
            const promises = batch.map(recipient => {
                const emailData: EmailData = {
                    to: recipient.email,
                    subject,
                    data: {
                        ...data,
                        userId: recipient.userId,
                        userName: recipient.name
                    }
                };

                return this.sendEmail(emailData, template);
            });

            const results = await Promise.allSettled(promises);

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    success++;
                } else {
                    failed++;
                }
            });

            // Add delay between batches to respect rate limits
            if (batches.length > 1) {
                await this.delay(1000);
            }
        }

        logger.info('Bulk email sending completed', {
            total: recipients.length,
            success,
            failed,
            template: template.type
        });

        return { success, failed };
    }

    /**
     * Log email to database
     */
    private async logEmail(logData: EmailLogData): Promise<void> {
        try {
            await prisma.emailLog.create({
                data: {
                    type: logData.type,
                    userId: logData.userId,
                    relatedId: logData.relatedId,
                    email: logData.email,
                    status: logData.status,
                    metadata: logData.sendGridResponse || logData.error ? {
                        sendGridResponse: logData.sendGridResponse,
                        error: logData.error
                    } : undefined
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to log email', {
                error: errorMessage,
                logData
            });
        }
    }

    /**
     * Utility method to delay execution
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Utility method to chunk array into smaller arrays
     */
    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Get email statistics
     */
    async getEmailStats(days: number = 30): Promise<any> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const stats = await prisma.emailLog.groupBy({
            by: ['status', 'type'],
            where: {
                createdAt: {
                    gte: startDate
                }
            },
            _count: {
                id: true
            }
        });

        const totalEmails = await prisma.emailLog.count({
            where: {
                createdAt: {
                    gte: startDate
                }
            }
        });

        return {
            totalEmails,
            stats: stats.reduce((acc, stat) => {
                if (!acc[stat.status]) {
                    acc[stat.status] = {};
                }
                acc[stat.status][stat.type] = stat._count.id;
                return acc;
            }, {} as Record<string, Record<string, number>>)
        };
    }
}

export default EmailService.getInstance();
