// src/__mocks__/openai.ts
const MockOpenAI = jest.fn().mockImplementation(() => {
    return {
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
});

export default MockOpenAI;