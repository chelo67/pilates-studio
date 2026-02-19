import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../components/ui/Toast';

interface ClassReservationsModalProps {
    classId: string | null;
    onClose: () => void;
}

const ClassReservationsModal = ({ classId, onClose }: ClassReservationsModalProps) => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [className, setClassName] = useState('');
    const { toast, confirm } = useToast();

    const fetchReservations = async () => {
        if (!classId) return;
        setLoading(true);

        const { data: cls } = await supabase.from('classes').select('title, class_date, start_time').eq('id', classId).single();
        if (cls) setClassName(`${cls.title} (${format(new Date(cls.class_date), 'dd MMM')} ${cls.start_time.slice(0, 5)})`);

        const { data, error } = await supabase
            .from('reservations')
            .select('*, profiles(full_name)')
            .eq('class_id', classId);

        if (error) console.error(error);
        else setReservations(data || []);

        setLoading(false);
    };

    useEffect(() => {
        if (classId) fetchReservations();
    }, [classId]);

    const handleCancel = async (reservationId: string) => {
        const confirmed = await confirm({
            title: 'Cancelar reserva',
            message: '¿Estás seguro de que querés cancelar esta reserva?',
            confirmText: 'Sí, cancelar',
            cancelText: 'No, mantener',
            variant: 'danger',
        });
        if (!confirmed) return;

        const { error } = await supabase.from('reservations').delete().eq('id', reservationId);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Reserva cancelada correctamente.');
            fetchReservations();
        }
    };

    if (!classId) return null;

    return (
        <div className="dash-modal-overlay">
            <div className="dash-modal dash-modal-lg">
                <div className="dash-modal-header">
                    <h2 className="dash-modal-title">Reservas — {className}</h2>
                    <button onClick={onClose} className="dash-modal-close">
                        <X size={16} />
                    </button>
                </div>

                <div className="dash-modal-body">
                    {loading ? (
                        <div className="dash-loading">
                            <div className="dash-spinner" />
                            <span>Cargando...</span>
                        </div>
                    ) : reservations.length === 0 ? (
                        <div className="dash-empty">
                            No hay reservas para esta clase.
                        </div>
                    ) : (
                        <div className="dash-table-wrap">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>Miembro</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.map((res) => (
                                        <tr key={res.id}>
                                            <td>
                                                <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                                                    {res.profiles?.full_name || 'Desconocido'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`dash-badge ${res.status === 'active' ? 'dash-badge-green' : 'dash-badge-red'}`}>
                                                    {res.status === 'active' ? 'Activa' : res.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleCancel(res.id)}
                                                    className="dash-icon-btn dash-icon-btn-red"
                                                    title="Cancelar reserva"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClassReservationsModal;
