import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) setError(error.message);
        else {
            toast.success('¡Registro exitoso! Revisá tu email para verificar tu cuenta.');
            navigate('/login');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            {/* Animated background elements */}
            <div className="auth-bg-shapes">
                <div className="auth-shape auth-shape-1"></div>
                <div className="auth-shape auth-shape-2"></div>
                <div className="auth-shape auth-shape-3"></div>
            </div>

            <div className="auth-container">
                {/* Left panel - branding */}
                <div className="auth-brand-panel">
                    <div className="auth-brand-content">
                        <div className="auth-logo">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="2.5" opacity="0.9" />
                                <path d="M24 10C18 10 14 16 14 24C14 32 18 38 24 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                                <path d="M24 10C30 10 34 16 34 24C34 32 30 38 24 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="24" cy="24" r="4" fill="white" opacity="0.9" />
                                <line x1="16" y1="18" x2="32" y2="18" stroke="white" strokeWidth="1.5" opacity="0.4" />
                                <line x1="15" y1="24" x2="33" y2="24" stroke="white" strokeWidth="1.5" opacity="0.4" />
                                <line x1="16" y1="30" x2="32" y2="30" stroke="white" strokeWidth="1.5" opacity="0.4" />
                            </svg>
                        </div>
                        <h1 className="auth-brand-title">Pilates Studio</h1>
                        <p className="auth-brand-subtitle">Comenzá tu camino hacia el bienestar</p>
                        <div className="auth-brand-features">
                            <div className="auth-feature">
                                <span className="auth-feature-icon">🧘</span>
                                <span>Clases para todos los niveles</span>
                            </div>
                            <div className="auth-feature">
                                <span className="auth-feature-icon">🗓️</span>
                                <span>Horarios flexibles</span>
                            </div>
                            <div className="auth-feature">
                                <span className="auth-feature-icon">🌟</span>
                                <span>Instructoras certificadas</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right panel - form */}
                <div className="auth-form-panel">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h2>Creá tu cuenta</h2>
                            <p>Registrate para reservar tus clases</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 10.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM8.75 4.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="auth-form">
                            <div className="auth-field">
                                <label htmlFor="fullName">Nombre completo</label>
                                <div className="auth-input-wrapper">
                                    <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="María García"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

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

                            <div className="auth-field">
                                <label htmlFor="password">Contraseña</label>
                                <div className="auth-input-wrapper">
                                    <svg className="auth-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="auth-toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="auth-submit-btn"
                            >
                                {loading ? (
                                    <span className="auth-spinner"></span>
                                ) : (
                                    'Crear Cuenta'
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
