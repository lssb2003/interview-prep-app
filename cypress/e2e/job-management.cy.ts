// cypress/e2e/job-management.cy.ts
describe('Job Management Flow', () => {
  beforeEach(() => {
    // Login with Firebase auth
    cy.login();
  });

  it('should create, edit, and delete a job', () => {
    // Navigate to jobs page
    cy.visit('/jobs');

    // Create new job
    cy.get('a').contains('Add New Job').click();
    cy.url().should('include', '/jobs/new');

    // Fill job form
    cy.get('input[name="title"]').type('Software Engineer');
    cy.get('input[name="company"]').type('Test Corp');
    cy.get('textarea[name="description"]').type('This is a test job description for a software engineer position.');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Verify redirect to job detail
    cy.url().should('include', '/jobs/');
    cy.get('h2').contains('Software Engineer').should('be.visible');

    // Edit job
    cy.get('button').contains('Edit').click();
    cy.get('input[name="title"]').clear().type('Senior Software Engineer');
    cy.get('button').contains('Save Changes').click();

    // Verify update
    cy.get('h2').contains('Senior Software Engineer').should('be.visible');

    // Delete job
    cy.get('button').contains('Edit').click();
    cy.get('button').contains('Delete Job').click();

    // Confirm delete in alert dialog
    cy.on('window:confirm', () => true);

    // Verify redirect to jobs list
    cy.url().should('eq', Cypress.config().baseUrl + '/jobs');
  });
});