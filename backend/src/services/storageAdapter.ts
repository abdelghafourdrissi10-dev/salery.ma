/**
 * SALERY Storage Adapter
 * 
 * Unified file storage interface that abstracts the underlying storage
 * backend. Currently uses local disk storage via multer, but designed
 * to be dropped-in replaced with AWS S3, Cloudflare R2, or GCS.
 *
 * @future Switch STORAGE_DRIVER env var to 's3' | 'r2' | 'gcs' | 'local'
 */
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// ─── Configuration ─────────────────────────────────────────

const UPLOAD_BASE = path.resolve(process.cwd(), 'uploads');
const EMPLOYEE_UPLOAD_DIR = path.join(UPLOAD_BASE, 'employees');
const PHOTO_UPLOAD_DIR = path.join(UPLOAD_BASE, 'photos');

// Ensure upload directories exist
[UPLOAD_BASE, EMPLOYEE_UPLOAD_DIR, PHOTO_UPLOAD_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Security Whitelist ─────────────────────────────────────

export const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
};

export const ALLOWED_PHOTO_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

export const LIMITS = {
    DOCUMENT_MAX_BYTES: 10 * 1024 * 1024, // 10 MB
    PHOTO_MAX_BYTES: 2 * 1024 * 1024,     // 2 MB
};

// ─── File Sanitizer ─────────────────────────────────────────

export const sanitizeFilename = (original: string): string => {
    return original
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 150);
};

// ─── Storage Engines ────────────────────────────────────────

/** Document storage — writes to uploads/employees/:employeeId/ */
const documentStorageEngine: StorageEngine = multer.diskStorage({
    destination: (req: Request, _file, cb) => {
        const employeeId = req.params.id || 'unknown';
        const dir = path.join(EMPLOYEE_UPLOAD_DIR, employeeId);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const safe = sanitizeFilename(file.originalname);
        cb(null, `${timestamp}_${safe}`);
    },
});

/** Photo storage — writes to uploads/photos/ */
const photoStorageEngine: StorageEngine = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PHOTO_UPLOAD_DIR),
    filename: (req: Request, file, cb) => {
        const employeeId = req.params.id || 'unknown';
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${employeeId}_avatar${ext}`);
    },
});

// ─── File Filters ───────────────────────────────────────────

const documentFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_DOCUMENT_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Types acceptés: PDF, JPG, PNG, DOCX`));
    }
};

const photoFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_PHOTO_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`Type d'image non autorisé: ${file.mimetype}. Accepté: JPG, PNG, WEBP`));
    }
};

// ─── Multer Instances ───────────────────────────────────────

export const uploadDocuments = multer({
    storage: documentStorageEngine,
    fileFilter: documentFileFilter,
    limits: { fileSize: LIMITS.DOCUMENT_MAX_BYTES },
});

export const uploadPhoto = multer({
    storage: photoStorageEngine,
    fileFilter: photoFileFilter,
    limits: { fileSize: LIMITS.PHOTO_MAX_BYTES },
});

// ─── Helpers ────────────────────────────────────────────────

/** Build a public URL for a stored file. Update base URL for production S3/CDN. */
export const buildFileUrl = (relativePath: string): string => {
    const normalized = relativePath.replace(/\\/g, '/');
    return `http://127.0.0.1:3001/${normalized}`;
};

export const getDocumentCategory = (mimeType: string): string => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'WORD';
    return 'OTHER';
};
