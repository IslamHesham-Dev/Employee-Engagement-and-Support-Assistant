import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Server Configuration
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hrhelpdesk',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

    // SendGrid Configuration
    sendGridApiKey: process.env.SENDGRID_API_KEY || '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',
    sendGridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'islamhk1234@gmail.com',
    sendGridFromName: process.env.SENDGRID_FROM_NAME || 'iScore HR HelpDesk',

    // Email Configuration
    emailRetryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3'),
    emailRetryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '5000'), // 5 seconds

    // Company Information
    companyName: process.env.COMPANY_NAME || 'iScore',
    companyWebsite: process.env.COMPANY_WEBSITE || 'https://iscore.com',
    companyLogo: process.env.COMPANY_LOGO || 'https://iscore.com/logo.png',

    // Frontend URL
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export default config;
