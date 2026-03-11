// client/jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['./src/tests/setup.js'],
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss)$': '<rootDir>/src/tests/__mocks__/styleMock.js',
    // Handle static assets
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/tests/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.jsx'],
};
