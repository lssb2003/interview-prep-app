// src/__mocks__/firebase/firestore.ts
export const getFirestore = jest.fn().mockReturnValue({});

export const collection = jest.fn().mockReturnValue({
    id: 'mock-collection'
});

export const doc = jest.fn().mockReturnValue({
    id: 'mock-doc-id'
});

export const getDoc = jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
        uid: 'test-uid',
        name: 'Test User',
        email: 'test@example.com'
    }),
    id: 'mock-doc-id'
});

export const getDocs = jest.fn().mockResolvedValue({
    docs: [
        {
            id: 'mock-doc-id',
            data: () => ({
                uid: 'test-uid',
                name: 'Test User',
                email: 'test@example.com'
            }),
            exists: () => true
        }
    ]
});

export const setDoc = jest.fn().mockResolvedValue(undefined);
export const updateDoc = jest.fn().mockResolvedValue(undefined);
export const addDoc = jest.fn().mockResolvedValue({ id: 'new-doc-id' });
export const deleteDoc = jest.fn().mockResolvedValue(undefined);
export const query = jest.fn().mockReturnValue([]);
export const where = jest.fn().mockReturnValue({});
export const orderBy = jest.fn().mockReturnValue({});
export const serverTimestamp = jest.fn().mockReturnValue('2023-01-01T00:00:00.000Z');