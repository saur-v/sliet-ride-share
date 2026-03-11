// server/src/jobs/cleanup.js
// Runs every hour to:
//   1. Mark rides as "completed" if their date/time has passed
//   2. (Optional) Send reminders for upcoming rides

import cron from 'node-cron';
import Group from '../models/Group.js';
import logger from '../utils/logger.js';

// Runs every hour at :00
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();

    // Mark open/confirmed groups whose ride date is in the past as completed
    const result = await Group.updateMany(
      { status: { $in: ['open', 'confirmed'] }, date: { $lt: now } },
      { status: 'completed' }
    );

    if (result.modifiedCount > 0)
      logger.info(`Cleanup: ${result.modifiedCount} group(s) marked as completed`);
  } catch (err) {
    logger.error(`Cleanup job error: ${err.message}`);
  }
});

logger.info('Cleanup cron job registered (runs every hour)');
