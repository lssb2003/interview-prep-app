// src/utils/__tests__/api.test.ts
import { rest } from 'msw';
import { server } from '../../mocks/server';

describe('API Mocking Tests', () => {
    beforeEach(() => {
        // Create a fresh implementation of fetch for each test
        global.fetch = jest.fn();
    });

    it('should mock a successful API response', async () => {
        // Set up a response
        const mockResponse = { success: true, data: [1, 2, 3] };

        // Configure MSW to handle the request
        server.use(
            rest.get('https://api.example.com/data', (req, res, ctx) => {
                return res(ctx.json(mockResponse));
            })
        );

        // Mock the fetch implementation properly
        (global.fetch as jest.Mock).mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            })
        );

        // Create a function that uses fetch
        const fetchData = async () => {
            const response = await fetch('https://api.example.com/data');
            return response.json();
        };

        // Call the function and check results
        const result = await fetchData();
        expect(result).toEqual(mockResponse);
    });

    it('should pass a basic test', () => {
        expect(1 + 2).toBe(3);
    });
});