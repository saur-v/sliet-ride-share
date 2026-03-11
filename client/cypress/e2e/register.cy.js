// client/cypress/e2e/register.cy.js
// Tests the registration and email verification flow.

describe('Registration', () => {
  it('rejects non-college email', () => {
    cy.visit('/register');
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@gmail.com');
    cy.get('button[type="submit"]').click();
    cy.contains(/sliet|college email/i).should('be.visible');
  });

  it('shows success screen after valid registration', () => {
    // Use a unique email to avoid "already registered" conflicts
    const uniq = Date.now();
    cy.intercept('POST', '/api/v1/auth/register', {
      statusCode: 201,
      body: { ok: true, message: 'Verification email sent.' },
    }).as('register');

    cy.visit('/register');
    cy.get('input[name="name"]').type('New Student');
    cy.get('input[name="email"]').type(`newstudent${uniq}@sliet.ac.in`);
    cy.get('button[type="submit"]').click();

    cy.wait('@register');
    cy.contains(/check your email/i).should('be.visible');
  });

  it('verify page shows error for bad token', () => {
    cy.visit('/verify?email=test@sliet.ac.in&token=badtoken');
    cy.contains(/failed|invalid/i, { timeout: 6000 }).should('be.visible');
  });
});
