# HR Dashboard Test Scripts

This directory contains automated test scripts to verify the HR dashboard survey functionality and real-time synchronization.

## Prerequisites

1. **Backend Server**: Ensure the backend is running on `http://localhost:5000`
2. **Frontend Server**: Ensure the frontend is running on `http://localhost:3001`
3. **Database**: Ensure the database is running and accessible
4. **Published Survey**: At least one survey should be published and active

## Installation

```bash
cd scripts
npm install
```

## Available Scripts

### 1. Create Test Accounts (`create-test-accounts.js`)
Creates 10 test employee accounts with realistic data.

```bash
npm run create-accounts
# or
node create-test-accounts.js
```

**What it does:**
- Creates 10 employee accounts with different names and emails
- Handles existing accounts gracefully
- Saves account data to `test-accounts.json`

### 2. Survey Participation (`survey-participation.js`)
Has the created accounts participate in published surveys.

```bash
npm run participate
# or
node survey-participation.js
```

**What it does:**
- Loads test accounts from `test-accounts.json`
- Fetches published surveys
- Submits realistic survey responses based on templates
- Saves participation results to `survey-participation-results.json`

### 3. Full Test Suite (`run-test-suite.js`)
Runs the complete test workflow.

```bash
npm run test
# or
node run-test-suite.js
```

**What it does:**
- Creates test accounts
- Has them participate in surveys
- Verifies dashboard synchronization
- Provides comprehensive results

## Test Data

### Account Templates
The scripts create accounts with these patterns:
- **Names**: John Doe, Jane Smith, Mike Johnson, etc.
- **Emails**: john.doe@test.com, jane.smith@test.com, etc.
- **Password**: password123 (for all accounts)
- **Role**: EMPLOYEE

### Response Templates
Survey responses are based on realistic patterns:

1. **Positive Employee**: Generally satisfied, agrees with most statements
2. **Neutral Employee**: Mixed feelings, neutral responses
3. **Mixed Employee**: Very positive about some aspects, neutral about others
4. **Concerned Employee**: Some concerns about work-life balance and communication

## Expected Results

After running the test suite, you should see:

1. **10 new employee accounts** created in the system
2. **Multiple survey responses** submitted by these accounts
3. **Updated HR dashboard** showing new data
4. **Real-time synchronization** working properly

## Verification Steps

1. **Check Backend Logs**: Look for account creation and survey submission logs
2. **Check Database**: Verify accounts and responses are stored
3. **Check HR Dashboard**: 
   - Navigate to `http://localhost:3001`
   - Login as HR user
   - Go to Survey Insights section
   - Verify new data appears
   - Check that metrics update
4. **Check Real-time Updates**: 
   - Keep dashboard open
   - Run survey participation script again
   - Verify dashboard updates automatically

## Troubleshooting

### Common Issues

1. **"No published surveys found"**
   - Solution: Create and publish a survey first through the HR interface

2. **"Account already exists"**
   - Solution: This is handled automatically - existing accounts are retrieved

3. **"Login failed"**
   - Solution: Check that backend is running and database is accessible

4. **"Dashboard analytics requires HR authentication"**
   - Solution: This is expected - the dashboard requires HR login

### Debug Mode

To see more detailed output, you can modify the scripts to include additional logging or run them with debug flags.

## File Structure

```
scripts/
├── package.json                    # Dependencies and scripts
├── README.md                       # This file
├── create-test-accounts.js         # Account creation script
├── survey-participation.js         # Survey participation script
├── run-test-suite.js              # Combined test suite
├── test-accounts.json             # Generated account data
└── survey-participation-results.json # Generated results
```

## API Endpoints Used

- `POST /api/auth/register` - Create new accounts
- `POST /api/auth/login` - Authenticate accounts
- `GET /api/surveys/published` - Get published surveys
- `POST /api/surveys/:id/responses` - Submit survey responses
- `GET /api/surveys/analytics/dashboard` - Get dashboard analytics

## Notes

- Scripts include delays between requests to avoid overwhelming the server
- All test data uses realistic patterns based on the provided CSV data
- Scripts handle errors gracefully and provide detailed feedback
- Generated files can be used for debugging and verification
