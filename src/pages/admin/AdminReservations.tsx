import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ChevronDown, Trash2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface Class {
    id: string;
    title: string;
    class_date: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
}

interface Reservation {
    id: string;
    user_id: string;
    created_at: string;
    profiles: {
        full_name: string;
        email?: string;
    };
}

const AdminReservations = () => {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loadingRes, setLoadingRes] = useState(false);
    const { toast, confirm } = useToast();

    // Generate dates for the current week based on selectedDate
    const getWeekDays = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0);
        const start = startOfWeek(date, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    };

    const quickDates = getWeekDays(selectedDate);

    const fetchClasses = async (date: string) => {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('class_date', date)
            .order('start_time', { ascending: true });

        if (!error && data) {
            setClasses(data);
            if (data.length > 0) {
                // Keep current selection if it's in the new list, otherwise pick the first one
                if (!data.find(c => c.id === selectedClassId)) {
                    setSelectedClassId(data[0].id);
                }
            } else {
                setSelectedClassId('');
                setReservations([]);
            }
        }
    };

    const fetchReservations = async (classId: string) => {
        if (!classId) return;
        setLoadingRes(true);
        const { data, error } = await supabase
            .from('reservations')
            .select('*, profiles(full_name, email)') // Note: email column added by user recommendation
            .eq('class_id', classId);

        if (!error && data) {
            setReservations(data as any);
        }
        setLoadingRes(false);
    };

    const cancelReservation = async (reservationId: string) => {
        const confirmed = await confirm({
            title: 'Cancelar reservación',
            message: '¿Estás seguro de que deseas cancelar esta reservación?',
            confirmText: 'Sí, cancelar',
            cancelText: 'No, mantener',
            variant: 'danger',
        });
        if (!confirmed) return;

        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', reservationId);

        if (error) {
            toast.error('Error al cancelar la reservación: ' + error.message);
        } else {
            toast.success('Reservación cancelada correctamente.');
            setReservations(prev => prev.filter(r => r.id !== reservationId));
        }
    };

    useEffect(() => {
        fetchClasses(selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        if (selectedClassId) {
            fetchReservations(selectedClassId);
        }
    }, [selectedClassId]);

    const selectedClassObj = classes.find(c => c.id === selectedClassId);

    // Stable date formatting using parts to avoid timezone shifts
    const getSafeDateDisplay = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Create date at noon to avoid midnight/timezone issues
        const date = new Date(year, month - 1, day, 12, 0, 0);
        return format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
    };

    const formattedDate = getSafeDateDisplay(selectedDate);

    return (
        <div className="res-container">
            <div className="res-card res-filters">
                <div className="res-filter-grid">
                    <div className="dash-form-group" style={{ margin: 0 }}>
                        <label className="dash-form-label">Seleccionar Clase</label>
                        <div className="res-select-wrap">
                            <select
                                className="dash-form-input"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                disabled={classes.length === 0}
                            >
                                {classes.length === 0 ? (
                                    <option>Sin clases para este día</option>
                                ) : (
                                    classes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} ({c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)})
                                        </option>
                                    ))
                                )}
                            </select>
                            <ChevronDown size={16} className="res-select-arrow" />
                        </div>
                    </div>

                    <div className="dash-form-group" style={{ margin: 0 }}>
                        <label className="dash-form-label">Fecha</label>
                        <div className="dash-input-with-icon">
                            <Calendar size={16} className="dash-input-icon-left" />
                            <input
                                type="date"
                                className="dash-form-input dash-input-has-icon"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="res-quick-dates">
                    <p className="res-label">Fechas rápidas:</p>
                    <div className="res-days-strip">
                        {quickDates.map((date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isActive = isSameDay(date, parseISO(selectedDate));
                            const dayName = format(date, 'eee', { locale: es }).toLowerCase();
                            const dayNum = format(date, 'd');

                            return (
                                <button
                                    key={dateStr}
                                    className={`res-day-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => setSelectedDate(dateStr)}
                                >
                                    <span className="res-day-name">{dayName}</span>
                                    <span className="res-day-num">{dayNum}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="res-card res-results">
                {selectedClassObj && (
                    <div className="res-results-header">
                        <h3 className="res-class-title">{selectedClassObj.title}</h3>
                        <p className="res-class-info">{formattedDate}</p>
                    </div>
                )}

                <div className="dash-table-wrap">
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>#</th>
                                <th>MIEMBRO</th>
                                <th>EMAIL</th>
                                <th style={{ textAlign: 'right' }}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingRes ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className="dash-spinner" style={{ margin: '0 auto 1rem' }} />
                                        Cargando participantes...
                                    </td>
                                </tr>
                            ) : reservations.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="dash-table-empty">
                                        No hay miembros inscritos en esta clase.
                                    </td>
                                </tr>
                            ) : (
                                reservations.map((res, index) => (
                                    <tr key={res.id}>
                                        <td data-label="#">{index + 1}</td>
                                        <td data-label="Miembro">
                                            <div className="res-member-cell">
                                                <div className="res-avatar">
                                                    {res.profiles?.full_name?.charAt(0)}
                                                </div>
                                                <span>{res.profiles?.full_name}</span>
                                            </div>
                                        </td>
                                        <td data-label="Email">
                                            <span className="res-email-text">
                                                {res.profiles?.email || '—'}
                                            </span>
                                        </td>
                                        <td data-label="Acciones">
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="dash-btn-icon dash-btn-danger"
                                                    onClick={() => cancelReservation(res.id)}
                                                    title="Eliminar Reservación"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminReservations;
