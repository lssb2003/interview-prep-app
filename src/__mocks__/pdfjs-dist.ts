// src/__mocks__/pdfjs-dist.ts
const mockTextContent = {
    items: [{ str: 'Mock PDF Content ' }, { str: 'Line 2' }],
};

const mockPage = {
    getTextContent: jest.fn().mockResolvedValue(mockTextContent),
};

const mockPdfDocument = {
    numPages: 2,
    getPage: jest.fn().mockResolvedValue(mockPage),
};

export const getDocument = jest.fn().mockReturnValue({
    promise: Promise.resolve(mockPdfDocument),
});

export const GlobalWorkerOptions = {
    workerSrc: 'mock-worker-src',
};