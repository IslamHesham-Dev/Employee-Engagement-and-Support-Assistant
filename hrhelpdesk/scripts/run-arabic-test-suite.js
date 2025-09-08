const { exec } = require('child_process');
const path = require('path');

async function runScript(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 Running ${scriptName}...`);
        console.log('='.repeat(60));

        const child = exec(`node ${scriptName}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error running ${scriptName}:`, error.message);
                reject(error);
                return;
            }

            if (stderr) {
                console.error(`⚠️  Warning from ${scriptName}:`, stderr);
            }

            console.log(stdout);
            resolve();
        });

        child.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        child.stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}

async function runArabicTestSuite() {
    console.log('🎯 ARABIC TEST SUITE');
    console.log('='.repeat(60));
    console.log('This script will:');
    console.log('1. Create 10 Arabic test accounts');
    console.log('2. Have them participate in surveys');
    console.log('3. Test dashboard synchronization');
    console.log('='.repeat(60));

    try {
        // Step 1: Create Arabic accounts
        await runScript('create-arabic-accounts.js');

        // Wait a bit between scripts
        console.log('\n⏳ Waiting 3 seconds before running survey participation...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 2: Survey participation
        await runScript('participate-arabic-survey.js');

        console.log('\n🎉 ARABIC TEST SUITE COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('📁 Check the following files for detailed results:');
        console.log('  - arabic-accounts-results.json');
        console.log('  - arabic-survey-participation-results.json');
        console.log('\n🌐 Next steps:');
        console.log('1. Open http://localhost:3001 in your browser');
        console.log('2. Login with hr@test.com / password123');
        console.log('3. Navigate to Survey Insights dashboard');
        console.log('4. Verify you see the new Arabic account responses');

    } catch (error) {
        console.error('\n❌ ARABIC TEST SUITE FAILED:', error.message);
        process.exit(1);
    }
}

// Run the test suite
runArabicTestSuite();
