import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
    X, Phone, MapPin, CheckCircle2, Download, AlertCircle,
    Calendar, Building2, Shield, ArrowLeft, RefreshCw,
    BadgeCheck, Camera, Fingerprint, Map, HeartPulse, UserCircle
} from 'lucide-react';
import {
    Employee, Language, AuthUser, EmployeeDocument,
    SystemUser
} from '../types.ts';
import { validateFile } from '../services/documentVault.ts';
import EmployeeTimeline from './EmployeeTimeline.tsx';
import EmployeeFileUploader from './EmployeeFileUploader.tsx';

interface Props {
    employee: Employee;
    lang: Language;
    user: AuthUser;
    onClose: () => void;
    onUpdate: (updatedEmp: Employee) => void;
}

const EmployeeProfile: React.FC<Props> = ({ employee, lang, user, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'payroll' | 'banking' | 'documents' | 'access' | 'badge' | 'history'>('personal');
    const [isUploading, setIsUploading] = useState(false);
    const [localEmp, setLocalEmp] = useState<Employee>(employee);
    const [linkedUser, setLinkedUser] = useState<SystemUser | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const allUsersRaw = localStorage.getItem('salaire_system_users');
        const allUsers = allUsersRaw ? JSON.parse(allUsersRaw) : [];
        const found = allUsers.find((u: any) => u.employeeId === employee.id || u.email === employee.email);
        setLinkedUser(found || null);
    }, [employee.id, employee.email]);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToastMessage({ type, text });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast('error', "L'image ne doit pas dépasser 2MB.");
            return;
        }

        try {
            setIsUploading(true);
            const fData = new FormData();
            fData.append('photo', file);

            const token = localStorage.getItem('salery_access_token');
            const res = await fetch(`http://127.0.0.1:3001/api/v1/employees/${localEmp.id}/photo`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include',
                body: fData
            });

            if (!res.ok) throw new Error("Upload failed to connect to backend");

            const updated = await res.json();
            setLocalEmp(updated);
            onUpdate(updated);
            showToast('success', "Photo de profil mise à jour avec succès.");
        } catch (err: any) {
            console.error("Upload error:", err);
            showToast('error', `Erreur d'envoi: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadBadge = async () => {
        const badgeElement = document.getElementById(`badge-${localEmp.id}`);
        if (!badgeElement) return;

        try {
            setIsUploading(true);
            const canvas = await html2canvas(badgeElement, { scale: 3, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [54, 86] });
            pdf.addImage(imgData, 'PNG', 0, 0, 54, 86);
            pdf.save(`Badge_${localEmp.internalMatricule || localEmp.id.substring(0, 8)}.pdf`);
            showToast('success', "Badge téléchargé.");
        } catch (err) {
            console.error(err);
            showToast('error', "Erreur lors de l'export du badge.");
        } finally {
            setIsUploading(false);
        }
    };

    // Calculate dynamic completion score
    const score = localEmp.profileCompletionScore || 0;
    const scoreColor = score < 50 ? 'bg-rose-500' : score < 80 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="w-full max-w-[1400px] mx-auto flex flex-col xl:flex-row gap-8 xl:gap-12 animate-in fade-in duration-400 pb-12 relative px-4 xl:px-0">

            {/* Custom Toast Notification */}
            {toastMessage && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-top-4 ${toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    {toastMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold text-sm">{toastMessage.text}</span>
                </div>
            )}

            {/* ─── LEFT SIDEBAR PROFILE CARD ─── */}
            <div className="w-full xl:w-[360px] shrink-0 flex flex-col gap-6">
                
                {/* Main Hero Card */}
                <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden flex flex-col items-center relative">
                    <div className="h-32 w-full bg-gradient-to-br from-blue-700 via-indigo-800 to-indigo-900 relative">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    </div>

                    {/* Avatar Upload Container */}
                    <div className="-mt-16 relative group z-10 w-32 h-32 rounded-full border-4 border-white bg-gray-100 shadow-lg flex justify-center items-center overflow-hidden">
                        {localEmp.photoUrl ? (
                            <img src={localEmp.photoUrl} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <UserCircle size={64} className="text-gray-300" />
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-sm">
                            <Camera size={24} className="mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Changer</span>
                            <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handlePhotoUpload} />
                        </label>
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-20 backdrop-blur-sm">
                                <RefreshCw size={24} className="animate-spin text-blue-600" />
                            </div>
                        )}
                    </div>

                    {/* Employee Identity */}
                    <div className="px-6 py-6 text-center w-full">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter truncate">{localEmp.fullName}</h2>
                        <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest truncate">{localEmp.jobTitle}</p>
                        <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">{localEmp.department || 'Général'}</p>

                        <div className="mt-6 flex justify-center gap-3">
                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {localEmp.employmentStatus === 'active' ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                    </div>

                    {/* Profile Completion Score */}
                    <div className="w-full px-8 py-6 bg-gray-50 border-t border-gray-100">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Complétion du Profil</span>
                            <span className="text-lg font-black text-gray-900">{score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className={`h-full ${scoreColor} transition-all duration-1000`} style={{ width: `${score}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Quick Details Card */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-200 shadow-sm space-y-4">
                    <SideDetail icon={<Building2 size={16} />} label="Matricule" value={localEmp.internalMatricule} />
                    <SideDetail icon={<Fingerprint size={16} />} label="CIN" value={localEmp.cin || 'Non renseigné'} />
                    <SideDetail icon={<Shield size={16} />} label="CNSS" value={localEmp.socialSecurityNumber || localEmp.cnssEmployee || 'Non renseigné'} />
                    <SideDetail icon={<MapPin size={16} />} label="Site" value={localEmp.assignedSite || 'Siège Principal'} />
                </div>
            </div>


            {/* ─── RIGHT SIDE WORKSPACE ─── */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                
                {/* Header & Tabs */}
                <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm px-6 sm:px-10 pt-8">
                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-6">
                            <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-all shadow-inner border border-gray-100 hidden sm:block">
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">Dossier Collaborateur</h1>
                                <p className="text-sm font-medium text-gray-500 mt-2">Gestion complète de l'identité et du cycle de vie RH.</p>
                            </div>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md shrink-0">
                            Éditer Profil
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-8 sm:gap-12 overflow-x-auto border-b border-gray-100 mt-4 px-2 pb-1 custom-scrollbar">
                        {[
                            { id: 'personal', label: 'Infos Personnelles' },
                            { id: 'employment', label: 'Contrat & Poste' },
                            { id: 'payroll', label: 'Paie' },
                            { id: 'banking', label: 'Banque' },
                            { id: 'documents', label: 'Documents' },
                            { id: 'access', label: 'Accès' },
                            { id: 'badge', label: 'Badge' },
                            { id: 'history', label: 'Historique' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-4 text-[12px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap px-1 shrink-0 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {tab.label}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full shadow-[0_-2px_12px_rgba(37,99,235,0.5)]"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content Panels */}
                <div className="space-y-10 mt-4">

                    {activeTab === 'personal' && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <SectionCard title="Identité Civile">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-8 gap-x-12">
                                    <DataField label="Prénom" val={localEmp.firstName} />
                                    <DataField label="Nom" val={localEmp.lastName} />
                                    <DataField label="Nationalité" val={localEmp.nationality} />
                                    <DataField label="Date de naissance" val={localEmp.dob || localEmp.dateOfBirth} isDate />
                                    <DataField label="Lieu de naissance" val={localEmp.pob || localEmp.placeOfBirth} />
                                </div>
                            </SectionCard>
                            
                            <SectionCard title="Contact & Situation Familiale">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <DataField label="Téléphone Personnel" val={localEmp.phoneNumber} />
                                    <DataField label="Email" val={localEmp.email} />
                                    <DataField label="Situation Familiale" val={localEmp.maritalStatus} />
                                    <DataField label="Personne à Contacter (Urgence)" val={localEmp.emergencyContact || localEmp.emergencyContactName} />
                                    <div className="md:col-span-2">
                                        <DataField label="Adresse Résidentielle" val={localEmp.address || localEmp.physicalAddress} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {activeTab === 'employment' && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <SectionCard title="Détails du Poste">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <DataField label="Poste Occupé" val={localEmp.jobTitle} />
                                    <DataField label="Département" val={localEmp.department} />
                                    <DataField label="Manager Direct" val={localEmp.manager} />
                                    <DataField label="Site d'affectation" val={localEmp.assignedSite} />
                                </div>
                            </SectionCard>

                            <SectionCard title="Contrat">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <DataField label="Type de Contrat" val={localEmp.contractType} isBadge />
                                    <DataField label="Date d'Embauche" val={localEmp.hireDate} isDate />
                                    <DataField label="Fin de Contrat Prévue" val={localEmp.contractEndDate} isDate />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {activeTab === 'payroll' && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <SectionCard title="Configuration Paie">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <DataField label="Mode de Rémunération" val={localEmp.salaryType === 'hourly' ? "Taux Horaire" : "Salaire Fixe"} />
                                    <DataField label="Salaire de Base" val={localEmp.baseSalary ? `${localEmp.baseSalary.toLocaleString('fr-FR')} MAD` : null} isHighlight />
                                    <DataField label="Taux Heures Supp." val={localEmp.overtimeRate ? `${localEmp.overtimeRate} MAD / h` : null} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {activeTab === 'banking' && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <SectionCard title="Coordonnées Bancaires">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <DataField label="Mode de Paiement" val={localEmp.paymentMethod === 'CASH' ? 'Espèces' : 'Virement Bancaire'} />
                                    <DataField label="Nom de la Banque" val={localEmp.bankName} />
                                    <div className="md:col-span-2">
                                        <DataField label="Relevé d'Identité Bancaire (RIB)" val={localEmp.rib} isMono />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <SectionCard title="Coffre-Fort Électronique">
                                <EmployeeFileUploader employeeId={localEmp.id} />
                            </SectionCard>
                        </div>
                    )}

                    {activeTab === 'badge' && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <SectionCard title="Génération de Badge d'Accès">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    {/* Preview */}
                                    <div className="flex justify-center bg-gray-50 border border-gray-200 rounded-3xl p-8">
                                        <div className="w-[320px] h-[480px] bg-white rounded-2xl shadow-[0_20px_50px_rgb(0,0,0,0.15)] overflow-hidden">
                                            <div id={`badge-${localEmp.id}`} className="flex flex-col h-[480px] bg-white relative">
                                                <div className="h-24 bg-blue-700 flex items-start pt-4 justify-center text-white font-black tracking-widest text-lg">
                                                    {user?.companyName || 'SALERY CORP'}
                                                </div>
                                                <div className="flex-1 flex flex-col items-center">
                                                    <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 -mt-12 overflow-hidden shadow-lg z-10">
                                                        {localEmp.photoUrl ? (
                                                            <img src={localEmp.photoUrl} className="w-full h-full object-cover" alt="Profile" />
                                                        ) : (
                                                            <UserCircle size={88} className="text-gray-300 m-auto mt-1" />
                                                        )}
                                                    </div>
                                                    <div className="mt-4 text-center px-4">
                                                        <h2 className="text-xl font-black text-gray-900 leading-tight">{localEmp.fullName}</h2>
                                                        <p className="text-xs font-bold text-blue-600 mt-1 uppercase">{localEmp.jobTitle}</p>
                                                    </div>
                                                    <div className="mt-6 p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                                        <QRCodeSVG value={localEmp.id} size={140} level="H" />
                                                    </div>
                                                </div>
                                                <div className="h-12 bg-gray-50 flex items-center justify-center border-t border-gray-100">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID: {localEmp.internalMatricule}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex flex-col gap-4">
                                        <button onClick={handleDownloadBadge} disabled={isUploading} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-all">
                                            {isUploading ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
                                            Télécharger le PDF d'impression
                                        </button>
                                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                                            <h4 className="font-bold text-blue-800 flex items-center gap-2"><Fingerprint size={18} /> Puce NFC Intégrée</h4>
                                            <p className="text-sm text-blue-600">Le QR code est conçu pour les scanners optiques. Vous pouvez également lier une carte NFC pour le pointage sans contact.</p>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <EmployeeTimeline employeeId={localEmp.id} />
                        </div>
                    )}

                </div>
            </div>

            {/* ─── EDIT PROFILE MODAL ─── */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <form 
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            const data = Object.fromEntries(fd.entries());
                            try {
                                setIsUploading(true);
                                const token = localStorage.getItem('salery_access_token');
                                const res = await fetch(`http://127.0.0.1:3001/api/v1/employees/${localEmp.id}`, {
                                    method: 'PATCH',
                                    headers: { 
                                        'Content-Type': 'application/json',
                                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                    },
                                    body: JSON.stringify(data)
                                });
                                if (!res.ok) throw new Error("Erreur de sauvegarde");
                                const updated = await res.json();
                                setLocalEmp(updated);
                                onUpdate(updated);
                                setIsEditing(false);
                                showToast('success', "Profil mis à jour avec succès.");
                            } catch (err: any) {
                                showToast('error', err.message);
                            } finally {
                                setIsUploading(false);
                            }
                        }}
                        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
                    >
                        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="font-black text-gray-900 text-xl tracking-tight">Éditer le Profil</h3>
                                <p className="text-xs font-semibold text-gray-500 mt-1">Mise à jour des informations de {localEmp.firstName}</p>
                            </div>
                            <button type="button" onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                            
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2">Identité Civile</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput name="firstName" label="Prénom" def={localEmp.firstName} />
                                    <FormInput name="lastName" label="Nom" def={localEmp.lastName} />
                                    <FormInput name="cin" label="CIN" def={localEmp.cin} />
                                    <FormInput name="socialSecurityNumber" label="N° CNSS" def={localEmp.socialSecurityNumber || localEmp.cnssEmployee} />
                                    <FormInput name="nationality" label="Nationalité" def={localEmp.nationality} />
                                    <FormInput name="maritalStatus" label="Situation Familiale" def={localEmp.maritalStatus} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2">Contact & Localisation</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput name="phoneNumber" label="Téléphone" def={localEmp.phoneNumber} />
                                    <FormInput name="email" label="Email Personnel" def={localEmp.email} type="email" />
                                    <div className="col-span-2">
                                        <FormInput name="address" label="Adresse Résidentielle" def={localEmp.address || localEmp.physicalAddress} />
                                    </div>
                                    <FormInput name="emergencyContact" label="Contact d'Urgence" def={localEmp.emergencyContact} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2">Professionnel & Paie</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput name="jobTitle" label="Intitulé du Poste" def={localEmp.jobTitle} />
                                    <FormInput name="department" label="Département" def={localEmp.department} />
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Type de Contrat</label>
                                        <select 
                                            name="contractType" 
                                            defaultValue={localEmp.contractType || ''}
                                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        >
                                            <option value="">Sélectionner...</option>
                                            <option value="CDI">CDI</option>
                                            <option value="CDD">CDD</option>
                                            <option value="ANAPEC">ANAPEC</option>
                                            <option value="CHANTIER">Chantier</option>
                                            <option value="STAGE">Stage</option>
                                            <option value="FREELANCE">Freelance</option>
                                        </select>
                                    </div>
                                    <FormInput name="hireDate" label="Date d'Embauche" def={localEmp.hireDate ? new Date(localEmp.hireDate).toISOString().split('T')[0] : ''} type="date" />
                                    <FormInput name="contractEndDate" label="Fin de Contrat" def={localEmp.contractEndDate ? new Date(localEmp.contractEndDate).toISOString().split('T')[0] : ''} type="date" />
                                    <FormInput name="baseSalary" label="Salaire de Base (MAD)" def={localEmp.baseSalary?.toString()} type="number" />
                                    <div className="col-span-2">
                                        <FormInput name="rib" label="RIB (24 chiffres)" def={localEmp.rib} />
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all">
                                Annuler
                            </button>
                            <button type="submit" disabled={isUploading} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2">
                                {isUploading && <RefreshCw size={16} className="animate-spin" />}
                                Sauvegarder
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// --- Reusable Premium UI Components ---

const FormInput = ({ label, name, def, type = 'text' }: any) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{label}</label>
        <input 
            type={type} 
            name={name} 
            defaultValue={def || ''} 
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300"
            placeholder={`Saisir ${label.toLowerCase()}`}
        />
    </div>
);

const SectionCard = ({ title, children }: any) => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <div className="px-8 py-6 border-b border-gray-100">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
        </div>
        <div className="p-8">
            {children}
        </div>
    </div>
);

const SideDetail = ({ icon, label, value }: any) => (
    <div className="flex items-center gap-4 py-1">
        <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{value}</p>
        </div>
    </div>
);

const DataField = ({ label, val, isHighlight, isBadge, isMono, isDate }: any) => {
    let displayVal = val;
    if (isDate && val) {
        try {
            displayVal = new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch(e) {}
    }

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
            {isBadge && val ? (
                <div><span className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-md text-xs font-bold uppercase tracking-widest inline-block">{displayVal}</span></div>
            ) : isHighlight && val ? (
                <span className="text-xl font-black text-gray-900">{displayVal}</span>
            ) : (
                <span className={`${val ? 'text-gray-900 font-semibold' : 'text-gray-300 italic'} ${isMono ? 'font-mono text-sm tracking-wider' : 'text-sm'}`}>
                    {displayVal || 'Non renseigné'}
                </span>
            )}
        </div>
    );
};

export default EmployeeProfile;