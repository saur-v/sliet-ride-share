// client/cypress/e2e/full-flow.cy.js
// End-to-end test covering the core happy path.
// Requires seeded test data (npm run seed in server/).

describe('Full user flow', () => {
  // ── Login ──────────────────────────────────────────────────────────────────
  describe('Login', () => {
    it('shows error for wrong password', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('aman@sliet.ac.in');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      cy.contains(/invalid|wrong|credentials/i).should('be.visible');
    });

    it('logs in with correct credentials and goes to dashboard', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('aman@sliet.ac.in');
      cy.get('input[type="password"]').type('Test@1234');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
      cy.contains('Aman').should('be.visible');
    });
  });

  // ── Profile ────────────────────────────────────────────────────────────────
  describe('Profile', () => {
    it('can update hostel number', () => {
      cy.loginAs('aman@sliet.ac.in');
      cy.visit('/profile');
      cy.get('input[name="hostelNo"]').clear().type('H-5');
      cy.get('button[type="submit"]').click();
      cy.contains(/saved|updated/i).should('be.visible');
    });
  });

  // ── Browse groups ──────────────────────────────────────────────────────────
  describe('Browse groups', () => {
    beforeEach(() => {
      cy.loginAs('aman@sliet.ac.in');
    });

    it('shows list of groups', () => {
      cy.visit('/browse');
      cy.get('[href^="/groups/"]').should('have.length.greaterThan', 0);
    });

    it('filters by destination', () => {
      cy.visit('/browse');
      cy.get('input[name="destination"]').type('Sangrur');
      cy.get('[href^="/groups/"]').each($el => {
        cy.wrap($el).contains(/Sangrur/i);
      });
    });
  });

  // ── Create group ───────────────────────────────────────────────────────────
  describe('Create group', () => {
    it('creates a new group and redirects to detail page', () => {
      cy.loginAs('priya@sliet.ac.in');
      cy.visit('/create');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      cy.get('input[name="title"]').type('E2E Test Ride 🚗');
      cy.get('input[name="origin"]').type('SLIET Gate');
      cy.get('input[name="destination"]').type('Sangrur Station');
      cy.get('input[name="date"]').type(dateStr);
      cy.get('input[name="time"]').type('20:00');
      cy.get('input[name="seatsTotal"]').clear().type('3');
      cy.get('button[type="submit"]').click();

      cy.url().should('match', /\/groups\/[a-f0-9]+/);
      cy.contains('E2E Test Ride 🚗').should('be.visible');
    });
  });

  // ── Join group ─────────────────────────────────────────────────────────────
  describe('Join group', () => {
    it('joins an open group and sees member list', () => {
      cy.loginAs('rahul@sliet.ac.in');
      cy.visit('/browse');
      // Click first open group
      cy.get('[href^="/groups/"]').first().click();
      cy.url().should('match', /\/groups\//);

      // If not already a member, join
      cy.get('body').then($body => {
        if ($body.text().includes('Join Ride')) {
          cy.contains('Join Ride').click();
          cy.contains(/joined|members/i).should('be.visible');
        }
      });
    });
  });

  // ── Confirm group (creator flow) ───────────────────────────────────────────
  describe('Confirm group', () => {
    let groupId;

    before(() => {
      cy.loginAs('sneha@sliet.ac.in');
      cy.getToken().then(token => {
        cy.createGroup(token, { title: 'Sneha E2E Confirm Test', seatsTotal: 2 })
          .then(({ body }) => { groupId = body._id; });
      });
    });

    it('creator can confirm booking with vehicle info', () => {
      cy.loginAs('sneha@sliet.ac.in');
      cy.visit(`/groups/${groupId}`);
      cy.contains('Confirm Booking').click();
      cy.get('input[placeholder*="vehicle" i]').type('Auto WB-9999, driver: Test');
      cy.contains('Confirm & Notify Members').click();
      cy.contains('CONFIRMED').should('be.visible');
      cy.contains('Auto WB-9999').should('be.visible');
    });
  });
});
