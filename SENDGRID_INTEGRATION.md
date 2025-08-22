# SendGrid Integration Guide
## AI HR Employee Engagement & Support Assistant

### 🎯 Overview
This document outlines the integration of SendGrid email service for automated notifications in the HR Assistant system. SendGrid will handle all email communications including survey notifications, response alerts, and system updates.

---

## 📧 Email Notification Types

### **HR Manager Notifications**
1. **Survey Response Alerts**
   - New employee survey submission
   - Survey completion milestones
   - Low response rate warnings
   - Survey deadline reminders

2. **System Activity Alerts**
   - New employee registrations
   - Bulk operations completion
   - System health issues
   - Daily/weekly activity summaries

3. **Feedback Notifications**
   - New employee feedback submission
   - Urgent issue escalations
   - Sentiment trend alerts
   - Anonymous feedback reports

### **Employee Notifications**
1. **Survey Invitations**
   - New survey availability
   - Survey reminder emails
   - Deadline approaching warnings
   - Thank you confirmations

2. **Account Notifications**
   - Welcome emails for new accounts
   - Password reset requests
   - Profile update confirmations
   - System maintenance notices

3. **HR Response Notifications**
   - Feedback acknowledgment
   - Survey results available
   - Policy update announcements
   - Training opportunity alerts

---

## 🔧 Technical Implementation

### **SendGrid Configuration**
```typescript
// config/email-config.ts
interface EmailConfig {
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
    templates: {
      surveyInvitation: string;
      surveyReminder: string;
      responseAlert: string;
      welcomeEmail: string;
      passwordReset: string;
      feedbackConfirmation: string;
    };
  };
  notifications: {
    hrManagers: string[];
    adminEmails: string[];
    supportEmail: string;
  };
}

export const emailConfig: EmailConfig = {
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY!,
    fromEmail: process.env.FROM_EMAIL || 'noreply@company.com',
    fromName: process.env.FROM_NAME || 'HR Assistant',
    replyToEmail: process.env.REPLY_TO_EMAIL || 'hr@company.com',
    templates: {
      surveyInvitation: 'd-1234567890abcdef',
      surveyReminder: 'd-abcdef1234567890',
      responseAlert: 'd-567890abcdef1234',
      welcomeEmail: 'd-cdef1234567890ab',
      passwordReset: 'd-90abcdef12345678',
      feedbackConfirmation: 'd-4567890abcdef12'
    }
  },
  notifications: {
    hrManagers: ['hr-manager@company.com'],
    adminEmails: ['admin@company.com'],
    supportEmail: 'support@company.com'
  }
};
```

### **Email Service Implementation**
```typescript
// services/email/email-service.ts
import sgMail from '@sendgrid/mail';
import { emailConfig } from '../../config/email-config';

export class EmailService {
  constructor() {
    sgMail.setApiKey(emailConfig.sendgrid.apiKey);
  }

  // Survey-related emails
  async sendSurveyInvitation(employee: Employee, survey: Survey): Promise<void> {
    const msg = {
      to: employee.email,
      from: {
        email: emailConfig.sendgrid.fromEmail,
        name: emailConfig.sendgrid.fromName
      },
      templateId: emailConfig.sendgrid.templates.surveyInvitation,
      dynamicTemplateData: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        surveyTitle: survey.title,
        surveyDescription: survey.description,
        surveyUrl: `${process.env.FRONTEND_URL}/surveys/${survey.id}`,
        dueDate: survey.endDate,
        language: employee.language
      }
    };

    await sgMail.send(msg);
    await this.logEmailSent('survey_invitation', employee.id, survey.id);
  }

  async sendSurveyReminder(employee: Employee, survey: Survey): Promise<void> {
    const msg = {
      to: employee.email,
      from: {
        email: emailConfig.sendgrid.fromEmail,
        name: emailConfig.sendgrid.fromName
      },
      templateId: emailConfig.sendgrid.templates.surveyReminder,
      dynamicTemplateData: {
        firstName: employee.firstName,
        surveyTitle: survey.title,
        surveyUrl: `${process.env.FRONTEND_URL}/surveys/${survey.id}`,
        daysRemaining: this.calculateDaysRemaining(survey.endDate),
        language: employee.language
      }
    };

    await sgMail.send(msg);
    await this.logEmailSent('survey_reminder', employee.id, survey.id);
  }

  // HR notification emails
  async notifyHROfSurveyResponse(response: SurveyResponse, survey: Survey): Promise<void> {
    const hrEmails = emailConfig.notifications.hrManagers;
    
    const msg = {
      to: hrEmails,
      from: {
        email: emailConfig.sendgrid.fromEmail,
        name: emailConfig.sendgrid.fromName
      },
      templateId: emailConfig.sendgrid.templates.responseAlert,
      dynamicTemplateData: {
        surveyTitle: survey.title,
        responseId: response.id,
        submissionTime: response.completedAt,
        isAnonymous: survey.isAnonymous,
        employeeName: survey.isAnonymous ? 'Anonymous' : `${response.user?.firstName} ${response.user?.lastName}`,
        dashboardUrl: `${process.env.FRONTEND_URL}/hr/surveys/${survey.id}/results`
      }
    };

    await sgMail.send(msg);
    await this.logEmailSent('response_alert', null, survey.id);
  }

  async notifyHROfFeedback(feedback: Feedback): Promise<void> {
    const hrEmails = emailConfig.notifications.hrManagers;
    
    const msg = {
      to: hrEmails,
      from: {
        email: emailConfig.sendgrid.fromEmail,
        name: emailConfig.sendgrid.fromName
      },
      subject: `New Employee Feedback: ${feedback.category}`,
      html: `
        <h2>New Employee Feedback Received</h2>
        <p><strong>Category:</strong> ${feedback.category}</p>
        <p><strong>Priority:</strong> ${feedback.priority}</p>
        <p><strong>Title:</strong> ${feedback.title}</p>
        <p><strong>Description:</strong> ${feedback.description}</p>
        <p><strong>Submitted by:</strong> ${feedback.isAnonymous ? 'Anonymous' : feedback.user?.email}</p>
        <p><strong>Submitted at:</strong> ${feedback.createdAt}</p>
        <p><a href="${process.env.FRONTEND_URL}/hr/feedback/${feedback.id}">View Feedback</a></p>
      `
    };

    await sgMail.send(msg);
    await this.logEmailSent('feedback_alert', feedback.userId, feedback.id);
  }

  // Account-related emails
  async sendWelcomeEmail(employee: Employee, temporaryPassword: string): Promise<void> {
    const msg = {
      to: employee.email,
      from: {
        email: emailConfig.sendgrid.fromEmail,
        name: emailConfig.sendgrid.fromName
      },
      templateId: emailConfig.sendgrid.templates.welcomeEmail,
      dynamicTemplateData: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
        temporaryPassword: temporaryPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        language: employee.language || 'en'
      }
    };

    await sgMail.send(msg);
    await this.logEmailSent('welcome_email', employee.id);
  }

  async sendPasswordResetEmail(employee: Employee, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const msg = {
      to: employee.email,
      from: {
        email: emailConfig.sendgrid.fromEmail,
        name: emailConfig.sendgrid.fromName
      },
      templateId: emailConfig.sendgrid.templates.passwordReset,
      dynamicTemplateData: {
        firstName: employee.firstName,
        resetUrl: resetUrl,
        expirationTime: '24 hours',
        language: employee.language
      }
    };

    await sgMail.send(msg);
    await this.logEmailSent('password_reset', employee.id);
  }

  // Utility methods
  private async logEmailSent(type: string, userId?: string, relatedId?: string): Promise<void> {
    // Log email sending to database for tracking
    await prisma.emailLog.create({
      data: {
        type,
        userId,
        relatedId,
        sentAt: new Date(),
        status: 'sent'
      }
    });
  }

  private calculateDaysRemaining(endDate: Date): number {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Batch operations
  async sendBulkSurveyInvitations(employees: Employee[], survey: Survey): Promise<void> {
    const emails = employees.map(employee => ({
      to: employee.email,
      from: {
        email: emailConfig.sendgrid.fromEmail,
        name: emailConfig.sendgrid.fromName
      },
      templateId: emailConfig.sendgrid.templates.surveyInvitation,
      dynamicTemplateData: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        surveyTitle: survey.title,
        surveyDescription: survey.description,
        surveyUrl: `${process.env.FRONTEND_URL}/surveys/${survey.id}`,
        dueDate: survey.endDate,
        language: employee.language
      }
    }));

    await sgMail.sendMultiple(emails);
    
    // Log bulk send
    for (const employee of employees) {
      await this.logEmailSent('survey_invitation', employee.id, survey.id);
    }
  }
}
```

### **Email Templates (SendGrid Dynamic Templates)**

#### **Survey Invitation Template**
```html
<!-- survey-invitation.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Survey Invitation</title>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f8f9fa; }
        .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Survey Available</h1>
        </div>
        <div class="content">
            {{#if (eq language "ar")}}
                <h2>مرحباً {{firstName}},</h2>
                <p>لديك استطلاع جديد متاح للمشاركة:</p>
                <h3>{{surveyTitle}}</h3>
                <p>{{surveyDescription}}</p>
                <p>يرجى إكمال الاستطلاع قبل {{dueDate}}</p>
                <a href="{{surveyUrl}}" class="button">ابدأ الاستطلاع</a>
            {{else}}
                <h2>Hello {{firstName}},</h2>
                <p>You have a new survey available to complete:</p>
                <h3>{{surveyTitle}}</h3>
                <p>{{surveyDescription}}</p>
                <p>Please complete the survey by {{dueDate}}</p>
                <a href="{{surveyUrl}}" class="button">Start Survey</a>
            {{/if}}
        </div>
        <div class="footer">
            <p>HR Assistant | Your Company Name</p>
            <p>If you have questions, please contact HR at hr@company.com</p>
        </div>
    </div>
</body>
</html>
```

#### **Response Alert Template (HR)**
```html
<!-- response-alert.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Survey Response Notification</title>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f8f9fa; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
        .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Survey Response</h1>
        </div>
        <div class="content">
            <h2>Survey Response Received</h2>
            <div class="info-box">
                <p><strong>Survey:</strong> {{surveyTitle}}</p>
                <p><strong>Response ID:</strong> {{responseId}}</p>
                <p><strong>Submitted by:</strong> {{employeeName}}</p>
                <p><strong>Submission Time:</strong> {{submissionTime}}</p>
                <p><strong>Type:</strong> {{#if isAnonymous}}Anonymous{{else}}Identified{{/if}}</p>
            </div>
            <a href="{{dashboardUrl}}" class="button">View Survey Results</a>
        </div>
    </div>
</body>
</html>
```

---

## 🔄 Automated Email Workflows

### **Survey Lifecycle Emails**
```typescript
// services/email/survey-email-workflow.ts
export class SurveyEmailWorkflow {
  private emailService: EmailService;
  private schedulerService: SchedulerService;

  constructor() {
    this.emailService = new EmailService();
    this.schedulerService = new SchedulerService();
  }

  async startSurveyWorkflow(survey: Survey): Promise<void> {
    // Get target employees
    const employees = await this.getTargetEmployees(survey);

    // Send initial invitations
    await this.emailService.sendBulkSurveyInvitations(employees, survey);

    // Schedule reminder emails
    await this.scheduleReminders(survey, employees);

    // Schedule completion notifications
    await this.scheduleCompletionNotifications(survey);
  }

  private async scheduleReminders(survey: Survey, employees: Employee[]): Promise<void> {
    const reminderDates = this.calculateReminderDates(survey.startDate!, survey.endDate!);

    for (const reminderDate of reminderDates) {
      await this.schedulerService.schedule(
        'survey-reminder',
        reminderDate,
        { surveyId: survey.id, employeeIds: employees.map(e => e.id) }
      );
    }
  }

  private async scheduleCompletionNotifications(survey: Survey): Promise<void> {
    // Schedule daily completion rate notifications for HR
    const startDate = survey.startDate!;
    const endDate = survey.endDate!;
    
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      await this.schedulerService.schedule(
        'survey-completion-report',
        new Date(date.getTime() + 18 * 60 * 60 * 1000), // 6 PM daily
        { surveyId: survey.id }
      );
    }
  }

  private calculateReminderDates(startDate: Date, endDate: Date): Date[] {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const reminders: Date[] = [];

    if (totalDays > 7) {
      // Send reminder at 50% and 80% of survey duration
      reminders.push(new Date(startDate.getTime() + (totalDays * 0.5) * 24 * 60 * 60 * 1000));
      reminders.push(new Date(startDate.getTime() + (totalDays * 0.8) * 24 * 60 * 60 * 1000));
    } else if (totalDays > 3) {
      // Send reminder 2 days before closing
      reminders.push(new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000));
    }

    return reminders;
  }
}
```

### **Real-time Notification System**
```typescript
// services/email/notification-system.ts
export class NotificationSystem {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // Survey response notifications
  async handleSurveyResponse(response: SurveyResponse): Promise<void> {
    const survey = await prisma.survey.findUnique({
      where: { id: response.surveyId },
      include: { createdBy: true }
    });

    if (!survey) return;

    // Notify HR immediately
    await this.emailService.notifyHROfSurveyResponse(response, survey);

    // Check if this is a milestone response
    await this.checkSurveyMilestones(survey);
  }

  // Feedback notifications
  async handleFeedbackSubmission(feedback: Feedback): Promise<void> {
    await this.emailService.notifyHROfFeedback(feedback);

    // Send confirmation to employee if not anonymous
    if (!feedback.isAnonymous && feedback.user) {
      await this.emailService.sendFeedbackConfirmation(feedback.user, feedback);
    }

    // Check for urgent priority
    if (feedback.priority === 'URGENT') {
      await this.sendUrgentAlert(feedback);
    }
  }

  // Account notifications
  async handleNewUserCreation(user: User, temporaryPassword: string): Promise<void> {
    await this.emailService.sendWelcomeEmail(user, temporaryPassword);
  }

  async handlePasswordReset(user: User, resetToken: string): Promise<void> {
    await this.emailService.sendPasswordResetEmail(user, resetToken);
  }

  private async checkSurveyMilestones(survey: Survey): Promise<void> {
    const stats = await this.calculateSurveyStats(survey.id);
    
    // Notify at 25%, 50%, 75% completion rates
    const milestones = [25, 50, 75];
    
    for (const milestone of milestones) {
      if (Math.floor(stats.responseRate) === milestone) {
        await this.sendMilestoneNotification(survey, milestone, stats);
      }
    }
  }

  private async sendUrgentAlert(feedback: Feedback): Promise<void> {
    const urgentContacts = emailConfig.notifications.adminEmails;
    
    // Send immediate SMS/email alert for urgent issues
    // Implementation depends on specific urgent contact preferences
  }
}
```

---

## 📊 Email Analytics & Tracking

### **Email Metrics Tracking**
```typescript
// models/email-log.ts (Prisma schema addition)
model EmailLog {
  id        String   @id @default(cuid())
  type      String   // 'survey_invitation', 'reminder', 'response_alert'
  userId    String?
  relatedId String?  // Survey ID, Feedback ID, etc.
  email     String
  status    EmailStatus @default(SENT)
  sentAt    DateTime @default(now())
  openedAt  DateTime?
  clickedAt DateTime?
  
  // Relations
  user      User?    @relation(fields: [userId], references: [id])
  
  @@map("email_logs")
}

enum EmailStatus {
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
}
```

### **Email Performance Dashboard**
```typescript
// services/email/email-analytics.ts
export class EmailAnalytics {
  async getEmailMetrics(startDate: Date, endDate: Date): Promise<EmailMetrics> {
    const logs = await prisma.emailLog.findMany({
      where: {
        sentAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return {
      totalSent: logs.length,
      deliveryRate: this.calculateDeliveryRate(logs),
      openRate: this.calculateOpenRate(logs),
      clickRate: this.calculateClickRate(logs),
      bounceRate: this.calculateBounceRate(logs),
      byType: this.groupByType(logs)
    };
  }

  async getSurveyEmailEffectiveness(surveyId: string): Promise<SurveyEmailStats> {
    const invitations = await prisma.emailLog.findMany({
      where: {
        type: 'survey_invitation',
        relatedId: surveyId
      }
    });

    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId }
    });

    return {
      invitationsSent: invitations.length,
      responsesReceived: responses.length,
      responseRate: (responses.length / invitations.length) * 100,
      avgResponseTime: this.calculateAvgResponseTime(invitations, responses)
    };
  }
}
```

---

## 🔧 Environment Configuration

### **Required Environment Variables**
```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.your-api-key-here
FROM_EMAIL=noreply@company.com
FROM_NAME=HR Assistant
REPLY_TO_EMAIL=hr@company.com

# Email Template IDs (from SendGrid)
TEMPLATE_SURVEY_INVITATION=d-1234567890abcdef
TEMPLATE_SURVEY_REMINDER=d-abcdef1234567890
TEMPLATE_RESPONSE_ALERT=d-567890abcdef1234
TEMPLATE_WELCOME_EMAIL=d-cdef1234567890ab
TEMPLATE_PASSWORD_RESET=d-90abcdef12345678
TEMPLATE_FEEDBACK_CONFIRMATION=d-4567890abcdef12

# Notification Recipients
HR_MANAGER_EMAILS=hr-manager1@company.com,hr-manager2@company.com
ADMIN_EMAILS=admin@company.com
SUPPORT_EMAIL=support@company.com

# Frontend URLs
FRONTEND_URL=http://localhost:5173
```

### **Package Dependencies**
```json
{
  "dependencies": {
    "@sendgrid/mail": "^7.7.0",
    "email-templates": "^11.1.1",
    "handlebars": "^4.7.8",
    "node-cron": "^3.0.2"
  },
  "devDependencies": {
    "@types/node-cron": "^3.0.8"
  }
}
```

---

## 🧪 Testing Email Integration

### **Email Service Tests**
```typescript
// tests/services/email-service.test.ts
describe('EmailService', () => {
  let emailService: EmailService;
  let mockSgMail: jest.Mocked<typeof sgMail>;

  beforeEach(() => {
    emailService = new EmailService();
    mockSgMail = sgMail as jest.Mocked<typeof sgMail>;
  });

  describe('sendSurveyInvitation', () => {
    it('should send survey invitation email', async () => {
      const employee = createMockEmployee();
      const survey = createMockSurvey();

      await emailService.sendSurveyInvitation(employee, survey);

      expect(mockSgMail.send).toHaveBeenCalledWith({
        to: employee.email,
        from: expect.objectContaining({
          email: emailConfig.sendgrid.fromEmail
        }),
        templateId: emailConfig.sendgrid.templates.surveyInvitation,
        dynamicTemplateData: expect.objectContaining({
          firstName: employee.firstName,
          surveyTitle: survey.title
        })
      });
    });
  });

  describe('notifyHROfSurveyResponse', () => {
    it('should notify HR managers of new survey response', async () => {
      const response = createMockSurveyResponse();
      const survey = createMockSurvey();

      await emailService.notifyHROfSurveyResponse(response, survey);

      expect(mockSgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailConfig.notifications.hrManagers
        })
      );
    });
  });
});
```

This comprehensive SendGrid integration provides automated email notifications for all key system events, ensuring HR managers stay informed about survey responses and system activity while keeping employees engaged with timely notifications.
