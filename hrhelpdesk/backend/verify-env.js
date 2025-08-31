const dotenv = require('dotenv');
const path = require('path');

console.log('🔍 Environment Variables Verification Script');
console.log('='.repeat(50));

// Try different .env file locations
const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../.env')
];

console.log('📁 Checking .env file locations:');
envPaths.forEach((envPath, index) => {
    const fs = require('fs');
    const exists = fs.existsSync(envPath);
    console.log(`${index + 1}. ${envPath} - ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
});

// Load the correct .env file
const correctEnvPath = path.join(__dirname, '../.env');
dotenv.config({ path: correctEnvPath });

console.log('\n🔧 Environment Variables Status:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing'}`);
console.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN || '❌ Missing (will use fallback)'}`);
console.log(`BACKEND_PORT: ${process.env.BACKEND_PORT || '❌ Missing (will use 3000)'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing'}`);

console.log('\n📊 Expected Values:');
console.log('- DATABASE_URL: postgresql://postgres:postgres@localhost:5432/hrhelpdesk');
console.log('- CORS_ORIGIN: http://localhost:3001');
console.log('- BACKEND_PORT: 3000');

if (!process.env.DATABASE_URL) {
    console.log('\n🚨 CRITICAL: DATABASE_URL is missing!');
    console.log('💡 Solution: Restart your terminal and run backend with proper .env loading');
}

if (!process.env.CORS_ORIGIN) {
    console.log('\n⚠️  WARNING: CORS_ORIGIN is missing!');
    console.log('💡 Solution: Will use fallback http://localhost:3001');
}
