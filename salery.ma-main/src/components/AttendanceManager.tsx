import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Scan, Camera, Wifi, WifiOff, RefreshCw, LocateFixed, ShieldAlert,
  ShieldCheck, AlertTriangle, Plus, FileSpreadsheet, X, CameraOff, Unlock, User,
  Clock, Calendar, CheckCircle2, Save, History, Search, Upload, Download, FileDown
} from 'lucide-react';
import { Employee, Language, AuthUser, AttendanceRecord, Site, ActionLog, AttendanceStatus } from '../types';
import { validateSecurePayload } from '../services/securityService';
import { downloadTemplate } from '../services/importService';
import { getSites } from '../services/siteService';
import ImportModal from './ImportModal';

interface Props {
  lang: Language;
  user: AuthUser;
  employees: Employee[];
}

const AttendanceManager: React.FC<Props> = ({ lang, user, employees }) => {
  const [view, setView] = useState<'scan' | 'summary' | 'approvals'>('scan');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scanStatus, setScanStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual Form State
  const [manualData, setManualData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '17:00',
    reason: ''
  });

  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints = {
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(lang === 'ar' ? 'يرجى السماح بالوصول إلى الكاميرا من إعدادات المتصفح.' : "Permission caméra refusée. Veuillez autoriser l'accès dans les réglages.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (view === 'scan') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [view]);

  useEffect(() => {
    // Load dynamic sites
    const dynamicSites = getSites();
    setSites(dynamicSites);

    // Set initial selected site
    if (user.assignedSite) {
      const found = dynamicSites.find(s => s.name === user.assignedSite || s.id === user.assignedSite);
      if (found) setSelectedSiteId(found.id);
      else if (dynamicSites.length > 0) setSelectedSiteId(dynamicSites[0].id);
    } else if (dynamicSites.length > 0) {
      setSelectedSiteId(dynamicSites[0].id);
    }

    const savedAttendance = localStorage.getItem('salaire_attendance');
    if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
  }, [user.assignedSite]);

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.employeeId || !manualData.reason) return;

    const [hIn, mIn] = manualData.checkIn.split(':').map(Number);
    const [hOut, mOut] = manualData.checkOut.split(':').map(Number);
    const hours = (hOut + mOut / 60) - (hIn + mIn / 60);

    const newRecord: AttendanceRecord = {
      id: `MAN-${Date.now()}`,
      employeeId: manualData.employeeId,
      date: manualData.date,
      checkIn: `${manualData.date}T${manualData.checkIn}:00`,
      checkOut: `${manualData.date}T${manualData.checkOut}:00`,
      hoursWorked: Math.max(0, parseFloat(hours.toFixed(2))),
      status: 'pending',
      riskLevel: 'MEDIUM',
      type: 'manual',
      manualReason: manualData.reason,
      history: [{
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: 'Manual pointage creation',
        timestamp: Date.now()
      }],
      gpsTimeline: [],
      lastActionAt: Date.now(),
      addedBy: user.id,
      siteId: selectedSiteId,
      validated: false
    };

    const updated = [newRecord, ...attendance];
    setAttendance(updated);
    localStorage.setItem('salaire_attendance', JSON.stringify(updated));
    setShowManualForm(false);
    setManualData({ employeeId: '', date: new Date().toISOString().split('T')[0], checkIn: '08:00', checkOut: '17:00', reason: '' });
  };

  const handleImportComplete = (newRecords: AttendanceRecord[]) => {
    const updated = [...attendance, ...newRecords];
    setAttendance(updated);
    localStorage.setItem('salaire_attendance', JSON.stringify(updated));
  };

  const alertsCount = attendance.filter(rec => rec.status === 'pending' && rec.riskLevel !== 'LOW').length;

  const t = {
    fr: {
      trackingTitle: "Pointage IA",
      scanTab: "Scanner",
      historyTab: "Suivi / Présence",
      alertsTab: "Alertes",
      colIn: "Arrivée",
      colOut: "Départ",
      colTotal: "Heures",
      btnManual: "POINTAGE MANUEL",
      btnImport: "IMPORT POINTAGE",
      btnTemplate: "GABARIT",
      modalTitle: "Nouvelle Entrée Manuelle",
      modalSub: "L'entrée manuelle génère une alerte de conformité pour validation RH.",
      fieldEmp: "Sélectionner Collaborateur",
      fieldDate: "Date",
      fieldIn: "Heure d'arrivée",
      fieldOut: "Heure de départ",
      fieldReason: "Justification du pointage manuel",
      btnSave: "Enregistrer l'entrée",
      noSites: "Aucun site disponible. Créez un site dans le module 'Sites & Branches'."
    },
    ar: {
      trackingTitle: "تسجيل الحضور",
      scanTab: "مسح",
      historyTab: "تتبع الحضور",
      alertsTab: "تنبيهات",
      colIn: "وصول",
      colOut: "مغادرة",
      colTotal: "ساعات",
      btnManual: "تسجيل يدوي",
      btnImport: "استيراد الحضور",
      btnTemplate: "نموذج",
      modalTitle: "إضافة حضور يدوي",
      modalSub: "التسجيل اليدوي يولد تنبيهاً للمراجعة من قبل الموارد البشرية.",
      fieldEmp: "اختر الموظف",
      fieldDate: "التاريخ",
      fieldIn: "وقت الوصول",
      fieldOut: "وقت المغادرة",
      fieldReason: "سبب التسجيل اليدوي",
      btnSave: "حفظ البيانات",
      noSites: "لا توجد مواقع متاحة. يرجى إنشاء موقع أولاً."
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-[#1A1F36] tracking-tighter">{t.trackingTitle}</h2>
            <div className="flex gap-2">
              {isOnline ? <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase"><Wifi size={12} /> Online</span> : <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase"><WifiOff size={12} /> Offline</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#697386] bg-white p-2 rounded-xl border border-gray-100 w-fit shadow-sm">
            <LocateFixed size={14} className="text-[#0078D4]" />
            {sites.length > 0 ? (
              <select value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)} className="bg-transparent font-bold text-xs outline-none cursor-pointer pr-4">
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <span className="text-[10px] font-bold text-rose-500 px-2">{t.noSites}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <button
            onClick={() => downloadTemplate('attendance')}
            className="px-4 py-2.5 bg-white border border-[#E5E7EB] text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-[#0A66C2] hover:border-[#0078D4] transition-all shadow-sm group"
          >
            <FileDown size={14} className="text-gray-400 group-hover:text-[#0A66C2]" /> {t.btnTemplate}
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2.5 bg-[#111827] text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md"
          >
            <Upload size={14} /> {t.btnImport}
          </button>

          <button
            onClick={() => setShowManualForm(true)}
            className="px-4 py-2.5 bg-white border border-[#E5E7EB] text-[#1A1F36] rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-[#0078D4] hover:text-[#0078D4] transition-all shadow-sm"
          >
            <Plus size={14} /> {t.btnManual}
          </button>

          <nav className="flex bg-[#F7F9FC] p-0.5 rounded-xl border border-[#E3E8EE] w-full md:w-auto shadow-inner ml-2">
            <TabButton active={view === 'scan'} onClick={() => setView('scan')} icon={<Scan size={14} />} label={t.scanTab} />
            <TabButton active={view === 'summary'} onClick={() => setView('summary')} icon={<FileSpreadsheet size={14} />} label={t.historyTab} />
            <TabButton active={view === 'approvals'} onClick={() => setView('approvals')} icon={<ShieldAlert size={14} />} label={`${t.alertsTab} (${alertsCount})`} />
          </nav>
        </div>
      </div>

      {view === 'scan' && (
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="airbnb-card bg-zinc-950 rounded-[48px] aspect-square relative overflow-hidden flex flex-col items-center justify-center border-[12px] border-zinc-900 shadow-2xl">
            {!cameraError ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-75 contrast-125" />
            ) : (
              <div className="flex flex-col items-center gap-6 p-10 text-center">
                <CameraOff size={64} className="text-rose-500 animate-pulse" />
                <p className="text-white text-sm font-bold leading-relaxed">{cameraError}</p>
                <button onClick={() => { stopCamera(); startCamera(); }} className="px-8 py-3 bg-[#0078D4] text-white rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><RefreshCw size={14} /> RÉESSAYER</button>
              </div>
            )}
            {!cameraError && (
              <div className="absolute inset-4 border-2 border-white/20 rounded-[32px] pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-[#0078D4] shadow-[0_0_25px_#0078D4] animate-pulse"></div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            {scanStatus ? (
              <div className={`p-10 rounded-[40px] border-2 shadow-2xl ${scanStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-rose-50 border-rose-100 text-rose-900'}`}>
                <div className="flex items-center gap-6 mb-4">
                  <div className={`p-4 rounded-3xl ${scanStatus.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white shadow-lg`}>
                    {scanStatus.type === 'success' ? <Unlock size={28} /> : <AlertTriangle size={28} />}
                  </div>
                  <h4 className="text-2xl font-black">{scanStatus.type === 'success' ? 'Validé' : 'Erreur'}</h4>
                </div>
                <p className="text-lg font-bold">{scanStatus.msg}</p>
              </div>
            ) : (
              <div className="airbnb-card p-10 bg-white space-y-8">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#697386]">Protocoles de sécurité</h4>
                <div className="space-y-6">
                  <WorkflowStep icon={<ShieldCheck size={20} />} label="Verification GPS" desc="Vérification du périmètre site" active />
                  <WorkflowStep icon={<ShieldCheck size={20} />} label="Integrity Link" desc="Validation du badge crypté" active />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'summary' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div className="relative group min-w-[240px]">
              <Calendar className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full ${lang === 'ar' ? 'pr-11' : 'pl-11'} py-3 bg-white border border-[#E3E8EE] rounded-2xl text-sm font-bold focus:border-[#0078D4] outline-none transition-all shadow-sm`}
              />
            </div>
            <button className="px-6 py-3 bg-white border border-[#E3E8EE] text-[#697386] rounded-2xl text-xs font-bold hover:border-[#0078D4] hover:text-[#0078D4] transition-all flex items-center gap-2">
              <RefreshCw size={14} /> Actualiser la liste
            </button>
          </div>

          <div className="airbnb-card bg-white overflow-hidden border-[#E3E8EE] rounded-[32px] shadow-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#F7F9FC] border-b">
                <tr className="text-[10px] font-black text-[#697386] uppercase tracking-widest">
                  <th className="p-6">Collaborateur</th>
                  <th className="p-6 text-center">Type</th>
                  <th className="p-6">{t.colIn}</th>
                  <th className="p-6">{t.colOut}</th>
                  <th className="p-6 text-center">{t.colTotal}</th>
                  <th className="p-6 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.filter(r => r.date === selectedDate).length > 0 ? (
                  attendance.filter(r => r.date === selectedDate).map(rec => {
                    const emp = employees.find(e => e.id === rec.employeeId);
                    return (
                      <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4 text-start">
                            <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center font-black border-2 border-white shadow-sm ring-1 ring-gray-100">
                              {emp?.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-2xl" /> : <User size={20} className="text-gray-300" />}
                            </div>
                            <div>
                              <p className="font-bold text-[#1A1F36]">{emp?.fullName || '---'}</p>
                              <p className="text-[10px] uppercase text-gray-400 font-mono tracking-tighter">{emp?.internalMatricule || '---'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${rec.type === 'manual' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {rec.type}
                          </span>
                        </td>
                        <td className="p-6 font-black text-[#1A1F36]">{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                        <td className="p-6 font-black text-[#1A1F36]">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                        <td className="p-6 text-center font-black text-[#0078D4] text-base">{rec.hoursWorked}h</td>
                        <td className="p-6 text-right">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${rec.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : rec.status === 'pending' ? 'bg-gray-50 text-gray-500 border-gray-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-gray-400 italic font-medium">
                      Aucun pointage enregistré pour cette date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showManualForm && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in duration-300 relative border border-gray-100 m-auto">
            <button onClick={() => setShowManualForm(false)} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-black transition-all hover:bg-gray-50 rounded-full z-10"><X size={24} /></button>

            <div className="p-10 md:p-14 space-y-10">
              <div className="flex items-center gap-6 text-start">
                <div className="w-16 h-16 bg-blue-50 text-[#0078D4] rounded-3xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0"><History size={32} /></div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1F36] tracking-tighter">{t.modalTitle}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-md">{t.modalSub}</p>
                </div>
              </div>

              <form onSubmit={handleSaveManual} className="space-y-10">
                <div className="space-y-3 text-start">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldEmp}</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0078D4]" size={18} />
                    <select
                      required
                      value={manualData.employeeId}
                      onChange={(e) => setManualData({ ...manualData, employeeId: e.target.value })}
                      className="w-full pl-12 pr-6 py-4 bg-[#F7F9FC] border border-[#E3E8EE] rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="">Sélectionner un employé...</option>
                      {employees.filter(e => e.employmentStatus === 'active').map(e => (
                        <option key={e.id} value={e.id}>{e.fullName} ({e.internalMatricule})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3 text-start">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldDate}</label>
                    <input
                      required
                      type="date"
                      value={manualData.date}
                      onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
                      className="w-full p-4 bg-[#F7F9FC] border border-[#E3E8EE] rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-3 text-start">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldIn}</label>
                    <input
                      required
                      type="time"
                      value={manualData.checkIn}
                      onChange={(e) => setManualData({ ...manualData, checkIn: e.target.value })}
                      className="w-full p-4 bg-[#F7F9FC] border border-[#E3E8EE] rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-3 text-start">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldOut}</label>
                    <input
                      required
                      type="time"
                      value={manualData.checkOut}
                      onChange={(e) => setManualData({ ...manualData, checkOut: e.target.value })}
                      className="w-full p-4 bg-[#F7F9FC] border border-[#E3E8EE] rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3 text-start">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldReason}</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Ex: Oubli de scan, Travail extérieur, Erreur système..."
                    value={manualData.reason}
                    onChange={(e) => setManualData({ ...manualData, reason: e.target.value })}
                    className="w-full p-6 bg-[#F7F9FC] border border-[#E3E8EE] rounded-[32px] text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all resize-none shadow-sm"
                  />
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                  <ShieldAlert size={20} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-800 font-bold leading-relaxed italic">
                    Toute modification manuelle est enregistrée dans l'Audit Trail sous le nom de <b>{user.firstName} {user.lastName}</b>.
                  </p>
                </div>

                <button type="submit" className="w-full py-6 btn-primary-gradient text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                  <CheckCircle2 size={24} /> {t.btnSave}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <ImportModal
          type="attendance"
          lang={lang}
          onClose={() => setShowImport(false)}
          onComplete={handleImportComplete}
          contextData={{ employees, attendance }}
        />
      )}
    </div>
  );
};

const WorkflowStep = ({ icon, label, desc, active }: any) => (
  <div className="flex items-center gap-4 text-start group">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-[#0078D4] text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-300'}`}>{icon}</div>
    <div>
      <h5 className="text-sm font-black uppercase tracking-tight text-[#1A1F36]">{label}</h5>
      <p className="text-[10px] text-gray-400 font-medium">{desc}</p>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest whitespace-nowrap ${active ? 'bg-white shadow-sm text-[#0078D4]' : 'text-[#6B7280] hover:text-[#1A1F36]'}`}>
    {icon} {label}
  </button>
);

export default AttendanceManager;