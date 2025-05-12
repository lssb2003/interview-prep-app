// src/__mocks__/firebase/auth.ts
export const getAuth = jest.fn().mockReturnValue({
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
    onAuthStateChanged: jest.fn((auth, callback) => {
        // Simulate auth state change
        setTimeout(() => callback(null), 0);
        return jest.fn(); // Unsubscribe function
    }),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({
        user: { uid: 'test-uid', email: 'test@example.com' }
    }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
        user: { uid: 'test-uid', email: 'test@example.com' }
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined)
});

export const onAuthStateChanged = jest.fn((auth, callback) => {
    setTimeout(() => callback(null), 0);
    return jest.fn(); // Unsubscribe function
});

export const signInWithEmailAndPassword = jest.fn().mockResolvedValue({
    user: { uid: 'test-uid', email: 'test@example.com' }
});

export const createUserWithEmailAndPassword = jest.fn().mockResolvedValue({
    user: { uid: 'test-uid', email: 'test@example.com' }
});

export const signOut = jest.fn().mockResolvedValue(undefined);
export const sendPasswordResetEmail = jest.fn().mockResolvedValue(undefined);