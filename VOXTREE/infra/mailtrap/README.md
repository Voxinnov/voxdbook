# Mailtrap Email Testing Setup

This directory contains configuration for using Mailtrap for email testing in development.

## Setup

1. **Create Mailtrap Account**
   - Go to [Mailtrap.io](https://mailtrap.io)
   - Sign up for a free account
   - Create a new inbox for your project

2. **Configure Environment Variables**
   Add these to your `.env` file:

   ```env
   # Mailtrap SMTP Configuration
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_mailtrap_username
   SMTP_PASS=your_mailtrap_password
   SMTP_FROM=noreply@voxtree.com
   ```

3. **Get Mailtrap Credentials**
   - In your Mailtrap dashboard, go to "Email Testing" → "Inboxes"
   - Select your inbox
   - Go to "SMTP Settings" tab
   - Copy the credentials to your `.env` file

## Usage

With Mailtrap configured, all emails sent by the application will be captured in your Mailtrap inbox instead of being sent to real recipients. This is perfect for:

- Testing email templates
- Verifying email content
- Testing email flows without sending real emails
- Development and staging environments

## Email Templates

The application includes several email templates:

- **Task Assignment**: Sent when a user is assigned to a task
- **New Comment**: Sent when someone comments on a task
- **Invoice Sent**: Sent when an invoice is sent to a client
- **Payment Confirmation**: Sent when a payment is received

## Production Email Setup

For production, replace Mailtrap with a real SMTP provider:

```env
# Production SMTP (example with SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com
```

## Testing

To test email functionality:

1. Start the application
2. Perform actions that trigger emails (assign tasks, add comments, etc.)
3. Check your Mailtrap inbox for captured emails
4. Verify email content and formatting

## Troubleshooting

- **Emails not appearing**: Check SMTP credentials and network connectivity
- **Authentication errors**: Verify username and password are correct
- **Connection timeouts**: Check firewall settings and port accessibility
