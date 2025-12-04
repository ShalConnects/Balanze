# Last Wish System Testing Guide

This guide provides comprehensive testing instructions for the Last Wish digital time capsule system.

## 🎯 Overview

The Last Wish system allows users to set up automatic delivery of their financial data to designated recipients if they don't check in within a specified time period. This guide covers testing all aspects of the system.

## 📋 Test Scripts Available

### 1. Quick Test Script (`quick-test-last-wish.js`)
**Purpose**: Immediate verification that the system is working
**Usage**: `node quick-test-last-wish.js`
**Tests**:
- CORS configuration
- API endpoint availability
- Email API functionality
- OPTIONS preflight requests

### 2. Simple Test Script (`test-last-wish-simple.js`)
**Purpose**: Comprehensive testing without complex dependencies
**Usage**: `node test-last-wish-simple.js`
**Tests**:
- All quick test features
- Error handling
- Response times
- Invalid input handling

### 3. Comprehensive Test Script (`test-last-wish-comprehensive.js`)
**Purpose**: Full system testing with database operations
**Usage**: `node test-last-wish-comprehensive.js`
**Requirements**: Supabase credentials and environment variables
**Tests**:
- Database operations
- Settings CRUD
- Data gathering
- Check-in system
- Delivery logs
- Test mode functionality
- Security and permissions
- Performance and edge cases

### 4. Browser Test Suite (`test-last-wish-browser.html`)
**Purpose**: Interactive testing in a web browser
**Usage**: Open the HTML file in a web browser
**Features**:
- Interactive test interface
- Real-time results
- Configuration options
- Visual progress tracking

## 🚀 Quick Start Testing

### Step 1: Run Quick Test
```bash
node quick-test-last-wish.js
```

This will immediately tell you if the basic system is working.

### Step 2: Open Browser Test Suite
Open `test-last-wish-browser.html` in your browser for interactive testing.

### Step 3: Run Comprehensive Tests (Optional)
If you have Supabase credentials configured:
```bash
node test-last-wish-comprehensive.js
```

## 🧪 Test Categories

### 1. CORS and API Tests
- **CORS Configuration**: Verifies cross-origin requests work
- **API Endpoints**: Tests all Last Wish API endpoints
- **Preflight Requests**: Ensures OPTIONS requests work properly

### 2. Email Functionality Tests
- **Test Mode**: Sends test emails without real data
- **Real Email**: Sends actual emails (use with caution)
- **Email Templates**: Tests email content generation
- **SMTP Configuration**: Verifies email server setup

### 3. Database Operations Tests
- **Settings CRUD**: Create, read, update, delete Last Wish settings
- **Data Gathering**: Tests collection of user financial data
- **Check-in System**: Tests the check-in tracking mechanism
- **Delivery Logs**: Tests email delivery logging

### 4. Security and Error Handling Tests
- **Invalid Inputs**: Tests handling of bad data
- **Missing Data**: Tests handling of incomplete requests
- **Security Headers**: Verifies proper security headers
- **RLS Policies**: Tests Row Level Security

### 5. Performance Tests
- **Response Times**: Ensures APIs respond quickly
- **Concurrent Requests**: Tests system under load
- **Large Payloads**: Tests handling of large data

## 🔧 Configuration

### Environment Variables
For comprehensive testing, set these environment variables:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# SMTP Configuration (for email tests)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Test Configuration
TEST_USER_ID=test-user-123
TEST_EMAIL=test@example.com
TEST_RECIPIENT_EMAIL=recipient@example.com
```

### API Configuration
The test scripts use these default API endpoints:
- Base URL: `https://balanze.cash/api`
- CORS Test: `/cors-test`
- Last Wish Check: `/last-wish-check`
- Last Wish Public: `/last-wish-public`
- Send Email: `/send-last-wish-email`

## 📊 Expected Results

### Successful Test Results
- ✅ All CORS headers present
- ✅ API endpoints responding (200-499 status codes)
- ✅ JSON responses valid
- ✅ Error handling working properly
- ✅ Response times under 5 seconds

### Common Issues and Solutions

#### CORS Errors
**Problem**: `Access-Control-Allow-Origin` header missing
**Solution**: Deploy the updated CORS configuration

#### API Not Found (404)
**Problem**: API endpoints returning 404
**Solution**: Ensure API routes are deployed to Vercel

#### SMTP Not Configured
**Problem**: Email tests failing with SMTP errors
**Solution**: Set up SMTP credentials in environment variables

#### Database Connection Issues
**Problem**: Database operations failing
**Solution**: Verify Supabase credentials and connection

## 🎯 Test Scenarios

### Scenario 1: New User Setup
1. User enables Last Wish system
2. Adds recipients
3. Sets check-in frequency
4. Writes personal message
5. Tests email functionality

### Scenario 2: Check-in Process
1. User checks in before deadline
2. System resets check-in timer
3. No emails are sent
4. Status remains active

### Scenario 3: Overdue User
1. User doesn't check in by deadline
2. System detects overdue status
3. Emails are sent to recipients
4. System marks as delivered
5. Status becomes inactive

### Scenario 4: Test Mode
1. User enables test mode
2. System uses shorter time intervals (hours vs days)
3. Test emails are sent
4. No real data is shared

## 🔍 Debugging

### Check API Status
```bash
curl -X GET https://balanze.cash/api/cors-test
```

### Test CORS Manually
```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://balanze.cash/api/send-last-wish-email
```

### Check Database Connection
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
supabase.from('last_wish_settings').select('count').then(console.log);
"
```

## 📝 Test Checklist

### Pre-Deployment Testing
- [ ] CORS configuration working
- [ ] All API endpoints responding
- [ ] Database operations working
- [ ] Email functionality working
- [ ] Error handling working
- [ ] Security headers present

### Post-Deployment Testing
- [ ] Frontend can access APIs
- [ ] Real email sending works
- [ ] Check-in system functional
- [ ] Overdue detection working
- [ ] Data gathering complete
- [ ] Delivery logging working

### Production Readiness
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Error handling robust
- [ ] Monitoring in place
- [ ] Documentation complete

## 🚨 Important Notes

1. **Test Mode**: Always use test mode for initial testing to avoid sending real emails
2. **SMTP Limits**: Be aware of email sending limits to avoid being blocked
3. **Database Cleanup**: Test scripts may create test data that should be cleaned up
4. **Rate Limiting**: Don't run tests too frequently to avoid rate limiting
5. **Real Emails**: Only test real email sending with explicit permission

## 📞 Support

If tests fail or you encounter issues:

1. Check the error messages in the test output
2. Verify your configuration and credentials
3. Check the API deployment status
4. Review the CORS configuration
5. Ensure database connectivity

For additional help, refer to the deployment guide and troubleshooting documentation.