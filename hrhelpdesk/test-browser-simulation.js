const axios = require('axios');

async function testBrowserSimulation() {
    try {
        console.log('Testing browser-like request...');
        
        // Test preflight CORS request first
        console.log('\n1. Testing OPTIONS preflight...');
        try {
            const optionsResponse = await axios.options('http://localhost:3000/api/auth/login', {
                headers: {
                    'Origin': 'http://localhost:3001',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'content-type'
                }
            });
            console.log('✅ OPTIONS request successful');
        } catch (error) {
            console.log('❌ OPTIONS request failed:', error.message);
        }
        
        // Test actual login request
        console.log('\n2. Testing POST login...');
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'hr@iscore.com',
            password: 'hrpassword123'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3001',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            }
        });
        
        console.log('✅ Browser simulation successful:', response.data);
        
    } catch (error) {
        console.error('❌ Browser simulation failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Headers:', error.response?.headers);
    }
}

testBrowserSimulation();
