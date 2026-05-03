import { API_URL } from './api';

export const documentService = {
    async downloadPdf(type: 'payroll' | 'cnss' | 'bulletin' | 'attendance', companyId: string, month: string, employeeId?: string) {
        try {
            const url = new URL(`${API_URL}/documents/generate-pdf`);
            url.searchParams.append('type', type);
            url.searchParams.append('month', month);
            url.searchParams.append('companyId', companyId);
            if (employeeId) {
                url.searchParams.append('employeeId', employeeId);
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                credentials: 'include' // Required for HttpOnly cookies
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate PDF');
            }

            // Parse Blob
            const blob = await response.blob();

            // Try to extract filename from Content-Disposition if present
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'document.pdf';
            if (contentDisposition && contentDisposition.includes('filename=')) {
                const matches = contentDisposition.match(/filename="?([^"]+)"?/);
                if (matches && matches[1]) {
                    filename = matches[1];
                }
            } else {
                filename = `${type}_${month}.pdf`;
            }

            // Create temporary download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
        } catch (error: any) {
            console.error('Document Export failed:', error);
            alert(error.message || 'Failed to generate official PDF document.');
        }
    },

    async downloadZip(type: 'bulletins', companyId: string, month: string) {
        try {
            const url = new URL(`${API_URL}/documents/bulk-zip`);
            url.searchParams.append('type', type);
            url.searchParams.append('month', month);
            url.searchParams.append('companyId', companyId);

            const response = await fetch(url.toString(), {
                method: 'GET',
                credentials: 'include' // Required for HttpOnly cookies
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate ZIP');
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'archive.zip';
            if (contentDisposition && contentDisposition.includes('filename=')) {
                const matches = contentDisposition.match(/filename="?([^"]+)"?/);
                if (matches && matches[1]) {
                    filename = matches[1];
                }
            } else {
                filename = `${type}_${month}.zip`;
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
        } catch (error) {
            console.error('ZIP Export failed:', error);
            alert('Failed to generate bulk ZIP archive.');
        }
    }
};
