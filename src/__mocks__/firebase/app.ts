// src/__mocks__/firebase/app.ts
export const initializeApp = jest.fn().mockReturnValue({
    name: '[DEFAULT]',
    options: {
        apiKey: 'mock-api-key',
        authDomain: 'mock-auth-domain',
        projectId: 'mock-project-id',
        storageBucket: 'mock-storage-bucket',
        messagingSenderId: 'mock-messaging-sender-id',
        appId: 'mock-app-id'
    }
});

export const getApp = jest.fn().mockImplementation(() => {
    return initializeApp();
});

export const getApps = jest.fn().mockReturnValue([]);