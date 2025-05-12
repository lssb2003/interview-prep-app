// cypress/e2e/practice-flow.cy.ts
describe('Practice Session Flow', () => {
    beforeEach(() => {
        // Login with Firebase auth
        cy.login();

        // Create a test user profile if it doesn't exist
        cy.callFirestore('set', 'profiles/test-user-id', {
            uid: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            education: [
                {
                    id: 'edu1',
                    institution: 'Test University',
                    degree: 'Bachelor of Science',
                    field: 'Computer Science',
                    startDate: '2018-09-01',
                    endDate: '2022-05-01',
                }
            ],
            workExperience: [
                {
                    id: 'work1',
                    company: 'Test Company',
                    position: 'Software Engineer',
                    startDate: '2022-06-01',
                    endDate: '2023-06-01',
                    description: ['Developed web applications', 'Collaborated with team members']
                }
            ],
            skills: [
                { id: 'skill1', name: 'React', level: 'Advanced' },
                { id: 'skill2', name: 'TypeScript', level: 'Intermediate' }
            ],
        });
    });

    it('should start and complete a practice session', () => {
        // Navigate to practice setup
        cy.visit('/practice/setup');

        // Select general prep
        cy.get('input#general').check();

        // Select categories
        cy.get('input#behavioral').check();
        cy.get('input#technical').check();

        // Start session
        cy.get('button').contains('Start Practice Session').click();

        // Wait for session to load and questions to generate
        cy.url().should('include', '/practice/session/');
        cy.get('h2', { timeout: 10000 }).contains('Practice Session').should('be.visible');

        // Answer first question
        cy.get('textarea#answer').type('This is my practice answer for this interview question. I would approach this by...');

        // Get feedback
        cy.get('button').contains('Get AI Feedback').click();

        // Wait for feedback
        cy.get('h3', { timeout: 15000 }).contains('AI Feedback').should('be.visible');

        // Save answer
        cy.get('button').contains('Save Answer').click();

        // Go to next question
        cy.get('button').contains('Next Question').click();

        // Verify next question loads
        cy.get('textarea#answer').should('be.empty');
    });
});