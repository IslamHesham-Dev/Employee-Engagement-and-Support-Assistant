# AI Chatbot Testing Documentation

## Overview
This document outlines the testing strategy for the AI Chatbot service integrated with the HRHelpDesk application. The chatbot provides intelligent support for HR policies and employee inquiries using a local AI model.

## Testing Environment Setup

### Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- PostgreSQL database running
- Local AI model files in `FAQ-Model/` directory

### Environment Configuration
1. **AI Chatbot Service** (Port 5000):
   ```bash
   cd hrhelpdesk/FAQchatbot
   cp .env.example .env
   # Update DATABASE_URL in .env file
   ```

2. **Main Backend** (Port 3000):
   ```bash
   cd hrhelpdesk/backend
   # Ensure DATABASE_URL is configured
   ```

3. **Frontend** (Port 3001):
   ```bash
   cd hrhelpdesk/frontend
   # Configure proxy to backend
   ```

## Test Categories

### 1. Unit Testing

#### AI Chatbot Service (Python)
```bash
cd hrhelpdesk/FAQchatbot
python -m pytest tests/ -v
```

**Test Coverage:**
- Model loading and inference
- Database operations
- Translation services
- Session management
- Response formatting

#### Backend Integration (TypeScript)
```bash
cd hrhelpdesk/backend
npm run test
```

**Test Coverage:**
- AI chatbot service integration
- Authentication middleware
- Error handling
- Response validation

### 2. Integration Testing

#### Service Communication
```bash
# Test AI chatbot service health
curl http://localhost:5000/health

# Test main backend health
curl http://localhost:3000/health

# Test AI chatbot endpoint through main backend
curl -H "Authorization: Bearer <TOKEN>" \
     http://localhost:3000/api/ai-chatbot/health
```

#### Database Integration
```bash
# Test database connection
cd hrhelpdesk/FAQchatbot
python -c "
from run import get_db_connection
conn = get_db_connection()
print('Database connection:', 'OK' if conn else 'FAILED')
if conn: conn.close()
"
```

### 3. API Endpoint Testing

#### AI Chatbot Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Ask a question
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "كم ساعات العمل في اليوم؟",
    "language": "ar",
    "session_id": "test_session_123",
    "is_common_question": false
  }'

# Get common questions
curl "http://localhost:5000/common-questions?language=ar"

# Submit feedback
curl -X POST http://localhost:5000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 1,
    "is_good": true
  }'
```

#### Main Backend Integration
```bash
# Test through main backend with authentication
TOKEN="your_jwt_token_here"

# Health check
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/ai-chatbot/health

# Ask question
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "question": "How many vacation days do I have?",
       "language": "en",
       "session_id": "test_session_456",
       "is_common_question": true
     }' \
     http://localhost:3000/api/ai-chatbot/ask
```

### 4. Frontend Component Testing

#### React Component Testing
```bash
cd hrhelpdesk/frontend
npm test -- --testPathPattern=AIChatbot
```

**Test Scenarios:**
- Component rendering
- Message sending/receiving
- Language switching
- Common question selection
- Feedback submission
- Responsive design

#### User Interface Testing
```bash
# Start frontend
npm start

# Test chatbot integration
# 1. Open browser to http://localhost:3001
# 2. Login to application
# 3. Click AI chatbot toggle button
# 4. Test conversation flow
# 5. Test language switching
# 6. Test common questions
# 7. Test feedback system
```

### 5. Performance Testing

#### Load Testing
```bash
# Install Apache Bench
# Ubuntu: sudo apt-get install apache2-utils
# macOS: brew install httpd

# Test AI chatbot service
ab -n 100 -c 10 -H "Content-Type: application/json" \
   -p test_question.json \
   http://localhost:5000/ask

# Test main backend integration
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
   -H "Content-Type: application/json" \
   -p test_question.json \
   http://localhost:3000/api/ai-chatbot/ask
```

#### Memory and CPU Testing
```bash
# Monitor resource usage during testing
htop  # or top
watch -n 1 'ps aux | grep python'
watch -n 1 'ps aux | grep node'
```

### 6. Security Testing

#### Authentication Testing
```bash
# Test without token
curl http://localhost:3000/api/ai-chatbot/ask

# Test with invalid token
curl -H "Authorization: Bearer invalid_token" \
     http://localhost:3000/api/ai-chatbot/ask

# Test with expired token
# (Create expired token and test)
```

#### Input Validation Testing
```bash
# Test SQL injection attempts
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "'; DROP TABLE questions; --",
    "language": "ar",
    "session_id": "test_session"
  }'

# Test XSS attempts
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "<script>alert(\"xss\")</script>",
    "language": "ar",
    "session_id": "test_session"
  }'
```

### 7. Fallback Mechanism Testing

#### Service Unavailability
```bash
# Stop AI chatbot service
pkill -f "python.*run.py"

# Test main backend fallback
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/ai-chatbot/common-questions

# Restart service
cd hrhelpdesk/FAQchatbot
python start_chatbot.py
```

#### Model Loading Failures
```bash
# Temporarily rename model directory
mv FAQ-Model FAQ-Model-backup

# Test service health
curl http://localhost:5000/health

# Restore model directory
mv FAQ-Model-backup FAQ-Model
```

## Test Data

### Sample Questions for Testing
```json
{
  "arabic_questions": [
    "كم ساعات العمل في اليوم؟",
    "كم إجازة سنوية لي؟",
    "كيف أقدم استقالة؟",
    "ما هي حقوقي كموظف؟"
  ],
  "english_questions": [
    "How many working hours per day?",
    "How many vacation days do I have?",
    "How do I submit a resignation?",
    "What are my rights as an employee?"
  ]
}
```

### Expected Responses
- **High confidence**: Direct answer from knowledge base
- **Low confidence**: "Question sent to team" response
- **Common questions**: Interactive workflow (vacation, department change, resignation)

## Error Scenarios

### Common Errors and Solutions
1. **Model loading failed**
   - Check FAQ-Model directory exists
   - Verify model files are complete
   - Check Python dependencies

2. **Database connection failed**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify database exists and is accessible

3. **Translation service failed**
   - Check internet connection
   - Verify deep-translator package
   - Test with simple text

4. **Memory issues**
   - Monitor system resources
   - Reduce batch_size in configuration
   - Limit max_passages

## Performance Benchmarks

### Response Time Targets
- **Simple questions**: < 2 seconds
- **Complex queries**: < 5 seconds
- **Model inference**: < 1 second
- **Database operations**: < 500ms

### Throughput Targets
- **Concurrent users**: 50+
- **Requests per second**: 20+
- **Memory usage**: < 2GB
- **CPU usage**: < 80%

## Monitoring and Logging

### Health Check Endpoints
```bash
# AI Chatbot Service
curl http://localhost:5000/health

# Main Backend
curl http://localhost:3000/health

# AI Chatbot through Main Backend
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/ai-chatbot/health
```

### Log Monitoring
```bash
# AI Chatbot logs
tail -f hrhelpdesk/FAQchatbot/logs/chatbot.log

# Main backend logs
tail -f hrhelpdesk/backend/logs/app.log

# Database logs
tail -f /var/log/postgresql/postgresql-*.log
```

## Troubleshooting Guide

### Service Won't Start
1. Check Python version (3.8+)
2. Verify dependencies installed
3. Check environment variables
4. Verify model files exist
5. Check database connectivity

### Poor Response Quality
1. Verify model files are complete
2. Check knowledge base data
3. Monitor confidence scores
4. Review training data quality

### High Response Times
1. Check system resources
2. Monitor database performance
3. Verify model loading
4. Check network latency

## Continuous Integration

### Automated Testing
```yaml
# .github/workflows/ai-chatbot-test.yml
name: AI Chatbot Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: |
          cd hrhelpdesk/FAQchatbot
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd hrhelpdesk/FAQchatbot
          python -m pytest tests/ -v
```

## Conclusion

This testing strategy ensures the AI chatbot service is robust, secure, and performs well under various conditions. Regular testing should be performed during development and before production deployment.

For additional support or questions, refer to the development team or create an issue in the project repository.
