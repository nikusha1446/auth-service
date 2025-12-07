import { Resend } from 'resend';
import { env } from '../../config/env.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (params: SendEmailParams): Promise<boolean> => {
  if (!resend) {
    console.log(
      'Email service not configured. Email would be sent to:',
      params.to
    );
    console.log('Subject:', params.subject);
    console.log('---');
    return true;
  }

  try {
    await resend.emails.send({
      from: 'Auth Service <noreply@yourdomain.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const verificationUrl = `${env.APP_URL}/auth/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: 'Verify your email',
    html: `
      <h1>Welcome!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>Or copy this link: ${verificationUrl}</p>
      <p>This link expires in 24 hours.</p>
    `,
  });
};
