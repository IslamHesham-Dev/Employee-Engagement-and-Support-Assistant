const { createTestAccounts } = require('./create-test-accounts');
const { participateInSurveys, verifyDashboardSync } = require('./survey-participation');

async function runTestSuite() {
    console.log('🚀 Starting HR Dashboard Test Suite\n');
    console.log('='.repeat(50));

    try {
        // Step 1: Create test accounts
        console.log('\n📝 STEP 1: Creating Test Accounts');
        console.log('-'.repeat(30));
        const accounts = await createTestAccounts();

        if (accounts.length === 0) {
            console.log('❌ No accounts were created. Exiting...');
            return;
        }

        // Step 2: Wait a moment for accounts to be fully processed
        console.log('\n⏳ Waiting for accounts to be processed...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Have accounts participate in surveys
        console.log('\n📊 STEP 2: Survey Participation');
        console.log('-'.repeat(30));
        const results = await participateInSurveys();

        // Step 4: Verify dashboard sync
        console.log('\n🔍 STEP 3: Dashboard Verification');
        console.log('-'.repeat(30));
        await verifyDashboardSync();

        // Final summary
        console.log('\n🎉 TEST SUITE COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(50));
        console.log(`✅ Created/Retrieved: ${accounts.length} accounts`);
        console.log(`📊 Survey submissions: ${results?.successful || 0} successful`);
        console.log(`❌ Failed submissions: ${results?.failed || 0}`);

        console.log('\n📋 Next Steps:');
        console.log('1. Open the HR dashboard in your browser');
        console.log('2. Navigate to the Survey Insights section');
        console.log('3. Verify that new survey responses are visible');
        console.log('4. Check that the dashboard updates in real-time');

        console.log('\n🌐 Dashboard URL: http://localhost:3001');
        console.log('📊 HR Dashboard: http://localhost:3001 (Login as HR user)');

    } catch (error) {
        console.error('\n❌ TEST SUITE FAILED:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test suite
if (require.main === module) {
    runTestSuite();
}

module.exports = { runTestSuite };
