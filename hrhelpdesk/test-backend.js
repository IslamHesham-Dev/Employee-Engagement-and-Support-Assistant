const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testBackend() {
    try {
        console.log('Testing backend connectivity...');

        // Test health endpoint
        const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
        console.log('✅ Health check passed:', healthResponse.data);

        // Test registration
        const testUser = {
            email: 'test@iscore.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            employeeId: 'TEST001',
            role: 'EMPLOYEE'
        };

        console.log('Testing registration...');
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
        console.log('✅ Registration successful:', registerResponse.data);

        // Test login
        console.log('Testing login...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login successful:', loginResponse.data);

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testBackend();




