import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import { Calendar, Clock, Users, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { getCurrentTenantId } from '../../lib/tenant';
import NotificationBell from '../../components/NotificationBell';

const MemberReservations = () => {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const { toast, confirm } = useToast();
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchReservations = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('reservations')
            .select('*, classes(*)')
            .eq('user_id', user?.id)
            .eq('tenant_id', getCurrentTenantId())
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setReservations(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) fetchReservations();
    }, [user]);

    const handleCancel = async (classId: string) => {
        const confirmed = await confirm({
            title: 'Cancelar reserva',
            message: '¿Estás seguro de que querés cancelar esta reserva?',
            confirmText: 'Sí, cancelar',
            cancelText: 'No, mantener',
            variant: 'danger',
        });
        if (!confirmed) return;

        const { error } = await supabase
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('class_id', classId)
            .eq('user_id', user?.id)
            .eq('status', 'active')
            .eq('tenant_id', getCurrentTenantId());

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Reserva cancelada correctamente.');
            fetchReservations();
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="dash-page">

            <div className="dash-layout">
                {/* Sidebar */}
                <aside className={`dash-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="dash-sidebar-brand">
                        <div className="brand-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8a4 4 0 0 0-4 4" />
                                <circle cx="12" cy="12" r="2" />
                            </svg>
                        </div>
                        <div className="dash-sidebar-brand-text">
                            <span className="brand-name">Pilates Studio</span>
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
                    </nav>

                    <footer className="dash-sidebar-footer">
                        <div className="dash-sidebar-user">
                            <div className="dash-sidebar-user-avatar">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <span className="dash-sidebar-user-name" title={user?.email || ''}>
                                {user?.email?.split('@')[0]}
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
                                <h1 className="dash-title">Mis Reservas</h1>
                                <p className="dash-subtitle">Historial de tus reservas de clases</p>
                            </div>
                            <NotificationBell />
                        </div>

                        {loading ? (
                            <div className="dash-loading">
                                <div className="dash-spinner" />
                                <span>Cargando reservas...</span>
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className="dash-card" style={{ padding: '3rem 2rem' }}>
                                <div className="dash-empty">
                                    No tenés reservas todavía. <Link to="/" style={{ color: '#a855f7' }}>Reservá una clase</Link>
                                </div>
                            </div>
                        ) : (
                            <div className="dash-res-list">
                                {reservations.map((res) => (
                                    <div key={res.id} className="dash-res-item">
                                        <div className="dash-res-info">
                                            <p className="dash-res-class-title">{res.classes?.title}</p>
                                            <div className="dash-res-meta">
                                                <div className="dash-res-meta-item">
                                                    <Calendar size={14} />
                                                    {res.classes?.class_date && (() => {
                                                        const [y, m, d] = res.classes.class_date.split('-').map(Number);
                                                        return format(new Date(y, m - 1, d, 12, 0, 0), 'dd MMM yyyy');
                                                    })()}
                                                </div>
                                                <div className="dash-res-meta-item">
                                                    <Clock size={14} />
                                                    {res.classes?.start_time?.slice(0, 5)} - {res.classes?.end_time?.slice(0, 5)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="dash-res-actions">
                                            <span className={`dash-badge ${res.status === 'active' ? 'dash-badge-green' : 'dash-badge-red'}`}>
                                                {res.status === 'active' ? 'Activa' : 'Cancelada'}
                                            </span>
                                            {res.status === 'active' && (
                                                <button
                                                    onClick={() => handleCancel(res.classes?.id)}
                                                    className="dash-btn-danger"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Navigation Elements (at the bottom to ensure top stacking order) */}
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

export default MemberReservations;
