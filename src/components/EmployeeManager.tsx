import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Search, Edit3, Trash2, MapPin,
  Phone, Mail, FileText, CheckCircle2, X, Plus,
  Briefcase, CreditCard, User, Building2, Calendar,
  AlertCircle, Camera, QrCode, Printer, ChevronDown,
  FileDown, FileUp, Download, Upload, AlertTriangle, Lock,
  AtSign, Smartphone, Baby, Heart, BadgeCheck, FileBadge, FileStack, Trash,
  FileCheck, ShieldCheck, Landmark, SearchX, Eye, ArrowRight, ArrowLeft,
  Check as CheckIcon, UploadCloud, Info, Fingerprint, RefreshCw, Users2,
  Archive, MoreHorizontal, Filter, XCircle, CheckSquare, Square
} from 'lucide-react';
import { Employee, Language, AuthUser, UserRole, SystemUser, Site } from '../types.ts';
import { provisionUserAccount, simulateActivationEmail } from '../services/authService.ts';
import { getSites } from '../services/siteService.ts';
import ImportModal from './ImportModal.tsx';
import EmployeeProfile from './EmployeeProfile.tsx';
import { useNavigate } from 'react-router-dom';

interface Props {
  employees: Employee[];
  setEmployees: (emps: Employee[]) => void;
  lang: Language;
  user: AuthUser;
  onShowPricing: () => void;
}

const EmployeeManager: React.FC<Props> = ({ employees, setEmployees, lang, user }) => {
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoCreateUser, setAutoCreateUser] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [availableSites, setAvailableSites] = useState<Site[]>([]);

  // Enterprise Table & Filtering States
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ title: string, msg: string, type: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();

  const initialForm: Partial<Employee> = {
    civility: 'MR',
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    cin: '',
    cnssEmployee: '',
    dob: '',
    pob: '',
    nationality: 'Marocaine',
    maritalStatus: 'single',
    childrenCount: 0,
    physicalAddress: '',
    jobTitle: '',
    department: 'Opérations',
    contractType: 'CDI',
    baseSalary: 3500,
    hireDate: new Date().toISOString().split('T')[0],
    employmentStatus: 'active',
    country: 'MA',
    assignedSite: '',
    overtimeRate: 1.25,
    transportAllowance: 0,
    mealAllowance: 0,
    fixedPrimes: 0,
    manager: '',
    bankName: '',
    rib: '',
    paymentMethod: 'TRANSFER',
    photoUrl: ''
  };

  const [formData, setFormData] = useState<Partial<Employee>>(initialForm);

  useEffect(() => {
    // Charger les sites dynamiques pour le sélecteur
    setAvailableSites(getSites());
  }, [showForm]);

  const handleImportComplete = (newEmps: Employee[]) => {
    const updated = [...employees, ...newEmps];
    setEmployees(updated);
    localStorage.setItem('salaire_employees', JSON.stringify(updated));
    setShowImport(false);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const updated = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    setEmployees(updated);
    localStorage.setItem('salaire_employees', JSON.stringify(updated));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, photo: "Max 2MB autorisé." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
        setErrors({ ...errors, photo: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  const t = {
    fr: {
      title: "Gestion d'Équipe",
      subtitle: "Gérez vos collaborateurs, contrats et conformité sociale.",
      addBtn: "ONBOARDING COLLABORATEUR",
      importBtn: "IMPORTER",
      steps: ["Identité", "Professionnel", "Salaire", "Banque", "Accès"],
      validation: {
        cinExists: "Ce CIN est déjà utilisé.",
        cnssExists: "N° CNSS déjà utilisé.",
        emailReq: "E-mail obligatoire pour la création de compte.",
        emailExists: "Cet e-mail est déjà lié à un compte utilisateur.",
        ageLimit: "Majeur (18 ans+) requis.",
        required: "Obligatoire."
      }
    },
    ar: {
      title: "إدارة الفريق",
      subtitle: "إدارة الموظفين والعقود والامتثال الاجتماعي.",
      addBtn: "توظيف جديد",
      importBtn: "استيراد",
      steps: ["الهوية", "المهني", "الراتب", "البنك", "الولوج"]
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = t.validation.required;
      if (!formData.lastName) newErrors.lastName = t.validation.required;
      if (!formData.cin) newErrors.cin = t.validation.required;
      if (employees.some(e => e.cin === formData.cin && e.id !== editingId)) newErrors.cin = "Ce CIN est déjà utilisé.";
    }
    if (step === 5 && autoCreateUser) {
      if (!formData.email) newErrors.email = "E-mail requis.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => prev + 1);
  };

  const showToast = (title: string, msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleArchiveBulk = async () => {
    if (selectedIds.size === 0) return;
    try {
      const updated = employees.map(e => {
        if (selectedIds.has(e.id)) {
          return { ...e, isArchived: true, archivedAt: new Date().toISOString() };
        }
        return e;
      });
      setEmployees(updated);
      showToast("Archivage réussi", `${selectedIds.size} collaborateurs ont été archivés.`, "success");
      setSelectedIds(new Set());
    } catch (e) {
      showToast("Erreur", "Impossible d'archiver la sélection.", "error");
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer (soft-delete) ${selectedIds.size} collaborateurs ?`)) return;
    try {
      const updated = employees.map(e => {
        if (selectedIds.has(e.id)) {
          return { ...e, isDeleted: true, deletedAt: new Date().toISOString() };
        }
        return e;
      });
      setEmployees(updated);
      showToast("Suppression réussie", `${selectedIds.size} collaborateurs supprimés logiciellement.`, "success");
      setSelectedIds(new Set());
    } catch (e) {
      showToast("Erreur", "Impossible de supprimer la sélection.", "error");
    }
  };

  const handleRestoreBulk = async () => {
    if (selectedIds.size === 0) return;
    try {
      const updated = employees.map(e => {
        if (selectedIds.has(e.id)) {
          return { ...e, isArchived: false, archivedAt: undefined };
        }
        return e;
      });
      setEmployees(updated);
      showToast("Restauration réussie", `${selectedIds.size} collaborateurs désarchivés.`, "success");
      setSelectedIds(new Set());
    } catch (e) {
      showToast("Erreur", "Impossible de restaurer la sélection.", "error");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedEmployees.length && paginatedEmployees.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedEmployees.map(e => e.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsProvisioning(true);

    try {
      const { api } = await import('../services/api');

      if (editingId) {
        // PATCH update to backend
        await api.patch(`/employees/${editingId}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phoneNumber,
          email: formData.email,
          position: formData.jobTitle,
          baseSalary: formData.baseSalary,
          salaryType: formData.salaryType || 'MONTHLY',
        });
      } else {
        // POST create to backend
        await api.post('/employees', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phoneNumber,
          email: formData.email,
          position: formData.jobTitle,
          salaryType: formData.salaryType || 'MONTHLY',
          baseSalary: formData.baseSalary
        });

        // Auto create user if toggled
        if (autoCreateUser && formData.email) {
          const newUser = await provisionUserAccount(formData as Employee, user);
          await simulateActivationEmail(newUser);
        }
      }

      // Always refresh employees from backend after any change
      const freshEmployees = await api.get('/employees');
      if (Array.isArray(freshEmployees)) {
        setEmployees(freshEmployees);
      }

    } catch (err) {
      console.error("Save error", err);
      setErrors({ ...errors, general: "Erreur lors de la sauvegarde" });
    } finally {
      setIsProvisioning(false);
      setShowForm(false);
      setCurrentStep(1);
      setFormData(initialForm);
      setEditingId(null);
    }
  };

  const baseFiltered = employees.filter(e => !e.isDeleted);

  const filteredEmployees = baseFiltered.filter(e => {
    const tabMatch = activeTab === 'archived' ? e.isArchived : !e.isArchived;
    const searchMatch = !searchTerm || e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.cin.toLowerCase().includes(searchTerm.toLowerCase());
    const deptMatch = !filterDepartment || e.department === filterDepartment;
    const statusMatch = !filterStatus || e.employmentStatus === filterStatus;

    return tabMatch && searchMatch && deptMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedEmployee = useMemo(() =>
    employees.find(e => e.id === selectedProfileId && !e.isDeleted),
    [employees, selectedProfileId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[2000] px-6 py-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-top-4 ${toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
          <Info size={20} className={toastMessage.type === 'success' ? 'text-emerald-500' : 'text-red-500'} />
          <div>
            <h4 className="font-bold text-sm">{toastMessage.title}</h4>
            <p className="text-xs mt-1 opacity-80">{toastMessage.msg}</p>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#111827] tracking-tighter">{t.title}</h2>
          <p className="text-[#6B7280] font-medium">{t.subtitle}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowImport(true)} className="flex-1 md:flex-none px-6 py-4 bg-blue-50 text-[#0078D4] border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"><Upload size={16} className="text-[#0A66C2]" /> {t.importBtn}</button>
          <button onClick={() => { setFormData(initialForm); setEditingId(null); setCurrentStep(1); setShowForm(true); }} className="flex-1 md:flex-none btn-primary-gradient px-8 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95"><UserPlus size={18} /> {t.addBtn}</button>
        </div>
      </header>

      {/* TABS & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex bg-gray-50 p-1 rounded-xl">
          <button onClick={() => { setActiveTab('active'); setSelectedIds(new Set()); setCurrentPage(1); }} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'active' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-400 hover:text-gray-600'}`}>Actifs</button>
          <button onClick={() => { setActiveTab('archived'); setSelectedIds(new Set()); setCurrentPage(1); }} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'archived' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-400 hover:text-gray-600'}`}>Archivés</button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-64">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-300`} size={16} />
            <input type="text" placeholder="Rechercher (Nom, CIN)..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none shadow-inner focus:border-[#0078D4] transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className="py-2 pl-4 pr-8 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:border-[#0078D4] appearance-none">
            <option value="">Tous les départements</option>
            {Array.from(new Set(employees.map(e => e.department))).filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* BULK ACTION TOOLBAR */}
      {selectedIds.size > 0 && (
        <div className="bg-[#111827] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between sticky top-4 z-50 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">{selectedIds.size}</div>
            <span className="text-sm font-bold">Sélectionnés</span>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'active' ? (
              <button onClick={handleArchiveBulk} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"><Archive size={14} /> Archiver</button>
            ) : (
              <button onClick={handleRestoreBulk} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"><RefreshCw size={14} /> Restaurer</button>
            )}
            <button onClick={handleDeleteBulk} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"><Trash size={14} /> Supprimer</button>
            <button onClick={() => setSelectedIds(new Set())} className="p-2 text-gray-400 hover:text-white transition-all"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* TABLE UI */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-[#111827] transition-colors">
                    {paginatedEmployees.length > 0 && selectedIds.size === paginatedEmployees.length ? <CheckSquare size={18} className="text-[#0078D4]" /> : <Square size={18} />}
                  </button>
                </th>
                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-400">Employé</th>
                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-400">Poste & Dépt</th>
                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-400">Statut</th>
                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-400">Embauche</th>
                <th className="p-4 text-[10px] uppercase font-black tracking-widest text-gray-400">Rémunération</th>
                <th className="p-4 text-center text-[10px] uppercase font-black tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedEmployees.length > 0 ? paginatedEmployees.map(emp => (
                <tr key={emp.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.has(emp.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleSelectOne(emp.id)} className="text-gray-300 hover:text-[#111827] transition-colors">
                      {selectedIds.has(emp.id) ? <CheckSquare size={18} className="text-[#0078D4]" /> : <Square size={18} className="group-hover:text-gray-400" />}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                        {emp.photoUrl && <img src={emp.photoUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div
                          className="font-bold text-sm text-[#111827] flex items-center gap-2 cursor-pointer hover:underline"
                          onClick={() => navigate(`/rh/emps/${emp.id}`)}
                        >
                          {emp.fullName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">{[emp.cin, emp.phoneNumber].filter(Boolean).join(' • ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-xs text-[#111827]">{emp.jobTitle || 'N/A'}</div>
                    <div className="text-[10px] text-gray-400">{emp.department || 'N/A'} • {emp.contractType || 'N/A'}</div>
                  </td>
                  <td className="p-4">
                    {emp.employmentStatus === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wide"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Actif</span>
                    ) : emp.employmentStatus === 'leaving' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase tracking-wide"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Démission</span>
                    ) : emp.employmentStatus === 'terminated' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold uppercase tracking-wide"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Licencié</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold uppercase tracking-wide"><div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> Absent</span>
                    )}
                  </td>
                  <td className="p-4 text-xs font-medium text-gray-600">
                    {new Date(emp.hireDate).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-xs text-[#111827]">{emp.baseSalary.toLocaleString()} DH</div>
                    <div className="text-[9px] text-gray-400 uppercase">{emp.paymentMethod === 'TRANSFER' ? 'Virement' : 'Espèces'}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => navigate(`/rh/emps/${emp.id}`)} className="p-1.5 text-gray-400 hover:text-[#0078D4] hover:bg-blue-50 rounded-lg transition-all" title="Profil Complet"><Eye size={16} /></button>
                      <button onClick={() => { setFormData(emp); setEditingId(emp.id); setCurrentStep(1); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-[#0078D4] hover:bg-blue-50 rounded-lg transition-all" title="Modifier"><Edit3 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <SearchX size={32} className="text-gray-300" />
                      <p className="text-sm font-medium">Aucun collaborateur trouvé.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Affichage {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} sur {filteredEmployees.length}</span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ArrowLeft size={14} /></button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{i + 1}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ArrowRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[1500] bg-black/70 backdrop-blur-xl flex items-center justify-center p-0 md:p-8 overflow-y-auto no-scrollbar">
          <div className="bg-[#F9FAFB] w-full max-w-5xl md:rounded-[40px] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 flex flex-col min-h-screen md:min-h-0 md:max-h-[90vh]">

            <header className="p-8 bg-white border-b border-gray-100 shrink-0">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F0F7FF] text-[#0078D4] rounded-2xl flex items-center justify-center shadow-inner"><UserPlus size={24} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-[#111827] tracking-tighter">Onboarding System</h3>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Provisioning Layer V26</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-all text-gray-400"><X size={24} /></button>
              </div>

              <div className="flex items-center gap-2 max-w-2xl mx-auto">
                {t.steps.map((label, i) => (
                  <React.Fragment key={i}>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${currentStep > i + 1 ? 'bg-emerald-500 text-white shadow-lg' : currentStep === i + 1 ? 'bg-[#0078D4] text-white shadow-xl scale-110' : 'bg-gray-100 text-gray-400'}`}>
                        {currentStep > i + 1 ? <CheckIcon size={14} strokeWidth={4} /> : i + 1}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${currentStep === i + 1 ? 'text-[#0078D4]' : 'text-gray-300'}`}>{label}</span>
                    </div>
                    {i < t.steps.length - 1 && <div className={`h-0.5 flex-1 transition-all ${currentStep > i + 1 ? 'bg-emerald-200' : 'bg-gray-100'}`}></div>}
                  </React.Fragment>
                ))}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 no-scrollbar text-start">
              <div className="max-w-4xl mx-auto">
                {currentStep === 1 && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <SectionTitle icon={<Fingerprint size={16} />} label="Identité Personnelle" />

                    <div className="flex flex-col md:flex-row items-center gap-8 mb-10 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-[#F5F7FA] border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
                          {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <User size={32} className="text-gray-300" />}
                        </div>
                        <label className="absolute -bottom-1 -right-1 p-2 bg-[#111827] text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                          <Camera size={14} />
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                      </div>
                      <div className="text-center md:text-start flex-1">
                        <h5 className="font-black text-sm uppercase text-[#111827]">Photo de Profil</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">Format carré recommandé (JPG/PNG, Max 2MB)</p>
                        {errors.photoUrl && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.photoUrl}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      <div className="md:col-span-2">
                        <FormSelect label="Civilité" value={formData.civility} onChange={v => setFormData({ ...formData, civility: v as any })} options={[{ v: 'MR', l: 'Monsieur' }, { v: 'MME', l: 'Madame' }, { v: 'MLLE', l: 'Mademoiselle' }]} />
                      </div>
                      <div className="md:col-span-5">
                        <FormInput label="Prénom" value={formData.firstName} onChange={v => setFormData({ ...formData, firstName: v })} error={errors.firstName} />
                      </div>
                      <div className="md:col-span-5">
                        <FormInput label="Nom" value={formData.lastName} onChange={v => setFormData({ ...formData, lastName: v })} error={errors.lastName} />
                      </div>

                      <div className="md:col-span-6">
                        <FormInput label="C.I.N" value={formData.cin} onChange={v => setFormData({ ...formData, cin: v.toUpperCase() })} error={errors.cin} placeholder="AB123456" />
                      </div>
                      <div className="md:col-span-6">
                        <FormInput label="N° CNSS" value={formData.cnssEmployee} onChange={v => setFormData({ ...formData, cnssEmployee: v })} placeholder="999999999" />
                      </div>

                      <div className="md:col-span-6">
                        <FormInput label="Date de naissance" type="date" value={formData.dob} onChange={v => setFormData({ ...formData, dob: v })} />
                      </div>
                      <div className="md:col-span-6">
                        <FormInput label="Lieu de naissance" value={formData.pob} onChange={v => setFormData({ ...formData, pob: v })} placeholder="Ex: Casablanca" />
                      </div>

                      <div className="md:col-span-6">
                        <FormInput label="Nationalité" value={formData.nationality} onChange={v => setFormData({ ...formData, nationality: v })} placeholder="Marocaine" />
                      </div>
                      <div className="md:col-span-6">
                        <FormSelect label="Situation Familiale" value={formData.maritalStatus} onChange={v => setFormData({ ...formData, maritalStatus: v as any })} options={[{ v: 'single', l: 'Célibataire' }, { v: 'married', l: 'Marié(e)' }, { v: 'divorced', l: 'Divorcé(e)' }, { v: 'widowed', l: 'Veuf/Veuve' }]} />
                      </div>

                      <div className="md:col-span-4">
                        <FormInput label="Nombre d'enfants" type="number" value={formData.childrenCount} onChange={v => setFormData({ ...formData, childrenCount: Number(v) })} />
                      </div>
                      <div className="md:col-span-8">
                        <FormInput label="Téléphone" value={formData.phoneNumber} onChange={v => setFormData({ ...formData, phoneNumber: v })} icon={<Smartphone size={16} className="text-gray-300" />} />
                      </div>
                      <div className="md:col-span-12">
                        <FormInput label="Adresse Complète" value={formData.physicalAddress} onChange={v => setFormData({ ...formData, physicalAddress: v })} icon={<MapPin size={16} className="text-gray-300" />} />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <SectionTitle icon={<Briefcase size={16} />} label="Informations Professionnelles" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormInput label="Poste / Intitulé" value={formData.jobTitle} onChange={v => setFormData({ ...formData, jobTitle: v })} error={errors.jobTitle} />
                      <FormSelect label="Département" value={formData.department} onChange={v => setFormData({ ...formData, department: v })} options={['Direction', 'Finance', 'RH', 'IT', 'Opérations', 'Production', 'Logistique']} />

                      <div className="md:col-span-2">
                        <FormSelect
                          label="Affectation Site / Branche"
                          value={formData.assignedSite}
                          onChange={v => setFormData({ ...formData, assignedSite: v })}
                          icon={<Building2 size={16} className="text-gray-300" />}
                          options={[
                            { v: '', l: 'Sélectionner un site ou une branche...' },
                            ...availableSites.map(s => ({ v: s.name, l: `${s.name} (${s.city})` }))
                          ]}
                        />
                      </div>

                      <FormSelect label="Type de Contrat" value={formData.contractType} onChange={v => setFormData({ ...formData, contractType: v as any })} options={['CDI', 'CDD', 'ANAPEC', 'CHANTIER', 'STAGE']} />
                      <FormInput label="Date d'embauche" type="date" value={formData.hireDate} onChange={v => setFormData({ ...formData, hireDate: v })} />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <SectionTitle icon={<CreditCard size={16} />} label="Rémunération" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormInput label="Salaire de base (Mensuel)" type="number" value={formData.baseSalary} onChange={v => setFormData({ ...formData, baseSalary: Number(v) })} />
                      <FormSelect label="Mode de Paiement" value={formData.paymentMethod} onChange={v => setFormData({ ...formData, paymentMethod: v as any })} options={[{ v: 'TRANSFER', l: 'Virement' }, { v: 'CASH', l: 'Espèces' }]} />
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <SectionTitle icon={<Landmark size={16} />} label="Banque" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormInput label="Banque" value={formData.bankName} onChange={v => setFormData({ ...formData, bankName: v })} />
                      <FormInput label="R.I.B." value={formData.rib} onChange={v => setFormData({ ...formData, rib: v })} placeholder="24 chiffres" />
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <SectionTitle icon={<Lock size={16} />} label="Gouvernance d'Accès" />
                    <div className="airbnb-card p-10 bg-white border-[#E3E8EE] space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="text-start">
                          <h4 className="font-black text-lg text-[#1A1F36]">Créer un compte utilisateur</h4>
                          <p className="text-xs font-bold text-gray-400">Génération automatique des droits d'accès</p>
                        </div>
                        <button
                          onClick={() => setAutoCreateUser(!autoCreateUser)}
                          className={`w-14 h-7 rounded-full p-1 transition-all ${autoCreateUser ? 'bg-[#0078D4]' : 'bg-gray-200'}`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${autoCreateUser ? (lang === 'ar' ? '-translate-x-7' : 'translate-x-7') : ''}`}></div>
                        </button>
                      </div>

                      {autoCreateUser && (
                        <div className="space-y-6 animate-in slide-in-from-top-4">
                          <FormInput
                            label="E-mail de connexion"
                            value={formData.email}
                            onChange={v => setFormData({ ...formData, email: v })}
                            error={errors.email}
                            placeholder="email@entreprise.ma"
                          />
                          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                            <Info size={18} className="text-[#0078D4] mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black text-blue-900 uppercase">Rôle Proposé : {formData.jobTitle ? 'AUTOMATIC' : 'EMPLOYEE'}</p>
                              <p className="text-[10px] text-blue-700 font-bold mt-1">L'employé recevra ses identifiants par e-mail immédiatement après confirmation.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="p-8 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
              <button onClick={() => currentStep === 1 ? setShowForm(false) : setCurrentStep(prev => prev - 1)} className="px-8 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-rose-100 transition-all"><ArrowLeft size={16} /> {currentStep === 1 ? 'Annuler' : 'Précédent'}</button>
              {currentStep < 5 ? (
                <button onClick={handleNext} className="px-10 py-4 bg-[#111827] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95">Suivant <ArrowRight size={16} /></button>
              ) : (
                <button onClick={handleSave} disabled={isProvisioning} className="px-12 py-4 btn-primary-gradient text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50">
                  {isProvisioning ? <RefreshCw className="animate-spin" size={18} /> : <><CheckIcon size={18} /> Confirmer Onboarding</>}
                </button>
              )}
            </footer>
          </div>
        </div>
      )}

      {showImport && <ImportModal type="employees" lang={lang} onClose={() => setShowImport(false)} onComplete={handleImportComplete} contextData={{ employees, companyId: user.companyId }} />}
    </div>
  );
};

const SectionTitle = ({ icon, label }: any) => (
  <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-8">
    <div className="text-[#0078D4]">{icon}</div>
    <h4 className="text-[11px] font-black text-[#111827] uppercase tracking-[0.2em]">{label}</h4>
  </div>
);

const FormInput = ({ label, value, onChange, type = "text", error, placeholder, icon }: any) => (
  <div className="space-y-2 text-start">
    <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full p-4 bg-white border ${error ? 'border-rose-500' : 'border-gray-100'} rounded-2xl text-sm font-bold focus:border-[#0078D4] outline-none transition-all shadow-sm group-hover:border-gray-300`}
      />
      {icon && <div className="absolute right-4 top-1/2 -translate-y-1/2">{icon}</div>}
    </div>
    {error && <p className="text-[9px] font-bold text-rose-500 ml-1">{error}</p>}
  </div>
);

const FormSelect = ({ label, value, onChange, options, error, icon }: any) => (
  <div className="space-y-2 text-start">
    <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className={`w-full ${icon ? 'pl-11' : 'pl-4'} pr-10 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:border-[#0078D4] outline-none transition-all shadow-sm appearance-none cursor-pointer`}
      >
        {options.map((opt: any) => {
          const v = typeof opt === 'string' ? opt : opt.v;
          const l = typeof opt === 'string' ? opt : opt.l;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</div>}
      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
    </div>
  </div>
);

export default EmployeeManager;