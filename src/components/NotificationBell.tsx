import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrentTenantId } from '../lib/tenant';
import '../styles/notifications.css';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read_at: string | null;
    created_at: string;
}

const NotificationBell = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!user) return;

        const tenantId = getCurrentTenantId();
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read_at).length);
        }
    };

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;

        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', user?.id)
            .is('read_at', null);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        }
    };

    const deleteNotification = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.filter(n => n.id !== id));
            // Recalculate unread if necessary
            setUnreadCount(prev => notifications.find(n => n.id === id && !n.read_at) ? Math.max(0, prev - 1) : prev);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        // Handle click outside to close
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user]);

    return (
        <div className="notif-bell-container" ref={dropdownRef}>
            <button
                className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Notificaciones"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notif-dropdown">
                    <div className="notif-header">
                        <h3>Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="notif-read-all">
                                Marcar todo como leído
                            </button>
                        )}
                    </div>

                    <div className="notif-list">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">
                                No tienes notificaciones
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`notif-item ${!n.read_at ? 'unread' : ''}`}>
                                    <div className="notif-content">
                                        <p className="notif-title">{n.title}</p>
                                        <p className="notif-message">{n.message}</p>
                                        <div className="notif-footer">
                                            <span className="notif-time">
                                                <Clock size={10} style={{ marginRight: '4px' }} />
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="notif-actions">
                                        {!n.read_at && (
                                            <button onClick={() => markAsRead(n.id)} className="notif-action-btn read" title="Marcar como leída">
                                                <Check size={14} />
                                            </button>
                                        )}
                                        <button onClick={() => deleteNotification(n.id)} className="notif-action-btn delete" title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
