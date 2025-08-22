# API Documentation
## AI HR Employee Engagement & Support Assistant

### 🌐 API Overview
**Base URL**: `http://localhost:3000/api/v1`  
**Authentication**: JWT Bearer Token  
**Content Type**: `application/json`  
**API Version**: 1.0  

---

## 🔐 Authentication

### **Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "user@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE",
      "departmentId": "dept_1",
      "language": "ENGLISH"
    }
  },
  "message": "Login successful"
}
```

### **Refresh Token**
```http
POST /auth/refresh
Authorization: Bearer {refreshToken}
```

### **Logout**
```http
POST /auth/logout
Authorization: Bearer {token}
```

---

## 👥 User Management

### **Get Current User Profile**
```http
GET /users/profile
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@company.com",
    "employeeId": "EMP_001",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "status": "ACTIVE",
    "language": "ENGLISH",
    "phone": "+1234567890",
    "position": "Software Developer",
    "startDate": "2023-01-15T00:00:00.000Z",
    "department": {
      "id": "dept_1",
      "name": "Information Technology",
      "code": "IT"
    },
    "manager": {
      "id": "mgr_123",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com"
    }
  }
}
```

### **Update User Profile**
```http
PUT /users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+1234567890",
  "language": "ARABIC"
}
```

### **Change Password**
```http
PUT /users/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

### **Get All Users (HR Only)**
```http
GET /users?page=1&limit=20&search=john&department=IT&status=ACTIVE
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by name, email, or employee ID
- `department`: Filter by department ID or code
- `status`: Filter by user status (ACTIVE, INACTIVE, TERMINATED)
- `role`: Filter by user role

### **Create User (HR Only)**
```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newuser@company.com",
  "employeeId": "EMP_002",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "EMPLOYEE",
  "departmentId": "dept_1",
  "position": "Data Analyst",
  "startDate": "2024-01-15",
  "managerId": "mgr_123"
}
```

### **Update User (HR Only)**
```http
PUT /users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe-Smith",
  "position": "Senior Data Analyst",
  "departmentId": "dept_2"
}
```

### **Deactivate User (HR Only)**
```http
DELETE /users/{userId}
Authorization: Bearer {token}
```

---

## 🏢 Department Management

### **Get All Departments**
```http
GET /departments
Authorization: Bearer {token}
```

### **Create Department (Admin Only)**
```http
POST /departments
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Research & Development",
  "code": "RND",
  "description": "Innovation and product development team"
}
```

### **Update Department (Admin Only)**
```http
PUT /departments/{departmentId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Research & Development",
  "description": "Updated description"
}
```

---

## 📊 Survey Management

### **Get User's Surveys**
```http
GET /surveys/my-surveys?status=ACTIVE&page=1&limit=10
Authorization: Bearer {token}
```

### **Get All Surveys (HR Only)**
```http
GET /surveys?status=ACTIVE&createdBy=hr_123&page=1&limit=20
Authorization: Bearer {token}
```

### **Get Survey Details**
```http
GET /surveys/{surveyId}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "survey_123",
    "title": "Employee Satisfaction Q1 2024",
    "description": "Quarterly employee satisfaction survey",
    "status": "ACTIVE",
    "isAnonymous": true,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.000Z",
    "targetAllEmployees": true,
    "allowMultipleResponses": false,
    "showProgressBar": true,
    "questions": [
      {
        "id": "q_1",
        "text": "How satisfied are you with your current role?",
        "type": "RATING_SCALE",
        "required": true,
        "order": 1,
        "minValue": 1,
        "maxValue": 5
      },
      {
        "id": "q_2",
        "text": "What aspects of your job do you enjoy most?",
        "type": "TEXTAREA",
        "required": false,
        "order": 2
      }
    ]
  }
}
```

### **Create Survey (HR Only)**
```http
POST /surveys
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Employee Satisfaction Q1 2024",
  "description": "Quarterly employee satisfaction survey",
  "isAnonymous": true,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.000Z",
  "targetAllEmployees": true,
  "questions": [
    {
      "text": "How satisfied are you with your current role?",
      "type": "RATING_SCALE",
      "required": true,
      "order": 1,
      "minValue": 1,
      "maxValue": 5
    }
  ]
}
```

### **Update Survey (HR Only)**
```http
PUT /surveys/{surveyId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Survey Title",
  "description": "Updated description"
}
```

### **Publish Survey (HR Only)**
```http
POST /surveys/{surveyId}/publish
Authorization: Bearer {token}
```

### **Get Survey Analytics (HR Only)**
```http
GET /surveys/{surveyId}/analytics
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "surveyId": "survey_123",
    "totalTargeted": 150,
    "totalResponses": 87,
    "responseRate": 58.0,
    "completionRate": 94.2,
    "averageCompletionTime": 420,
    "sentimentScore": 0.72,
    "questionAnalytics": [
      {
        "questionId": "q_1",
        "question": "How satisfied are you with your current role?",
        "type": "RATING_SCALE",
        "responses": 87,
        "averageRating": 4.2,
        "distribution": {
          "1": 2,
          "2": 8,
          "3": 15,
          "4": 35,
          "5": 27
        }
      }
    ]
  }
}
```

---

## 📝 Survey Responses

### **Submit Survey Response**
```http
POST /surveys/{surveyId}/responses
Authorization: Bearer {token}
Content-Type: application/json

{
  "responses": [
    {
      "questionId": "q_1",
      "value": "4"
    },
    {
      "questionId": "q_2",
      "value": "I enjoy the collaborative environment and learning opportunities."
    }
  ]
}
```

### **Save Draft Response**
```http
PUT /surveys/{surveyId}/responses/draft
Authorization: Bearer {token}
Content-Type: application/json

{
  "responses": [
    {
      "questionId": "q_1",
      "value": "4"
    }
  ]
}
```

### **Get User's Response History**
```http
GET /survey-responses/my-responses?page=1&limit=20
Authorization: Bearer {token}
```

---

## 💬 Chatbot & Conversations

### **Get User's Conversations**
```http
GET /conversations?page=1&limit=20
Authorization: Bearer {token}
```

### **Create New Conversation**
```http
POST /conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "language": "ENGLISH"
}
```

### **Get Conversation Messages**
```http
GET /conversations/{conversationId}/messages?page=1&limit=50
Authorization: Bearer {token}
```

### **Send Message**
```http
POST /conversations/{conversationId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "What is the company's leave policy?"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "msg_123",
      "content": "What is the company's leave policy?",
      "role": "USER",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "assistantMessage": {
      "id": "msg_124",
      "content": "Our company offers several types of leave including annual leave, sick leave, and personal days. Annual leave accrues at 2 days per month for full-time employees...",
      "role": "ASSISTANT",
      "intent": "leave_policy_inquiry",
      "confidence": 0.95,
      "sentimentScore": 0.1,
      "sentimentLabel": "neutral",
      "responseTime": 1250,
      "createdAt": "2024-01-15T10:30:01.250Z"
    }
  }
}
```

### **Get Chatbot Analytics (HR Only)**
```http
GET /chatbot/analytics?startDate=2024-01-01&endDate=2024-01-31&department=IT
Authorization: Bearer {token}
```

---

## 📄 Knowledge Base

### **Search Documents**
```http
GET /documents/search?q=leave%20policy&category=POLICY&language=ENGLISH&page=1&limit=10
Authorization: Bearer {token}
```

### **Get Document Content**
```http
GET /documents/{documentId}
Authorization: Bearer {token}
```

### **Upload Document (HR Only)**
```http
POST /documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": [binary file data],
  "title": "Employee Handbook 2024",
  "category": "HANDBOOK",
  "language": "ENGLISH",
  "tags": ["policies", "procedures", "benefits"]
}
```

### **Update Document (HR Only)**
```http
PUT /documents/{documentId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Employee Handbook 2024",
  "category": "HANDBOOK",
  "tags": ["policies", "procedures", "benefits", "updated"]
}
```

### **Delete Document (HR Only)**
```http
DELETE /documents/{documentId}
Authorization: Bearer {token}
```

---

## 💭 Feedback & Communication

### **Submit Feedback**
```http
POST /feedback
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Suggestion for Remote Work Policy",
  "description": "I would like to suggest implementing a hybrid work model...",
  "category": "POLICIES",
  "priority": "MEDIUM",
  "isAnonymous": false
}
```

### **Get User's Feedback**
```http
GET /feedback/my-feedback?page=1&limit=20
Authorization: Bearer {token}
```

### **Get All Feedback (HR Only)**
```http
GET /feedback?status=SUBMITTED&category=POLICIES&priority=HIGH&page=1&limit=20
Authorization: Bearer {token}
```

### **Update Feedback Status (HR Only)**
```http
PUT /feedback/{feedbackId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "response": "Thank you for your feedback. We are reviewing this suggestion."
}
```

---

## 📈 Analytics & Reporting

### **Get Dashboard Analytics (HR Only)**
```http
GET /analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31&department=IT
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "engagementScore": 7.8,
    "totalEmployees": 150,
    "activeSurveys": 3,
    "chatbotInteractions": 1247,
    "avgSentiment": 0.65,
    "surveyParticipation": {
      "invited": 150,
      "completed": 87,
      "rate": 58.0
    },
    "topQueries": [
      { "query": "leave policy", "count": 45 },
      { "query": "benefits enrollment", "count": 32 },
      { "query": "performance review", "count": 28 }
    ],
    "sentimentTrend": [
      { "date": "2024-01-01", "sentiment": 0.62 },
      { "date": "2024-01-02", "sentiment": 0.65 },
      { "date": "2024-01-03", "sentiment": 0.68 }
    ]
  }
}
```

### **Generate Report (HR Only)**
```http
POST /analytics/reports
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "ENGAGEMENT_REPORT",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "departments": ["dept_1", "dept_2"],
  "format": "PDF"
}
```

### **Export Survey Data (HR Only)**
```http
GET /surveys/{surveyId}/export?format=EXCEL
Authorization: Bearer {token}
```

---

## 🔔 Notifications

### **Get User Notifications**
```http
GET /notifications?page=1&limit=20&status=PENDING
Authorization: Bearer {token}
```

### **Mark Notification as Read**
```http
PUT /notifications/{notificationId}/read
Authorization: Bearer {token}
```

### **Send Notification (HR Only)**
```http
POST /notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Survey Available",
  "message": "Please complete the Q1 2024 Employee Satisfaction Survey",
  "type": "SURVEY_INVITATION",
  "targetUsers": ["user_123", "user_456"],
  "scheduledFor": "2024-01-15T09:00:00.000Z"
}
```

---

## ⚙️ System Configuration (Admin Only)

### **Get System Configuration**
```http
GET /system/config
Authorization: Bearer {token}
```

### **Update System Configuration**
```http
PUT /system/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "app_name": "HR Assistant Pro",
  "session_timeout": 28800,
  "max_file_size": 10485760
}
```

### **Get System Health**
```http
GET /system/health
Authorization: Bearer {token}
```

---

## 📝 Audit Logs (Admin Only)

### **Get Audit Logs**
```http
GET /audit-logs?entity=USER&action=CREATE&userId=user_123&startDate=2024-01-01&page=1&limit=50
Authorization: Bearer {token}
```

---

## 🔒 Error Handling

### **Standard Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

### **HTTP Status Codes**
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### **Common Error Codes**
- `AUTHENTICATION_REQUIRED` - JWT token required
- `INVALID_TOKEN` - JWT token is invalid or expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `VALIDATION_ERROR` - Request data validation failed
- `RESOURCE_NOT_FOUND` - Requested resource does not exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests from user/IP

---

## 🔐 Rate Limiting

### **Rate Limits**
- **Authentication**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **File Upload**: 10 requests per minute per user
- **Chatbot**: 30 requests per minute per user

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642341600
X-RateLimit-Retry-After: 60
```

---

## 🌐 WebSocket Events (Real-time)

### **Connection**
```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### **Chat Events**
```javascript
// Join conversation
socket.emit('join_conversation', { conversationId: 'conv_123' });

// Send message
socket.emit('send_message', {
  conversationId: 'conv_123',
  content: 'Hello!'
});

// Receive message
socket.on('message_received', (data) => {
  console.log('New message:', data.message);
});

// Typing indicator
socket.emit('typing', { conversationId: 'conv_123' });
socket.on('user_typing', (data) => {
  console.log(`${data.userName} is typing...`);
});
```

### **Notification Events**
```javascript
// Real-time notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Survey updates
socket.on('survey_update', (data) => {
  console.log('Survey status changed:', data);
});
```

---

## 📚 SDK Examples

### **JavaScript/TypeScript**
```typescript
import { HRAssistantAPI } from '@company/hr-assistant-sdk';

const api = new HRAssistantAPI({
  baseURL: 'http://localhost:3000/api/v1',
  token: 'your-jwt-token'
});

// Get user profile
const profile = await api.users.getProfile();

// Submit survey response
await api.surveys.submitResponse('survey_123', {
  responses: [
    { questionId: 'q_1', value: '4' }
  ]
});

// Send chat message
const response = await api.chat.sendMessage('conv_123', {
  content: 'What is the leave policy?'
});
``` 