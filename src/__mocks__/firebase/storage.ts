// src/__mocks__/firebase/storage.ts
export const getStorage = jest.fn().mockReturnValue({});
export const ref = jest.fn().mockReturnValue({});
export const uploadBytes = jest.fn().mockResolvedValue({});
export const getDownloadURL = jest.fn().mockResolvedValue('https://example.com/test.pdf');
