# AI Chatbot Setup Guide

## Overview
This guide will help you set up and run the AI Chatbot service locally for your HRHelpDesk application. The chatbot provides intelligent support for HR policies using a local AI model and integrates seamlessly with your existing application.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **Python**: 3.8 or higher
- **Node.js**: 18.0 or higher
- **PostgreSQL**: 12.0 or higher
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 2GB free space for models and dependencies

### Software Installation

#### 1. Python Installation
```bash
# Windows: Download from https://www.python.org/downloads/
# macOS: brew install python3
# Ubuntu: sudo apt-get install python3 python3-pip

# Verify installation
python3 --version
pip3 --version
```

#### 2. Node.js Installation
```bash
# Windows: Download from https://nodejs.org/
# macOS: brew install node
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Verify installation
node --version
npm --version
```

#### 3. PostgreSQL Installation
```bash
# Windows: Download from https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
# Windows: Services app
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql
```

## Step-by-Step Setup

### Step 1: Clone and Navigate to Project
```bash
# Navigate to your project directory
cd Employee-Engagement-and-Support-Assistant

# Verify the FAQchatbot directory exists
ls -la hrhelpdesk/FAQchatbot
```

### Step 2: Set Up Python Environment
```bash
cd hrhelpdesk/FAQchatbot

# Create virtual environment (recommended)
python3 -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Verify activation
which python  # Should point to venv directory
```

### Step 3: Install Python Dependencies
```bash
# Install required packages
pip install -r requirements.txt

# Verify installations
python -c "import torch, transformers, flask, psycopg2; print('All packages installed successfully!')"
```

### Step 4: Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database details
# Windows: notepad .env
# macOS/Linux: nano .env
```

**Update the following in `.env`:**
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Service Configuration
HOST=0.0.0.0
PORT=5000

# Model Configuration
MODEL_PATH=./FAQ-Model
MAX_PASSAGES=200
BATCH_SIZE=16
```

**Example database configuration:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hrhelpdesk
```

### Step 5: Set Up Database
```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database (if it doesn't exist)
CREATE DATABASE hrhelpdesk;

# Verify database exists
\l

# Exit PostgreSQL
\q
```

### Step 6: Verify AI Model Files
```bash
# Check if model directory exists
ls -la FAQ-Model/

# Verify required files are present
ls -la FAQ-Model/config.json
ls -la FAQ-Model/pytorch_model.bin
ls -la FAQ-Model/tokenizer.json
ls -la FAQ-Model/vocab.txt
```

**Required files:**
- `config.json` - Model configuration
- `pytorch_model.bin` - Trained model weights
- `tokenizer.json` - Tokenizer configuration
- `vocab.txt` - Vocabulary file
- `special_tokens_map.json` - Special tokens mapping
- `tokenizer_config.json` - Tokenizer settings

### Step 7: Test AI Chatbot Service
```bash
# Test the startup script
python start_chatbot.py

# Or run directly
python run.py
```

**Expected output:**
```
🤖 HRHelpDesk AI Chatbot Service Startup
==================================================
✅ Python version: 3.9.x
📋 Checking dependencies...
✅ flask
✅ torch
✅ transformers
✅ psycopg2
✅ deep_translator
✅ pyarabic
✅ numpy
🤖 Checking AI model files...
✅ AI model files found
🗄️  Checking database connection...
✅ Database connection successful
🚀 Starting AI Chatbot Service...
✅ Service imported successfully
📍 Service will be available at: http://localhost:5000
🔗 Health check: http://localhost:5000/health
🔗 Ask endpoint: http://localhost:5000/ask
🔗 Common questions: http://localhost:5000/common-questions
🔗 Feedback endpoint: http://localhost:5000/feedback
==================================================
```

### Step 8: Test Service Endpoints
```bash
# Open new terminal and test health endpoint
curl http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "database": "healthy",
  "model": "healthy",
  "timestamp": "2024-01-01T12:00:00.000000"
}
```

### Step 9: Set Up Main Backend Integration
```bash
# Navigate to backend directory
cd ../../backend

# Install axios dependency (if not already installed)
npm install axios

# Verify the new AI chatbot files exist
ls -la src/services/aiChatbotService.ts
ls -la src/controllers/aiChatbotController.ts
ls -la src/routes/aiChatbot.ts
```

### Step 10: Test Backend Integration
```bash
# Start the main backend service
npm run dev

# In another terminal, test the integration
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/ai-chatbot/health
```

### Step 11: Set Up Frontend Integration
```bash
# Navigate to frontend directory
cd ../frontend

# Verify the AI chatbot component exists
ls -la src/components/AIChatbot/

# Install dependencies if needed
npm install
```

### Step 12: Test Complete Integration
```bash
# Start frontend
npm start

# Open browser to http://localhost:3001
# Login to application
# Look for AI chatbot toggle button (🤖)
# Test conversation flow
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Python Version Issues
```bash
# Check Python version
python3 --version

# If version < 3.8, upgrade Python
# Windows: Download from python.org
# macOS: brew upgrade python3
# Ubuntu: sudo apt-get update && sudo apt-get upgrade python3
```

#### 2. Dependency Installation Failures
```bash
# Upgrade pip
pip install --upgrade pip

# Install with specific versions
pip install torch==2.1.0
pip install transformers==4.35.0

# For Windows users, try:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

#### 3. Database Connection Issues
```bash
# Check PostgreSQL status
# Windows: Services app
# macOS: brew services list | grep postgresql
# Ubuntu: sudo systemctl status postgresql

# Test connection
psql -U postgres -h localhost -d hrhelpdesk

# Check firewall settings
# Windows: Windows Defender Firewall
# macOS: System Preferences > Security & Privacy > Firewall
# Ubuntu: sudo ufw status
```

#### 4. Model Loading Issues
```bash
# Check model directory permissions
ls -la FAQ-Model/

# Verify file sizes (should be several MB)
du -sh FAQ-Model/*

# Check for corrupted files
file FAQ-Model/pytorch_model.bin
```

#### 5. Port Conflicts
```bash
# Check if port 5000 is in use
# Windows: netstat -ano | findstr :5000
# macOS/Linux: lsof -i :5000

# Kill process using port 5000
# Windows: taskkill /PID <PID>
# macOS/Linux: kill -9 <PID>

# Or change port in .env file
PORT=5001
```

#### 6. Memory Issues
```bash
# Check available memory
# Windows: Task Manager
# macOS: Activity Monitor
# Ubuntu: free -h

# Reduce model batch size in .env
BATCH_SIZE=8
MAX_PASSAGES=100
```

## Performance Optimization

### Model Optimization
```bash
# Use CPU-only version for lower memory usage
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Reduce batch size for lower memory usage
BATCH_SIZE=8

# Limit passages for faster response
MAX_PASSAGES=100
```

### Database Optimization
```bash
# Add indexes to improve query performance
psql -U postgres -d hrhelpdesk

CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_feedback_question_id ON feedback(question_id);
```

## Monitoring and Maintenance

### Health Checks
```bash
# Set up automated health checks
# Create a simple script to monitor service health
cat > monitor_chatbot.sh << 'EOF'
#!/bin/bash
while true; do
    response=$(curl -s http://localhost:5000/health)
    if [[ $response == *"healthy"* ]]; then
        echo "$(date): Service is healthy"
    else
        echo "$(date): Service is unhealthy - $response"
    fi
    sleep 60
done
EOF

chmod +x monitor_chatbot.sh
./monitor_chatbot.sh &
```

### Log Monitoring
```bash
# Monitor service logs
tail -f logs/chatbot.log

# Monitor database logs
tail -f /var/log/postgresql/postgresql-*.log
```

## Security Considerations

### Environment Variables
```bash
# Never commit .env files to version control
echo ".env" >> .gitignore

# Use strong passwords for database
# Enable SSL for database connections
# Restrict network access to service
```

### Network Security
```bash
# Configure firewall rules
# Windows: Windows Defender Firewall
# macOS: System Preferences > Security & Privacy > Firewall
# Ubuntu: sudo ufw allow from 127.0.0.1 to any port 5000
```

## Next Steps

### 1. Customize Knowledge Base
- Update `A.tsv` with your company's HR policies
- Add new question-answer pairs
- Retrain the model if needed

### 2. Integrate with Existing Systems
- Connect with employee database
- Integrate with HR management system
- Add authentication and authorization

### 3. Deploy to Production
- Set up production database
- Configure production environment
- Set up monitoring and logging
- Implement backup strategies

## Support and Resources

### Documentation
- [AI Chatbot Testing Guide](./AI_CHATBOT_TESTING.md)
- [Project Overview](./PROJECT_OVERVIEW.md)
- [Development Setup Guide](./hrhelpdesk/DEVELOPMENT_SETUP_GUIDE.md)

### Community
- Create issues in the project repository
- Contact the development team
- Join project discussions

### Additional Resources
- [PyTorch Documentation](https://pytorch.org/docs/)
- [Transformers Documentation](https://huggingface.co/docs/transformers/)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

**Congratulations!** You've successfully set up the AI Chatbot service for your HRHelpDesk application. The chatbot is now ready to provide intelligent support for your employees' HR-related inquiries.

For any questions or issues, refer to the troubleshooting section or create an issue in the project repository.
