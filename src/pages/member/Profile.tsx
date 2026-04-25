import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Lock, LogOut, Menu, X, Calendar, Users, Eye, EyeOff, Check, AlertCircle, Save } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { useBranding } from '../../contexts/BrandingContext';
import NotificationBell from '../../components/NotificationBell';

const MemberProfile = () => {
    const { user, profile, signOut } = useAuth();
    const location = useLocation();
    const { toast } = useToast();
    const { settings } = useBranding();

    // Profile form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.full_name || '');
        }
        if (user) {
            setEmail(user.email || '');
        }
    }, [profile, user]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSavingProfile(true);
        try {
            // Update profile info
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: name })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Update email if changed
            if (email !== user.email) {
                const { error: emailError } = await supabase.auth.updateUser({ email });
                if (emailError) throw emailError;
                toast.success('Perfil actualizado. Revisá tu email para confirmar el cambio de correo.');
            } else {
                toast.success('Perfil actualizado correctamente.');
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Error al actualizar el perfil');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden.');
            return;
        }

        setSavingPassword(true);
        try {
            // Verify current password by signing in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: currentPassword,
            });

            if (signInError) {
                toast.error('La contraseña actual es incorrecta.');
                setSavingPassword(false);
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            toast.success('Contraseña actualizada correctamente.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            toast.error(error.message || 'Error al cambiar la contraseña');
        } finally {
            setSavingPassword(false);
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const getPasswordStrength = (password: string) => {
        if (!password) return { level: 0, label: '', color: '' };
        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return { level: 1, label: 'Débil', color: '#ef4444' };
        if (score <= 2) return { level: 2, label: 'Regular', color: '#f59e0b' };
        if (score <= 3) return { level: 3, label: 'Buena', color: '#3b82f6' };
        return { level: 4, label: 'Fuerte', color: '#22c55e' };
    };

    const passwordStrength = getPasswordStrength(newPassword);
    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

    return (
        <div className="dash-page">

            <div className="dash-layout">
                {/* Sidebar */}
                <aside className={`dash-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="dash-sidebar-brand">
                        <div className="brand-icon">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8a4 4 0 0 0-4 4" />
                                    <circle cx="12" cy="12" r="2" />
                                </svg>
                            )}
                        </div>
                        <div className="dash-sidebar-brand-text">
                            <span className="brand-name">{settings.business_name}</span>
                            <span className="brand-role">Miembro</span>
                        </div>
                    </div>

                    <nav className="dash-sidebar-nav">
                        <span className="dash-sidebar-label">Mis Clases</span>
                        <Link
                            to="/"
                            onClick={() => setIsSidebarOpen(false)}
                            className={`dash-sidebar-item ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            <div className="sidebar-icon"><Calendar size={18} /></div>
                            Horarios
                        </Link>
                        <Link
                            to="/my-reservations"
                            onClick={() => setIsSidebarOpen(false)}
                            className={`dash-sidebar-item ${location.pathname === '/my-reservations' ? 'active' : ''}`}
                        >
                            <div className="sidebar-icon"><Users size={18} /></div>
                            Mis Reservas
                        </Link>

                        <span className="dash-sidebar-label" style={{ marginTop: '1.25rem' }}>Mi Cuenta</span>
                        <Link
                            to="/profile"
                            onClick={() => setIsSidebarOpen(false)}
                            className={`dash-sidebar-item ${location.pathname === '/profile' ? 'active' : ''}`}
                        >
                            <div className="sidebar-icon"><User size={18} /></div>
                            Mi Perfil
                        </Link>
                    </nav>

                    <footer className="dash-sidebar-footer">
                        <div className="dash-sidebar-user">
                            <div className="dash-sidebar-user-avatar">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <span className="dash-sidebar-user-name" title={user?.email || ''}>
                                {profile?.full_name || user?.email?.split('@')[0]}
                            </span>
                        </div>
                        <button onClick={signOut} className="dash-sidebar-logout">
                            <LogOut size={16} />
                            Cerrar Sesión
                        </button>
                    </footer>
                </aside>

                {/* Content Area */}
                <div className="dash-content">
                    <main className="dash-content-inner">
                        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 className="dash-title">Mi Perfil</h1>
                                <p className="dash-subtitle">Editá tu información personal y contraseña</p>
                            </div>
                            <NotificationBell />
                        </div>

                        <div className="profile-grid">
                            {/* Profile Info Card */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="profile-card-icon">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h2 className="profile-card-title">Información Personal</h2>
                                        <p className="profile-card-desc">Actualizá tu nombre y correo electrónico</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveProfile} className="profile-form">
                                    <div className="dash-form-group">
                                        <label className="dash-form-label">Nombre Completo</label>
                                        <div className="profile-input-wrapper">
                                            <User size={16} className="profile-input-icon" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Tu nombre completo"
                                                className="dash-form-input profile-input-with-icon"
                                            />
                                        </div>
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-form-label">Correo Electrónico</label>
                                        <div className="profile-input-wrapper">
                                            <Mail size={16} className="profile-input-icon" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="tu@email.com"
                                                className="dash-form-input profile-input-with-icon"
                                            />
                                        </div>
                                        {email !== user?.email && (
                                            <p className="profile-hint">
                                                <AlertCircle size={12} />
                                                Se enviará un email de confirmación a la nueva dirección
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="dash-btn-primary profile-save-btn"
                                    >
                                        {savingProfile ? (
                                            <>
                                                <div className="dash-spinner" style={{ width: '16px', height: '16px' }} />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Password Change Card */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="profile-card-icon profile-card-icon-lock">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <h2 className="profile-card-title">Cambiar Contraseña</h2>
                                        <p className="profile-card-desc">Asegurá tu cuenta con una nueva contraseña</p>
                                    </div>
                                </div>

                                <form onSubmit={handleChangePassword} className="profile-form">
                                    <div className="dash-form-group">
                                        <label className="dash-form-label">Contraseña Actual</label>
                                        <div className="profile-input-wrapper">
                                            <Lock size={16} className="profile-input-icon" />
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="dash-form-input profile-input-with-icon"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="profile-toggle-password"
                                            >
                                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-form-label">Nueva Contraseña</label>
                                        <div className="profile-input-wrapper">
                                            <Lock size={16} className="profile-input-icon" />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="dash-form-input profile-input-with-icon"
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="profile-toggle-password"
                                            >
                                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {newPassword && (
                                            <div className="profile-password-strength">
                                                <div className="profile-strength-bar">
                                                    {[1, 2, 3, 4].map((level) => (
                                                        <div
                                                            key={level}
                                                            className="profile-strength-segment"
                                                            style={{
                                                                background: level <= passwordStrength.level ? passwordStrength.color : 'rgba(255,255,255,0.1)',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="profile-strength-label" style={{ color: passwordStrength.color }}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="dash-form-group">
                                        <label className="dash-form-label">Confirmar Contraseña</label>
                                        <div className="profile-input-wrapper">
                                            <Lock size={16} className="profile-input-icon" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="dash-form-input profile-input-with-icon"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="profile-toggle-password"
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {confirmPassword && (
                                            <p className={`profile-hint ${passwordsMatch ? 'profile-hint-success' : 'profile-hint-error'}`}>
                                                {passwordsMatch ? (
                                                    <><Check size={12} /> Las contraseñas coinciden</>
                                                ) : (
                                                    <><AlertCircle size={12} /> Las contraseñas no coinciden</>
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                                        className="dash-btn-primary profile-save-btn"
                                    >
                                        {savingPassword ? (
                                            <>
                                                <div className="dash-spinner" style={{ width: '16px', height: '16px' }} />
                                                Actualizando...
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={16} />
                                                Cambiar Contraseña
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Navigation Elements */}
            <button className="dash-hamburger" onClick={toggleSidebar}>
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div
                className={`dash-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />
        </div>
    );
};

export default MemberProfile;
