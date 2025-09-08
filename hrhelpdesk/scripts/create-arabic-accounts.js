const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3000/api';

// Arabic names for test accounts
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

async function createArabicAccounts() {
    console.log('🚀 Creating 10 Arabic Test Accounts');
    console.log('='.repeat(50));

    const createdAccounts = [];
    const failedAccounts = [];

    for (let i = 0; i < arabicNames.length; i++) {
        const account = arabicNames[i];
        const employeeId = `EMP${Date.now()}${i}`;

        try {
            console.log(`\n${i + 1}️⃣ Creating account: ${account.firstName} ${account.lastName}`);
            console.log(`📧 Email: ${account.email}`);
            console.log(`🆔 Employee ID: ${employeeId}`);

            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                email: account.email,
                password: 'password123',
                firstName: account.firstName,
                lastName: account.lastName,
                employeeId: employeeId,
                role: 'employee'
            });

            console.log('✅ Account created successfully');
            createdAccounts.push({
                ...account,
                employeeId,
                id: response.data.user.id,
                status: 'success'
            });

        } catch (error) {
            console.error('❌ Failed to create account:', error.response?.data?.message || error.message);
            failedAccounts.push({
                ...account,
                employeeId,
                error: error.response?.data?.message || error.message,
                status: 'failed'
            });
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Save results to file
    const results = {
        timestamp: new Date().toISOString(),
        total: arabicNames.length,
        successful: createdAccounts.length,
        failed: failedAccounts.length,
        createdAccounts,
        failedAccounts
    };

    fs.writeFileSync('arabic-accounts-results.json', JSON.stringify(results, null, 2));

    // Summary
    console.log('\n📊 CREATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${createdAccounts.length}/${arabicNames.length}`);
    console.log(`❌ Failed: ${failedAccounts.length}/${arabicNames.length}`);

    if (createdAccounts.length > 0) {
        console.log('\n✅ SUCCESSFULLY CREATED ACCOUNTS:');
        createdAccounts.forEach((account, index) => {
            console.log(`  ${index + 1}. ${account.firstName} ${account.lastName} (${account.email})`);
        });
    }

    if (failedAccounts.length > 0) {
        console.log('\n❌ FAILED ACCOUNTS:');
        failedAccounts.forEach((account, index) => {
            console.log(`  ${index + 1}. ${account.firstName} ${account.lastName} - ${account.error}`);
        });
    }

    console.log('\n📁 Results saved to: arabic-accounts-results.json');
    console.log('\n🎯 NEXT STEP: Run the survey participation script');
    console.log('   Command: node participate-arabic-survey.js');

    return results;
}

// Run the script
createArabicAccounts().catch(console.error);
