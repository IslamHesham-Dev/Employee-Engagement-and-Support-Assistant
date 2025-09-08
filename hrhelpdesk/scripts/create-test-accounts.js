const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test user data
const testUsers = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@test.com', password: 'password123', role: 'EMPLOYEE' },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@test.com', password: 'password123', role: 'EMPLOYEE' },
    { firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@test.com', password: 'password123', role: 'EMPLOYEE' },
    { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@test.com', password: 'password123', role: 'EMPLOYEE' },
    { firstName: 'David', lastName: 'Brown', email: 'david.brown@test.com', password: 'password123', role: 'EMPLOYEE' },
    { firstName: 'Lisa', lastName: 'Davis', email: 'lisa.davis@test.com', password: 'password123', role: 'EMPLOYEE' },
    { firstName: 'Tom', lastName: 'Wilson', email: 'tom.wilson@test.com', password: 'password123', role: 'EMPLOYEE' },
    { firstName: 'Emma', lastName: 'Garcia', email: 'emma.garcia@test.com', password: 'password123', role: 'EMPLOYEE' },
    { firstName: 'Chris', lastName: 'Martinez', email: 'chris.martinez@test.com', password: 'password123', role: 'EMPLOYEE' },
    { firstName: 'Anna', lastName: 'Anderson', email: 'anna.anderson@test.com', password: 'password123', role: 'EMPLOYEE' }
];

async function createTestAccounts() {
    console.log('🚀 Starting to create test accounts...\n');

    const createdAccounts = [];
    const failedAccounts = [];

    for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];
        console.log(`Creating account ${i + 1}/10: ${user.firstName} ${user.lastName} (${user.email})`);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                password: user.password,
                role: user.role
            });

            if (response.status === 201) {
                console.log(`✅ Account created successfully: ${user.email}`);
                createdAccounts.push({
                    ...user,
                    id: response.data.user.id,
                    employeeId: response.data.user.employeeId
                });
            } else {
                console.log(`❌ Failed to create account: ${user.email} - Status: ${response.status}`);
                failedAccounts.push(user);
            }
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
                console.log(`⚠️  Account already exists: ${user.email}`);
                // Try to login to get the user info
                try {
                    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                        email: user.email,
                        password: user.password
                    });
                    createdAccounts.push({
                        ...user,
                        id: loginResponse.data.user.id,
                        employeeId: loginResponse.data.user.employeeId,
                        token: loginResponse.data.token
                    });
                    console.log(`✅ Retrieved existing account: ${user.email}`);
                } catch (loginError) {
                    console.log(`❌ Failed to login to existing account: ${user.email}`);
                    failedAccounts.push(user);
                }
            } else {
                console.log(`❌ Error creating account: ${user.email} - ${error.message}`);
                failedAccounts.push(user);
            }
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully created/retrieved: ${createdAccounts.length} accounts`);
    console.log(`❌ Failed: ${failedAccounts.length} accounts`);

    if (failedAccounts.length > 0) {
        console.log('\nFailed accounts:');
        failedAccounts.forEach(user => console.log(`  - ${user.email}`));
    }

    // Save created accounts to file for use in survey script
    const fs = require('fs');
    const path = require('path');

    const accountsFile = path.join(__dirname, 'test-accounts.json');
    fs.writeFileSync(accountsFile, JSON.stringify(createdAccounts, null, 2));
    console.log(`\n💾 Account data saved to: ${accountsFile}`);

    return createdAccounts;
}

// Run the script
if (require.main === module) {
    createTestAccounts()
        .then(accounts => {
            console.log('\n🎉 Test account creation completed!');
            console.log(`Ready to use ${accounts.length} accounts for survey testing.`);
        })
        .catch(error => {
            console.error('❌ Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { createTestAccounts, testUsers };
