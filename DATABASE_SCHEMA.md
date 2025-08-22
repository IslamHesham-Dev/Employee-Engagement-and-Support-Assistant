# Database Schema Design
## AI HR Employee Engagement & Support Assistant

### 🗄️ Database Overview
**Primary Database**: PostgreSQL 15.x  
**ORM**: Prisma  
**Vector Database**: Chroma/Qdrant (for AI embeddings)  
**Cache**: Redis  

---

## 📊 Entity Relationship Overview

### **Core Entities**
1. **Users** - HR managers and employees
2. **Departments** - Organizational structure
3. **Surveys** - Employee feedback surveys
4. **Questions** - Survey questions and types
5. **Responses** - Employee survey responses
6. **Conversations** - Chatbot conversation history
7. **Messages** - Individual chat messages
8. **Documents** - Knowledge base content
9. **Analytics** - Aggregated metrics and insights

---

## 🏗️ Prisma Schema Definition

```prisma
// This is your Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  employeeId  String   @unique
  firstName   String
  lastName    String
  password    String
  role        UserRole @default(EMPLOYEE)
  status      UserStatus @default(ACTIVE)
  language    Language @default(ENGLISH)
  avatar      String?
  phone       String?
  position    String?
  startDate   DateTime?
  lastLogin   DateTime?
  
  // Relations
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  managerId    String?
  manager      User?       @relation("EmployeeManager", fields: [managerId], references: [id])
  subordinates User[]      @relation("EmployeeManager")
  
  // Activity Relations
  surveyResponses     SurveyResponse[]
  conversations       Conversation[]
  messages           Message[]
  feedbackSubmissions Feedback[]
  createdSurveys     Survey[]
  auditLogs          AuditLog[]
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}

model Department {
  id          String @id @default(cuid())
  name        String @unique
  description String?
  code        String @unique
  
  // Relations
  users    User[]
  surveys  Survey[]
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("departments")
}

enum UserRole {
  ADMIN
  SUPER_ADMIN
  HR_MANAGER
  HR_COORDINATOR
  EMPLOYEE
}

enum UserStatus {
  ACTIVE
  INACTIVE
  TERMINATED
}

enum Language {
  ENGLISH
  ARABIC
}

// ============================================================================
// SURVEY MANAGEMENT
// ============================================================================

model Survey {
  id          String      @id @default(cuid())
  title       String
  description String?
  status      SurveyStatus @default(DRAFT)
  isAnonymous Boolean     @default(false)
  startDate   DateTime?
  endDate     DateTime?
  
  // Settings
  allowMultipleResponses Boolean @default(false)
  showProgressBar       Boolean @default(true)
  randomizeQuestions    Boolean @default(false)
  
  // Targeting
  targetAllEmployees Boolean @default(true)
  targetDepartments  String[] // Array of department IDs
  targetUsers        String[] // Array of user IDs
  
  // Relations
  createdById String
  createdBy   User   @relation(fields: [createdById], references: [id])
  
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  
  questions SurveyQuestion[]
  responses SurveyResponse[]
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("surveys")
}

model SurveyQuestion {
  id       String       @id @default(cuid())
  text     String
  type     QuestionType
  required Boolean      @default(false)
  order    Int
  
  // Question-specific settings
  options  String[] // For multiple choice questions
  minValue Int?     // For rating scales
  maxValue Int?     // For rating scales
  
  // Conditional logic
  dependsOnQuestionId String?
  dependsOnQuestion   SurveyQuestion? @relation("QuestionDependency", fields: [dependsOnQuestionId], references: [id])
  dependentQuestions  SurveyQuestion[] @relation("QuestionDependency")
  dependsOnValue      String?
  
  // Relations
  surveyId String
  survey   Survey @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  
  responses QuestionResponse[]
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("survey_questions")
}

model SurveyResponse {
  id         String   @id @default(cuid())
  isComplete Boolean  @default(false)
  ipAddress  String?
  userAgent  String?
  
  // Relations
  surveyId String
  survey   Survey @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  
  userId String?
  user   User?   @relation(fields: [userId], references: [id])
  
  responses QuestionResponse[]
  
  // Timestamps
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@map("survey_responses")
}

model QuestionResponse {
  id     String @id @default(cuid())
  value  String
  
  // Relations
  questionId String
  question   SurveyQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  responseId String
  response   SurveyResponse @relation(fields: [responseId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([questionId, responseId])
  @@map("question_responses")
}

enum SurveyStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

enum QuestionType {
  TEXT
  TEXTAREA
  MULTIPLE_CHOICE
  CHECKBOX
  RATING_SCALE
  YES_NO
  DATE
  NUMBER
}

// ============================================================================
// CHATBOT & CONVERSATIONS
// ============================================================================

model Conversation {
  id        String            @id @default(cuid())
  title     String?
  status    ConversationStatus @default(ACTIVE)
  language  Language          @default(ENGLISH)
  
  // Relations
  userId String
  user   User   @relation(fields: [userId], references: [id])
  
  messages Message[]
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("conversations")
}

model Message {
  id       String      @id @default(cuid())
  content  String
  role     MessageRole
  metadata Json?       // Store additional AI metadata
  
  // AI-specific fields
  intent          String?
  confidence      Float?
  sentimentScore  Float?
  sentimentLabel  String?
  responseTime    Int?    // Response time in milliseconds
  
  // Relations
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  userId String
  user   User   @relation(fields: [userId], references: [id])
  
  // Timestamps
  createdAt DateTime @default(now())
  
  @@map("messages")
}

enum ConversationStatus {
  ACTIVE
  RESOLVED
  ESCALATED
  ARCHIVED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// ============================================================================
// KNOWLEDGE BASE
// ============================================================================

model Document {
  id          String         @id @default(cuid())
  title       String
  content     String
  type        DocumentType
  category    String
  tags        String[]
  language    Language       @default(ENGLISH)
  status      DocumentStatus @default(ACTIVE)
  version     Int            @default(1)
  
  // File information
  filename    String?
  mimeType    String?
  fileSize    Int?
  checksum    String?
  
  // Metadata
  metadata    Json?
  
  // Vector embeddings (stored in vector database)
  embeddingId String? @unique
  
  // Relations
  parentId String?
  parent   Document? @relation("DocumentVersion", fields: [parentId], references: [id])
  versions Document[] @relation("DocumentVersion")
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  expiresAt DateTime?
  
  @@map("documents")
}

enum DocumentType {
  POLICY
  PROCEDURE
  FAQ
  HANDBOOK
  FORM
  ANNOUNCEMENT
  OTHER
}

enum DocumentStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  EXPIRED
}

// ============================================================================
// FEEDBACK & COMMUNICATION
// ============================================================================

model Feedback {
  id          String         @id @default(cuid())
  title       String
  description String
  category    FeedbackCategory
  priority    Priority       @default(MEDIUM)
  status      FeedbackStatus @default(SUBMITTED)
  isAnonymous Boolean        @default(false)
  
  // Relations
  userId String?
  user   User?   @relation(fields: [userId], references: [id])
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  resolvedAt DateTime?
  
  @@map("feedback")
}

enum FeedbackCategory {
  WORKPLACE
  MANAGEMENT
  POLICIES
  BENEFITS
  TECHNOLOGY
  TRAINING
  OTHER
}

enum FeedbackStatus {
  SUBMITTED
  IN_REVIEW
  IN_PROGRESS
  RESOLVED
  REJECTED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

model Analytics {
  id     String        @id @default(cuid())
  type   AnalyticsType
  period String        // e.g., "2024-01", "2024-01-15"
  data   Json          // Flexible storage for various metrics
  
  // Relations
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([type, period, departmentId])
  @@map("analytics")
}

enum AnalyticsType {
  ENGAGEMENT_SCORE
  SURVEY_PARTICIPATION
  CHATBOT_USAGE
  SENTIMENT_TRENDS
  RESPONSE_RATES
  TOP_QUERIES
  USER_ACTIVITY
}

// ============================================================================
// SYSTEM & AUDIT
// ============================================================================

model AuditLog {
  id       String    @id @default(cuid())
  action   String
  entity   String
  entityId String
  oldData  Json?
  newData  Json?
  
  // Relations
  userId String?
  user   User?   @relation(fields: [userId], references: [id])
  
  // Additional context
  ipAddress String?
  userAgent String?
  
  // Timestamps
  createdAt DateTime @default(now())
  
  @@map("audit_logs")
}

model SystemConfig {
  id    String @id @default(cuid())
  key   String @unique
  value Json
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("system_config")
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

model Notification {
  id      String           @id @default(cuid())
  title   String
  message String
  type    NotificationType
  status  NotificationStatus @default(PENDING)
  
  // Targeting
  userId String?
  user   User?   @relation(fields: [userId], references: [id])
  
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  
  // Scheduling
  scheduledFor DateTime?
  sentAt       DateTime?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("notifications")
}

enum NotificationType {
  SURVEY_INVITATION
  SURVEY_REMINDER
  SYSTEM_UPDATE
  POLICY_UPDATE
  GENERAL
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  CANCELLED
}
```

---

## 🔗 Key Relationships

### **User Management**
- Users belong to Departments (many-to-one)
- Users can have Managers (self-referential)
- Users have Roles and Status for access control

### **Survey System**
- Surveys contain multiple Questions (one-to-many)
- Questions can depend on other Questions (conditional logic)
- Users submit Responses to Surveys (many-to-many through SurveyResponse)
- Each Response contains answers to Questions (QuestionResponse)

### **Chatbot System**
- Users have Conversations (one-to-many)
- Conversations contain Messages (one-to-many)
- Messages store AI metadata (intent, sentiment, confidence)

### **Knowledge Base**
- Documents can have versions (self-referential)
- Documents support multiple languages
- Vector embeddings stored separately for AI retrieval

### **Analytics**
- Analytics can be global or department-specific
- Flexible JSON storage for different metric types
- Time-series data with period-based indexing

---

## 📊 Database Indexes

### **Primary Indexes**
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Survey performance
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_created_by ON surveys(created_by_id);
CREATE INDEX idx_surveys_dates ON surveys(start_date, end_date);

-- Message and conversation lookups
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Analytics queries
CREATE INDEX idx_analytics_type_period ON analytics(type, period);
CREATE INDEX idx_analytics_department ON analytics(department_id);

-- Document search
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_language ON documents(language);
```

### **Composite Indexes**
```sql
-- Survey targeting
CREATE INDEX idx_survey_responses_survey_user ON survey_responses(survey_id, user_id);

-- Analytics time-series
CREATE INDEX idx_analytics_dept_type_period ON analytics(department_id, type, period);

-- Audit trail
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
```

---

## 🗃️ Data Seeding Strategy

### **Initial System Data**
```sql
-- Default departments
INSERT INTO departments (id, name, code) VALUES
  ('dept_1', 'Human Resources', 'HR'),
  ('dept_2', 'Information Technology', 'IT'),
  ('dept_3', 'Finance', 'FIN'),
  ('dept_4', 'Marketing', 'MKT'),
  ('dept_5', 'Operations', 'OPS');

-- Admin user (manages HR/Employee accounts only)
INSERT INTO users (id, email, employee_id, first_name, last_name, role, status) VALUES
  ('admin_1', 'admin@company.com', 'EMP_0001', 'System', 'Admin', 'ADMIN', 'ACTIVE');

-- Super Admin user (full system access)
INSERT INTO users (id, email, employee_id, first_name, last_name, role, status) VALUES
  ('super_admin_1', 'superadmin@company.com', 'EMP_0000', 'System', 'SuperAdmin', 'SUPER_ADMIN', 'ACTIVE');

-- Default system configurations
INSERT INTO system_config (key, value) VALUES
  ('app_name', '"HR Assistant"'),
  ('default_language', '"ENGLISH"'),
  ('session_timeout', '28800'),
  ('max_file_size', '10485760'),
  ('supported_languages', '["ENGLISH", "ARABIC"]');
```

### **Sample Survey Templates**
```sql
-- Employee satisfaction survey template
INSERT INTO surveys (id, title, description, status, created_by_id) VALUES
  ('survey_template_1', 'Employee Satisfaction Survey', 'Quarterly employee satisfaction assessment', 'DRAFT', 'admin_1');

-- Sample questions for the template
INSERT INTO survey_questions (id, survey_id, text, type, required, "order") VALUES
  ('q1', 'survey_template_1', 'How satisfied are you with your current role?', 'RATING_SCALE', true, 1),
  ('q2', 'survey_template_1', 'What aspects of your job do you enjoy most?', 'TEXTAREA', false, 2),
  ('q3', 'survey_template_1', 'Would you recommend this company as a great place to work?', 'YES_NO', true, 3);
```

---

## 🔐 Security Considerations

### **Data Protection**
- All passwords hashed with bcrypt (minimum 12 rounds)
- Sensitive PII fields encrypted at rest
- API tokens and secrets stored in secure vault
- Database connections use SSL/TLS

### **Access Control**
- Row-level security for multi-tenant data
- Audit logging for all data modifications
- Role-based access control (RBAC)
- API rate limiting per user/IP

### **Privacy**
- Anonymous survey responses not linked to users
- GDPR compliance with data retention policies
- User data export and deletion capabilities
- Consent tracking for data processing

---

## 📈 Performance Optimization

### **Query Optimization**
- Proper indexing for all foreign keys
- Pagination for large result sets
- Query result caching with Redis
- Database connection pooling

### **Data Archival**
- Automated archival of old survey responses
- Log rotation for audit trails
- Document version cleanup
- Analytics data aggregation

### **Monitoring**
- Query performance monitoring
- Database size and growth tracking
- Index usage analysis
- Connection pool metrics

---

## 🔄 Backup and Recovery

### **Backup Strategy**
- Daily full database backups
- Hourly incremental backups
- Point-in-time recovery capability
- Cross-region backup replication

### **Recovery Procedures**
- Automated backup verification
- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 1 hour
- Disaster recovery testing quarterly 