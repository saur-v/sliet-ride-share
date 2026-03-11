// server/src/tests/setup.js
// Global test setup: silence console.error noise from expected error responses

import { jest } from '@jest/globals';

// Suppress noisy logger output during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
