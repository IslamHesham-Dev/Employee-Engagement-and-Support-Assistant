# Deployment Guide
## AI HR Employee Engagement & Support Assistant

### 🚀 Deployment Overview
**Environment**: Local Development & Production  
**Architecture**: Containerized Microservices  
**Orchestration**: Docker Compose  
**Monitoring**: Built-in Health Checks  

---

## 🛠️ Prerequisites

### **System Requirements**
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 16GB minimum (32GB recommended)
- **CPU**: 8-core processor
- **Storage**: 100GB available space
- **Network**: Broadband internet connection (for initial setup)

### **Required Software**
- **Node.js**: 18.x LTS or higher
- **Docker**: 20.10+ and Docker Compose 2.0+
- **Git**: Latest version
- **Code Editor**: VS Code recommended

---

## 📦 Installation Steps

### **1. Clone Repository**
```bash
# Clone the project repository
git clone https://github.com/your-company/ai-hr-assistant.git
cd ai-hr-assistant

# Create and switch to development branch
git checkout -b development
```

### **2. Environment Setup**
```bash
# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Install root dependencies (if using monorepo tools)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### **3. Environment Configuration**

#### **Root .env File**
```bash
# .env
NODE_ENV=development
PROJECT_NAME=ai-hr-assistant

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hr_assistant
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/hr_assistant_test

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
ENCRYPTION_KEY=your-32-character-encryption-key

# AI Configuration
OLLAMA_BASE_URL=http://localhost:11434
VECTOR_DB_URL=http://localhost:8000

# Email (Optional for local development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

#### **Backend .env File**
```bash
# backend/.env
PORT=3000
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=your-session-secret-key
SESSION_TIMEOUT=28800

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

#### **Frontend .env File**
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3001
VITE_APP_NAME=HR Assistant
VITE_APP_VERSION=1.0.0
```

---

## 🐳 Docker Setup

### **Docker Compose Configuration**
```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: hr-postgres
    environment:
      POSTGRES_DB: hr_assistant
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: hr-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Ollama AI Service
  ollama:
    image: ollama/ollama:latest
    container_name: hr-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/version"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Vector Database (Chroma)
  chroma:
    image: chromadb/chroma:latest
    container_name: hr-chroma
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_HTTP_PORT=8000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MailHog (Development Email Testing)
  mailhog:
    image: mailhog/mailhog:latest
    container_name: hr-mailhog
    ports:
      - "1025:1025"  # SMTP port
      - "8025:8025"  # Web UI port

volumes:
  postgres_data:
  redis_data:
  ollama_data:
  chroma_data:

networks:
  default:
    name: hr-assistant-network
```

### **Start Infrastructure Services**
```bash
# Start all infrastructure services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check service logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f ollama
```

---

## 🤖 AI Model Setup

### **Download and Configure Ollama Models**
```bash
# Pull Llama 3.1 model (this may take 30+ minutes)
docker exec hr-ollama ollama pull llama3.1:8b

# Pull embedding model
docker exec hr-ollama ollama pull nomic-embed-text

# Verify models are available
docker exec hr-ollama ollama list

# Test model response
docker exec hr-ollama ollama run llama3.1:8b "Hello, how are you?"
```

### **Initialize Vector Database**
```bash
# Create a simple script to test Chroma connection
cat > test-chroma.js << 'EOF'
const { ChromaClient } = require('chromadb');

async function testChroma() {
  try {
    const client = new ChromaClient({ path: "http://localhost:8000" });
    const collections = await client.listCollections();
    console.log('Chroma connection successful!', collections);
  } catch (error) {
    console.error('Chroma connection failed:', error);
  }
}

testChroma();
EOF

# Install chromadb client and test
npm install chromadb
node test-chroma.js
rm test-chroma.js
```

---

## 💾 Database Setup

### **Initialize Database**
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with initial data
npx prisma db seed

# Open Prisma Studio to verify data
npx prisma studio
```

### **Database Seeding Script**
```typescript
// backend/prisma/seed.ts
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Human Resources',
        code: 'HR',
        description: 'Human Resources Department'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Information Technology',
        code: 'IT',
        description: 'Information Technology Department'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Finance',
        code: 'FIN',
        description: 'Finance Department'
      }
    })
  ]);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      employeeId: 'EMP_0001',
      firstName: 'System',
      lastName: 'Administrator',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      departmentId: departments[0].id
    }
  });

  // Create HR Manager
  const hrPassword = await bcrypt.hash('hr123', 12);
  const hrUser = await prisma.user.create({
    data: {
      email: 'hr@company.com',
      employeeId: 'EMP_0002',
      firstName: 'HR',
      lastName: 'Manager',
      password: hrPassword,
      role: UserRole.HR_MANAGER,
      status: UserStatus.ACTIVE,
      departmentId: departments[0].id
    }
  });

  // Create sample employee
  const empPassword = await bcrypt.hash('employee123', 12);
  const employee = await prisma.user.create({
    data: {
      email: 'employee@company.com',
      employeeId: 'EMP_0003',
      firstName: 'John',
      lastName: 'Doe',
      password: empPassword,
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      departmentId: departments[1].id,
      managerId: hrUser.id
    }
  });

  // Create sample survey
  const survey = await prisma.survey.create({
    data: {
      title: 'Employee Satisfaction Survey',
      description: 'Quarterly employee satisfaction assessment',
      createdById: hrUser.id,
      questions: {
        create: [
          {
            text: 'How satisfied are you with your current role?',
            type: 'RATING_SCALE',
            required: true,
            order: 1,
            minValue: 1,
            maxValue: 5
          },
          {
            text: 'What aspects of your job do you enjoy most?',
            type: 'TEXTAREA',
            required: false,
            order: 2
          }
        ]
      }
    }
  });

  // Create sample documents
  await prisma.document.createMany({
    data: [
      {
        title: 'Employee Handbook',
        content: 'Welcome to our company! This handbook contains important information about our policies and procedures.',
        type: 'HANDBOOK',
        category: 'General',
        tags: ['policies', 'procedures', 'handbook']
      },
      {
        title: 'Leave Policy',
        content: 'Our leave policy provides employees with various types of leave including annual leave, sick leave, and personal days.',
        type: 'POLICY',
        category: 'Leave',
        tags: ['leave', 'vacation', 'policy']
      }
    ]
  });

  console.log('✅ Database seeding completed!');
  console.log('👤 Admin user: admin@company.com / admin123');
  console.log('👤 HR user: hr@company.com / hr123');
  console.log('👤 Employee user: employee@company.com / employee123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 🚀 Application Deployment

### **Backend Deployment**
```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev

# Or start production server
npm run start
```

### **Frontend Deployment**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

### **Development Scripts**
```json
// package.json (root)
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm run test",
    "test:frontend": "cd frontend && npm run test",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "setup": "npm run docker:up && npm run db:setup && npm run ai:setup",
    "db:setup": "cd backend && npx prisma migrate dev && npx prisma db seed",
    "ai:setup": "docker exec hr-ollama ollama pull llama3.1:8b"
  }
}
```

---

## 🔧 Configuration Management

### **SSL/TLS Setup (Production)**
```bash
# Generate SSL certificates
mkdir -p certificates

# Self-signed certificate for local development
openssl req -x509 -newkey rsa:4096 -keyout certificates/key.pem -out certificates/cert.pem -days 365 -nodes

# Update backend configuration
# backend/src/app.ts
import https from 'https';
import fs from 'fs';

if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync('certificates/key.pem'),
    cert: fs.readFileSync('certificates/cert.pem')
  };
  
  https.createServer(options, app).listen(443, () => {
    console.log('HTTPS Server running on port 443');
  });
}
```

### **Environment-Specific Configuration**
```typescript
// backend/src/config/index.ts
import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  database: {
    url: string;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  ai: {
    ollamaUrl: string;
    vectorDbUrl: string;
  };
  redis: {
    url: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000'),
  database: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production'
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },
  ai: {
    ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    vectorDbUrl: process.env.VECTOR_DB_URL || 'http://localhost:8000'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
};

export default config;
```

---

## 📊 Monitoring & Health Checks

### **Health Check Endpoints**
```typescript
// backend/src/routes/health.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      ai: 'unknown'
    }
  };

  try {
    // Database health
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Redis health
    await redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // AI service health
    const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/version`);
    if (response.ok) {
      health.services.ai = 'healthy';
    } else {
      health.services.ai = 'unhealthy';
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.ai = 'unhealthy';
    health.status = 'degraded';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

export default router;
```

### **Logging Configuration**
```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hr-assistant' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

---

## 🔄 Backup & Recovery

### **Database Backup Script**
```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hr_assistant_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
docker exec hr-postgres pg_dump -U postgres hr_assistant > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### **Database Restore Script**
```bash
#!/bin/bash
# scripts/restore-database.sh

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

BACKUP_FILE=$1

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker exec -i hr-postgres psql -U postgres -d hr_assistant
else
    docker exec -i hr-postgres psql -U postgres -d hr_assistant < $BACKUP_FILE
fi

echo "Database restored from: $BACKUP_FILE"
```

---

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
cd backend && npx prisma migrate dev --name init
```

#### **AI Service Issues**
```bash
# Check Ollama status
docker exec hr-ollama ollama list

# Restart Ollama service
docker-compose restart ollama

# Check Ollama logs
docker-compose logs ollama

# Re-pull models if corrupted
docker exec hr-ollama ollama pull llama3.1:8b
```

#### **Port Conflicts**
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :5432

# Kill processes using the ports
sudo fuser -k 3000/tcp
sudo fuser -k 5432/tcp
```

#### **Memory Issues**
```bash
# Check Docker memory usage
docker stats

# Increase Docker memory allocation (Docker Desktop)
# Settings > Resources > Memory > Increase to 8GB+

# Monitor system memory
free -h
top
```

### **Log Analysis**
```bash
# View application logs
tail -f backend/logs/combined.log

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f ollama

# Search for errors
grep "ERROR" backend/logs/combined.log
```

---

## 📋 Deployment Checklist

### **Pre-Deployment Checklist**
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] AI models downloaded and tested
- [ ] SSL certificates configured (production)
- [ ] Backup procedures tested
- [ ] Health checks working
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Documentation updated

### **Post-Deployment Verification**
- [ ] All services running correctly
- [ ] Health endpoints responding
- [ ] Database connectivity confirmed
- [ ] AI services responding
- [ ] Frontend accessible
- [ ] Authentication working
- [ ] File uploads working
- [ ] Email notifications working (if configured)
- [ ] Monitoring alerts configured

---

## 🔧 Maintenance

### **Regular Maintenance Tasks**
```bash
# Weekly tasks
npm run test                    # Run test suite
docker system prune -f          # Clean up unused Docker resources
scripts/backup-database.sh      # Create database backup

# Monthly tasks
docker-compose pull             # Update Docker images
npm audit fix                   # Update dependencies
docker exec hr-ollama ollama pull llama3.1:8b  # Update AI models

# Quarterly tasks
# Review and update security configurations
# Performance optimization review
# Documentation updates
```

### **Monitoring Setup**
```bash
# Set up log rotation
sudo nano /etc/logrotate.d/hr-assistant

# Content:
/path/to/hr-assistant/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
}
```

This comprehensive deployment guide provides everything needed to set up, deploy, and maintain the AI HR Assistant locally. Follow the steps in order and refer to the troubleshooting section if you encounter any issues. 