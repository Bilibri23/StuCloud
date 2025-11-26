# 📧 Email Configuration Guide

This guide explains how to configure email sending for OTP codes in the Distributed Cloud Storage system.

## Quick Setup Options

### Option 1: Gmail (Recommended for Testing)

1. **Enable App Passwords in Gmail:**
   - Go to your Google Account: https://myaccount.google.com/
   - Security → 2-Step Verification (enable if not already)
   - App passwords → Generate app password
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

2. **Update `application.properties`:**
   ```properties
   spring.mail.host=smtp.gmail.com
   spring.mail.port=587
   spring.mail.username=your-email@gmail.com
   spring.mail.password=your-16-char-app-password
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   ```

### Option 2: Outlook/Hotmail

```properties
spring.mail.host=smtp-mail.outlook.com
spring.mail.port=587
spring.mail.username=your-email@outlook.com
spring.mail.password=your-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Option 3: Custom SMTP Server

```properties
spring.mail.host=your-smtp-server.com
spring.mail.port=587
spring.mail.username=your-username
spring.mail.password=your-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

## Environment Variables (Recommended for Production)

Instead of hardcoding credentials, use environment variables:

```properties
spring.mail.host=${MAIL_HOST:smtp.gmail.com}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME:}
spring.mail.password=${MAIL_PASSWORD:}
```

Then set them when running:
```bash
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password
```

Or in IntelliJ Run Configuration:
- Environment variables: `MAIL_USERNAME=your-email@gmail.com;MAIL_PASSWORD=your-app-password`

## Testing Email Configuration

1. Start the application
2. Register a new user via API
3. Check your email inbox (and spam folder)
4. If email fails, check console logs for OTP code (fallback)

## Troubleshooting

### "Authentication failed"
- **Gmail:** Make sure you're using an App Password, not your regular password
- **2FA:** App passwords are required if 2FA is enabled
- Check username/password are correct

### "Connection timeout"
- Check firewall settings
- Verify SMTP host and port are correct
- Try port 465 with SSL instead of 587 with STARTTLS

### "Email not sending but no error"
- Check spam/junk folder
- Verify recipient email is valid
- Check SMTP server logs if available

### Using Port 465 (SSL) instead of 587 (STARTTLS)

```properties
spring.mail.port=465
spring.mail.properties.mail.smtp.ssl.enable=true
spring.mail.properties.mail.smtp.starttls.enable=false
```

## Fallback Behavior

If email is not configured or fails:
- OTP code will be logged to console
- Look for: `📧 EMAIL NOT CONFIGURED - OTP CODE`
- This allows testing without email setup

## Security Notes

⚠️ **Never commit email passwords to Git!**
- Use environment variables
- Add `application-local.properties` to `.gitignore`
- Use secrets management in production

## Example: Gmail Setup Step-by-Step

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Scroll to "App passwords"
4. Click "Select app" → "Mail"
5. Click "Select device" → "Other (Custom name)" → Enter "Distributed Cloud"
6. Click "Generate"
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
8. Use this password (without spaces) in `application.properties`

That's it! Your application will now send beautiful HTML emails with OTP codes.

