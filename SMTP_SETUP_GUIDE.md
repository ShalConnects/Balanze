# Gmail SMTP Setup Guide for Balanze SaaS

This guide will help you set up Gmail SMTP to fix the email rate limit issue in your Balanze application.

## 🚨 **Why This is Needed**

Your Supabase project has hit the email rate limit due to bounced emails. Setting up custom SMTP will:
- ✅ Bypass Supabase email limits
- ✅ Provide reliable email delivery
- ✅ Enable proper user registration
- ✅ Support password reset functionality

## 📧 **Step 1: Prepare Your Gmail Account**

### **1.1 Enable 2-Factor Authentication**
1. Go to: https://myaccount.google.com/
2. Click **"Security"** in the left sidebar
3. Find **"2-Step Verification"** and click on it
4. Follow the setup process to enable 2FA
5. Verify with your phone or backup codes

### **1.2 Generate App Password**
1. Go to: https://myaccount.google.com/security
2. Click **"2-Step Verification"** (should show as "On")
3. Scroll down and click **"App passwords"**
4. Select **"Mail"** from the dropdown
5. Click **"Generate"**
6. **Copy the 16-character password** (format: `abcd efgh ijkl mnop`)

## ⚙️ **Step 2: Configure Supabase SMTP**

### **2.1 Access Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/xgncksougafnfbtusfnf/settings/auth
2. Click **"Auth"** in the left sidebar
3. Click **"Settings"** tab
4. Scroll down to **"SMTP Settings"**

### **2.2 Enter SMTP Configuration**
Fill in these exact values:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-gmail@gmail.com
SMTP Pass: [your-16-character-app-password]
```

### **2.3 Save Configuration**
1. Click **"Save"** or **"Update"**
2. Wait for confirmation that settings are saved

## 🧪 **Step 3: Test the Configuration**

### **3.1 Run Test Script**
```bash
cd /Users/shalconnects/Downloads/Balanze
node test_smtp.js
```

### **3.2 Manual Test**
1. Go to your Balanze app: https://balanze.cash
2. Try to register a new user
3. Check if you receive the verification email
4. Try password reset functionality

## ✅ **Step 4: Verify Everything Works**

### **4.1 Test User Registration**
1. Register with a real email address
2. Check your email for verification link
3. Click the verification link
4. Login to the application
5. Verify you can access all features

### **4.2 Test Password Reset**
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check email for reset link
5. Reset password and login

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **Issue: "Invalid credentials"**
- **Solution**: Make sure you're using the App Password, not your regular Gmail password
- **Check**: Verify 2FA is enabled and App Password is generated

#### **Issue: "Connection refused"**
- **Solution**: Check your firewall settings
- **Alternative**: Try port 465 with SSL instead of 587

#### **Issue: "Rate limit exceeded"**
- **Solution**: Wait 24 hours for Supabase rate limit to reset
- **Alternative**: Use a different Gmail account

#### **Issue: "Email not received"**
- **Solution**: Check spam folder
- **Alternative**: Verify email address is correct

## 📋 **SMTP Configuration Checklist**

- [ ] 2-Factor Authentication enabled on Gmail
- [ ] App Password generated for "Mail"
- [ ] SMTP settings configured in Supabase
- [ ] Test email sent successfully
- [ ] User registration working
- [ ] Password reset working
- [ ] Email verification working

## 🎯 **Expected Results**

After successful setup:
- ✅ User registration sends verification emails
- ✅ Password reset sends reset emails
- ✅ No more "rate limit" errors
- ✅ Professional email delivery
- ✅ Reliable SaaS functionality

## 📞 **Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all steps were completed
3. Test with a different Gmail account
4. Contact support if issues persist

## 🚀 **Next Steps**

Once SMTP is configured:
1. Test all email functionality
2. Monitor email delivery rates
3. Set up email templates if needed
4. Consider email service providers for production scale

---

**Your Balanze SaaS will be fully functional once SMTP is properly configured!** 🎉 