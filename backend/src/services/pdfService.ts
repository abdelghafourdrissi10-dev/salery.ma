import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export class PdfService {
    static async generatePdf(templateName: string, data: Record<string, any>): Promise<Buffer> {
        const templatePath = path.join(process.cwd(), 'src', 'templates', `${templateName}.html`);
        let html = fs.readFileSync(templatePath, 'utf8');

        // Simple template engine: replace {{key}} with data[key]
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, data[key] !== undefined && data[key] !== null ? String(data[key]) : '');
        });

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.emulateMediaType('print');
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const landscape = templateName === 'payroll-report';

        const pdfUint8Array = await page.pdf({
            format: 'A4',
            printBackground: true,
            landscape,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
        });

        await browser.close();
        // puppeteer .pdf() returns Uint8Array, we convert to Buffer
        return Buffer.from(pdfUint8Array);
    }
}
