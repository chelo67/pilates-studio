import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Users, ChevronLeft, ChevronRight, CalendarDays, Trash2 } from 'lucide-react';
import ClassReservationsModal from './ClassReservationsModal';
import { useToast } from '../../components/ui/Toast';

interface ClassItem {
    id: string;
    title: string;
    description: string;
    class_date: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
    reservation_count: number;
}

const AdminCalendar = () => {
    const { toast, confirm } = useToast();

    // State
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [monthClassDates, setMonthClassDates] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    // Fetch class count per day for the month (calendar indicators)
    const fetchMonthIndicators = async () => {
        const start = format(startOfMonth(viewDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(viewDate), 'yyyy-MM-dd');

        const { data } = await supabase
            .from('classes')
            .select('class_date')
            .gte('class_date', start)
            .lte('class_date', end);

        if (data) {
            const countMap = new Map<string, number>();
            data.forEach(c => {
                countMap.set(c.class_date, (countMap.get(c.class_date) || 0) + 1);
            });
            setMonthClassDates(countMap);
        }
    };

    // Fetch classes for the selected day
    const fetchClassesForDay = async (dateStr: string) => {
        setLoading(true);

        const { data, error } = await supabase
            .from('classes')
            .select('*, reservations(count)')
            .eq('class_date', dateStr)
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching classes:', error);
            setLoading(false);
            return;
        }

        const mergedData = data?.map(cls => ({
            ...cls,
            reservation_count: cls.reservations?.[0]?.count || 0,
        })) || [];

        setClasses(mergedData);
        setLoading(false);
    };

    // Delete a class
    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Eliminar clase',
            message: '¿Estás segura de querer eliminar esta clase? Esta acción no se puede deshacer.',
            confirmText: 'Sí, eliminar',
            cancelText: 'No, mantener',
            variant: 'danger',
        });
        if (!confirmed) return;

        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Clase eliminada correctamente.');
            fetchClassesForDay(selectedDate);
            fetchMonthIndicators();
        }
    };

    useEffect(() => {
        fetchMonthIndicators();
    }, [viewDate]);

    useEffect(() => {
        fetchClassesForDay(selectedDate);
    }, [selectedDate]);

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
        <>
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
                            const classCount = monthClassDates.get(dateStr) || 0;
                            const hasClasses = classCount > 0;

                            return (
                                <div
                                    key={idx}
                                    className={`calendar-day-cell ${!isCurrentMonth ? 'empty' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasClasses ? 'has-classes' : ''}`}
                                    onClick={() => isCurrentMonth && setSelectedDate(dateStr)}
                                >
                                    {format(day, 'd')}
                                    {hasClasses && classCount > 1 && (
                                        <span className="calendar-day-count">{classCount}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="calendar-legend">
                        <div className="legend-item">
                            <div className="legend-dot"></div>
                            <span>Día con clases</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Classes for selected day */}
                <div className="member-classes-list" key={selectedDate}>
                    <div className="classes-for-day-header">
                        <h2 className="classes-for-day-title">
                            Clases — {getSafeDateDisplay(selectedDate)}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="dash-loading">
                            <div className="dash-spinner" />
                            <span>Cargando clases...</span>
                        </div>
                    ) : classes.length > 0 ? (
                        <div className="admin-calendar-classes">
                            {classes.map((cls) => {
                                const occupancyPercent = cls.max_capacity > 0
                                    ? Math.round((cls.reservation_count / cls.max_capacity) * 100)
                                    : 0;
                                const isFull = cls.reservation_count >= cls.max_capacity;

                                return (
                                    <div key={cls.id} className="admin-cal-class-card">
                                        <div className="admin-cal-class-top">
                                            <div className="admin-cal-class-info">
                                                <h3 className="admin-cal-class-title">{cls.title}</h3>
                                                {cls.description && (
                                                    <p className="admin-cal-class-desc">{cls.description}</p>
                                                )}
                                            </div>
                                            <span className={`dash-badge ${isFull ? 'dash-badge-red' : 'dash-badge-green'}`}>
                                                {isFull ? 'Completa' : 'Disponible'}
                                            </span>
                                        </div>

                                        <div className="admin-cal-class-meta">
                                            <div className="dash-class-meta-item">
                                                <Clock size={14} />
                                                {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                                            </div>
                                            <div className="dash-class-meta-item">
                                                <Users size={14} />
                                                {cls.reservation_count} / {cls.max_capacity} inscritos
                                            </div>
                                        </div>

                                        {/* Occupancy bar */}
                                        <div className="admin-cal-occupancy">
                                            <div className="admin-cal-occupancy-bar">
                                                <div
                                                    className={`admin-cal-occupancy-fill ${isFull ? 'full' : ''}`}
                                                    style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                                                />
                                            </div>
                                            <span className="admin-cal-occupancy-text">
                                                {occupancyPercent}% ocupación
                                            </span>
                                        </div>

                                        <div className="admin-cal-class-actions">
                                            <button
                                                onClick={() => setSelectedClassId(cls.id)}
                                                className="dash-btn-primary"
                                                style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem' }}
                                            >
                                                <Users size={14} />
                                                Ver inscritos
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cls.id)}
                                                className="dash-btn-danger"
                                                style={{ fontSize: '0.75rem', padding: '0.4rem 0.7rem' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
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

            {/* Reservations Modal - reuse existing */}
            {selectedClassId && (
                <ClassReservationsModal
                    classId={selectedClassId}
                    onClose={() => setSelectedClassId(null)}
                />
            )}
        </>
    );
};

export default AdminCalendar;
