import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, Activity, Calendar, TrendingUp, Plus, UserPlus } from 'lucide-react';
import { getCurrentTenantId } from '../../lib/tenant';

interface Stats {
    totalMembers: number;
    activeMembers: number;
    scheduledClasses: number;
    todayReservations: number;
}

interface RecentReservation {
    id: string;
    created_at: string;
    profiles: {
        full_name: string;
    };
    classes: {
        title: string;
        class_date: string;
    };
}

interface AdminOverviewProps {
    onNewMember: () => void;
    onNewClass: () => void;
}

const AdminOverview = ({ onNewMember, onNewClass }: AdminOverviewProps) => {
    const [stats, setStats] = useState<Stats>({
        totalMembers: 0,
        activeMembers: 0,
        scheduledClasses: 0,
        todayReservations: 0
    });
    const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        // Fetch Stats
        const [
            { count: total },
            { count: active },
            { count: classes },
            { count: todayRes }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('tenant_id', getCurrentTenantId()),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('active', true).eq('tenant_id', getCurrentTenantId()),
            supabase.from('classes').select('*', { count: 'exact', head: true }).gte('class_date', today).eq('tenant_id', getCurrentTenantId()),
            supabase.from('reservations').select('*, classes!inner(*)', { count: 'exact', head: true }).eq('classes.class_date', today).eq('tenant_id', getCurrentTenantId())
        ]);

        setStats({
            totalMembers: total || 0,
            activeMembers: active || 0,
            scheduledClasses: classes || 0,
            todayReservations: todayRes || 0
        });

        // Fetch Recent Reservations
        const { data: recent } = await supabase
            .from('reservations')
            .select(`
                id,
                created_at,
                profiles(full_name),
                classes(title, class_date)
            `)
            .eq('tenant_id', getCurrentTenantId())
            .order('created_at', { ascending: false })
            .limit(5);

        setRecentReservations(recent as any || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

    if (loading) {
        return (
            <div className="dash-loading">
                <div className="dash-spinner" />
                <span>Cargando dashboard...</span>
            </div>
        );
    }

    return (
        <div className="ov-container">
            <header className="ov-header">
                <div className="ov-header-left">
                    <h1 className="ov-greeting">¡Hola, admin! 👋</h1>
                    <p className="ov-date">{todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)}</p>
                </div>
            </header>

            <div className="ov-stats-grid">
                <div className="ov-stat-card">
                    <div className="ov-stat-info">
                        <span className="ov-stat-label">Total Miembros</span>
                        <span className="ov-stat-value">{stats.totalMembers}</span>
                    </div>
                    <div className="ov-stat-icon ov-icon-blue">
                        <Users size={20} />
                    </div>
                </div>

                <div className="ov-stat-card">
                    <div className="ov-stat-info">
                        <span className="ov-stat-label">Miembros Activos</span>
                        <span className="ov-stat-value">{stats.activeMembers}</span>
                    </div>
                    <div className="ov-stat-icon ov-icon-green">
                        <Activity size={20} />
                    </div>
                </div>

                <div className="ov-stat-card">
                    <div className="ov-stat-info">
                        <span className="ov-stat-label">Clases Programadas</span>
                        <span className="ov-stat-value">{stats.scheduledClasses}</span>
                    </div>
                    <div className="ov-stat-icon ov-icon-purple">
                        <Calendar size={20} />
                    </div>
                </div>

                <div className="ov-stat-card">
                    <div className="ov-stat-info">
                        <span className="ov-stat-label">Reservas Hoy</span>
                        <span className="ov-stat-value">{stats.todayReservations}</span>
                    </div>
                    <div className="ov-stat-icon ov-icon-orange">
                        <TrendingUp size={20} />
                    </div>
                </div>
            </div>

            <div className="ov-main-grid">
                <section className="ov-recent-card">
                    <h3 className="ov-section-title">Reservas Recientes</h3>
                    <div className="ov-recent-list">
                        {recentReservations.length === 0 ? (
                            <div className="dash-table-empty">No hay reservas recientes.</div>
                        ) : (
                            recentReservations.map((res) => (
                                <div key={res.id} className="ov-recent-item">
                                    <div className="ov-recent-avatar">
                                        {res.profiles?.full_name?.charAt(0)}
                                    </div>
                                    <div className="ov-recent-info">
                                        <p className="ov-recent-name">{res.profiles?.full_name}</p>
                                        <p className="ov-recent-sub">
                                            {res.classes?.title} • {format(new Date(res.created_at), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                    <span className="dash-badge dash-badge-purple">Confirmada</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="ov-actions-card">
                    <h3 className="ov-section-title">Acciones Rápidas</h3>
                    <div className="ov-actions-grid">
                        <button onClick={onNewMember} className="ov-action-btn">
                            <div className="ov-action-icon ov-icon-purple">
                                <UserPlus size={24} />
                            </div>
                            <span>Nuevo Miembro</span>
                        </button>
                        <button onClick={onNewClass} className="ov-action-btn">
                            <div className="ov-action-icon ov-icon-purple">
                                <Plus size={24} />
                            </div>
                            <span>Nueva Clase</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminOverview;
