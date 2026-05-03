import { EmployeeDocument } from '../types';

/**
 * SALERY SECURE VAULT SERVICE
 * Simulates enterprise-grade cloud object storage.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];

export const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) return "Le fichier dépasse la limite de 5MB.";
  // Added comment: Fix property reference to 'type' for standard File objects
  if (!ALLOWED_MIMES.includes(file.type)) return "Seuls les formats PDF, JPG et PNG sont autorisés.";
  return null;
};

export const simulateUpload = async (
  file: File, 
  employeeId: string, 
  docType: EmployeeDocument['type'],
  userId: string
): Promise<EmployeeDocument> => {
  // Simulate delay
  await new Promise(r => setTimeout(r, 1200));

  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg');
  const secureName = `${employeeId}_${docType}_${timestamp}.${extension}`;

  // In production, this would be a cloud URL (S3/GCS)
  // For demo, we use a data URL
  const reader = new FileReader();
  const dataUrl = await new Promise<string>((resolve) => {
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  return {
    id: `DOC-${timestamp}`,
    type: docType,
    name: file.name,
    url: dataUrl, 
    size: file.size,
    mimeType: file.type,
    uploadedBy: userId,
    uploadedAt: timestamp,
    status: 'VALID'
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
