import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Plus } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import { useToast } from '../../components/ui/Toast';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    active: boolean;
    start_date?: string;
}

interface AdminMembersProps {
    forceOpenAddModal?: boolean;
    onModalClose?: () => void;
}

const AdminMembers = ({ forceOpenAddModal, onModalClose }: AdminMembersProps) => {
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (forceOpenAddModal) {
            setIsModalOpen(true);
        }
    }, [forceOpenAddModal]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        if (onModalClose) onModalClose();
    };

    const fetchMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching members:', error);
        } else {
            setMembers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ active: !currentStatus })
            .eq('id', id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success(currentStatus ? 'Miembro desactivado.' : 'Miembro activado.');
            fetchMembers();
        }
    };

    if (loading && members.length === 0) {
        return (
            <div className="dash-loading">
                <div className="dash-spinner" />
                <span>Cargando miembros...</span>
            </div>
        );
    }

    return (
        <div>
            <div className="dash-section-header" style={{ marginBottom: '1rem' }}>
                <h2 className="dash-section-title">Miembros Registrados</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="dash-btn-primary"
                >
                    <Plus size={16} />
                    Agregar Miembro
                </button>

                <AddMemberModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSuccess={fetchMembers}
                />
            </div>
            <div className="dash-table-wrap">
                <table className="dash-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Rol</th>
                            <th>Fecha Inicio</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member) => (
                            <tr key={member.id}>
                                <td data-label="Nombre">
                                    <div className="dash-member-row">
                                        <div className="dash-avatar">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <div className="dash-member-name">
                                                {member.full_name || 'Sin nombre'}
                                            </div>
                                            <div className="dash-member-id">
                                                ID: {member.id.slice(0, 8)}…
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Rol">
                                    <span className={`dash-badge ${member.role === 'admin' ? 'dash-badge-purple' : 'dash-badge-gray'}`}>
                                        {member.role}
                                    </span>
                                </td>
                                <td data-label="Fecha Inicio">
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {member.start_date ? new Date(member.start_date).toLocaleDateString() : '—'}
                                    </span>
                                </td>
                                <td data-label="Estado">
                                    <span className={`dash-badge ${member.active ? 'dash-badge-green' : 'dash-badge-red'}`}>
                                        {member.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td data-label="Acciones">
                                    <button
                                        onClick={() => toggleStatus(member.id, member.active)}
                                        className={member.active ? 'dash-btn-danger' : 'dash-btn-primary'}
                                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
                                    >
                                        {member.active ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="dash-table-empty">
                                    No se encontraron miembros.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AddMemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchMembers}
            />
        </div>
    );
};

export default AdminMembers;
