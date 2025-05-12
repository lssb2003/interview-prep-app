// cypress/e2e/auth-flow.cy.ts
describe('Authentication Flow', () => {
    before(() => {
        // Clean up database before tests
        cy.callFirestore('delete', 'users');
    });

    it('should allow a user to register, logout, and login', () => {
        const testUser = {
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123',
            name: 'Test User'
        };

        // Register
        cy.visit('/register');
        cy.get('input[name="email"]').type(testUser.email);
        cy.get('input[name="password"]').type(testUser.password);
        cy.get('input[name="confirm-password"]').type(testUser.password);
        cy.get('button[type="submit"]').click();

        // Should redirect to profile setup
        cy.url().should('include', '/profile/setup');
        cy.get('input[name="name"]').type(testUser.name);
        cy.get('input[name="email"]').should('have.value', testUser.email);

        // Complete first step of profile setup
        cy.get('button').contains('Next').click();

        // Leave profile setup (for simplicity in this test)
        cy.visit('/dashboard');
        cy.get('h1').should('contain', 'Welcome');

        // Logout
        cy.get('button').contains('Sign out').click();
        cy.url().should('include', '/login');

        // Login again
        cy.get('input[name="email"]').type(testUser.email);
        cy.get('input[name="password"]').type(testUser.password);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/dashboard');
    });
});