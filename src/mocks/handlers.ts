// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
    // Mock Firebase auth
    rest.post('https://identitytoolkit.googleapis.com/v1/*', (req, res, ctx) => {
        return res(
            ctx.json({
                idToken: 'test-token',
                email: 'test@example.com',
                refreshToken: 'test-refresh-token',
                expiresIn: '3600',
                localId: 'test-user-id',
                registered: true,
            })
        );
    }),

    // Mock OpenAI API calls
    rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
        return res(
            ctx.json({
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                name: 'Test User',
                                summary: 'Professional summary for testing',
                                skills: [{ id: 'skill1', name: 'React', level: 'Expert' }]
                            })
                        }
                    }
                ]
            })
        );
    }),

    // You can add more handlers here as needed
];