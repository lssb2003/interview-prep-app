// src/utils/pdfParser.ts
import * as pdfjsLib from 'pdfjs-dist';

// Use the static assets folder's PDF.js worker
// No need for worker configuration with this approach
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

export const parsePdfText = async (file: File): Promise<string> => {
    try {
        // Read the file as an array buffer
        const arrayBuffer = await file.arrayBuffer();

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Get text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map((item: any) => item.str).join(' ');
            fullText += textItems + '\n';
        }

        // Log the first part of the text to help with debugging
        console.log("PDF Text Extracted (first 200 chars):", fullText.substring(0, 200));
        
        return fullText;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        // Return descriptive error message instead of throwing
        return "Error reading PDF. The file may be corrupted, password-protected, or using a format that's difficult to parse. Please try a different PDF format or enter information manually.";
    }
};