# Temporary Email Fix

## Quick Solution: Disable Email Confirmation

Since SMTP is not working, you can temporarily disable email confirmation to allow users to register and log in immediately.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to Authentication → Settings

2. **Disable Email Confirmation**
   - Find "Enable email confirmations"
   - **Uncheck** this option
   - Click "Save"

3. **Test Registration**
   - Go to your app: https://balanze.cash
   - Try registering a new user
   - You should be able to log in immediately

4. **Re-enable Later**
   - Once you fix SMTP issues, re-enable email confirmation
   - Go back to Authentication → Settings
   - Check "Enable email confirmations"
   - Save changes

### Why This Works:

- Users can register and log in immediately
- No email confirmation required
- Perfect for development and testing
- Can be re-enabled once SMTP is fixed

### Important Notes:

- This is a temporary solution
- Users won't receive confirmation emails
- Re-enable email confirmation for production
- Consider this for development only

### Alternative: Use SendGrid

If you want to keep email confirmation enabled:

1. Sign up for free SendGrid account
2. Create API key
3. Update Supabase SMTP settings:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: Your SendGrid API key
   - Sender Email: Your verified email

This will provide reliable email delivery for your app. 