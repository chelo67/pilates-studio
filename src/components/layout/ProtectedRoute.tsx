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

    if (role && profile?.role !== role) {
        // Redirect based on role if they try to access unauthorized page
        if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
