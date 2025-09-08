const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3000/api';

// Survey response templates based on the CSV data patterns
const responseTemplates = [
    // Template 1: Positive responses
    {
        name: 'Positive Employee',
        responses: {
            q1: 'Agree',           // Role clarity
            q2: 'Agree',           // Meaningful work
            q3: 'Compensation & benefits,Work-life balance', // Job satisfaction factors
            q4: 'Agree',           // Inclusion and respect
            q5: 'Good',            // Collaboration
            q6: 'Agree',           // Communication
            q7: 'Agree',           // Manager support
            q8: 'Agree',           // Leadership trust
            q9: 'Providing Vision and Direction,Empowering Employees,Transparent Communication,Recognizing Achievements', // Leadership qualities
            q10: 'Agree',          // Career growth
            q11: 'External Workshops & Certifications,Training Programs', // Development opportunities
            q12: 'Agree',          // Work motivation
            q13: 'Great work environment and supportive team' // Additional feedback
        }
    },
    // Template 2: Neutral responses
    {
        name: 'Neutral Employee',
        responses: {
            q1: 'Neutral',
            q2: 'Neutral',
            q3: 'Company culture,Other',
            q4: 'Neutral',
            q5: 'Neutral',
            q6: 'Neutral',
            q7: 'Neutral',
            q8: 'Neutral',
            q9: 'Transparent Communication,Recognizing Achievements,Providing Vision and Direction,Empowering Employees',
            q10: 'Neutral',
            q11: 'Cross-departmental Projects,Mentorship & Coaching',
            q12: 'Neutral',
            q13: 'Things are okay, could be better'
        }
    },
    // Template 3: Mixed responses
    {
        name: 'Mixed Employee',
        responses: {
            q1: 'Strongly Agree',
            q2: 'Agree',
            q3: 'Career development opportunities,Recognition for achievements',
            q4: 'Agree',
            q5: 'Excellent',
            q6: 'Strongly Agree',
            q7: 'Strongly Agree',
            q8: 'Strongly Agree',
            q9: 'Empowering Employees,Providing Vision and Direction,Transparent Communication,Recognizing Achievements',
            q10: 'Strongly Agree',
            q11: 'Leadership Development Programs,External Workshops & Certifications',
            q12: 'Strongly Agree',
            q13: 'Love the team and opportunities for growth'
        }
    },
    // Template 4: Some concerns
    {
        name: 'Concerned Employee',
        responses: {
            q1: 'Agree',
            q2: 'Neutral',
            q3: 'Work-life balance,Company culture',
            q4: 'Neutral',
            q5: 'Poor',
            q6: 'Disagree',
            q7: 'Neutral',
            q8: 'Neutral',
            q9: 'Recognizing Achievements,Transparent Communication,Empowering Employees,Providing Vision and Direction',
            q10: 'Neutral',
            q11: 'Mentorship & Coaching,Training Programs',
            q12: 'Disagree',
            q13: 'Need better work-life balance and clearer communication'
        }
    }
];

async function getPublishedSurveys() {
    try {
        console.log('📋 Fetching published surveys...');
        const response = await axios.get(`${API_BASE_URL}/surveys/published`);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching surveys:', error.message);
        return [];
    }
}

async function loginUser(email, password) {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password
        });
        return response.data.token;
    } catch (error) {
        console.error(`❌ Login failed for ${email}:`, error.message);
        return null;
    }
}

async function submitSurveyResponse(surveyId, responses, token) {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/surveys/${surveyId}/responses`,
            { responses },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(`❌ Survey submission failed:`, error.response?.data || error.message);
        return null;
    }
}

async function getDashboardAnalytics(token) {
    try {
        const response = await axios.get(`${API_BASE_URL}/surveys/analytics/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching dashboard analytics:', error.message);
        return null;
    }
}

async function participateInSurveys() {
    console.log('🎯 Starting survey participation script...\n');

    // Load test accounts
    const accountsFile = path.join(__dirname, 'test-accounts.json');
    if (!fs.existsSync(accountsFile)) {
        console.error('❌ Test accounts file not found. Please run create-test-accounts.js first.');
        return;
    }

    const accounts = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
    console.log(`📊 Loaded ${accounts.length} test accounts\n`);

    // Get published surveys
    const surveys = await getPublishedSurveys();
    if (surveys.length === 0) {
        console.log('⚠️  No published surveys found. Please create and publish a survey first.');
        return;
    }

    console.log(`📋 Found ${surveys.length} published survey(s)`);
    surveys.forEach(survey => {
        console.log(`  - ${survey.title} (ID: ${survey.id})`);
    });
    console.log();

    const results = {
        successful: 0,
        failed: 0,
        alreadyResponded: 0,
        details: []
    };

    // Process each account
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        console.log(`👤 Processing account ${i + 1}/${accounts.length}: ${account.firstName} ${account.lastName}`);

        // Login to get fresh token
        const token = await loginUser(account.email, account.password);
        if (!token) {
            console.log(`❌ Failed to login: ${account.email}`);
            results.failed++;
            results.details.push({
                account: account.email,
                status: 'login_failed',
                error: 'Could not authenticate'
            });
            continue;
        }

        // Select a random response template
        const template = responseTemplates[i % responseTemplates.length];
        console.log(`📝 Using response template: ${template.name}`);

        // Submit responses to each survey
        for (const survey of surveys) {
            console.log(`  📊 Submitting to survey: ${survey.title}`);

            // Convert template responses to API format
            const apiResponses = survey.questions.map(question => {
                const templateKey = `q${question.order}`;
                const templateValue = template.responses[templateKey];

                if (!templateValue) {
                    // Generate random response for missing template data
                    if (question.type === 'RATING_SCALE') {
                        return {
                            questionId: question.id,
                            value: Math.floor(Math.random() * 5) + 1
                        };
                    } else if (question.type === 'CHECKBOX') {
                        const selectedOptions = question.options.slice(0, Math.floor(Math.random() * 3) + 1);
                        return {
                            questionId: question.id,
                            value: selectedOptions.join(',')
                        };
                    } else {
                        return {
                            questionId: question.id,
                            value: 'Sample response'
                        };
                    }
                }

                // Convert template value to appropriate format
                if (question.type === 'RATING_SCALE') {
                    const scaleMap = {
                        'Strongly Disagree': 1,
                        'Disagree': 2,
                        'Neutral': 3,
                        'Agree': 4,
                        'Strongly Agree': 5
                    };
                    return {
                        questionId: question.id,
                        value: scaleMap[templateValue] || 3
                    };
                } else {
                    return {
                        questionId: question.id,
                        value: templateValue
                    };
                }
            });

            const submissionResult = await submitSurveyResponse(survey.id, apiResponses, token);

            if (submissionResult) {
                console.log(`    ✅ Response submitted successfully`);
                results.successful++;
                results.details.push({
                    account: account.email,
                    survey: survey.title,
                    status: 'success',
                    responseId: submissionResult.id
                });
            } else {
                console.log(`    ❌ Failed to submit response`);
                results.failed++;
                results.details.push({
                    account: account.email,
                    survey: survey.title,
                    status: 'submission_failed',
                    error: 'API error'
                });
            }

            // Small delay between submissions
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log();
    }

    // Display results
    console.log('📊 Survey Participation Results:');
    console.log(`✅ Successful submissions: ${results.successful}`);
    console.log(`❌ Failed submissions: ${results.failed}`);
    console.log(`⚠️  Already responded: ${results.alreadyResponded}`);

    // Save detailed results
    const resultsFile = path.join(__dirname, 'survey-participation-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsFile}`);

    return results;
}

async function verifyDashboardSync() {
    console.log('\n🔍 Verifying dashboard sync...');

    // Try to get dashboard analytics (this would normally require HR login)
    // For now, we'll just check if the API endpoint is accessible
    try {
        const response = await axios.get(`${API_BASE_URL}/surveys/analytics/dashboard`);
        console.log('✅ Dashboard analytics endpoint is accessible');
        console.log(`📊 Total responses: ${response.data.totalResponses}`);
        console.log(`📋 Total surveys: ${response.data.totalSurveys}`);
        console.log(`👥 Recent responses: ${response.data.recentResponses?.length || 0}`);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('⚠️  Dashboard analytics requires HR authentication (expected)');
        } else {
            console.log('❌ Error accessing dashboard analytics:', error.message);
        }
    }
}

// Run the script
if (require.main === module) {
    participateInSurveys()
        .then(async (results) => {
            console.log('\n🎉 Survey participation completed!');
            await verifyDashboardSync();
            console.log('\n✨ Check the HR dashboard to see the new survey responses!');
        })
        .catch(error => {
            console.error('❌ Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { participateInSurveys, verifyDashboardSync };
