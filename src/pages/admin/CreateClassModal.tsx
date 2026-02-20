import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { withTenant, getCurrentTenantId } from '../../lib/tenant';
import { useEffect } from 'react';
import { ChevronDown, PlusCircle } from 'lucide-react';

interface CreateClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateClassModal = ({ isOpen, onClose, onSuccess }: CreateClassModalProps) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [instructors, setInstructors] = useState<{ id: string, name: string }[]>([]);
    const [isAddingInstructor, setIsAddingInstructor] = useState(false);
    const [newInstructorName, setNewInstructorName] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        class_date: '',
        start_time: '',
        end_time: '',
        max_capacity: 10,
        instructor_id: '',
        instructor_name: '', // Deprecated text field
    });

    const fetchInstructors = async () => {
        const { data } = await supabase
            .from('instructors')
            .select('id, name')
            .eq('tenant_id', getCurrentTenantId())
            .eq('active', true)
            .order('name', { ascending: true });
        if (data) setInstructors(data);
    };

    useEffect(() => {
        if (isOpen) fetchInstructors();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let instructorId = formData.instructor_id;

        // Create instructor inline if needed
        if (isAddingInstructor && newInstructorName.trim()) {
            const { data, error: instError } = await supabase
                .from('instructors')
                .insert([withTenant({ name: newInstructorName.trim() })])
                .select()
                .single();

            if (instError) {
                toast.error('Error al crear instructor: ' + instError.message);
                setLoading(false);
                return;
            }
            instructorId = data.id;
        }

        const { error } = await supabase.from('classes').insert([withTenant({
            ...formData,
            instructor_id: instructorId || null,
            instructor_name: isAddingInstructor ? newInstructorName : (instructors.find(i => i.id === instructorId)?.name || '')
        })]);

        if (error) {
            toast.error(error.message);
        } else {
            onSuccess();
            onClose();
            setFormData({
                title: '',
                description: '',
                class_date: '',
                start_time: '',
                end_time: '',
                max_capacity: 10,
                instructor_id: '',
                instructor_name: ''
            });
            setIsAddingInstructor(false);
            setNewInstructorName('');
        }
        setLoading(false);
    };

    return (
        <div className="dash-modal-overlay">
            <div className="dash-modal">
                <div className="dash-modal-header">
                    <h2 className="dash-modal-title">Crear Nueva Clase</h2>
                    <button onClick={onClose} className="dash-modal-close">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="dash-modal-body">
                        <div className="dash-form-group">
                            <label className="dash-form-label">Título</label>
                            <input
                                type="text"
                                name="title"
                                required
                                className="dash-form-input"
                                placeholder="Ej: Pilates Mat"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="dash-form-group">
                            <label className="dash-form-label">Descripción</label>
                            <textarea
                                name="description"
                                className="dash-form-textarea"
                                rows={2}
                                placeholder="Descripción de la clase..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="dash-form-group">
                            <label className="dash-form-label">Instructor</label>
                            {!isAddingInstructor ? (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div className="res-select-wrap" style={{ flex: 1 }}>
                                        <select
                                            name="instructor_id"
                                            className="dash-form-input"
                                            value={formData.instructor_id}
                                            onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                                        >
                                            <option value="">Seleccionar instructor...</option>
                                            {instructors.map(i => (
                                                <option key={i.id} value={i.id}>{i.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="res-select-arrow" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingInstructor(true)}
                                        className="dash-icon-btn dash-icon-btn-blue"
                                        title="Nuevo Instructor"
                                        style={{ height: '42px', width: '42px' }}
                                    >
                                        <PlusCircle size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="dash-form-input"
                                        placeholder="Nombre del nuevo instructor"
                                        value={newInstructorName}
                                        onChange={(e) => setNewInstructorName(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingInstructor(false)}
                                        className="dash-icon-btn dash-icon-btn-red"
                                        title="Cancelar"
                                        style={{ height: '42px', width: '42px' }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="dash-form-group">
                            <label className="dash-form-label">Fecha</label>
                            <input
                                type="date"
                                name="class_date"
                                required
                                className="dash-form-input"
                                value={formData.class_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="dash-form-row">
                            <div className="dash-form-group">
                                <label className="dash-form-label">Hora Inicio</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    required
                                    className="dash-form-input"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="dash-form-group">
                                <label className="dash-form-label">Hora Fin</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    required
                                    className="dash-form-input"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="dash-form-group">
                            <label className="dash-form-label">Capacidad</label>
                            <input
                                type="number"
                                name="max_capacity"
                                min="1"
                                required
                                className="dash-form-input"
                                value={formData.max_capacity}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="dash-modal-footer">
                        <button type="button" onClick={onClose} className="dash-btn-ghost">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="dash-btn-primary">
                            {loading ? (
                                <>
                                    <div className="dash-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                                    Creando...
                                </>
                            ) : 'Crear Clase'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClassModal;
