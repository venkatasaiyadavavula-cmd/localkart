import * as nodemailer from 'nodemailer';

// Use SendGrid or SMTP
const createTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    // SendGrid
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else {
    // Fallback to SMTP (e.g., Gmail)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
};

export const mailTransporter = createTransporter();

export const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@localkart.com';
