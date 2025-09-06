export interface EmailTemplate {
    type: EmailTemplateType;
    name: string;
}

export interface EmailData {
    to: string;
    subject: string;
    data: EmailTemplateData;
}

export interface EmailTemplateData {
    userId?: string;
    relatedId?: string;
    userName?: string;
    userRole?: string;
    surveyTitle?: string;
    surveyDescription?: string;
    surveyUrl?: string;
    responseUrl?: string;
    employeeName?: string;
    employeeCount?: number;
    responseCount?: number;
    loginUrl?: string;
    type: EmailTemplateType;
}

export interface EmailLogData {
    type: string;
    userId?: string;
    relatedId?: string;
    email: string;
    status: 'SENT' | 'FAILED' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED';
    sendGridResponse?: any;
    error?: string;
}

export type EmailTemplateType =
    | 'survey_invitation'
    | 'survey_published'
    | 'survey_closed'
    | 'response_notification'
    | 'welcome'
    | 'reminder'
    | 'system_update';

export interface SendGridResponse {
    headers: Record<string, string>;
    statusCode: number;
    body: any;
}
