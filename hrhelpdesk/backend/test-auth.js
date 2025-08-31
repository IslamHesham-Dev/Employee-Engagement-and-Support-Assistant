const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
    try {
        console.log('Testing authentication endpoints...');
        
        // Test health endpoint first
        console.log('\n1. Testing health endpoint...');
        const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
        console.log('✅ Health check passed:', healthResponse.data);
        
        // Test HR login
        console.log('\n2. Testing HR login...');
        const hrLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'hr@iscore.com',
            password: 'hrpassword123'
        });
        console.log('✅ HR login successful:', hrLoginResponse.data);
        
        // Test Employee login
        console.log('\n3. Testing Employee login...');
        const empLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'employee@iscore.com',
            password: 'employeepass123'
        });
        console.log('✅ Employee login successful:', empLoginResponse.data);
        
        // Test wrong password
        console.log('\n4. Testing wrong password...');
        try {
            await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'hr@iscore.com',
                password: 'wrongpassword'
            });
        } catch (error) {
            console.log('✅ Wrong password correctly rejected:', error.response?.data);
        }
        
        // Test browser simulation
        console.log('\n5. Testing browser-like request...');
        const browserResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'hr@iscore.com',
            password: 'hrpassword123'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3001',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        console.log('✅ Browser simulation successful:', browserResponse.data);
        
    } catch (error) {
        console.error('❌ Authentication test failed:', error.response?.data || error.message);
    }
}

testAuth();

