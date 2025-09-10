# HR HelpDesk - AI-Powered Employee Engagement & Support Assistant

A comprehensive HR management system built for iScore, featuring AI-powered chatbot assistance, employee surveys, analytics dashboard, and multi-language support for Egyptian Labour Law compliance.

## Features

### AI-Powered Chatbot
- **RAG (Retrieval-Augmented Generation)** system for Egypt Labour Law questions
- **Multi-language support** (Arabic & English)
- **Real-time conversation** with confidence scoring
- **Source citation** and reference links
- **Feedback system** for continuous improvement

### Employee Surveys & Analytics
- **Dynamic survey creation** with multiple question types
- **Real-time analytics dashboard** with engagement metrics
- **Department-wise insights** and trend analysis
- **Anonymous and identified response options**
- **Email notifications** and reminders

### User Management
- **Role-based access control** (HR & Employee)
- **Department management** and organizational structure
- **User profiles** with avatar and contact information
- **Activity tracking** and audit logs

### Communication System
- **Email notifications** via SendGrid integration
- **Survey invitations** and reminders
- **Response alerts** for HR managers
- **Welcome emails** for new users

### Security & Compliance
- **JWT-based authentication**
- **Environment-based configuration**
- **Audit logging** for all activities
- **Data privacy** and GDPR compliance

## Architecture

### Frontend (React + TypeScript)
- **Material-UI** for modern, responsive design
- **Redux Toolkit** for state management
- **Real-time chat interface** with AI chatbot
- **Analytics dashboard** with interactive charts
- **Multi-language support** with RTL layout

### Backend (Node.js + Express + TypeScript)
- **RESTful API** with comprehensive endpoints
- **Prisma ORM** for database management
- **JWT authentication** middleware
- **Email service** with retry mechanisms
- **Comprehensive error handling**

### AI Chatbot (Python + Flask)
- **RAG pipeline** with FAISS vector search
- **OpenAI GPT-4** for answer generation
- **Web scraping** for Egypt Labour Law content
- **Multi-language translation** support
- **Confidence scoring** and source attribution

### Database (PostgreSQL)
- **Comprehensive schema** for all entities
- **User management** with roles and departments
- **Survey system** with questions and responses
- **Analytics data** storage and retrieval
- **Audit logging** and system configuration

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **Redux Toolkit** for state management
- **Recharts** for data visualization
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **JWT** for authentication
- **SendGrid** for email services

### AI Chatbot
- **Python 3.9+** with Flask
- **OpenAI API** for language models
- **FAISS** for vector similarity search
- **BeautifulSoup** for web scraping
- **Google Translate** for language support

### Infrastructure
- **Docker** for containerization
- **PostgreSQL** for data persistence
- **Redis** for caching (optional)
- **MailHog** for email testing

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **PostgreSQL** 15+
- **Docker** and Docker Compose (optional)
- **OpenAI API Key**
- **SendGrid API Key** (optional)

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/hrhelpdesk.git
cd hrhelpdesk
```

### 2. Environment Setup
Create environment files for each service:

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hrhelpdesk"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# SendGrid (Optional)
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="your-email@example.com"
SENDGRID_FROM_NAME="iScore HR HelpDesk"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

#### AI Chatbot (.env)
```env
# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hrhelpdesk"
```

### 3. Database Setup
```bash
# Using Docker (Recommended)
npm run docker:up

# Or manually install PostgreSQL and create database
createdb hrhelpdesk
```

### 4. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd hrhelpdesk/backend && npm install

# Install frontend dependencies
cd hrhelpdesk/frontend && npm install

# Install AI chatbot dependencies
cd hrhelpdesk/FAQchatbot && pip install -r requirements.txt
```

### 5. Database Migration & Seeding
```bash
cd hrhelpdesk/backend
npx prisma migrate dev
npx prisma db seed
```

### 6. Start the Application

#### Option 1: Start All Services (Recommended)
```bash
# From root directory
npm run dev
```

#### Option 2: Start Services Individually
```bash
# Terminal 1: Backend
cd hrhelpdesk/backend
npm run dev

# Terminal 2: Frontend
cd hrhelpdesk/frontend
npm run dev

# Terminal 3: AI Chatbot
cd hrhelpdesk/FAQchatbot
python chatbot_service.py
```

### 7. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **AI Chatbot**: http://localhost:5000
- **Database**: localhost:5432

## 📱 Application Showcase

### 🎥 Demo Video
[Watch the Demo Video](https://drive.google.com/file/d/1fH1bbWuGLnaD7hiMyPG3Wq7o9PYBZV3R/view?usp=sharing) - *Coming Soon*

### 🖼️ Screenshots

#### Login Interface
![Login](login.png)
*Clean and modern login interface with iScore branding*

#### Employee Management Dashboard
![Dashboard](dashboard.png)
*Comprehensive HR dashboard with employee management, survey management, and analytics tabs*

#### Add New Employee Modal
![Add Employee](Add%20Employee.png)
*Streamlined employee creation interface with required fields and validation*

#### AI Chatbot Interface
![Chatbot](Chatbot.PNG)
*AI-powered chatbot with Egypt Labour Law knowledge, confidence scoring, and source citations*

#### Employee Survey Interface
![Survey](Survey.png)
*Interactive survey interface with star ratings, multiple choice questions, and progress tracking*

#### Survey Analytics Dashboard
![Analytics](dashboard.png)
*Real-time analytics dashboard showing engagement metrics, satisfaction rates, and detailed insights*

## 🔧 Configuration

### Database Configuration
The application uses PostgreSQL with Prisma ORM. Key configuration options:

```typescript
// Database connection
DATABASE_URL="postgresql://username:password@host:port/database"

// Connection pool settings
DB_POOL_SIZE=10
DB_POOL_TIMEOUT=30000
```

### Email Configuration
Configure SendGrid for email notifications:

```typescript
// SendGrid settings
SENDGRID_API_KEY="your-api-key"
SENDGRID_FROM_EMAIL="noreply@yourcompany.com"
SENDGRID_FROM_NAME="Your Company HR"
```

### AI Chatbot Configuration
Configure OpenAI and RAG pipeline:

```python
# OpenAI settings
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-4o-mini"

# RAG settings
MAX_CHARS=350
TOP_K=6
MAX_CONTEXT_CHARS=8000
```

## 🧪 Testing

### Backend Tests
```bash
cd hrhelpdesk/backend
npm test
```

### Frontend Tests
```bash
cd hrhelpdesk/frontend
npm test
```

### AI Chatbot Tests
```bash
cd hrhelpdesk/FAQchatbot
python test_rag_simple.py
```

### Integration Tests
```bash
cd hrhelpdesk
python test_chatbot_integration.py
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Survey Endpoints
- `GET /api/surveys/templates` - Get survey templates
- `POST /api/surveys/create` - Create new survey
- `GET /api/surveys/published` - Get published surveys
- `POST /api/surveys/:id/responses` - Submit survey response
- `GET /api/surveys/:id/results` - Get survey results

### AI Chatbot Endpoints
- `POST /ask` - Ask question to chatbot
- `GET /common-questions` - Get common questions
- `POST /feedback` - Submit feedback

### User Management Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/departments` - Get departments

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
1. Set up production environment variables
2. Configure reverse proxy (nginx)
3. Set up SSL certificates
4. Configure database backups
5. Set up monitoring and logging

---

**Built with ❤️ by the iScore Team**
