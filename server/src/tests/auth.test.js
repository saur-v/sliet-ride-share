// server/src/tests/auth.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';

const TEST_EMAIL = 'testuser@sliet.ac.in';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sliet-test');
});

afterAll(async () => {
  await User.deleteMany({ email: TEST_EMAIL });
  await mongoose.disconnect();
});

describe('Auth — register', () => {
  it('rejects non-college emails', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'Test', email: 'test@gmail.com' });
    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('accepts college email and creates user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'Test User', email: TEST_EMAIL });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  it('does not allow login before email verified', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: TEST_EMAIL, password: 'anything' });
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('EMAIL_NOT_VERIFIED');
  });
});
