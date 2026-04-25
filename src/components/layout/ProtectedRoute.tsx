import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    role?: 'admin' | 'member';
}

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="dash-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="dash-loading">
                    <div className="dash-spinner" />
                    <span>Cargando...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If profile couldn't be loaded, show error instead of redirect loop
    if (!profile) {
        return (
            <div className="dash-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', padding: '2rem' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No se pudo cargar tu perfil.</p>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                        Es posible que tu cuenta no tenga un perfil asociado.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', marginRight: '0.75rem'
                        }}
                    >
                        Reintentar
                    </button>
                    <button
                        onClick={() => { import('../../lib/supabase').then(m => m.supabase.auth.signOut()); }}
                        style={{
                            padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.5rem', cursor: 'pointer'
                        }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    if (role && profile?.role !== role) {
        // Redirect based on role if they try to access unauthorized page
        if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
