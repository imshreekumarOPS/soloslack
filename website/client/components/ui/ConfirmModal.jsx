'use client';
import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title = 'Are you sure?', message, confirmText = 'Delete', cancelText = 'Cancel', variant = 'danger' }) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') { onConfirm(); onClose(); }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose, onConfirm]);

    if (!isOpen) return null;

    const btnColors = variant === 'danger'
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-accent hover:bg-accent/80 text-white';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-surface-raised border border-border-default rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent'}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
                            <p className="text-sm text-text-secondary mt-1">{message}</p>
                        </div>
                        <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-surface-hover shrink-0">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-5">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
                            {cancelText}
                        </button>
                        <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${btnColors}`}>
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
