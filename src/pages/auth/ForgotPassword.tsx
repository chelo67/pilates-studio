import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { useBranding } from '../../contexts/BrandingContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { settings } = useBranding();

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Se ha enviado un correo con instrucciones para restablecer tu contraseña.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-shapes">
                <div className="auth-shape auth-shape-1"></div>
                <div className="auth-shape auth-shape-2"></div>
                <div className="auth-shape auth-shape-3"></div>
            </div>

            <div className="auth-container">
                <div className="auth-brand-panel">
                    <div className="auth-brand-content">
                        <div className="auth-logo">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt={settings.business_name} className="auth-custom-logo" />
                            ) : (
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="2.5" opacity="0.9" />
                                    <path d="M24 10C18 10 14 16 14 24C14 32 18 38 24 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                                    <path d="M24 10C30 10 34 16 34 24C34 32 30 38 24 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                    <circle cx="24" cy="24" r="4" fill="white" opacity="0.9" />
                                </svg>
                            )}
                        </div>
                        <h1 className="auth-brand-title">{settings.business_name}</h1>
                        <p className="auth-brand-subtitle">Recuperá el acceso a tu cuenta</p>
                    </div>
                </div>

                <div className="auth-form-panel">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h2>¿Olvidaste tu contraseña?</h2>
                            <p>Ingresá tu email y te enviaremos un link para restablecerla.</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 10.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM8.75 4.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {message && (
                            <div className="auth-success">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>{message}</span>
                            </div>
                        )}

                        {!message && (
                            <form onSubmit={handleResetRequest} className="auth-form">
                                <div className="auth-field">
                                    <label htmlFor="email">Email</label>
                                    <div className="auth-input-wrapper">
                                        <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <path d="M22 7l-10 6L2 7" />
                                        </svg>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="tu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="auth-submit-btn"
                                >
                                    {loading ? <span className="auth-spinner"></span> : 'Enviar link de recuperación'}
                                </button>
                            </form>
                        )}

                        <div className="auth-footer">
                            <p>Volver al <Link to="/login">Inicio de sesión</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
