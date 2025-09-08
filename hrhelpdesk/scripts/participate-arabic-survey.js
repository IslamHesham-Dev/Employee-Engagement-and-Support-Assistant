const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3000/api';

// Arabic names for test accounts (same as creation script)
const arabicNames = [
    { firstName: 'أحمد', lastName: 'محمد', email: 'ahmed.mohamed@test.com' },
    { firstName: 'فاطمة', lastName: 'علي', email: 'fatima.ali@test.com' },
    { firstName: 'محمد', lastName: 'حسن', email: 'mohamed.hassan@test.com' },
    { firstName: 'عائشة', lastName: 'أحمد', email: 'aisha.ahmed@test.com' },
    { firstName: 'عمر', lastName: 'إبراهيم', email: 'omar.ibrahim@test.com' },
    { firstName: 'زينب', lastName: 'محمد', email: 'zainab.mohamed@test.com' },
    { firstName: 'يوسف', lastName: 'علي', email: 'youssef.ali@test.com' },
    { firstName: 'مريم', lastName: 'حسن', email: 'mariam.hassan@test.com' },
    { firstName: 'خالد', lastName: 'أحمد', email: 'khalid.ahmed@test.com' },
    { firstName: 'نور', lastName: 'إبراهيم', email: 'nour.ibrahim@test.com' }
];

// Survey response templates with Arabic context
const surveyResponses = [
    {
        question1: 4, // Role clarity - Agree
        question2: 3, // Work-life balance - Neutral
        question3: 5, // Growth opportunities - Strongly Agree
        question4: 4, // Manager support - Agree
        question5: 5, // Collaboration - Strongly Agree
        question6: 3, // Recognition - Neutral
        question7: 4, // Communication - Agree
        question8: 2, // Workload - Disagree
        question9: 5, // Company culture - Strongly Agree
        question10: 4, // Job satisfaction - Agree
        question11: 3, // Stress level - Neutral
        question12: 4, // Team dynamics - Agree
        question13: 5, // Innovation - Strongly Agree
        question14: 3, // Compensation - Neutral
        question15: 4 // Overall experience - Agree
    },
    {
        question1: 5, // Role clarity - Strongly Agree
        question2: 4, // Work-life balance - Agree
        question3: 3, // Growth opportunities - Neutral
        question4: 5, // Manager support - Strongly Agree
        question5: 4, // Collaboration - Agree
        question6: 5, // Recognition - Strongly Agree
        question7: 3, // Communication - Neutral
        question8: 4, // Workload - Agree
        question9: 4, // Company culture - Agree
        question10: 5, // Job satisfaction - Strongly Agree
        question11: 2, // Stress level - Disagree
        question12: 5, // Team dynamics - Strongly Agree
        question13: 3, // Innovation - Neutral
        question14: 4, // Compensation - Agree
        question15: 4 // Overall experience - Agree
    },
    {
        question1: 3, // Role clarity - Neutral
        question2: 2, // Work-life balance - Disagree
        question3: 4, // Growth opportunities - Agree
        question4: 3, // Manager support - Neutral
        question5: 3, // Collaboration - Neutral
        question6: 2, // Recognition - Disagree
        question7: 4, // Communication - Agree
        question8: 3, // Workload - Neutral
        question9: 3, // Company culture - Neutral
        question10: 3, // Job satisfaction - Neutral
        question11: 4, // Stress level - Agree
        question12: 3, // Team dynamics - Neutral
        question13: 4, // Innovation - Agree
        question14: 3, // Compensation - Neutral
        question15: 3 // Overall experience - Neutral
    }
];

async function participateInSurvey() {
    console.log('📝 Arabic Accounts Survey Participation');
    console.log('='.repeat(50));

    const participationResults = [];
    let totalParticipations = 0;
    let successfulParticipations = 0;
    let failedParticipations = 0;

    // First, get available surveys
    let availableSurveys = [];
    try {
        console.log('\n🔍 Fetching available surveys...');
        const surveysResponse = await axios.get(`${API_BASE_URL}/surveys`);
        availableSurveys = surveysResponse.data;
        console.log(`✅ Found ${availableSurveys.length} available surveys`);

        if (availableSurveys.length === 0) {
            console.log('❌ No surveys available. Please create a survey first.');
            return;
        }

        // Display available surveys
        availableSurveys.forEach((survey, index) => {
            console.log(`  ${index + 1}. ${survey.title} (ID: ${survey.id})`);
        });

    } catch (error) {
        console.error('❌ Failed to fetch surveys:', error.response?.data?.message || error.message);
        return;
    }

    // Use the first available survey
    const targetSurvey = availableSurveys[0];
    console.log(`\n🎯 Using survey: ${targetSurvey.title}`);

    for (let i = 0; i < arabicNames.length; i++) {
        const account = arabicNames[i];
        const responseTemplate = surveyResponses[i % surveyResponses.length]; // Cycle through response templates

        try {
            console.log(`\n${i + 1}️⃣ ${account.firstName} ${account.lastName} participating in survey...`);

            // Step 1: Login
            console.log('  🔐 Logging in...');
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: account.email,
                password: 'password123'
            });

            const token = loginResponse.data.token;
            const userId = loginResponse.data.user.id;
            console.log('  ✅ Login successful');

            // Step 2: Submit survey response
            console.log('  📝 Submitting survey response...');
            const surveyResponse = await axios.post(`${API_BASE_URL}/surveys/${targetSurvey.id}/responses`, {
                responses: Object.entries(responseTemplate).map(([questionKey, answer]) => ({
                    questionId: questionKey.replace('question', ''),
                    answer: answer.toString()
                }))
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('  ✅ Survey response submitted successfully');
            successfulParticipations++;

            participationResults.push({
                account: account,
                surveyId: targetSurvey.id,
                surveyTitle: targetSurvey.title,
                responseId: surveyResponse.data.id,
                responses: responseTemplate,
                status: 'success',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error(`  ❌ Failed for ${account.firstName} ${account.lastName}:`, error.response?.data?.message || error.message);
            failedParticipations++;

            participationResults.push({
                account: account,
                surveyId: targetSurvey.id,
                surveyTitle: targetSurvey.title,
                error: error.response?.data?.message || error.message,
                status: 'failed',
                timestamp: new Date().toISOString()
            });
        }

        totalParticipations++;

        // Small delay between participations
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save results to file
    const results = {
        timestamp: new Date().toISOString(),
        survey: {
            id: targetSurvey.id,
            title: targetSurvey.title
        },
        total: totalParticipations,
        successful: successfulParticipations,
        failed: failedParticipations,
        participationResults
    };

    fs.writeFileSync('arabic-survey-participation-results.json', JSON.stringify(results, null, 2));

    // Summary
    console.log('\n📊 PARTICIPATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`📝 Survey: ${targetSurvey.title}`);
    console.log(`👥 Total Attempts: ${totalParticipations}`);
    console.log(`✅ Successful: ${successfulParticipations}`);
    console.log(`❌ Failed: ${failedParticipations}`);
    console.log(`📈 Success Rate: ${((successfulParticipations / totalParticipations) * 100).toFixed(1)}%`);

    if (successfulParticipations > 0) {
        console.log('\n✅ SUCCESSFUL PARTICIPATIONS:');
        participationResults
            .filter(result => result.status === 'success')
            .forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.account.firstName} ${result.account.lastName} - Response ID: ${result.responseId}`);
            });
    }

    if (failedParticipations > 0) {
        console.log('\n❌ FAILED PARTICIPATIONS:');
        participationResults
            .filter(result => result.status === 'failed')
            .forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.account.firstName} ${result.account.lastName} - ${result.error}`);
            });
    }

    console.log('\n📁 Results saved to: arabic-survey-participation-results.json');

    // Test dashboard sync
    console.log('\n🔄 Testing Dashboard Sync...');
    try {
        const hrLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'hr@test.com',
            password: 'password123'
        });

        const dashboardResponse = await axios.get(`${API_BASE_URL}/surveys/analytics/dashboard`, {
            headers: {
                'Authorization': `Bearer ${hrLoginResponse.data.token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Dashboard sync test successful');
        console.log(`📊 Total responses now: ${dashboardResponse.data.totalResponses}`);
        console.log(`👥 Recent responses: ${dashboardResponse.data.recentResponses?.length || 0}`);

    } catch (error) {
        console.error('❌ Dashboard sync test failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 SURVEY PARTICIPATION COMPLETE!');
    console.log('🌐 Check the HR dashboard to see the new responses');

    return results;
}

// Run the script
participateInSurvey().catch(console.error);
