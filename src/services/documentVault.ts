import { EmployeeDocument } from '../types';

export const validateFile = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) return "Le fichier dépasse la limite de 5MB.";
  return null;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const simulateUpload = async (
  file: File, 
  employeeId: string, 
  type: EmployeeDocument['type'] | string,
  uploadedBy: string
): Promise<EmployeeDocument> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `DOC-${Date.now()}`,
        employeeId,
        type: type as any,
        name: file.name,
        url: URL.createObjectURL(file),
        uploadDate: new Date().toISOString(),
        uploadedBy
      });
    }, 800);
  });
};
