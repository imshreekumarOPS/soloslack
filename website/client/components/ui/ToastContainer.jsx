'use client';
import { useUndo } from '@/context/UndoContext';
import { useEffect, useState } from 'react';

const TOAST_DURATION = 5000;

const TOAST_STYLES = {
    error:   { icon: '✕', barColor: 'bg-red-500',    iconColor: 'text-red-400',    borderColor: 'border-red-500/30' },
    success: { icon: '✓', barColor: 'bg-green-500',  iconColor: 'text-green-400',  borderColor: 'border-green-500/30' },
    info:    { icon: 'ℹ', barColor: 'bg-blue-500',   iconColor: 'text-blue-400',   borderColor: 'border-blue-500/30' },
    undo:    { icon: '↩', barColor: 'bg-accent',     iconColor: 'text-accent',     borderColor: 'border-border-default' },
};

function Toast({ toast, onUndo, onDismiss }) {
    const [progress, setProgress] = useState(100);
    const [undoing, setUndoing] = useState(false);

    const isNotification = toast.isNotification;
    const style = TOAST_STYLES[toast.type] || TOAST_STYLES.undo;

    useEffect(() => {
        const startTime = toast.timestamp;
        let raf;

        const tick = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
            setProgress(remaining);
            if (remaining > 0) {
                raf = requestAnimationFrame(tick);
            }
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [toast.timestamp]);

    const handleUndo = async () => {
        setUndoing(true);
        await onUndo(toast.id);
    };

    return (
        <div className={`relative overflow-hidden rounded-lg border ${style.borderColor} bg-surface-raised shadow-lg min-w-[320px] max-w-[420px] animate-slide-up`}>
            <div className="flex items-center gap-3 px-4 py-3">
                <span className={`text-base font-bold shrink-0 ${style.iconColor}`}>
                    {style.icon}
                </span>
                <span className="text-sm text-text-primary flex-1">
                    {toast.label}
                </span>
                {!isNotification && (
                    <button
                        onClick={handleUndo}
                        disabled={undoing}
                        className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors disabled:opacity-50 shrink-0"
                    >
                        {undoing ? 'Undoing...' : 'Undo'}
                    </button>
                )}
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="text-text-muted hover:text-text-secondary transition-colors shrink-0 ml-1"
                    aria-label="Dismiss"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 1l12 12M13 1L1 13" />
                    </svg>
                </button>
            </div>
            {/* Countdown bar */}
            <div className="h-0.5 bg-surface-overlay">
                <div
                    className={`h-full ${style.barColor} transition-none`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

export default function ToastContainer() {
    const { toasts, undoAction, dismissToast } = useUndo();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast
                        toast={toast}
                        onUndo={undoAction}
                        onDismiss={dismissToast}
                    />
                </div>
            ))}
        </div>
    );
}
