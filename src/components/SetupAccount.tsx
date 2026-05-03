import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Key, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import Logo from './Logo';

const SetupAccount: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setError('Jeton d\'invitation manquant ou invalide.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        setStatus('loading');
        try {
            await api.post('/invites/setup', { token, password });
            setStatus('success');
            setTimeout(() => navigate('/'), 3000);
        } catch (err: any) {
            setStatus('idle');
            // api.ts throws plain Error objects (not Axios), so use err.message directly
            setError(err.message || 'Une erreur est survenue lors de l\'activation.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', overflowY: 'auto', background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f9ff 100%)' }}>
            {/* Background blobs */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(99,102,241,0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(59,130,246,0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 460, margin: '0 auto', padding: '48px 24px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Logo className="h-10 text-slate-900" />
                </div>

                {/* Card */}
                <div style={{ background: 'white', borderRadius: 32, boxShadow: '0 25px 60px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', overflow: 'visible' }}>
                    {status === 'success' ? (
                        <div style={{ padding: 48, textAlign: 'center' }}>
                            <div style={{ width: 80, height: 80, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#22c55e' }}>
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Compte Activé ✓</h2>
                            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Votre accès est sécurisé. Redirection vers la connexion dans 3 secondes...</p>
                        </div>
                    ) : (
                        <div style={{ padding: 40 }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{ width: 44, height: 44, background: '#eef2ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
                                    <Shield size={22} />
                                </div>
                                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Sécurisez votre accès</h2>
                            </div>

                            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                                Bienvenue sur Salery. Veuillez définir votre mot de passe pour finaliser l'activation de votre compte professionnel.
                            </p>

                            {/* Error Banner */}
                            {error && (
                                <div style={{ marginBottom: 20, padding: '12px 16px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 16, display: 'flex', alignItems: 'flex-start', gap: 10, color: '#e11d48' }}>
                                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Password */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 8 }}>
                                        Nouveau mot de passe
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            style={{
                                                width: '100%', height: 52, paddingLeft: 48, paddingRight: 48,
                                                background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16,
                                                fontSize: 15, fontWeight: 600, color: '#0f172a', outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                        <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 8 }}>
                                        Confirmer le mot de passe
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            style={{
                                                width: '100%', height: 52, paddingLeft: 48, paddingRight: 16,
                                                background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16,
                                                fontSize: 15, fontWeight: 600, color: '#0f172a', outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || !token}
                                    style={{
                                        width: '100%', height: 52, background: status === 'loading' ? '#6366f1' : '#0f172a',
                                        color: 'white', border: 'none', borderRadius: 16, fontSize: 13, fontWeight: 900,
                                        letterSpacing: 2, textTransform: 'uppercase', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                        opacity: status === 'loading' ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                    }}
                                >
                                    {status === 'loading' ? (
                                        <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Activation en cours...</>
                                    ) : (
                                        'Activer mon compte'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 24 }}>
                    Besoin d'aide ? <a href="mailto:support@salery.ma" style={{ color: '#0f172a', fontWeight: 700, textDecoration: 'none' }}>Contactez l'assistance</a>
                </p>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default SetupAccount;
