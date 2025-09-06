import { EmailTemplateData } from '../types/emailTypes';

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitize email content to prevent injection attacks
 */
export function sanitizeEmailContent(content: string): string {
    return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}

/**
 * Format email template data for logging
 */
export function formatEmailDataForLogging(data: EmailTemplateData): Record<string, any> {
    const { userId, relatedId, userName, userRole, surveyTitle, employeeName, ...rest } = data;

    return {
        userId: userId ? `${userId.substring(0, 8)}...` : undefined,
        relatedId: relatedId ? `${relatedId.substring(0, 8)}...` : undefined,
        userName,
        userRole,
        surveyTitle,
        employeeName,
        type: data.type,
        hasSurveyUrl: !!rest.surveyUrl,
        hasResponseUrl: !!rest.responseUrl
    };
}

/**
 * Generate email tracking pixel URL
 */
export function generateTrackingPixelUrl(emailLogId: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/api/email/track/${emailLogId}.png`;
}

/**
 * Generate email unsubscribe URL
 */
export function generateUnsubscribeUrl(userId: string, emailType: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const token = Buffer.from(`${userId}:${emailType}:${Date.now()}`).toString('base64');
    return `${baseUrl}/unsubscribe?token=${token}`;
}

/**
 * Format email statistics for display
 */
export function formatEmailStats(stats: any): Record<string, any> {
    const formatted: Record<string, any> = {};

    Object.keys(stats).forEach(status => {
        formatted[status] = {};
        Object.keys(stats[status]).forEach(type => {
            formatted[status][type] = {
                count: stats[status][type],
                percentage: 0 // Will be calculated if total is provided
            };
        });
    });

    return formatted;
}

/**
 * Calculate email delivery rate
 */
export function calculateDeliveryRate(stats: any): number {
    const total = Object.values(stats).reduce((sum: number, status: any) => {
        return sum + Object.values(status).reduce((s: number, count: any) => s + count, 0);
    }, 0);

    const delivered = stats.SENT?.survey_invitation || 0;

    return total > 0 ? (delivered / total) * 100 : 0;
}

/**
 * Generate email preview HTML
 */
export function generateEmailPreview(templateData: EmailTemplateData): string {
    const preview = `
    <div style="border: 1px solid #ddd; padding: 20px; margin: 20px; max-width: 600px;">
      <h3>Email Preview</h3>
      <p><strong>Type:</strong> ${templateData.type}</p>
      <p><strong>User:</strong> ${templateData.userName || 'N/A'}</p>
      ${templateData.surveyTitle ? `<p><strong>Survey:</strong> ${templateData.surveyTitle}</p>` : ''}
      ${templateData.employeeName ? `<p><strong>Employee:</strong> ${templateData.employeeName}</p>` : ''}
      ${templateData.surveyUrl ? `<p><strong>Survey URL:</strong> ${templateData.surveyUrl}</p>` : ''}
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>
  `;

    return preview;
}

/**
 * Validate email template data
 */
export function validateEmailTemplateData(data: EmailTemplateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.type) {
        errors.push('Email type is required');
    }

    if (data.type === 'survey_invitation' && !data.surveyTitle) {
        errors.push('Survey title is required for survey invitations');
    }

    if (data.type === 'response_notification' && !data.employeeName) {
        errors.push('Employee name is required for response notifications');
    }

    if (data.type === 'welcome' && !data.userName) {
        errors.push('User name is required for welcome emails');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Generate email subject line based on template type
 */
export function generateEmailSubject(type: string, data: EmailTemplateData): string {
    const companyName = process.env.COMPANY_NAME || 'iScore';

    switch (type) {
        case 'survey_invitation':
            return `Survey Invitation: ${data.surveyTitle}`;
        case 'survey_published':
            return `Survey Published: ${data.surveyTitle}`;
        case 'survey_closed':
            return `Survey Closed: ${data.surveyTitle}`;
        case 'response_notification':
            return `New Survey Response: ${data.surveyTitle}`;
        case 'welcome':
            return `Welcome to ${companyName} HR HelpDesk`;
        default:
            return `Notification from ${companyName}`;
    }
}

/**
 * Extract email metadata for analytics
 */
export function extractEmailMetadata(data: EmailTemplateData): Record<string, any> {
    return {
        templateType: data.type,
        hasSurvey: !!data.surveyTitle,
        hasEmployee: !!data.employeeName,
        hasUser: !!data.userName,
        hasUrls: !!(data.surveyUrl || data.responseUrl),
        timestamp: new Date().toISOString()
    };
}
