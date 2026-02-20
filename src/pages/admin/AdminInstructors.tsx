import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { getCurrentTenantId, withTenant } from '../../lib/tenant';

interface Instructor {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    active: boolean;
}

const AdminInstructors = () => {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        active: true,
    });
    const { toast, confirm } = useToast();

    const fetchInstructors = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('instructors')
            .select('*')
            .eq('tenant_id', getCurrentTenantId())
            .order('name', { ascending: true });

        if (error) {
            toast.error(error.message);
        } else {
            setInstructors(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInstructors();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = withTenant({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            active: formData.active,
        });

        if (editingInstructor) {
            const { error } = await supabase
                .from('instructors')
                .update(payload)
                .eq('id', editingInstructor.id)
                .eq('tenant_id', getCurrentTenantId());

            if (error) toast.error(error.message);
            else {
                toast.success('Instructor actualizado correctamente.');
                handleCloseModal();
                fetchInstructors();
            }
        } else {
            const { error } = await supabase
                .from('instructors')
                .insert([payload]);

            if (error) toast.error(error.message);
            else {
                toast.success('Instructor creado correctamente.');
                handleCloseModal();
                fetchInstructors();
            }
        }
        setLoading(false);
    };

    const handleEdit = (instructor: Instructor) => {
        setEditingInstructor(instructor);
        setFormData({
            name: instructor.name,
            email: instructor.email || '',
            phone: instructor.phone || '',
            active: instructor.active,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (instructor: Instructor) => {
        // Check for active classes
        const { count, error } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('instructor_id', instructor.id);

        if (error) {
            toast.error('Error al verificar clases: ' + error.message);
            return;
        }

        if (count && count > 0) {
            const deactivate = await confirm({
                title: 'Instructor con clases',
                message: `Este instructor tiene ${count} clases asociadas. No se puede eliminar. ¿Querés desactivarlo en su lugar?`,
                confirmText: 'Sí, desactivar',
                cancelText: 'Cancelar',
                variant: 'danger',
            });
            if (deactivate) {
                await supabase
                    .from('instructors')
                    .update({ active: false })
                    .eq('id', instructor.id)
                    .eq('tenant_id', getCurrentTenantId());
                fetchInstructors();
            }
            return;
        }

        const confirmed = await confirm({
            title: 'Eliminar Instructor',
            message: `¿Estás seguro de que querés eliminar a ${instructor.name}?`,
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            variant: 'danger',
        });

        if (confirmed) {
            const { error } = await supabase
                .from('instructors')
                .delete()
                .eq('id', instructor.id)
                .eq('tenant_id', getCurrentTenantId());

            if (error) toast.error(error.message);
            else {
                toast.success('Instructor eliminado correctamente.');
                fetchInstructors();
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingInstructor(null);
        setFormData({ name: '', email: '', phone: '', active: true });
    };

    return (
        <div className="admin-instructors">
            <div className="dash-section-header">
                <h2 className="dash-section-title">Instructores</h2>
                <button onClick={() => setIsModalOpen(true)} className="dash-btn-primary">
                    <Plus size={16} />
                    Nuevo Instructor
                </button>
            </div>

            {loading && !isModalOpen ? (
                <div className="dash-loading">
                    <div className="dash-spinner" />
                    <span>Cargando instructores...</span>
                </div>
            ) : (
                <div className="dash-table-wrap">
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {instructors.map((instructor) => (
                                <tr key={instructor.id}>
                                    <td style={{ fontWeight: 500 }}>{instructor.name}</td>
                                    <td>{instructor.email || '—'}</td>
                                    <td>{instructor.phone || '—'}</td>
                                    <td>
                                        <span className={`dash-badge ${instructor.active ? 'dash-badge-green' : 'dash-badge-red'}`}>
                                            {instructor.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEdit(instructor)} className="dash-icon-btn dash-icon-btn-blue">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(instructor)} className="dash-icon-btn dash-icon-btn-red">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {instructors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="dash-table-empty">No hay instructores registrados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="dash-modal-overlay">
                    <div className="dash-modal">
                        <div className="dash-modal-header">
                            <h2 className="dash-modal-title">{editingInstructor ? 'Editar Instructor' : 'Nuevo Instructor'}</h2>
                            <button onClick={handleCloseModal} className="dash-modal-close"><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="dash-modal-body">
                                <div className="dash-form-group">
                                    <label className="dash-form-label">Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="dash-form-input"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Ana Silva"
                                    />
                                </div>
                                <div className="dash-form-group">
                                    <label className="dash-form-label">Email (opcional)</label>
                                    <input
                                        type="email"
                                        className="dash-form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="ana@ejemplo.com"
                                    />
                                </div>
                                <div className="dash-form-group">
                                    <label className="dash-form-label">Teléfono (opcional)</label>
                                    <input
                                        type="text"
                                        className="dash-form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+54 11 ..."
                                    />
                                </div>
                                <div className="dash-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        id="instructor-active"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        style={{ width: '1.2rem', height: '1.2rem', accentColor: '#a855f7' }}
                                    />
                                    <label htmlFor="instructor-active" className="dash-form-label" style={{ margin: 0 }}>Instructor activo</label>
                                </div>
                            </div>
                            <div className="dash-modal-footer">
                                <button type="button" onClick={handleCloseModal} className="dash-btn-ghost">Cancelar</button>
                                <button type="submit" disabled={loading} className="dash-btn-primary">
                                    {loading ? 'Guardando...' : (editingInstructor ? 'Actualizar' : 'Crear')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInstructors;
