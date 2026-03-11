// server/src/services/mailer.js
// Sends transactional emails via SMTP or SendGrid.
// Add new email types as named exports — never build HTML inline in controllers.

import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

// Build transporter once at startup
const createTransporter = () => {
  if (config.emailProvider === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: config.sendgridApiKey },
    });
  }
  return nodemailer.createTransport({
    host:   config.smtp.host,
    port:   config.smtp.port,
    secure: true,
    auth:   { user: config.smtp.user, pass: config.smtp.pass },
  });
};

const transporter = createTransporter();

// Generic send helper
const send = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"SLIET RideShare" <${config.emailFrom}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`);
    throw err;
  }
};

// ─── Email types ──────────────────────────────────────────────────────────────

export const sendVerificationEmail = (email, token) => {
  const link = `${config.frontendUrl}/verify?email=${encodeURIComponent(email)}&token=${token}`;
  return send({
    to: email,
    subject: '✅ Verify your SLIET RideShare account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Welcome to SLIET RideShare 🚗</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold">
          Verify Email
        </a>
        <p style="color:#888;font-size:13px;margin-top:16px">Link expires in 1 hour. If you didn't register, ignore this email.</p>
        <hr/>
        <p style="font-size:12px;color:#aaa">Or copy this link: ${link}</p>
      </div>`,
  });
};

export const sendGroupConfirmedEmail = (email, groupTitle, vehicleInfo, meetingPoint) =>
  send({
    to: email,
    subject: `🎉 Your ride "${groupTitle}" is confirmed!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Ride Confirmed! 🚗</h2>
        <p>Your ride group <strong>${groupTitle}</strong> has been confirmed.</p>
        <p><strong>Vehicle:</strong> ${vehicleInfo || 'TBD'}</p>
        <p><strong>Meeting Point:</strong> ${meetingPoint || 'TBD'}</p>
        <p>Check the app for full details and member contacts.</p>
      </div>`,
  });

export const sendGroupCancelledEmail = (email, groupTitle) =>
  send({
    to: email,
    subject: `❌ Ride "${groupTitle}" has been cancelled`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Ride Cancelled</h2>
        <p>Unfortunately, the ride group <strong>${groupTitle}</strong> has been cancelled by the creator.</p>
        <p>Browse other available rides on SLIET RideShare.</p>
      </div>`,
  });
