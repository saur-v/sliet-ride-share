// server/src/seed/seed.js
// Creates: 1 admin, 5 student users, 10 open groups
// Run with: npm run seed

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Membership from '../models/Membership.js';

await mongoose.connect(config.mongoUri);
console.log('🌱 Seeding database...');

// Clear existing data (dev only!)
await User.deleteMany({});
await Group.deleteMany({});
await Membership.deleteMany({});

const passwordHash = await bcrypt.hash('Test@1234', 12);

// ── 1 Admin ────────────────────────────────────────────────────────────────────
const admin = await User.create({
  name: 'Admin User', email: `admin@${config.collegeEmailDomain}`,
  emailVerified: true, passwordHash, role: 'admin',
  collegeId: 'ADMIN001', contactNo: '9000000000', hostelNo: 'Admin Block',
});

// ── 5 Students ─────────────────────────────────────────────────────────────────
const students = await User.insertMany([
  { name: 'Aman Sharma',   email: `aman@${config.collegeEmailDomain}`,   emailVerified: true, passwordHash, collegeId: 'BE21001', contactNo: '9111111111', hostelNo: 'H-1' },
  { name: 'Priya Verma',   email: `priya@${config.collegeEmailDomain}`,  emailVerified: true, passwordHash, collegeId: 'BE21002', contactNo: '9222222222', hostelNo: 'G-1' },
  { name: 'Rahul Gupta',   email: `rahul@${config.collegeEmailDomain}`,  emailVerified: true, passwordHash, collegeId: 'BE21003', contactNo: '9333333333', hostelNo: 'H-2' },
  { name: 'Sneha Patel',   email: `sneha@${config.collegeEmailDomain}`,  emailVerified: true, passwordHash, collegeId: 'BE21004', contactNo: '9444444444', hostelNo: 'G-2' },
  { name: 'Vikram Singh',  email: `vikram@${config.collegeEmailDomain}`, emailVerified: true, passwordHash, collegeId: 'BE21005', contactNo: '9555555555', hostelNo: 'H-3' },
]);

// ── 10 Groups ──────────────────────────────────────────────────────────────────
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
const day2 = new Date();     day2.setDate(day2.getDate() + 2);
const day3 = new Date();     day3.setDate(day3.getDate() + 3);

const groupsData = [
  { title: 'Sangrur 9pm - 4 seats', origin: 'SLIET Main Gate', destination: 'Sangrur Bus Stand', date: tomorrow, time: '21:00', seatsTotal: 4, creatorId: students[0]._id },
  { title: 'Sangrur morning run',   origin: 'SLIET Gate #2',   destination: 'Sangrur Railway Station', date: tomorrow, time: '08:00', seatsTotal: 3, creatorId: students[1]._id },
  { title: 'Ludhiana trip',         origin: 'SLIET Main Gate', destination: 'Ludhiana Bus Stand', date: day2, time: '10:00', seatsTotal: 4, creatorId: students[2]._id },
  { title: 'Patiala weekend ride',  origin: 'SLIET Main Gate', destination: 'Patiala Railway Station', date: day2, time: '14:00', seatsTotal: 3, creatorId: students[3]._id },
  { title: 'Sangrur late night',    origin: 'SLIET Hostel Block', destination: 'Sangrur Bus Stand', date: day2, time: '22:30', seatsTotal: 4, creatorId: students[4]._id },
  { title: 'Evening Sangrur run',   origin: 'SLIET Main Gate', destination: 'Sangrur', date: day3, time: '18:00', seatsTotal: 2, creatorId: students[0]._id },
  { title: 'Early morning Sangrur', origin: 'SLIET Gate #1',   destination: 'Sangrur', date: day3, time: '06:00', seatsTotal: 3, creatorId: students[1]._id },
  { title: 'Airport drop Chandigarh', origin: 'SLIET Main Gate', destination: 'Chandigarh Airport', date: day3, time: '12:00', seatsTotal: 4, seatPrice: 300, creatorId: students[2]._id },
  { title: 'Nabha quick ride',      origin: 'SLIET Main Gate', destination: 'Nabha', date: tomorrow, time: '17:00', seatsTotal: 3, creatorId: students[3]._id },
  { title: 'Barnala connection',    origin: 'SLIET Main Gate', destination: 'Barnala Bus Stand', date: day3, time: '19:00', seatsTotal: 4, creatorId: students[4]._id },
];

for (const g of groupsData) {
  const group = await Group.create({ ...g, seatsTaken: 1 });
  await Membership.create({ groupId: group._id, userId: g.creatorId, isCreator: true, status: 'joined' });
}

console.log(`✅ Seeded:
  Admin:    admin@${config.collegeEmailDomain}  (password: Test@1234)
  Students: aman, priya, rahul, sneha, vikram @${config.collegeEmailDomain}
  Groups:   10 open groups created
`);
await mongoose.disconnect();
