import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminClassList from './AdminClassList';
import CreateClassModal from './CreateClassModal';
import AdminMembers from './AdminMembers';
import AdminOverview from './AdminOverview';
import AdminReservations from './AdminReservations';
import AdminInstructors from './AdminInstructors';
import AdminCalendar from './AdminCalendar';
import { Plus, Users, Calendar, LogOut, Menu, X, Activity, CalendarDays } from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';

const AdminDashboard = () => {
    const { user, signOut } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'members' | 'reservations' | 'calendar' | 'instructors'>('overview');
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleClassCreated = () => {
        setRefreshKey(prev => prev + 1);
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
                            <span className="brand-role">Administración</span>
                        </div>
                    </div>

                    <nav className="dash-sidebar-nav">
                        <span className="dash-sidebar-label">Menú</span>
                        <button
                            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
                            className={`dash-sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
                        >
                            <div className="sidebar-icon">
                                <Activity size={18} />
                            </div>
                            Dashboard
                        </button>
                        <button
                            onClick={() => { setActiveTab('classes'); setIsSidebarOpen(false); }}
                            className={`dash-sidebar-item ${activeTab === 'classes' ? 'active' : ''}`}
                        >
                            <div className="sidebar-icon"><Calendar size={18} /></div>
                            Clases
                        </button>
                        <button
                            onClick={() => { setActiveTab('members'); setIsSidebarOpen(false); }}
                            className={`dash-sidebar-item ${activeTab === 'members' ? 'active' : ''}`}
                        >
                            <div className="sidebar-icon"><Users size={18} /></div>
                            Miembros
                        </button>
                        <button
                            onClick={() => { setActiveTab('reservations'); setIsSidebarOpen(false); }}
                            className={`dash-sidebar-item ${activeTab === 'reservations' ? 'active' : ''}`}
                        >
                            <div className="sidebar-icon"><Activity size={18} /></div>
                            Reservaciones
                        </button>
                        <button
                            onClick={() => { setActiveTab('calendar'); setIsSidebarOpen(false); }}
                            className={`dash-sidebar-item ${activeTab === 'calendar' ? 'active' : ''}`}
                        >
                            <div className="sidebar-icon"><CalendarDays size={18} /></div>
                            Calendario
                        </button>
                        <button
                            onClick={() => { setActiveTab('instructors'); setIsSidebarOpen(false); }}
                            className={`dash-sidebar-item ${activeTab === 'instructors' ? 'active' : ''}`}
                        >
                            <div className="sidebar-icon"><Users size={18} /></div>
                            Instructores
                        </button>
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
                                <h1 className="dash-title">
                                    {activeTab === 'overview' ? 'Panel de Control' :
                                        activeTab === 'classes' ? 'Gestión de Clases' :
                                            activeTab === 'members' ? 'Gestión de Miembros' :
                                                activeTab === 'calendar' ? 'Calendario' :
                                                    activeTab === 'instructors' ? 'Gestión de Instructores' : 'Reservaciones'}
                                </h1>
                                <p className="dash-subtitle">
                                    {activeTab === 'overview'
                                        ? 'Resumen general de la actividad de tu estudio.'
                                        : activeTab === 'classes'
                                            ? 'Creá, editá y controlá las reservas de tus clases.'
                                            : activeTab === 'calendar'
                                                ? 'Visualizá las clases del mes en el calendario.'
                                                : activeTab === 'members'
                                                    ? 'Administrá los miembros registrados en el estudio.'
                                                    : activeTab === 'instructors'
                                                        ? 'Administrá los instructores del estudio.'
                                                        : 'Gestioná las reservaciones de tus clases.'}
                                </p>
                            </div>
                            <NotificationBell />
                        </div>

                        {/* Overview Section */}
                        {activeTab === 'overview' && (
                            <AdminOverview
                                onNewMember={() => { setActiveTab('members'); setIsAddMemberModalOpen(true); }}
                                onNewClass={() => setIsModalOpen(true)}
                            />
                        )}

                        {/* Classes Section */}
                        {activeTab === 'classes' && (
                            <div>
                                <div className="dash-section-header">
                                    <h2 className="dash-section-title">Próximas Clases</h2>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="dash-btn-primary"
                                    >
                                        <Plus size={16} />
                                        Crear Clase
                                    </button>
                                </div>
                                <AdminClassList key={refreshKey} />
                            </div>
                        )}

                        {/* Members Section */}
                        {activeTab === 'members' && (
                            <div>
                                <AdminMembers forceOpenAddModal={isAddMemberModalOpen} onModalClose={() => setIsAddMemberModalOpen(false)} />
                            </div>
                        )}

                        {/* Reservations Section */}
                        {activeTab === 'reservations' && (
                            <AdminReservations />
                        )}

                        {/* Calendar Section */}
                        {activeTab === 'calendar' && (
                            <AdminCalendar key={refreshKey} />
                        )}

                        {/* Instructors Section */}
                        {activeTab === 'instructors' && (
                            <AdminInstructors />
                        )}
                    </main>
                </div>
            </div>

            <CreateClassModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleClassCreated}
            />

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

export default AdminDashboard;
