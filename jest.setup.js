// jest.setup.js - UPDATED VERSION
// Add TextEncoder and TextDecoder to global scope
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock Firebase modules directly without requiring files
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn().mockReturnValue({}),
    getApp: jest.fn().mockReturnValue({}),
    getApps: jest.fn().mockReturnValue([])
}));

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn().mockReturnValue({
        currentUser: null,
        onAuthStateChanged: jest.fn((auth, callback) => {
            callback(null);
            return jest.fn();
        })
    }),
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
    signOut: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn().mockReturnValue({}),
    collection: jest.fn().mockReturnValue({}),
    doc: jest.fn().mockReturnValue({}),
    getDoc: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ uid: 'test-uid' }),
        id: 'test-doc-id'
    }),
    getDocs: jest.fn().mockResolvedValue({
        docs: [{ id: 'test-id', data: () => ({}) }]
    }),
    setDoc: jest.fn().mockResolvedValue(undefined),
    addDoc: jest.fn().mockResolvedValue({ id: 'new-id' }),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockReturnValue({}),
    where: jest.fn().mockReturnValue({}),
    orderBy: jest.fn().mockReturnValue({}),
    serverTimestamp: jest.fn().mockReturnValue({})
}));

jest.mock('firebase/storage', () => ({
    getStorage: jest.fn().mockReturnValue({}),
    ref: jest.fn().mockReturnValue({}),
    uploadBytes: jest.fn().mockResolvedValue({}),
    getDownloadURL: jest.fn().mockResolvedValue('https://example.com/test.pdf')
}));

// Mock your firebase config file
jest.mock('./src/services/firebase/config', () => ({
    auth: {},
    db: {},
    storage: {},
    default: {}
}), { virtual: true });


global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
    })
);

// Mock OpenAI
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
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
    }));
});
