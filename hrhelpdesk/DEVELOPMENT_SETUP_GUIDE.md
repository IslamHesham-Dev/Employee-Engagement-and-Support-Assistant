# HRHelpDesk - Development Setup and Running Guide

## Prerequisites

Before running the HRHelpDesk application, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Git**

## Project Structure

```
hrhelpdesk/
├── backend/           # Node.js + Express + Prisma API
├── frontend/          # React + TypeScript application
├── database/          # Database initialization scripts
└── docker-compose.yml # Docker configuration
```

## Environment Setup

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd Employee-Engagement-and-Support-Assistant/hrhelpdesk
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Configuration
Create a `.env` file in the `backend` directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hrhelpdesk"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Server Configuration
BACKEND_PORT=3000
CORS_ORIGIN="http://localhost:3001"

# SendGrid Configuration
SENDGRID_API_KEY="SG.jxI4CJSHQail953UGe_i9Q.482EbJQjjFQkksPCvFHLFBo-84YeC89GB59iF_DHHu8"
SENDGRID_FROM_EMAIL="islamhk1234@gmail.com"

# Application Settings
NODE_ENV="development"
```

#### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

#### Run Backend
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

Backend will run on: `http://localhost:3000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Run Frontend
```bash
# Development mode
npm start

# Production build
npm run build
```

Frontend will run on: `http://localhost:3001`

## Testing the Application

### 1. Health Check
Test if the backend is running:
```bash
curl http://localhost:3000/health
```
Expected response:
```json
{"status":"OK","timestamp":"2024-01-XX:XX:XX.XXXZ"}
```

### 2. Database Connection Test
Run the database test script:
```bash
cd backend
node test-db.js
```

### 3. Authentication Test
Test user registration:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "HR"
  }'
```

Test user login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Frontend Testing Scenarios

#### Scenario 1: HR User Workflow
1. Open `http://localhost:3001`
2. Register as HR user
3. Login with HR credentials
4. Access HR dashboard
5. Create a new survey
6. Publish the survey

#### Scenario 2: Employee User Workflow
1. Register as Employee user
2. Login with Employee credentials
3. View available surveys
4. Submit survey responses

## Development Commands

### Backend Commands
```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:push        # Push schema changes
npm run db:seed        # Seed database
npm run db:reset       # Reset database
npm run db:studio      # Open Prisma Studio

# Linting and type checking
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run type-check     # TypeScript type checking
```

### Frontend Commands
```bash
# Development server
npm start

# Production build
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Docker Setup (Alternative)

### Using Docker Compose
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Verify database exists

2. **Port Already in Use**
   - Change BACKEND_PORT in .env
   - Kill existing processes: `lsof -ti:3000 | xargs kill -9`

3. **Prisma Client Issues**
   - Regenerate client: `npm run db:generate`
   - Reset database: `npm run db:reset`

4. **CORS Errors**
   - Check CORS_ORIGIN in backend .env
   - Ensure frontend URL matches CORS_ORIGIN

5. **SendGrid Email Issues**
   - Verify SENDGRID_API_KEY is valid
   - Check SENDGRID_FROM_EMAIL is verified in SendGrid

### Debug Mode
Enable debug logging by setting in .env:
```env
NODE_ENV=development
DEBUG=true
```

### Database Inspection
Use Prisma Studio to inspect database:
```bash
cd backend
npm run db:studio
```
This opens a web interface at `http://localhost:5555`

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Endpoints
- `GET /api/users` - Get all users (HR only)
- `DELETE /api/users/:id` - Delete user (HR only)

### Survey Endpoints
- `GET /api/surveys/templates` - Get survey templates
- `POST /api/surveys/from-template` - Create survey from template
- `GET /api/surveys` - Get all surveys (HR) or published surveys (Employee)
- `POST /api/surveys/:id/publish` - Publish survey (HR only)
- `POST /api/surveys/:id/responses` - Submit survey response

## Performance Monitoring

### Backend Monitoring
Monitor backend performance:
```bash
# Memory usage
node --inspect backend/dist/server.js

# CPU profiling
node --prof backend/dist/server.js
```

### Database Performance
Monitor database queries:
```bash
# Enable query logging in postgresql.conf
log_statement = 'all'
log_duration = on
```

## Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Use strong JWT secrets
   - Rotate API keys regularly

2. **Database Security**
   - Use connection pooling
   - Implement query timeouts
   - Regular security updates

3. **API Security**
   - Rate limiting enabled
   - Input validation
   - CORS properly configured

## Next Steps

After successful setup, you can:
1. Test all authentication flows
2. Create and publish surveys
3. Submit survey responses
4. View analytics dashboard
5. Test email notifications

For any issues, check the logs in the `logs/` directory or run with debug mode enabled.
