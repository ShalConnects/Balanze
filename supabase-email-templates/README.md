# Supabase Email Templates for Balanze

This directory contains custom email templates for all Supabase authentication email types, designed with consistent Balanze branding and modern styling.

## 📧 Available Templates

1. **confirm-signup.html** - Email confirmation for new user signups
2. **invite-user.html** - Invitation emails for new users
3. **magic-link.html** - Passwordless login magic links
4. **change-email.html** - Email address change confirmation
5. **reauthentication.html** - Security reauthentication for sensitive actions

## 🎨 Design Features

All templates include:
- **Consistent Balanze branding** with logo and color scheme
- **Responsive design** that works on all devices
- **Modern gradient styling** (blue to purple)
- **Security-focused messaging** with appropriate icons
- **Fallback text links** for accessibility
- **Professional footer** with company information

## 🚀 How to Use

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. You'll see different template types listed

### Step 2: Update Each Template
For each email type, follow these steps:

1. **Click on the template type** (e.g., "Confirm signup")
2. **Copy the HTML content** from the corresponding file in this directory
3. **Paste it into the template editor** in Supabase
4. **Save the template**

### Step 3: Template Variables
All templates use Supabase's standard template variables:
- `{{ .ConfirmationURL }}` - The confirmation/action URL
- `{{ .Email }}` - User's email address (if needed)
- `{{ .Token }}` - Security token (if needed)

## 📋 Template Mapping

| Supabase Template Type | File Name | Description |
|------------------------|-----------|-------------|
| Confirm signup | `confirm-signup.html` | Welcome new users and confirm email |
| Invite user | `invite-user.html` | Invite new users to join |
| Magic Link | `magic-link.html` | Passwordless login links |
| Change email address | `change-email.html` | Confirm new email address |
| Reauthentication | `reauthentication.html` | Security verification for sensitive actions |

## 🎯 Customization

### Colors
The templates use Balanze's brand colors:
- **Primary Gradient**: `#2563eb` to `#9333ea` (blue to purple)
- **Text**: `#374151` (gray-700)
- **Background**: `#f9fafb` (gray-50)

### Logo
The templates use a simple "B" icon for Balanze. You can replace this with:
- Your actual logo image
- A different icon
- Text-only branding

### Content
Each template has specific messaging for its purpose:
- **Welcome messages** for new users
- **Security notices** for sensitive actions
- **Clear call-to-action buttons**
- **Helpful information boxes**

## 🔧 Technical Notes

- All templates are **mobile-responsive**
- Use **inline CSS** for maximum email client compatibility
- Include **fallback text links** for accessibility
- **Template variables** are properly escaped for security

## 📱 Testing

After updating templates in Supabase:
1. **Test each email type** by triggering the corresponding action
2. **Check on different devices** (desktop, mobile, tablet)
3. **Verify in different email clients** (Gmail, Outlook, Apple Mail)
4. **Ensure all links work correctly**

## 🚨 Important Notes

- **Always test** templates before going live
- **Keep backups** of your original templates
- **Monitor email delivery** rates after changes
- **Update templates** if you change branding or messaging

## 📞 Support

If you need help with these templates:
1. Check Supabase documentation for email template configuration
2. Test SMTP settings if emails aren't being delivered
3. Verify template syntax if emails appear broken

---

**Balanze** - Manage your finances with confidence
