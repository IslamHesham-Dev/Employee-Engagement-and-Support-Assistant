const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testEndpoints() {
    try {
        console.log('🔧 Testing All Endpoints...\n');

        // 1. Login as HR
        console.log('1. Testing HR Login...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'hr@iscore.com',
            password: 'hrpassword123'
        });

        const token = loginResponse.data.token;
        console.log('✅ HR Login successful');
        console.log('Token received:', token.substring(0, 50) + '...\n');

        // 2. Test employees endpoint
        console.log('2. Testing Employees Endpoint...');
        try {
            const employeesResponse = await axios.get(`${API_BASE_URL}/users/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Employees fetch successful');
            console.log('Employees count:', employeesResponse.data.length);
            employeesResponse.data.forEach(emp => {
                console.log(`  - ${emp.firstName} ${emp.lastName} (${emp.email})`);
            });
        } catch (error) {
            console.log('❌ Employees fetch failed:', error.response?.data || error.message);
        }

        console.log('\n3. Testing Survey Templates...');
        try {
            const templatesResponse = await axios.get(`${API_BASE_URL}/surveys/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Survey templates fetch successful');
            console.log('Templates count:', templatesResponse.data.length);
        } catch (error) {
            console.log('❌ Survey templates fetch failed:', error.response?.data || error.message);
        }

        console.log('\n4. Testing Survey Creation...');
        try {
            const createResponse = await axios.post(`${API_BASE_URL}/surveys`, {
                templateId: 'employee-satisfaction',
                title: 'Test Employee Satisfaction Survey',
                description: 'A test survey to check functionality'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Survey creation successful');
            console.log('Survey ID:', createResponse.data.id);
            console.log('Survey Title:', createResponse.data.title);
            console.log('Questions count:', createResponse.data.questions.length);
        } catch (error) {
            console.log('❌ Survey creation failed:', error.response?.data || error.message);
        }

        console.log('\n5. Testing All Surveys...');
        try {
            const surveysResponse = await axios.get(`${API_BASE_URL}/surveys/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ All surveys fetch successful');
            console.log('Surveys count:', surveysResponse.data.length);
        } catch (error) {
            console.log('❌ All surveys fetch failed:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testEndpoints();
