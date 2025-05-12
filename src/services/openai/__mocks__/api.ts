// src/services/openai/__mocks__/api.ts
const mockOpenAI = {
    chat: {
        completions: {
            create: jest.fn().mockResolvedValue({
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
        }
    }
};

export default mockOpenAI;