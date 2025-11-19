// This assumes jspdf and html2canvas are loaded via script tags in index.html
declare const jspdf: any;
declare const html2canvas: any;

export const generatePdf = async (element: HTMLElement, fileName: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
            return reject(new Error('PDF generation libraries (jspdf, html2canvas) not found.'));
        }

        const { jsPDF } = jspdf;
        // Create a new PDF in portrait A4 format
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 595.28 pt
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt

        try {
            // Use html2canvas to capture the entire continuous content element
            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false,
                width: element.offsetWidth,
                height: element.scrollHeight, // Capture the entire scrollable height
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Calculate the height of the image when scaled to fit the PDF width
            const ratio = pdfWidth / imgWidth;
            const scaledImgHeight = imgHeight * ratio;

            let heightLeft = scaledImgHeight;
            let position = 0;

            // Add the first page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledImgHeight);
            heightLeft -= pdfHeight;

            // Add new pages if the content is taller than one page, slicing the image
            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledImgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`${fileName.replace(/ /g, '_')}.pdf`);
            resolve();
        } catch (error) {
            console.error("Error during PDF generation with slicing:", error);
            reject(error);
        }
    });
};
