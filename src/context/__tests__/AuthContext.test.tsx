// src/context/__tests__/AuthContext.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { act } from 'react';

// Mock all Firebase modules
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn().mockReturnValue({}),
    onAuthStateChanged: jest.fn((auth, callback) => {
        // Immediately call with null (not logged in)
        callback(null);
        // Return mock unsubscribe function
        return jest.fn();
    }),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    serverTimestamp: jest.fn(),
    getFirestore: jest.fn()
}));

// Create a simple test component that consumes the auth context
const TestComponent = () => {
    const { currentUser, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return <div>User: {currentUser ? currentUser.email : 'Not logged in'}</div>;
};

describe('AuthContext', () => {
    it('provides auth context to children', async () => {
        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
        });

        // Wait for the auth state to be resolved
        await waitFor(() => {
            expect(screen.getByText('User: Not logged in')).toBeInTheDocument();
        });
    });
});