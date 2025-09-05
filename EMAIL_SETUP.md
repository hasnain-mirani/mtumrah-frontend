# Email Setup Instructions

To enable email functionality for booking confirmations and inquiry notifications, you need to configure email settings.

## 1. Create Environment File

Create a `.env` file in the `server` directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/mtumrah-portal

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES=7d

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@mtumrah.com

# Server
PORT=7000
NODE_ENV=development
```

## 2. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS`

## 3. Other Email Providers

You can also use other email services by modifying `server/utils/emailService.js`:

### Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Yahoo
```javascript
const transporter = nodemailer.createTransporter({
  service: 'yahoo',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 4. Features

Once configured, the system will:

- ✅ **Send booking confirmation emails** to customers when bookings are created
- ✅ **Send inquiry notification emails** to admin when customers submit inquiries
- ✅ **Display inquiries** in the admin/agent dashboard
- ✅ **Public contact form** available at `/contact`

## 5. Testing

1. Start the server: `npm run dev` (in server directory)
2. Create a booking to test confirmation email
3. Visit `/contact` to test inquiry form
4. Check admin dashboard to see inquiries

## 6. Troubleshooting

- **"Invalid login"**: Check your email credentials and app password
- **"Connection timeout"**: Check your internet connection and email provider settings
- **Emails not received**: Check spam folder and email provider settings
