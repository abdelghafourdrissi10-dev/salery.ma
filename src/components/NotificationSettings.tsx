import React from 'react';
import { Bell, Mail, Smartphone, Save, Check } from 'lucide-react';
import { api } from '../services/api';

const NotificationSettings: React.FC = () => {
    const [prefs, setPrefs] = React.useState({
        inAppEnabled: true,
        emailEnabled: true,
        pushEnabled: false
    });
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);

    React.useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const response = await api.get('/notifications/preferences');
                setPrefs(response.data);
            } catch (err) {
                console.error('Failed to load preferences');
            } finally {
                setLoading(false);
            }
        };
        fetchPrefs();
    }, []);

    const handleToggle = (key: keyof typeof prefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Using post as a fallback if put isn't typed in the standard api utility
            await (api as any).put('/notifications/preferences', prefs);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Save failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading settings...</div>;

    return (
        <div className="max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <Bell className="text-blue-500" size={24} />
                    Centre de Notifications
                </h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">Gérez comment et où vous recevez vos alertes RH.</p>
            </div>

            <div className="p-8 space-y-6">
                {/* In-App */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:border-blue-100 hover:bg-blue-50/30 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                            <Bell size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Notifications In-App</p>
                            <p className="text-xs text-gray-500 font-medium">Alertes en temps réel dans le tableau de bord.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleToggle('inAppEnabled')}
                        className={`w-14 h-8 rounded-full relative transition-all ${prefs.inAppEnabled ? 'bg-blue-500 shadow-lg shadow-blue-200' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${prefs.inAppEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:border-green-100 hover:bg-green-50/30 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-green-500 shadow-sm group-hover:scale-110 transition-transform">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Notifications Email</p>
                            <p className="text-xs text-gray-500 font-medium">Recevez un résumé par mail pour les alertes critiques.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleToggle('emailEnabled')}
                        className={`w-14 h-8 rounded-full relative transition-all ${prefs.emailEnabled ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${prefs.emailEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Push Mobile */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:border-purple-100 hover:bg-purple-50/30 group opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-purple-500 shadow-sm">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Push Mobile <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full ml-1">Bientôt</span></p>
                            <p className="text-xs text-gray-500 font-medium">Alertes directes sur votre smartphone.</p>
                        </div>
                    </div>
                    <button 
                         disabled
                        className="w-14 h-8 rounded-full relative bg-gray-200 cursor-not-allowed"
                    >
                        <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full" />
                    </button>
                </div>

                <div className="pt-4 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm tracking-widest uppercase transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200'}`}
                    >
                        {saving ? 'Enregistrement...' : saved ? <><Check size={18} /> Enregistré</> : <><Save size={18} /> Sauvegarder</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
