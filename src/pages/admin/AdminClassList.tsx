import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Trash2, Users } from 'lucide-react';
import ClassReservationsModal from './ClassReservationsModal';
import { useToast } from '../../components/ui/Toast';

interface ClassItem {
    id: string;
    title: string;
    class_date: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
    reservations: any[];
}

const AdminClassList = () => {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const { toast, confirm } = useToast();

    const fetchClasses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select('*, reservations(count)')
            .order('class_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching classes:', error);
        } else {
            setClasses(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchClasses();
    }, []);

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
            fetchClasses();
        }
    };

    if (loading) {
        return (
            <div className="dash-loading">
                <div className="dash-spinner" />
                <span>Cargando clases...</span>
            </div>
        );
    }

    return (
        <>
            <div className="dash-table-wrap">
                <table className="dash-table">
                    <thead>
                        <tr>
                            <th>Fecha y Hora</th>
                            <th>Título</th>
                            <th>Capacidad</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map((cls) => (
                            <tr key={cls.id}>
                                <td>
                                    <div style={{ fontWeight: 500 }}>
                                        {(() => {
                                            const [y, m, d] = cls.class_date.split('-').map(Number);
                                            return format(new Date(y, m - 1, d, 12, 0, 0), 'dd MMM yyyy');
                                        })()}
                                    </div>
                                    <div className="dash-table-sub">
                                        {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                                    </div>
                                </td>
                                <td style={{ fontWeight: 500, color: 'rgba(255,255,255,0.95)' }}>
                                    {cls.title}
                                </td>
                                <td>
                                    <button
                                        onClick={() => setSelectedClassId(cls.id)}
                                        className="dash-badge dash-badge-purple"
                                        style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        title="Ver lista de inscritos"
                                    >
                                        <Users size={12} />
                                        {cls.reservations?.[0]?.count || 0} / {cls.max_capacity}
                                    </button>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => setSelectedClassId(cls.id)}
                                            className="dash-icon-btn dash-icon-btn-blue"
                                            title="Ver Reservas"
                                        >
                                            <Users size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cls.id)}
                                            className="dash-icon-btn dash-icon-btn-red"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {classes.length === 0 && (
                            <tr>
                                <td colSpan={4} className="dash-table-empty">
                                    No se encontraron clases.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedClassId && (
                <ClassReservationsModal
                    classId={selectedClassId}
                    onClose={() => setSelectedClassId(null)}
                />
            )}
        </>
    );
};

export default AdminClassList;
