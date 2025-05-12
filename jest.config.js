// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transformIgnorePatterns: [
        '/node_modules/(?!(pdfjs-dist)/)'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
        'pdfjs-dist': '<rootDir>/src/__mocks__/pdfjs-dist.ts',
        '^openai$': '<rootDir>/src/__mocks__/openai.ts',
    },
    setupFiles: ['<rootDir>/jest.setup.js'],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.tsx',
        '!src/reportWebVitals.ts',
    ],
    testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
};