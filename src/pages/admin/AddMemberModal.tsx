import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, User, Mail, Lock } from 'lucide-react';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddMemberModal = ({ isOpen, onClose, onSuccess }: AddMemberModalProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        start_date: new Date().toISOString().split('T')[0],
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Create a temporary Supabase client that doesn't persist the session
        // to avoid signing out the current admin user when calling signUp.
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        const { error: signUpError } = await tempSupabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.full_name,
                    start_date: formData.start_date,
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
        } else {
            onSuccess();
            onClose();
            setFormData({
                full_name: '',
                email: '',
                password: '',
                start_date: new Date().toISOString().split('T')[0],
            });
        }
        setLoading(false);
    };

    return (
        <div className="dash-modal-overlay">
            <div className="dash-modal">
                <div className="dash-modal-header">
                    <h2 className="dash-modal-title">Agregar Nuevo Miembro</h2>
                    <button onClick={onClose} className="dash-modal-close">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="dash-modal-body">
                        {error && (
                            <div className="auth-error" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>{error}</span>
                            </div>
                        )}

                        <div className="dash-form-group">
                            <label className="dash-form-label">Nombre Completo</label>
                            <div className="dash-input-with-icon">
                                <User size={16} className="dash-input-icon-left" />
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    className="dash-form-input dash-input-has-icon"
                                    placeholder="Ej: Juan Pérez"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="dash-form-group">
                            <label className="dash-form-label">Email</label>
                            <div className="dash-input-with-icon">
                                <Mail size={16} className="dash-input-icon-left" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="dash-form-input dash-input-has-icon"
                                    placeholder="email@ejemplo.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="dash-form-group">
                            <label className="dash-form-label">Contraseña</label>
                            <div className="dash-input-with-icon">
                                <Lock size={16} className="dash-input-icon-left" />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    className="dash-form-input dash-input-has-icon"
                                    placeholder="Mínimo 6 caracteres"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="dash-form-group">
                            <label className="dash-form-label">Fecha de Inicio</label>
                            <input
                                type="date"
                                name="start_date"
                                required
                                className="dash-form-input"
                                value={formData.start_date}
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
                            ) : 'Crear Miembro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;
