// server/src/tests/join.concurrent.test.js
// THE critical test: verifies seat enforcement under concurrent load.

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Membership from '../models/Membership.js';
import { generateAccessToken } from '../utils/tokens.js';

let testUsers = [];
let testGroup;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sliet-test');

  // Create 10 test users
  testUsers = await User.insertMany(
    Array.from({ length: 10 }, (_, i) => ({
      name: `ConcUser${i}`, email: `concuser${i}@sliet.ac.in`,
      emailVerified: true, role: 'student',
      collegeId: `CONC00${i}`, contactNo: `900000000${i}`, hostelNo: 'H-1',
    }))
  );

  // Create a group with only 3 seats
  testGroup = await Group.create({
    creatorId: testUsers[0]._id,
    title: 'Concurrent Test Group',
    origin: 'SLIET', destination: 'Sangrur',
    date: new Date(Date.now() + 86400000),
    time: '21:00',
    seatsTotal: 3,
    seatsTaken: 0,
    status: 'open',
  });
});

afterAll(async () => {
  await User.deleteMany({ email: /concuser/ });
  await Group.findByIdAndDelete(testGroup?._id);
  await Membership.deleteMany({ groupId: testGroup?._id });
  await mongoose.disconnect();
});

describe('Concurrent seat enforcement', () => {
  it('allows only seatsTotal joins even with 10 simultaneous requests', async () => {
    // Fire all 10 join requests simultaneously
    const promises = testUsers.map((user) => {
      const token = generateAccessToken(user._id, 'student');
      return request(app)
        .post(`/api/v1/groups/${testGroup._id}/join`)
        .set('Authorization', `Bearer ${token}`);
    });

    const results = await Promise.all(promises);

    const successes = results.filter(r => r.status === 200);
    const failures  = results.filter(r => r.status !== 200);

    // Only 3 should succeed (seatsTotal = 3)
    expect(successes.length).toBe(3);
    expect(failures.length).toBe(7);

    // DB should reflect exactly 3 seats taken
    const updated = await Group.findById(testGroup._id);
    expect(updated.seatsTaken).toBe(3);

    // Exactly 3 memberships
    const memberships = await Membership.countDocuments({ groupId: testGroup._id, status: 'joined' });
    expect(memberships).toBe(3);
  });
});
