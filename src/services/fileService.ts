// This assumes mammoth.js and pdf.js are loaded via script tags in index.html
declare const mammoth: any;
declare const pdfjsLib: any;

export const extractTextFromFile = async (file: File): Promise<string> => {
    try {
        if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let textContent = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                // We are using `item.str` which is an attribute of the TextItem object.
                // It is safe to disable the `no-explicit-any` rule here.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                textContent += text.items.map((item: any) => item.str).join(' ');
                textContent += '\n\n'; // Page break
            }
            return textContent;
        } else if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            return result.value;
        } else {
            throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
        }
    } catch(error) {
         console.error("Error reading file:", error);
         throw new Error("Could not read or process the uploaded file.");
    }
};
