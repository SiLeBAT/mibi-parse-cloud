import { WritableBufferStream } from '../model/writable-buffer-stream';

import PdfPrinter from 'pdfmake';

export class PDFService {
    private readonly standard14Fonts = {
        Courier: {
            normal: 'Courier',
            bold: 'Courier-Bold',
            italics: 'Courier-Oblique',
            bolditalics: 'Courier-BoldOblique'
        },
        Helvetica: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
        },
        Times: {
            normal: 'Times-Roman',
            bold: 'Times-Bold',
            italics: 'Times-Italic',
            bolditalics: 'Times-BoldItalic'
        },
        Symbol: {
            normal: 'Symbol'
        },
        ZapfDingbats: {
            normal: 'ZapfDingbats'
        }
    };

    private readonly printer = new PdfPrinter(this.standard14Fonts);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createPDF(docDefinition: any, tableLayouts: any): Promise<Buffer> {
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition, {
            tableLayouts: tableLayouts
        });

        return this.printPDFToBuffer(pdfDoc);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async printPDFToBuffer(pdfDoc: any): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const bufferStream = new WritableBufferStream();
            bufferStream.on('finish', () => {
                resolve(bufferStream.toBuffer());
            });
            bufferStream.on('error', reject);

            pdfDoc.pipe(bufferStream);
            pdfDoc.end();
        });
    }
}
