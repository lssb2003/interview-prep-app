// src/utils/__tests__/pdfParser.test.ts
import { parsePdfText } from '../pdfParser';

// Mock pdf.js
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getTextContent: jest.fn().mockResolvedValue({
          items: [
            { str: 'Test ' },
            { str: 'PDF ' },
            { str: 'Content' }
          ]
        })
      })
    })
  }),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}));

// Mock File.prototype.arrayBuffer
const originalArrayBuffer = File.prototype.arrayBuffer;
File.prototype.arrayBuffer = jest.fn().mockImplementation(function () {
  return Promise.resolve(new ArrayBuffer(8));
});

// Restore the original after tests
afterAll(() => {
  if (originalArrayBuffer) {
    File.prototype.arrayBuffer = originalArrayBuffer;
  }
});

describe('PDF Parser', () => {
  it('extracts text from a PDF file', async () => {
    // Create a mock PDF file
    const pdfBlob = new Blob(['fake pdf content'], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], 'test.pdf', { type: 'application/pdf' });

    // Call the parser
    const result = await parsePdfText(pdfFile);

    // Check the result
    expect(result).toContain('Test  PDF  Content');
  });

  it('handles errors gracefully', async () => {
    // Force an error by making getDocument throw
    require('pdfjs-dist').getDocument.mockImplementationOnce(() => {
      return {
        promise: Promise.reject(new Error('PDF error'))
      };
    });

    // Create a mock PDF file
    const pdfBlob = new Blob(['fake pdf content'], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], 'test.pdf', { type: 'application/pdf' });

    // Call the parser
    const result = await parsePdfText(pdfFile);

    // Check that it returns an error message
    expect(result).toContain('Error reading PDF');
  });
});