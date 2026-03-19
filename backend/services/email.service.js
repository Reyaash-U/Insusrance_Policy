import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

// ─── Transporter ────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection on startup (non-blocking)
transporter.verify((err) => {
  if (err) {
    logger.warn(`SMTP connection failed: ${err.message}`);
  } else {
    logger.info("SMTP server is ready to send emails.");
  }
});

// ─── Base Sender ────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Insurance System <no-reply@insurance.com>",
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to} — MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw new Error("Email could not be sent. Please try again later.");
  }
};

// ─── Email Templates ────────────────────────────────────────

const baseTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0f0f1a; font-family: 'Segoe UI', sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: rgba(255,255,255,0.04); border: 1px solid rgba(99,102,241,0.3); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #fff; letter-spacing: 1px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 13px; }
    .body { padding: 36px 40px; }
    .body p { line-height: 1.7; color: #cbd5e1; font-size: 15px; }
    .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .note { font-size: 13px; color: #94a3b8; margin-top: 20px; }
    .footer { padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>&#9670; Insurance System</h1>
      <p>Secure. Scalable. Trusted.</p>
    </div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Insurance System. All rights reserved.<br/>
      This is an automated email — please do not reply.
    </div>
  </div>
</body>
</html>
`;

// ─── Specific Email Senders ──────────────────────────────────

/**
 * Sends an email verification link to a newly registered user.
 */
export const sendVerificationEmail = async (user, verificationToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  const body = `
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p>Welcome to the Insurance System! Please verify your email address to activate your account.</p>
    <a href="${verifyUrl}" class="btn">Verify My Email</a>
    <p class="note">This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.</p>
    <p class="note">Or copy this URL into your browser:<br/><span style="color:#818cf8;">${verifyUrl}</span></p>
  `;

  await sendEmail({
    to: user.email,
    subject: "Verify your email — Insurance System",
    html: baseTemplate("Email Verification", body),
  });
};

/**
 * Sends a welcome email after successful verification.
 */
export const sendWelcomeEmail = async (user) => {
  const dashboardUrl = `${process.env.CLIENT_URL}/dashboard`;

  const body = `
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p>Your email has been verified successfully. Your account is now active and ready to use.</p>
    <a href="${dashboardUrl}" class="btn">Go to Dashboard</a>
    <p class="note">Your registered role is: <strong>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong></p>
  `;

  await sendEmail({
    to: user.email,
    subject: "Welcome to Insurance System!",
    html: baseTemplate("Welcome!", body),
  });
};

/**
 * Sends a password reset link.
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const body = `
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to set a new password.</p>
    <a href="${resetUrl}" class="btn">Reset My Password</a>
    <p class="note">This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email — your account remains secure.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: "Password Reset Request — Insurance System",
    html: baseTemplate("Reset Your Password", body),
  });
};
