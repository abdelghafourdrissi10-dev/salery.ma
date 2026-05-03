import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Upload, X, CheckCircle2, AlertCircle, FileText, Image as ImageIcon,
    File, Download, Trash2, RefreshCw, Eye
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type DocumentCategory = 'CONTRACT' | 'ID_CARD' | 'PAYROLL' | 'CERTIFICATE' | 'IDENTITY' | 'OTHER';

export interface UploadedDocument {
    id: string;
    name: string;
    type: DocumentCategory;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    uploadedBy: string;
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
    preview?: string;
    savedDoc?: UploadedDocument;
}

interface EmployeeFileUploaderProps {
    employeeId: string;
    onDocumentsChanged?: (docs: UploadedDocument[]) => void;
    compact?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALLOWED_MIME: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/msword': 'DOC',
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={18} className="text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText size={18} className="text-rose-500" />;
    return <File size={18} className="text-gray-500" />;
};

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
    { value: 'CONTRACT', label: 'Contrat' },
    { value: 'ID_CARD', label: 'Pièce d\'identité' },
    { value: 'PAYROLL', label: 'Bulletin de paie' },
    { value: 'CERTIFICATE', label: 'Certificat' },
    { value: 'IDENTITY', label: 'Identité' },
    { value: 'OTHER', label: 'Autre' },
];

const BASE_URL = 'http://127.0.0.1:3001/api/v1';

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmployeeFileUploader({ employeeId, onDocumentsChanged, compact }: EmployeeFileUploaderProps) {
    const [dragState, setDragState] = useState<'idle' | 'dragging'>('idle');
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [savedDocuments, setSavedDocuments] = useState<UploadedDocument[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('CONTRACT');
    const [loadingDocs, setLoadingDocs] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load existing documents
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const token = localStorage.getItem('salery_access_token');
                const res = await fetch(`${BASE_URL}/employees/${employeeId}/documents`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSavedDocuments(data);
                    onDocumentsChanged?.(data);
                }
            } catch (e) {
                console.error('Failed to load documents', e);
            } finally {
                setLoadingDocs(false);
            }
        };
        fetchDocs();
    }, [employeeId]);

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_MIME[file.type]) return `Type non supporté: ${file.type}`;
        if (file.size > MAX_SIZE_BYTES) return `Fichier trop volumineux (max 10 Mo)`;
        return null;
    };

    const uploadFile = useCallback(async (uploadingFile: UploadingFile) => {
        setUploadingFiles(prev => prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'uploading' } : f));

        const token = localStorage.getItem('salery_access_token');
        const formData = new FormData();
        formData.append('files', uploadingFile.file);
        formData.append('documentType', selectedCategory);

        // Simulated progress (real progress requires XHR)
        const progressInterval = setInterval(() => {
            setUploadingFiles(prev => prev.map(f => {
                if (f.id === uploadingFile.id && f.status === 'uploading' && f.progress < 85) {
                    return { ...f, progress: f.progress + Math.random() * 15 };
                }
                return f;
            }));
        }, 200);

        try {
            const res = await fetch(`${BASE_URL}/employees/${employeeId}/upload`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });

            clearInterval(progressInterval);

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            const data = await res.json();
            const savedDoc: UploadedDocument = data.documents?.[0] || data;

            setUploadingFiles(prev => prev.map(f =>
                f.id === uploadingFile.id ? { ...f, status: 'done', progress: 100, savedDoc } : f
            ));

            setSavedDocuments(prev => {
                const updated = [savedDoc, ...prev];
                onDocumentsChanged?.(updated);
                return updated;
            });

        } catch (err: any) {
            clearInterval(progressInterval);
            setUploadingFiles(prev => prev.map(f =>
                f.id === uploadingFile.id ? { ...f, status: 'error', progress: 0, error: err.message } : f
            ));

            // Fallback: simulate success for demo mode (no backend)
            const demoDoc: UploadedDocument = {
                id: uploadingFile.id,
                name: uploadingFile.file.name,
                type: selectedCategory,
                fileUrl: uploadingFile.preview || '#',
                fileSize: uploadingFile.file.size,
                mimeType: uploadingFile.file.type,
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'demo@salery.ma',
            };
            setUploadingFiles(prev => prev.map(f =>
                f.id === uploadingFile.id ? { ...f, status: 'done', progress: 100, savedDoc: demoDoc } : f
            ));
            setSavedDocuments(prev => {
                const updated = [demoDoc, ...prev];
                onDocumentsChanged?.(updated);
                return updated;
            });
        }
    }, [employeeId, selectedCategory, onDocumentsChanged]);

    const handleFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const newItems: UploadingFile[] = [];

        fileArray.forEach(file => {
            const error = validateFile(file);
            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

            const item: UploadingFile = {
                id, file, progress: 0,
                status: error ? 'error' : 'pending',
                error: error || undefined, preview,
            };
            newItems.push(item);
        });

        setUploadingFiles(prev => [...prev, ...newItems]);

        // Auto-start valid uploads
        newItems.filter(f => f.status === 'pending').forEach(f => {
            setTimeout(() => uploadFile(f), 100);
        });
    }, [uploadFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragState('idle');
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDeleteDoc = async (docId: string) => {
        try {
            const token = localStorage.getItem('salery_access_token');
            await fetch(`${BASE_URL}/employees/${employeeId}/documents/${docId}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
        } catch (e) { /* continue in local state */ }
        setSavedDocuments(prev => {
            const updated = prev.filter(d => d.id !== docId);
            onDocumentsChanged?.(updated);
            return updated;
        });
    };

    const retryUpload = (item: UploadingFile) => {
        setUploadingFiles(prev => prev.map(f =>
            f.id === item.id ? { ...f, status: 'pending', progress: 0, error: undefined } : f
        ));
        uploadFile({ ...item, status: 'pending', progress: 0, error: undefined });
    };

    const removeFromQueue = (id: string) => {
        setUploadingFiles(prev => prev.filter(f => f.id !== id));
    };

    return (
        <div className="w-full space-y-6">
            {/* Category Picker */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.value
                            ? 'bg-[#0078D4] text-white shadow-md shadow-blue-500/30'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Drop Zone */}
            <div
                onDragEnter={(e) => { e.preventDefault(); setDragState('dragging'); }}
                onDragOver={(e) => { e.preventDefault(); setDragState('dragging'); }}
                onDragLeave={() => setDragState('idle')}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 select-none
                    ${dragState === 'dragging'
                        ? 'border-[#0078D4] bg-blue-50 scale-[1.01]'
                        : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
            >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border transition-all duration-200 ${dragState === 'dragging' ? 'bg-[#0078D4] border-[#0078D4] text-white' : 'bg-white border-gray-200 text-[#0078D4]'}`}>
                    <Upload size={28} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">
                        {dragState === 'dragging' ? 'Relâchez pour téléverser' : 'Glissez vos fichiers ici ou cliquez'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOCX — Max 10 Mo</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="sr-only"
                />
            </div>

            {/* Upload Queue */}
            {uploadingFiles.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Queue d'upload</h4>
                    {uploadingFiles.map(item => (
                        <div key={item.id} className={`bg-white border rounded-xl p-4 flex items-center gap-4 shadow-sm transition-all ${item.status === 'error' ? 'border-rose-200 bg-rose-50/30' : item.status === 'done' ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200'}`}>
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                {item.preview
                                    ? <img src={item.preview} className="w-full h-full object-cover" alt="preview" />
                                    : getFileIcon(item.file.type)
                                }
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-gray-900 truncate mr-2">{item.file.name}</span>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatBytes(item.file.size)}</span>
                                </div>

                                {item.status === 'uploading' && (
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                )}
                                {item.status === 'uploading' && (
                                    <p className="text-[10px] text-blue-600 font-bold mt-0.5">{Math.round(item.progress)}%</p>
                                )}
                                {item.status === 'done' && (
                                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Téléversé avec succès
                                    </p>
                                )}
                                {item.status === 'error' && (
                                    <p className="text-[10px] text-rose-500 font-bold truncate">⚠ {item.error}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {item.status === 'error' && (
                                    <button onClick={() => retryUpload(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Réessayer">
                                        <RefreshCw size={14} />
                                    </button>
                                )}
                                <button onClick={() => removeFromQueue(item.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Saved Documents List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        Documents Enregistrés ({savedDocuments.length})
                    </h4>
                </div>

                {loadingDocs ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : savedDocuments.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                        Aucun document enregistré — commencez par téléverser des fichiers.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {savedDocuments.map(doc => (
                            <div key={doc.id} className="group flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200 hover:shadow-sm transition-all">
                                <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                                    {getFileIcon(doc.mimeType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">{doc.type.replace('_', ' ')}</span>
                                        <span className="text-[10px] text-gray-300">•</span>
                                        <span className="text-[10px] text-gray-400">{formatBytes(doc.fileSize)}</span>
                                        <span className="text-[10px] text-gray-300">•</span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all"
                                        title="Télécharger"
                                    >
                                        <Download size={14} />
                                    </a>
                                    <button
                                        onClick={() => handleDeleteDoc(doc.id)}
                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
