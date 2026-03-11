// client/cypress.config.js
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth:  1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/commands.js',
    env: {
      apiUrl:        'http://localhost:5000/api/v1',
      collegeEmail:  'testcypress@sliet.ac.in',
      adminEmail:    'admin@sliet.ac.in',
      testPassword:  'Test@1234',
    },
  },
});
