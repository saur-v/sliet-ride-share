// server/src/services/sms.js
// Optional Twilio SMS integration.
// Only sends if TWILIO_SID, TWILIO_TOKEN, and TWILIO_PHONE are configured.
// Falls back silently if not configured — SMS is always opt-in.

import { config } from '../config/index.js';
import logger from '../utils/logger.js';

let twilioClient = null;

// Lazy-init Twilio only if credentials are present
const getClient = async () => {
  if (twilioClient) return twilioClient;
  if (!config.twilioSid || !config.twilioToken) return null;

  try {
    // Dynamic import so the server starts fine without twilio installed
    const twilio = await import('twilio');
    twilioClient = twilio.default(config.twilioSid, config.twilioToken);
    return twilioClient;
  } catch {
    logger.warn('Twilio not installed. Install with: npm install twilio');
    return null;
  }
};

// ─── Send SMS ─────────────────────────────────────────────────────────────────
const sendSms = async (to, body) => {
  const client = await getClient();
  if (!client) return; // silently skip if not configured

  // Normalise phone: ensure +91 prefix for Indian numbers
  const phone = to.startsWith('+') ? to : `+91${to}`;

  try {
    const msg = await client.messages.create({
      from: config.twilioPhone,
      to:   phone,
      body,
    });
    logger.info(`SMS sent to ${phone}: ${msg.sid}`);
  } catch (err) {
    logger.error(`SMS failed to ${phone}: ${err.message}`);
    // Non-fatal — don't throw
  }
};

// ─── SMS templates ────────────────────────────────────────────────────────────

export const sendGroupConfirmedSms = (contactNo, groupTitle) =>
  sendSms(contactNo, `✅ SLIET RideShare: Your ride "${groupTitle}" has been confirmed! Open the app for vehicle details.`);

export const sendGroupCancelledSms = (contactNo, groupTitle) =>
  sendSms(contactNo, `❌ SLIET RideShare: Ride "${groupTitle}" was cancelled. Browse other rides on the app.`);

export const sendMemberJoinedSms = (contactNo, memberName, groupTitle) =>
  sendSms(contactNo, `🚗 SLIET RideShare: ${memberName} joined your ride "${groupTitle}".`);
