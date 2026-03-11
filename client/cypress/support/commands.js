// client/cypress/support/commands.js
// Custom Cypress commands for common auth flows.

// cy.loginAs(email, password) — sets tokens directly via API to skip UI login
Cypress.Commands.add('loginAs', (email, password = 'Test@1234') => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, { email, password })
    .then(({ body }) => {
      window.localStorage.setItem('accessToken',  body.accessToken);
      window.localStorage.setItem('refreshToken', body.refreshToken);
    });
});

// cy.seedGroup(token, overrides) — create a group via API
Cypress.Commands.add('createGroup', (token, data = {}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return cy.request({
    method: 'POST',
    url:    `${Cypress.env('apiUrl')}/groups`,
    headers: { Authorization: `Bearer ${token}` },
    body: {
      title:       'E2E Test Ride',
      origin:      'SLIET Main Gate',
      destination: 'Sangrur Bus Stand',
      date:        tomorrow.toISOString().split('T')[0],
      time:        '21:00',
      seatsTotal:  4,
      meetingPoint:'Near Gate #2',
      ...data,
    },
  });
});

// Helper: get stored access token
Cypress.Commands.add('getToken', () =>
  cy.window().then(win => win.localStorage.getItem('accessToken'))
);
