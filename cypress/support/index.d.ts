// cypress/support/index.d.ts
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable<Subject = any> {
        /**
         * Custom command to login via the UI
         * @example cy.loginByUI('test@example.com', 'password123')
         */
        loginByUI(email: string, password: string): Chainable<void>;

        /**
         * Custom command to login directly via Firebase auth
         * @example cy.login()
         */
        login(): Chainable<void>;

        /**
         * Custom command to call Firestore operations
         * @example cy.callFirestore('set', 'users/123', { name: 'Test User' })
         */
        callFirestore(operation: string, path: string, data?: any): Chainable<void>;
    }
}