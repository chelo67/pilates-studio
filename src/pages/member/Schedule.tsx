import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
    format,
    isAfter,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, Users, LogOut, Menu, X, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

interface ClassItem {
    id: string;
    title: string;
    description: string;
    class_date: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
    reservations: { count: number }[];
    user_reservation?: boolean;
    reservation_count?: number;
}

const MemberSchedule = () => {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const { toast, confirm } = useToast();

    // State
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [monthAvailability, setMonthAvailability] = useState<Set<string>>(new Set());
    const [monthReservations, setMonthReservations] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fetch availability for the entire month (dots and circles)
    const fetchMonthIndicators = async () => {
        if (!user) return;

        const start = format(startOfMonth(viewDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(viewDate), 'yyyy-MM-dd');

        // Fetch classes in this month
        const { data: classesData } = await supabase
            .from('classes')
            .select('class_date')
            .gte('class_date', start)
            .lte('class_date', end);

        if (classesData) {
            setMonthAvailability(new Set(classesData.map(c => c.class_date)));
        }

        // Fetch my reservations in this month
        const { data: resData } = await supabase
            .from('reservations')
            .select('classes(class_date)')
            .eq('user_id', user.id)
            .eq('status', 'active');

        if (resData) {
            const resDates = new Set<string>();
            resData.forEach((r: any) => {
                if (r.classes?.class_date) resDates.add(r.classes.class_date);
            });
            setMonthReservations(resDates);
        }
    };

    // Fetch classes for the selected day
    const fetchClassesForDay = async (dateStr: string) => {
        setLoading(true);

        const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select('*, reservations(count)')
            .eq('class_date', dateStr)
            .order('start_time', { ascending: true });

        if (classesError) {
            console.error('Error fetching classes:', classesError);
            setLoading(false);
            return;
        }

        const { data: myReservations } = await supabase
            .from('reservations')
            .select('class_id')
            .eq('user_id', user?.id)
            .eq('status', 'active');

        const bookedClassIds = new Set(myReservations?.map(r => r.class_id));

        const mergedData = classesData?.map(cls => ({
            ...cls,
            reservation_count: cls.reservations?.[0]?.count || 0,
            user_reservation: bookedClassIds.has(cls.id)
        })) || [];

        setClasses(mergedData);
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchMonthIndicators();
        }
    }, [user, viewDate]);

    useEffect(() => {
        if (user) {
            fetchClassesForDay(selectedDate);
        }
    }, [user, selectedDate]);

    const handleBook = async (classId: string) => {
        setBookingId(classId);
        try {
            const { error } = await supabase
                .from('reservations')
                .insert([{ class_id: classId, user_id: user?.id }]);
            if (error) throw error;
            toast.success('¡Clase reservada exitosamente!');
            fetchClassesForDay(selectedDate);
            fetchMonthIndicators();
        } catch (error: any) {
            toast.error(error.message || 'Error al reservar');
        } finally {
            setBookingId(null);
        }
    };

    const handleCancel = async (classId: string) => {
        const confirmed = await confirm({
            title: 'Cancelar reserva',
            message: '¿Estás seguro de que querés cancelar esta reserva?',
            confirmText: 'Sí, cancelar',
            cancelText: 'No, mantener',
            variant: 'danger',
        });
        if (!confirmed) return;
        setBookingId(classId);
        try {
            const { error } = await supabase
                .from('reservations')
                .delete()
                .eq('class_id', classId)
                .eq('user_id', user?.id);
            if (error) throw error;
            toast.success('Reserva cancelada correctamente.');
            fetchClassesForDay(selectedDate);
            fetchMonthIndicators();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setBookingId(null);
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Calendar generation
    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [viewDate]);

    const nextMonth = () => setViewDate(prev => addMonths(prev, 1));
    const prevMonth = () => setViewDate(prev => subMonths(prev, 1));
    const goToToday = () => {
        const today = new Date();
        setViewDate(today);
        setSelectedDate(format(today, 'yyyy-MM-dd'));
    };

    const getSafeDateDisplay = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0);
        return format(date, "EEEE d 'de' MMMM", { locale: es });
    };

    return (
        <div className="dash-page">
            {/* Mobile Hamburger */}
            <button className="dash-hamburger" onClick={toggleSidebar}>
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Overlay */}
            <div
                className={`dash-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

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
                            <div className="sidebar-icon"><CalendarIcon size={18} /></div>
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
                        <div className="dash-header">
                            <h1 className="dash-title">Horarios de Clases</h1>
                            <p className="dash-subtitle">Navegá el calendario para encontrar y reservar tus clases</p>
                        </div>

                        <div className="member-sched-layout">
                            {/* Left Column: Calendar */}
                            <div className="member-calendar-card">
                                <div className="calendar-header">
                                    <h2 className="calendar-month-year">
                                        {format(viewDate, 'MMMM yyyy', { locale: es })}
                                    </h2>
                                    <div className="calendar-nav">
                                        <button onClick={prevMonth} className="calendar-nav-btn" title="Mes anterior">
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button onClick={goToToday} className="calendar-today-btn" title="Ir a hoy">
                                            Hoy
                                        </button>
                                        <button onClick={nextMonth} className="calendar-nav-btn" title="Mes siguiente">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="calendar-grid">
                                    {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(d => (
                                        <div key={d} className="calendar-weekday">{d}</div>
                                    ))}
                                    {calendarDays.map((day, idx) => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const isCurrentMonth = isSameMonth(day, viewDate);
                                        const isSelected = selectedDate === dateStr;
                                        const isToday = isSameDay(day, new Date());
                                        const hasClasses = monthAvailability.has(dateStr);
                                        const hasReservation = monthReservations.has(dateStr);

                                        return (
                                            <div
                                                key={idx}
                                                className={`calendar-day-cell ${!isCurrentMonth ? 'empty' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasClasses ? 'has-classes' : ''} ${hasReservation ? 'has-reservation' : ''}`}
                                                onClick={() => isCurrentMonth && setSelectedDate(dateStr)}
                                            >
                                                {format(day, 'd')}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="calendar-legend">
                                    <div className="legend-item">
                                        <div className="legend-dot"></div>
                                        <span>Día con clases</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-circle"></div>
                                        <span>Tienes reserva</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Classes */}
                            <div className="member-classes-list">
                                <div className="classes-for-day-header">
                                    <h2 className="classes-for-day-title">
                                        Clases para {getSafeDateDisplay(selectedDate)}
                                    </h2>
                                </div>

                                {loading ? (
                                    <div className="dash-loading">
                                        <div className="dash-spinner" />
                                        <span>Cargando clases...</span>
                                    </div>
                                ) : classes.length > 0 ? (
                                    <div className="dash-class-grid" style={{ gridTemplateColumns: '1fr' }}>
                                        {classes.map((cls) => {
                                            const checkDate = new Date(`${cls.class_date}T${cls.start_time}`);
                                            const now = new Date();
                                            const isPast = isAfter(now, checkDate);
                                            const isFull = (cls.reservation_count || 0) >= cls.max_capacity;
                                            const isBooked = cls.user_reservation;

                                            return (
                                                <div key={cls.id} className="dash-class-card">
                                                    <div className="dash-class-card-body">
                                                        <div className="dash-class-card-top">
                                                            <h3 className="dash-class-card-title">{cls.title}</h3>
                                                            {isBooked ? (
                                                                <span className="dash-badge dash-badge-green">Reservada</span>
                                                            ) : isFull ? (
                                                                <span className="dash-badge dash-badge-red">Completa</span>
                                                            ) : (
                                                                <span className="dash-badge dash-badge-blue">Disponible</span>
                                                            )}
                                                        </div>

                                                        <p className="dash-class-card-desc">{cls.description}</p>

                                                        <div className="dash-class-meta">
                                                            <div className="dash-class-meta-item">
                                                                <Clock size={14} />
                                                                {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                                                            </div>
                                                            <div className="dash-class-meta-item">
                                                                <Users size={14} />
                                                                {cls.reservation_count} / {cls.max_capacity} lugares
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="dash-class-card-footer">
                                                        {isBooked ? (
                                                            <button
                                                                onClick={() => handleCancel(cls.id)}
                                                                disabled={bookingId === cls.id || isPast}
                                                                className="dash-book-btn dash-book-btn-cancel"
                                                            >
                                                                {bookingId === cls.id ? 'Procesando...' : 'Cancelar Reserva'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleBook(cls.id)}
                                                                disabled={bookingId === cls.id || isFull || isPast}
                                                                className={`dash-book-btn ${isFull ? 'dash-book-btn-full' : 'dash-book-btn-primary'}`}
                                                            >
                                                                {bookingId === cls.id ? 'Reservando...' : (isFull ? 'Clase Completa' : 'Reservar')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="dash-empty">
                                        <CalendarDays size={40} style={{ opacity: 0.25, marginBottom: '0.5rem' }} />
                                        <p>No hay clases programadas para este día.</p>
                                        <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Seleccioná otro día en el calendario</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MemberSchedule;
