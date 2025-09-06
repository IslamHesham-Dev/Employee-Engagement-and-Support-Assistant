import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import emailService from '../services/emailService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Simple in-memory queue for email processing
interface EmailQueueItem {
    id: string;
    type: string;
    data: any;
    priority: number;
    createdAt: Date;
    retryCount: number;
}

class EmailQueue {
    private queue: EmailQueueItem[] = [];
    private processing = false;
    private maxRetries = 3;
    private processingInterval = 5000; // 5 seconds

    constructor() {
        this.startProcessing();
    }

    add(item: Omit<EmailQueueItem, 'id' | 'createdAt' | 'retryCount'>): void {
        const queueItem: EmailQueueItem = {
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            retryCount: 0
        };

        this.queue.push(queueItem);
        this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first

        logger.info('Email added to queue', {
            queueId: queueItem.id,
            type: queueItem.type,
            queueLength: this.queue.length
        });
    }

    private async startProcessing(): Promise<void> {
        if (this.processing) return;

        this.processing = true;

        while (this.processing) {
            if (this.queue.length > 0) {
                const item = this.queue.shift();
                if (item) {
                    await this.processItem(item);
                }
            }

            await this.delay(this.processingInterval);
        }
    }

    private async processItem(item: EmailQueueItem): Promise<void> {
        try {
            logger.info('Processing email queue item', {
                queueId: item.id,
                type: item.type,
                retryCount: item.retryCount
            });

            // Process based on type
            switch (item.type) {
                case 'survey_invitation':
                    await this.processSurveyInvitation(item.data);
                    break;
                case 'survey_published':
                    await this.processSurveyPublished(item.data);
                    break;
                case 'survey_closed':
                    await this.processSurveyClosed(item.data);
                    break;
                case 'response_notification':
                    await this.processResponseNotification(item.data);
                    break;
                case 'welcome':
                    await this.processWelcomeEmail(item.data);
                    break;
                default:
                    logger.warn('Unknown email type in queue', { type: item.type });
            }

            logger.info('Email queue item processed successfully', {
                queueId: item.id,
                type: item.type
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to process email queue item', {
                queueId: item.id,
                type: item.type,
                error: errorMessage,
                retryCount: item.retryCount
            });

            // Retry logic
            if (item.retryCount < this.maxRetries) {
                item.retryCount++;
                item.priority = Math.max(0, item.priority - 1); // Lower priority for retries
                this.queue.push(item);
                this.queue.sort((a, b) => b.priority - a.priority);

                logger.info('Email queue item scheduled for retry', {
                    queueId: item.id,
                    retryCount: item.retryCount
                });
            } else {
                logger.error('Email queue item failed after max retries', {
                    queueId: item.id,
                    type: item.type,
                    maxRetries: this.maxRetries
                });
            }
        }
    }

    private async processSurveyInvitation(data: any): Promise<void> {
        await emailService.sendSurveyInvitation(
            data.surveyId,
            data.userId,
            data.userEmail,
            data.userName,
            data.surveyTitle,
            data.surveyDescription
        );
    }

    private async processSurveyPublished(data: any): Promise<void> {
        await emailService.sendSurveyPublishedNotification(
            data.surveyId,
            data.hrUserId,
            data.hrEmail,
            data.hrName,
            data.surveyTitle,
            data.employeeCount
        );
    }

    private async processSurveyClosed(data: any): Promise<void> {
        await emailService.sendSurveyClosedNotification(
            data.surveyId,
            data.hrUserId,
            data.hrEmail,
            data.hrName,
            data.surveyTitle,
            data.responseCount
        );
    }

    private async processResponseNotification(data: any): Promise<void> {
        await emailService.sendResponseNotification(
            data.surveyId,
            data.responseId,
            data.hrUserId,
            data.hrEmail,
            data.hrName,
            data.employeeName,
            data.surveyTitle,
            data.responseCount
        );
    }

    private async processWelcomeEmail(data: any): Promise<void> {
        await emailService.sendWelcomeEmail(
            data.userId,
            data.userEmail,
            data.userName,
            data.userRole
        );
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getQueueStatus(): { length: number; processing: boolean } {
        return {
            length: this.queue.length,
            processing: this.processing
        };
    }

    stop(): void {
        this.processing = false;
    }
}

// Create singleton instance
const emailQueue = new EmailQueue();

// Rate limiting for email endpoints
const emailRateLimit = new Map<string, { count: number; resetTime: number }>();

export const emailRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req as any).userId || req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // Max 10 email requests per minute

    const userLimit = emailRateLimit.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
        emailRateLimit.set(userId, { count: 1, resetTime: now + windowMs });
    } else if (userLimit.count >= maxRequests) {
        return res.status(429).json({
            error: 'Too many email requests. Please try again later.',
            retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        });
    } else {
        userLimit.count++;
    }

    next();
};

// Middleware to queue email notifications
export const queueEmailNotification = (type: string, priority: number = 1) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const originalSend = res.json;

        res.json = function (data: any) {
            // Queue email notification after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    emailQueue.add({
                        type,
                        data: {
                            ...req.body,
                            userId: (req as any).userId,
                            timestamp: new Date().toISOString()
                        },
                        priority
                    });
                } catch (error) {
                    logger.error('Failed to queue email notification', {
                        type,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            return originalSend.call(this, data);
        };

        next();
    };
};

// Middleware to get queue status
export const getQueueStatus = (req: Request, res: Response): void => {
    res.json(emailQueue.getQueueStatus());
};

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('Shutting down email queue...');
    emailQueue.stop();
});

process.on('SIGINT', () => {
    logger.info('Shutting down email queue...');
    emailQueue.stop();
});

export default emailQueue;
