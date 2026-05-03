import React, { useState } from 'react';
import { ChevronDown, Building2, Check, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/store';
import { api } from '../services/api';

interface ContextSwitcherProps {
  isExpanded: boolean;
}

const ContextSwitcher: React.FC<ContextSwitcherProps> = ({ isExpanded }) => {
  const { user, accessibleCompanies, setUser } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  if (!user || accessibleCompanies.length <= 1) return null;

  const currentCompany = accessibleCompanies.find(c => c.id === user.companyId) || {
    id: user.companyId,
    name: user.companyName || 'Current Company'
  };

  const handleSwitch = async (companyId: string) => {
    if (companyId === user.companyId) return;
    
    setIsSwitching(true);
    try {
      await api.post('/auth/switch-context', { companyId });
      // Reload the page to reset all states and fetch new company data
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch company context:', err);
      alert('Erreur lors du changement de société');
    } finally {
      setIsSwitching(false);
      setIsOpen(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="flex justify-center py-4 border-b border-gray-100 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
          <Building2 size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-b border-gray-100 mb-2 relative">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Société Active</p>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center w-full p-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#0078D4] transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-[#F0F7FF] flex items-center justify-center text-[#0078D4] shrink-0">
          {isSwitching ? <RefreshCw size={16} className="animate-spin" /> : <Building2 size={16} />}
        </div>
        <div className="ml-3 text-start flex-1 truncate">
          <p className="text-[12px] font-bold text-[#1F2937] truncate leading-tight">{currentCompany.name}</p>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-2 space-y-1 max-h-[240px] overflow-y-auto no-scrollbar">
            {accessibleCompanies.map((comp) => (
              <button
                key={comp.id}
                onClick={() => handleSwitch(comp.id)}
                className={`flex items-center w-full p-2.5 rounded-xl text-start transition-all ${comp.id === user.companyId ? 'bg-blue-50 text-[#0078D4]' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 mr-3 ${comp.id === user.companyId ? 'bg-[#0078D4]' : 'bg-transparent'}`} />
                <span className="text-[12px] font-medium flex-1 truncate">{comp.name}</span>
                {comp.id === user.companyId && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextSwitcher;
