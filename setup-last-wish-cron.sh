#!/bin/bash

# Last Wish Service Setup Script
# This script sets up automated email delivery for the Last Wish feature

echo "🔧 Setting up Last Wish automated service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the service file exists
if [ ! -f "last-wish-service.js" ]; then
    echo "❌ last-wish-service.js not found. Please ensure the service file exists."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
EOF
    echo "⚠️  Please edit .env file with your actual credentials"
fi

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test the service
echo "🧪 Testing the service..."
node last-wish-service.js

if [ $? -eq 0 ]; then
    echo "✅ Service test successful!"
    
    # Set up cron job
    echo "⏰ Setting up cron job to run every hour..."
    
    # Get the absolute path to the service
    SERVICE_PATH=$(pwd)/last-wish-service.js
    
    # Create cron job entry
    CRON_JOB="0 * * * * cd $(pwd) && node $SERVICE_PATH >> last-wish-logs.txt 2>&1"
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    
    echo "✅ Cron job installed! The service will run every hour."
    echo "📋 Current cron jobs:"
    crontab -l
    
    echo ""
    echo "🎉 Setup complete! The Last Wish service will now:"
    echo "   • Check for overdue users every hour"
    echo "   • Send emails to recipients when check-in time expires"
    echo "   • Log all activities to last-wish-logs.txt"
    echo ""
    echo "📊 To monitor the service:"
    echo "   • View logs: tail -f last-wish-logs.txt"
    echo "   • Check cron status: systemctl status cron"
    echo "   • Test manually: node last-wish-service.js"
    
else
    echo "❌ Service test failed. Please check your configuration."
    exit 1
fi 