const nodemailer = require('nodemailer');

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

  if (!host || !port || !user || !pass) return null;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
  };
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@acadia-connect.local';
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const smtp = getSmtpConfig();
  const subject = 'Acadia Connect password reset';
  const text = `You requested a password reset for your Acadia Connect account.\n\nOpen this link to reset your password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;

  // Dev-friendly fallback: if SMTP isn't configured, log the link
  if (!smtp) {
    console.log('[password-reset] SMTP not configured; reset URL:', resetUrl);
    return { simulated: true };
  }

  const transporter = nodemailer.createTransport(smtp);
  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
  });

  return { simulated: false };
}

module.exports = {
  sendPasswordResetEmail,
};
