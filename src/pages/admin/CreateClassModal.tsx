import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface CreateClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateClassModal = ({ isOpen, onClose, onSuccess }: CreateClassModalProps) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        class_date: '',
        start_time: '',
        end_time: '',
        max_capacity: 10,
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('classes').insert([formData]);

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
            });
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
