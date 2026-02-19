import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ============================================
   Types
   ============================================ */
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'default';
}

interface ToastContextValue {
    toast: {
        success: (message: string, duration?: number) => void;
        error: (message: string, duration?: number) => void;
        warning: (message: string, duration?: number) => void;
        info: (message: string, duration?: number) => void;
    };
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* ============================================
   Hook
   ============================================ */
export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

/* ============================================
   Icons by type
   ============================================ */
const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

/* ============================================
   Individual Toast Item
   ============================================ */
const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
        }, toast.duration);
        return () => clearTimeout(timer);
    }, [toast, onRemove]);

    const handleClose = () => {
        setExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    return (
        <div className={`toast-item toast-${toast.type} ${exiting ? 'toast-exit' : ''}`}>
            <div className="toast-icon">{icons[toast.type]}</div>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={handleClose}>
                <X size={14} />
            </button>
        </div>
    );
};

/* ============================================
   Confirm Dialog
   ============================================ */
const ConfirmDialog = ({
    options,
    onConfirm,
    onCancel,
}: {
    options: ConfirmOptions;
    onConfirm: () => void;
    onCancel: () => void;
}) => {
    const isDanger = options.variant === 'danger';

    return (
        <div className="toast-confirm-overlay" onClick={onCancel}>
            <div className="toast-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="toast-confirm-icon-wrap">
                    {isDanger ? (
                        <div className="toast-confirm-icon toast-confirm-icon-danger">
                            <AlertTriangle size={24} />
                        </div>
                    ) : (
                        <div className="toast-confirm-icon toast-confirm-icon-info">
                            <Info size={24} />
                        </div>
                    )}
                </div>
                <h3 className="toast-confirm-title">{options.title}</h3>
                <p className="toast-confirm-message">{options.message}</p>
                <div className="toast-confirm-actions">
                    <button className="toast-confirm-cancel" onClick={onCancel}>
                        {options.cancelText || 'Cancelar'}
                    </button>
                    <button
                        className={`toast-confirm-btn ${isDanger ? 'toast-confirm-btn-danger' : 'toast-confirm-btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {options.confirmText || 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ============================================
   Provider
   ============================================ */
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmState, setConfirmState] = useState<{
        options: ConfirmOptions;
        resolve: (value: boolean) => void;
    } | null>(null);

    const idRef = useRef(0);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string, duration: number = 3500) => {
        const id = `toast-${++idRef.current}`;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const toast = {
        success: (msg: string, dur?: number) => addToast('success', msg, dur),
        error: (msg: string, dur?: number) => addToast('error', msg, dur ?? 5000),
        warning: (msg: string, dur?: number) => addToast('warning', msg, dur),
        info: (msg: string, dur?: number) => addToast('info', msg, dur),
    };

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({ options, resolve });
        });
    }, []);

    const handleConfirmResolve = (value: boolean) => {
        confirmState?.resolve(value);
        setConfirmState(null);
    };

    return (
        <ToastContext.Provider value={{ toast, confirm }}>
            {children}

            {/* Toast container */}
            <div className="toast-container">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                ))}
            </div>

            {/* Confirm dialog */}
            {confirmState && (
                <ConfirmDialog
                    options={confirmState.options}
                    onConfirm={() => handleConfirmResolve(true)}
                    onCancel={() => handleConfirmResolve(false)}
                />
            )}
        </ToastContext.Provider>
    );
};
