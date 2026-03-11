// client/src/tests/setup.js
import '@testing-library/jest-dom';

// Mock socket.io-client globally so no real connection is made in tests
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on:         jest.fn(),
    off:        jest.fn(),
    emit:       jest.fn(),
    disconnect: jest.fn(),
    connected:  true,
  };
  return { io: jest.fn(() => mockSocket) };
});

// Mock import.meta.env for Vite env vars
Object.defineProperty(globalThis, 'import', {
  value: { meta: { env: { VITE_COLLEGE_DOMAIN: 'sliet.ac.in', VITE_API_URL: '' } } },
  writable: true,
});
