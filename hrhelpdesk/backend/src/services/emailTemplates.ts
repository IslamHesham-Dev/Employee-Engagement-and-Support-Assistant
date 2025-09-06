import { EmailTemplate, EmailTemplateData } from '../types/emailTypes';
import config from '../config';

export function generateEmailTemplate(template: EmailTemplate, data: EmailTemplateData): string {
    const baseTemplate = getBaseTemplate();

    switch (template.type) {
        case 'survey_invitation':
            return generateSurveyInvitationTemplate(data, baseTemplate);
        case 'survey_published':
            return generateSurveyPublishedTemplate(data, baseTemplate);
        case 'survey_closed':
            return generateSurveyClosedTemplate(data, baseTemplate);
        case 'response_notification':
            return generateResponseNotificationTemplate(data, baseTemplate);
        case 'welcome':
            return generateWelcomeTemplate(data, baseTemplate);
        default:
            return generateDefaultTemplate(data, baseTemplate);
    }
}

function getBaseTemplate(): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>iScore HR HelpDesk</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 300;
        }
        .content {
          padding: 30px 20px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: 500;
        }
        .button:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .highlight {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .stats {
          background-color: #e9ecef;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .stats strong {
          color: #495057;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>iScore HR HelpDesk</h1>
        </div>
        <div class="content">
          {{CONTENT}}
        </div>
        <div class="footer">
          <p>© 2024 ${config.companyName}. All rights reserved.</p>
          <p>This email was sent from an automated system. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSurveyInvitationTemplate(data: EmailTemplateData, baseTemplate: string): string {
    const content = `
    <h2>Survey Invitation</h2>
    <p>Dear ${data.userName},</p>
    
    <p>You have been invited to participate in a survey that will help us improve our workplace environment and employee experience.</p>
    
    <div class="highlight">
      <h3>${data.surveyTitle}</h3>
      ${data.surveyDescription ? `<p>${data.surveyDescription}</p>` : ''}
    </div>
    
    <p>Your feedback is valuable to us and will help shape the future of our organization. The survey should take approximately 5-10 minutes to complete.</p>
    
    <div style="text-align: center;">
      <a href="${data.surveyUrl}" class="button">Take Survey Now</a>
    </div>
    
    <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${data.surveyUrl}</p>
    
    <p>Thank you for your participation!</p>
    
    <p>Best regards,<br>
    The HR Team<br>
    ${config.companyName}</p>
  `;

    return baseTemplate.replace('{{CONTENT}}', content);
}

function generateSurveyPublishedTemplate(data: EmailTemplateData, baseTemplate: string): string {
    const content = `
    <h2>Survey Published Successfully</h2>
    <p>Dear ${data.userName},</p>
    
    <p>Your survey has been successfully published and is now available to employees.</p>
    
    <div class="highlight">
      <h3>${data.surveyTitle}</h3>
    </div>
    
    <div class="stats">
      <p><strong>Target Employees:</strong> ${data.employeeCount}</p>
      <p><strong>Status:</strong> Active</p>
      <p><strong>Published:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    
    <p>You can monitor responses and view results through the HR dashboard.</p>
    
    <div style="text-align: center;">
      <a href="${data.surveyUrl}" class="button">View Survey Dashboard</a>
    </div>
    
    <p>Best regards,<br>
    ${config.companyName} HR HelpDesk</p>
  `;

    return baseTemplate.replace('{{CONTENT}}', content);
}

function generateSurveyClosedTemplate(data: EmailTemplateData, baseTemplate: string): string {
    const content = `
    <h2>Survey Closed</h2>
    <p>Dear ${data.userName},</p>
    
    <p>Your survey has been closed and is no longer accepting responses.</p>
    
    <div class="highlight">
      <h3>${data.surveyTitle}</h3>
    </div>
    
    <div class="stats">
      <p><strong>Total Responses:</strong> ${data.responseCount}</p>
      <p><strong>Status:</strong> Closed</p>
      <p><strong>Closed:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    
    <p>You can now view the complete results and analytics for this survey.</p>
    
    <div style="text-align: center;">
      <a href="${data.surveyUrl}" class="button">View Survey Results</a>
    </div>
    
    <p>Best regards,<br>
    ${config.companyName} HR HelpDesk</p>
  `;

    return baseTemplate.replace('{{CONTENT}}', content);
}

function generateResponseNotificationTemplate(data: EmailTemplateData, baseTemplate: string): string {
    const content = `
    <h2>New Survey Response Received</h2>
    <p>Dear ${data.userName},</p>
    
    <p>A new response has been submitted for your survey.</p>
    
    <div class="highlight">
      <h3>${data.surveyTitle}</h3>
      <p><strong>Employee:</strong> ${data.employeeName}</p>
    </div>
    
    <div class="stats">
      <p><strong>Total Responses:</strong> ${data.responseCount}</p>
      <p><strong>Response Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <p>You can view the detailed response and overall survey analytics.</p>
    
    <div style="text-align: center;">
      <a href="${data.surveyUrl}" class="button">View Survey Results</a>
    </div>
    
    <p>Best regards,<br>
    ${config.companyName} HR HelpDesk</p>
  `;

    return baseTemplate.replace('{{CONTENT}}', content);
}

function generateWelcomeTemplate(data: EmailTemplateData, baseTemplate: string): string {
    const content = `
    <h2>Welcome to ${config.companyName} HR HelpDesk</h2>
    <p>Dear ${data.userName},</p>
    
    <p>Welcome to the ${config.companyName} HR HelpDesk platform! We're excited to have you on board.</p>
    
    <div class="highlight">
      <p><strong>Your Role:</strong> ${data.userRole}</p>
      <p><strong>Account Status:</strong> Active</p>
    </div>
    
    <p>With your account, you can:</p>
    <ul>
      ${data.userRole === 'HR' ? `
        <li>Create and manage employee surveys</li>
        <li>View survey results and analytics</li>
        <li>Monitor employee engagement</li>
        <li>Access HR dashboard and reports</li>
      ` : `
        <li>Participate in employee surveys</li>
        <li>Submit feedback and suggestions</li>
        <li>Access company policies and resources</li>
        <li>View your survey history</li>
      `}
    </ul>
    
    <div style="text-align: center;">
      <a href="${data.loginUrl}" class="button">Access Your Dashboard</a>
    </div>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact the HR team.</p>
    
    <p>Best regards,<br>
    The HR Team<br>
    ${config.companyName}</p>
  `;

    return baseTemplate.replace('{{CONTENT}}', content);
}

function generateDefaultTemplate(data: EmailTemplateData, baseTemplate: string): string {
    const content = `
    <h2>Notification from ${config.companyName}</h2>
    <p>Dear ${data.userName || 'User'},</p>
    
    <p>You have received a notification from the ${config.companyName} HR HelpDesk system.</p>
    
    <div class="highlight">
      <p>Please log in to your dashboard to view the complete details.</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${data.loginUrl || config.frontendUrl}" class="button">Access Dashboard</a>
    </div>
    
    <p>Best regards,<br>
    ${config.companyName} HR HelpDesk</p>
  `;

    return baseTemplate.replace('{{CONTENT}}', content);
}
