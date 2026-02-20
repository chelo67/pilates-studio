import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Trash2, Users } from 'lucide-react';
import { getCurrentTenantId } from '../../lib/tenant';
import ClassReservationsModal from './ClassReservationsModal';
import { useToast } from '../../components/ui/Toast';

interface ClassItem {
    id: string;
    title: string;
    class_date: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
    reservation_count?: number;
    instructor?: { name: string } | null;
    instructor_name?: string;
    status: 'active' | 'closed' | 'cancelled';
}

const AdminClassList = () => {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const { toast, confirm } = useToast();

    const fetchClasses = async () => {
        setLoading(true);
        const { data: classesData, error } = await supabase
            .from('classes')
            .select('*, instructor:instructors(name)')
            .eq('tenant_id', getCurrentTenantId())
            .order('class_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching classes:', error);
        } else {
            // Fetch active counts
            const { data: resData } = await supabase
                .from('reservations')
                .select('class_id')
                .eq('status', 'active')
                .eq('tenant_id', getCurrentTenantId());

            const countMap = new Map<string, number>();
            resData?.forEach(r => {
                countMap.set(r.class_id, (countMap.get(r.class_id) || 0) + 1);
            });

            const merged = classesData?.map(c => ({
                ...c,
                reservation_count: countMap.get(c.id) || 0
            })) || [];

            setClasses(merged);
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

        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id)
            .eq('tenant_id', getCurrentTenantId());
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Clase eliminada correctamente.');
            fetchClasses();
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('classes')
            .update({ status: newStatus })
            .eq('id', id)
            .eq('tenant_id', getCurrentTenantId());

        if (error) {
            toast.error(error.message);
        } else {
            toast.success(`Estado actualizado a ${newStatus}`);
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
                            <th>Clase / Instructor</th>
                            <th>Capacidad</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map((cls) => (
                            <tr key={cls.id}>
                                <td data-label="Fecha y Hora">
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
                                <td data-label="Título">
                                    <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.95)' }}>
                                        {cls.title}
                                    </div>
                                    <div className="dash-table-sub" style={{ fontSize: '0.8rem' }}>
                                        {cls.instructor?.name || cls.instructor_name || 'Sin instructor'}
                                    </div>
                                </td>
                                <td data-label="Capacidad">
                                    <button
                                        onClick={() => setSelectedClassId(cls.id)}
                                        className="dash-badge dash-badge-purple"
                                        style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        title="Ver lista de inscritos"
                                    >
                                        <Users size={12} />
                                        {cls.reservation_count || 0} / {cls.max_capacity}
                                    </button>
                                </td>
                                <td data-label="Estado">
                                    {cls.status === 'active' && <span className="dash-badge dash-badge-green">Disponible</span>}
                                    {cls.status === 'closed' && <span className="dash-badge dash-badge-blue">Cerrada</span>}
                                    {cls.status === 'cancelled' && <span className="dash-badge dash-badge-red">Cancelada</span>}
                                </td>
                                <td data-label="Acciones">
                                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                        {/* Dynamic Action Buttons */}
                                        {cls.status === 'active' && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(cls.id, 'closed')}
                                                    className="dash-icon-btn dash-icon-btn-blue"
                                                    title="Cerrar Reservas"
                                                >
                                                    <span style={{ fontSize: '0.7rem' }}>🔒</span>
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(cls.id, 'cancelled')}
                                                    className="dash-icon-btn dash-icon-btn-red"
                                                    title="Cancelar Clase"
                                                >
                                                    <span style={{ fontSize: '0.7rem' }}>🚫</span>
                                                </button>
                                            </>
                                        )}
                                        {cls.status === 'closed' && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(cls.id, 'active')}
                                                    className="dash-icon-btn dash-icon-btn-blue"
                                                    title="Reabrir Reservas"
                                                >
                                                    <span style={{ fontSize: '0.7rem' }}>🔓</span>
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(cls.id, 'cancelled')}
                                                    className="dash-icon-btn dash-icon-btn-red"
                                                    title="Cancelar Clase"
                                                >
                                                    <span style={{ fontSize: '0.7rem' }}>🚫</span>
                                                </button>
                                            </>
                                        )}
                                        {cls.status === 'cancelled' && (
                                            <button
                                                onClick={() => handleUpdateStatus(cls.id, 'active')}
                                                className="dash-icon-btn dash-icon-btn-blue"
                                                title="Reactivar Clase"
                                            >
                                                <span style={{ fontSize: '0.7rem' }}>🔄</span>
                                            </button>
                                        )}

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
