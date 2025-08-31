const axios = require('axios');

async function testSimple() {
    try {
        // Login first
        console.log('1. Testing login...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'hr@iscore.com',
            password: 'hrpassword123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Test employees endpoint
        console.log('\n2. Testing employees endpoint...');
        try {
            const employeesResponse = await axios.get('http://localhost:3000/api/users/employees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Employees fetch successful:', employeesResponse.data.length, 'employees');
        } catch (error) {
            console.log('❌ Employees fetch failed:');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data);
        }

        // Test surveys endpoint
        console.log('\n3. Testing surveys endpoint...');
        try {
            const surveysResponse = await axios.get('http://localhost:3000/api/surveys/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Surveys fetch successful:', surveysResponse.data.length, 'surveys');

            if (surveysResponse.data.length > 0) {
                const surveyId = surveysResponse.data[0].id;
                console.log('\n4. Testing survey publish...');
                try {
                    const publishResponse = await axios.put(`http://localhost:3000/api/surveys/${surveyId}/publish`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('✅ Survey publish successful');
                } catch (error) {
                    console.log('❌ Survey publish failed:');
                    console.log('Status:', error.response?.status);
                    console.log('Error:', error.response?.data);
                }
            }
        } catch (error) {
            console.log('❌ Surveys fetch failed:');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data);
        }

    } catch (error) {
        console.log('❌ Login failed:', error.message);
    }
}

testSimple();
