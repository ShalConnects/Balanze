# Last Wish - Digital Time Capsule Feature

## Overview

The Last Wish feature is a digital time capsule system that allows users to set up automatic delivery of their financial data to designated recipients if they don't check in with the system within a specified timeframe. This ensures that important financial information is preserved and shared with loved ones when needed.

## Features

### 🔐 Secure Data Management
- End-to-end encrypted data storage
- User-controlled data selection
- Secure recipient management
- Audit logging for all activities

### ⏰ Automated Check-in System
- Configurable check-in frequency (7, 14, 30, 60, 90 days)
- Automatic reminders and notifications
- Grace period handling
- Overdue detection and processing

### 📧 Automated Delivery System
- Email-based data delivery
- Multiple recipient support
- Delivery status tracking
- Error handling and retry mechanisms

### 🎛️ User Control
- Enable/disable functionality
- Customizable data inclusion
- Personal message attachment
- Recipient management

## Database Schema

### `last_wish_settings` Table
```sql
CREATE TABLE last_wish_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    check_in_frequency INTEGER DEFAULT 30,
    last_check_in TIMESTAMP WITH TIME ZONE,
    recipients JSONB DEFAULT '[]'::jsonb,
    include_data JSONB DEFAULT '{
        "accounts": true,
        "transactions": true,
        "purchases": true,
        "lendBorrow": true,
        "savings": true,
        "analytics": true
    }'::jsonb,
    message TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `last_wish_deliveries` Table
```sql
CREATE TABLE last_wish_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    delivery_data JSONB NOT NULL,
    delivery_status TEXT DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup Instructions

### 1. Database Setup
Run the SQL migration to create the necessary tables:

```bash
# Apply the database migration
psql -d your_database -f create_last_wish_table.sql
```

### 2. Environment Variables
Set up the following environment variables for the service:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Service Installation
Install the Last Wish service:

```bash
# Navigate to the service directory
cd last-wish-service

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 4. Service Deployment
Deploy the service as a cron job or background process:

```bash
# For development
npm run dev

# For production (add to crontab)
# Run every hour
0 * * * * /usr/bin/node /path/to/last-wish-service.js

# Or use PM2 for process management
pm2 start last-wish-service.js --name "last-wish-service"
```

## User Interface

### Settings Tab
The Last Wish feature is accessible through the Settings page with a dedicated "Last Wish" tab that includes:

- **Enable/Disable Toggle**: Activate or deactivate the feature
- **Check-in Frequency**: Select how often to check in (7-90 days)
- **Recipient Management**: Add, edit, or remove recipients
- **Data Selection**: Choose which data types to include
- **Personal Message**: Add a custom message for recipients
- **Status Display**: Show current status and days until next check-in

### Key Components

#### LastWish.tsx
Main component handling the user interface and settings management.

#### RecipientModal.tsx
Modal for adding and editing recipients with validation.

#### Background Service
Node.js service that runs periodically to check for overdue users and trigger deliveries.

## Security Considerations

### Data Protection
- All sensitive data is encrypted at rest
- Recipient information is stored securely
- Delivery logs are maintained for audit purposes
- User consent is required for all operations

### Access Control
- Row Level Security (RLS) policies ensure users can only access their own data
- Service account has minimal required permissions
- All operations are logged for security auditing

### Privacy Compliance
- GDPR-compliant data handling
- User data export and deletion capabilities
- Clear privacy policy and terms of service

## API Endpoints

### Frontend Integration
The feature integrates with the existing Supabase client:

```typescript
// Load user settings
const { data, error } = await supabase
  .from('last_wish_settings')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Save settings
const { error } = await supabase
  .from('last_wish_settings')
  .upsert({
    user_id: user.id,
    is_enabled: true,
    check_in_frequency: 30,
    recipients: [...],
    include_data: {...},
    message: 'Personal message'
  });

// Check in
const { error } = await supabase
  .from('last_wish_settings')
  .update({ last_check_in: new Date().toISOString() })
  .eq('user_id', user.id);
```

## Monitoring and Logging

### Service Logs
The service maintains detailed logs in `last-wish-logs.txt`:

```
[2024-01-15T10:30:00.000Z] Starting Last Wish service...
[2024-01-15T10:30:01.000Z] Checking for overdue Last Wish users...
[2024-01-15T10:30:01.500Z] Found 2 overdue users
[2024-01-15T10:30:02.000Z] Processing overdue user: user@example.com (5 days overdue)
[2024-01-15T10:30:03.000Z] Sent data to recipient: recipient@example.com
[2024-01-15T10:30:04.000Z] Successfully processed user: user@example.com
```

### Database Monitoring
Monitor the following tables for system health:

```sql
-- Check active users
SELECT COUNT(*) FROM last_wish_settings WHERE is_enabled = TRUE;

-- Check overdue users
SELECT * FROM check_overdue_last_wish();

-- Check delivery status
SELECT delivery_status, COUNT(*) 
FROM last_wish_deliveries 
GROUP BY delivery_status;
```

## Troubleshooting

### Common Issues

1. **Service not running**
   - Check environment variables
   - Verify Supabase connection
   - Check service logs

2. **Emails not sending**
   - Verify SMTP configuration
   - Check email credentials
   - Review delivery logs

3. **Data not updating**
   - Check RLS policies
   - Verify user permissions
   - Review database logs

### Debug Commands

```bash
# Test database connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
supabase.from('last_wish_settings').select('count').then(console.log);
"

# Test email configuration
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
transporter.verify().then(console.log).catch(console.error);
"
```

## Future Enhancements

### Planned Features
- SMS notifications for check-ins
- Multiple delivery methods (cloud storage, physical mail)
- Legal document integration
- Family account management
- Advanced encryption options

### Integration Opportunities
- Estate planning services
- Legal document storage
- Financial advisor integration
- Insurance company partnerships

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**Important**: This feature handles sensitive personal and financial data. Always ensure proper security measures are in place and comply with relevant privacy laws and regulations. 