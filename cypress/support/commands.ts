// cypress/support/commands.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { attachCustomCommands } from 'cypress-firebase';

const firebaseConfig = {
  // Use your test Firebase project config
  apiKey: "your-test-api-key",
  authDomain: "your-test-project.firebaseapp.com",
  projectId: "your-test-project",
  storageBucket: "your-test-project.appspot.com",
  messagingSenderId: "your-test-messaging-sender-id",
  appId: "your-test-app-id"
};

firebase.initializeApp(firebaseConfig);

// Attach firebase-cypress custom commands
attachCustomCommands({ Cypress, cy, firebase });

// Custom command to login using UI
Cypress.Commands.add('loginByUI', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});