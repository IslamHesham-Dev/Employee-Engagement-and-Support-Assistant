const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testFrontendLogin() {
    try {
        console.log('Testing login as if from frontend (port 3001)...');
        
        // Simulate frontend request with headers
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'hr@iscore.com',
            password: 'hrpassword123'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3001'
            }
        });
        
        console.log('✅ Frontend simulation successful:', response.data);
        
    } catch (error) {
        console.error('❌ Frontend simulation failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Headers:', error.response?.headers);
        console.error('Full error:', error.message);
    }
}

testFrontendLogin();

