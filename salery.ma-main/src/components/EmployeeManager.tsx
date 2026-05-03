import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Search, Edit3, Trash2, MapPin,
  Phone, Mail, FileText, CheckCircle2, X, Plus,
  Briefcase, CreditCard, User, Building2, Calendar,
  AlertCircle, Camera, QrCode, Printer, ChevronDown,
  FileDown, FileUp, Download, Upload, AlertTriangle, Lock,
  AtSign, Smartphone, Baby, Heart, BadgeCheck, FileBadge, FileStack, Trash,
  FileCheck, ShieldCheck, Landmark, SearchX, Eye, ArrowRight, ArrowLeft,
  Check as CheckIcon, UploadCloud, Info, Fingerprint, RefreshCw, Users2
} from 'lucide-react';
import { Employee, Language, AuthUser, UserRole, SystemUser, Site } from '../types.ts';
import { provisionUserAccount, simulateActivationEmail } from '../services/authService.ts';
import { getSites } from '../services/siteService.ts';
import ImportModal from './ImportModal.tsx';
import EmployeeProfile from './EmployeeProfile.tsx';

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
    photo: ''
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsProvisioning(true);

    const newId = editingId || `EMP-${Date.now().toString().slice(-6)}`;
    const full = `${formData.firstName} ${formData.lastName}`.trim();

    const finalData: Employee = {
      ...formData as Employee,
      id: newId,
      fullName: full,
      companyId: user.companyId,
      internalMatricule: formData.internalMatricule || `SAL-${Date.now().toString().slice(-4)}`,
      auditHistory: [{
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: editingId ? "PROFILE_UPDATE" : "ONBOARDING_COMPLETED",
        timestamp: Date.now(),
        details: autoCreateUser ? "Employee created + Linked user provisioned" : "Manual creation"
      }, ...(formData.auditHistory || [])]
    };

    if (autoCreateUser) {
      const newUser = await provisionUserAccount(finalData, user);
      await simulateActivationEmail(newUser);
    }

    const updated = editingId
      ? employees.map(emp => emp.id === editingId ? finalData : emp)
      : [...employees, finalData];

    setEmployees(updated);
    localStorage.setItem('salaire_employees', JSON.stringify(updated));
    setIsProvisioning(false);
    setShowForm(false);
    setCurrentStep(1);
    setFormData(initialForm);
    setEditingId(null);
  };

  const filteredEmployees = employees.filter(e =>
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployee = useMemo(() =>
    employees.find(e => e.id === selectedProfileId),
    [employees, selectedProfileId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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

      <div className="relative group no-print">
        <Search className={`absolute ${lang === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0078D4] transition-colors`} size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom ou CIN..."
          className={`w-full ${lang === 'ar' ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6'} py-4 bg-white border border-[#E5E7EB] rounded-full text-sm font-bold outline-none shadow-sm transition-all focus:border-[#0078D4]`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map(emp => (
            <div key={emp.id} className="airbnb-card p-6 border-[#E5E7EB] flex flex-col justify-between h-full bg-white group hover:border-[#0078D4]">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#F5F7FA] flex items-center justify-center text-xl font-black text-[#111827] border border-[#E5E7EB] overflow-hidden group-hover:scale-105 transition-transform">
                    {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <div className="gradient-bg w-full h-full flex items-center justify-center text-white text-lg">{emp.fullName[0]}</div>}
                  </div>
                  <div className="text-start">
                    <h4 className="font-black text-[#111827] text-lg leading-tight truncate max-w-[150px]">{emp.fullName}</h4>
                    <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mt-1">{emp.jobTitle}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 border text-[8px] font-black uppercase rounded ${emp.employmentStatus === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-[#F5F7FA] border-[#E5E7EB] text-[#6B7280]'}`}>{emp.employmentStatus}</span>
              </div>
              <div className="pt-4 border-t border-[#F5F7FA] flex justify-between items-center">
                <div className="text-start">
                  <p className="text-[9px] font-black text-[#6B7280] uppercase">Base Mensuelle</p>
                  <p className="text-lg font-black text-[#111827]">{emp.baseSalary.toLocaleString()} <span className="text-[10px] text-gray-400">DH</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedProfileId(emp.id)} className="p-2.5 bg-blue-50 text-[#0078D4] rounded-xl hover:bg-[#0078D4] hover:text-white transition-all active:scale-90" title="Explorer le profil"><Eye size={18} /></button>
                  <button onClick={() => { setFormData(emp); setEditingId(emp.id); setCurrentStep(1); setShowForm(true); }} className="p-2 text-gray-400 hover:text-[#0078D4] transition-colors"><Edit3 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 airbnb-card bg-white border-dashed border-2 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-[#F5F7FA] rounded-full flex items-center justify-center text-gray-300">
            <SearchX size={40} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-[#111827] tracking-tight">Aucun résultat</h3>
            <p className="text-[#6B7280] font-medium max-w-xs">Ajustez vos filtres ou effectuez un onboarding.</p>
          </div>
        </div>
      )}

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
                          {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <User size={32} className="text-gray-300" />}
                        </div>
                        <label className="absolute -bottom-1 -right-1 p-2 bg-[#111827] text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                          <Camera size={14} />
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                      </div>
                      <div className="text-center md:text-start flex-1">
                        <h5 className="font-black text-sm uppercase text-[#111827]">Photo de Profil</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">Format carré recommandé (JPG/PNG, Max 2MB)</p>
                        {errors.photo && <p className="text-[9px] font-bold text-rose-500 mt-1">{errors.photo}</p>}
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
      {selectedEmployee && <EmployeeProfile employee={selectedEmployee} lang={lang} user={user} onClose={() => setSelectedProfileId(null)} onUpdate={handleUpdateEmployee} />}
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