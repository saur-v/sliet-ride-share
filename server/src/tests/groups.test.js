// server/src/tests/groups.test.js
// Integration tests for the full group lifecycle.

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Membership from '../models/Membership.js';
import { generateAccessToken } from '../utils/tokens.js';

let creator, joiner, creatorToken, joinerToken, groupId;

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sliet-test');

  creator = await User.create({
    name: 'Creator User', email: 'creator@sliet.ac.in',
    emailVerified: true, role: 'student',
    collegeId: 'CR001', contactNo: '9100000001', hostelNo: 'H-1',
  });
  joiner = await User.create({
    name: 'Joiner User', email: 'joiner@sliet.ac.in',
    emailVerified: true, role: 'student',
    collegeId: 'JN001', contactNo: '9100000002', hostelNo: 'H-2',
  });

  creatorToken = generateAccessToken(creator._id, 'student');
  joinerToken  = generateAccessToken(joiner._id,  'student');
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: ['creator@sliet.ac.in', 'joiner@sliet.ac.in'] } });
  await Group.deleteMany({ creatorId: creator._id });
  await Membership.deleteMany({ userId: { $in: [creator._id, joiner._id] } });
  await mongoose.disconnect();
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/v1/groups — create', () => {
  it('rejects unauthenticated request', async () => {
    const res = await request(app).post('/api/v1/groups').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('rejects invalid body', async () => {
    const res = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'ab' }); // too short
    expect(res.status).toBe(422);
  });

  it('creates group and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Test Ride Group',
        origin: 'SLIET Gate', destination: 'Sangrur',
        date: '2030-01-01', time: '21:00', seatsTotal: 3,
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Ride Group');
    expect(res.body.seatsTaken).toBe(1); // creator auto-joins
    groupId = res.body._id;
  });
});

describe('GET /api/v1/groups/:id', () => {
  it('returns group with masked contact for non-member', async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${joinerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.members).toBeDefined();
    // contactNo should be masked for non-member joiner
    res.body.members.forEach(m => {
      if (m._id !== creator._id.toString()) {
        expect(m.contactNo).toBeUndefined();
      }
    });
  });
});

describe('POST /api/v1/groups/:id/join', () => {
  it('joins successfully and returns membership', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/join`)
      .set('Authorization', `Bearer ${joinerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.membership.status).toBe('joined');
  });

  it('rejects duplicate join', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/join`)
      .set('Authorization', `Bearer ${joinerToken}`);
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe('ALREADY_JOINED');
  });

  it('reveals contactNo to joined member', async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${joinerToken}`);
    expect(res.status).toBe(200);
    // joiner is now a member — should see contactNo
    const creatorMember = res.body.members.find(m => m._id === creator._id.toString());
    expect(creatorMember?.contactNo).toBeDefined();
  });
});

describe('POST /api/v1/groups/:id/leave', () => {
  it('leaves group successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/leave`)
      .set('Authorization', `Bearer ${joinerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('decrements seatsTaken after leave', async () => {
    const g = await Group.findById(groupId);
    expect(g.seatsTaken).toBe(1); // only creator left
  });
});

describe('POST /api/v1/groups/:id/confirm', () => {
  it('rejects confirm from non-creator', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/confirm`)
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ vehicleInfo: 'WB-1234' });
    expect(res.status).toBe(403);
  });

  it('creator can confirm with vehicleInfo', async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/confirm`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ vehicleInfo: 'Maruti Alto WB-1234', meetingPoint: 'Gate #2' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
    expect(res.body.vehicleInfo).toBe('Maruti Alto WB-1234');
  });
});

describe('DELETE /api/v1/groups/:id — cancel', () => {
  it('creator can cancel group', async () => {
    const res = await request(app)
      .delete(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect(res.status).toBe(200);
    const g = await Group.findById(groupId);
    expect(g.status).toBe('cancelled');
  });
});
