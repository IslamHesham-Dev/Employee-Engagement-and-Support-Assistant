import dotenv from 'dotenv';

// Load environment variables - try .env file as fallback
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';

import { authRoutes } from './routes/auth';
import surveyRoutes from './routes/surveys';
import { userRoutes } from './routes/users';
import notificationRoutes from './routes/notifications';
import aiChatbotRoutes from './routes/aiChatbot';
import { errorHandler } from './middleware/errorHandler';

// Debug: Log environment variables
console.log('🔧 Environment Variables Check:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? `✅ ${process.env.DATABASE_URL}` : '❌ Missing');
console.log('- CORS_ORIGIN:', process.env.CORS_ORIGIN || 'Using fallback: http://localhost:3001');
console.log('- BACKEND_PORT:', process.env.BACKEND_PORT || '3000 (default)');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai-chatbot', aiChatbotRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 HRHelpDesk API running on http://localhost:${PORT}`);
});
