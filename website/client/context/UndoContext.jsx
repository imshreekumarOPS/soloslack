'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const UndoContext = createContext(null);

const MAX_STACK_SIZE = 20;
const TOAST_DURATION = 5000; // 5 seconds

let nextId = 0;

export function UndoProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const stackRef = useRef([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
    }, []);

    const removeFromStack = useCallback((id) => {
        stackRef.current = stackRef.current.filter(a => a.id !== id);
    }, []);

    const pushUndo = useCallback(({ label, undo }) => {
        const id = ++nextId;
        const entry = { id, label, undo, timestamp: Date.now() };

        // Add to stack (most recent first)
        stackRef.current = [entry, ...stackRef.current].slice(0, MAX_STACK_SIZE);

        // Show toast
        setToasts(prev => [entry, ...prev]);

        // Auto-expire toast (stack entry remains for Ctrl+Z)
        timersRef.current[id] = setTimeout(() => {
            removeToast(id);
        }, TOAST_DURATION);

        return id;
    }, [removeToast]);

    /**
     * Show a simple notification toast (no undo).
     * @param {string} label - Message to display
     * @param {'error'|'success'|'info'} type - Toast type
     * @param {number} [duration] - Auto-dismiss in ms (default TOAST_DURATION)
     */
    const showToast = useCallback(({ label, type = 'info', duration = TOAST_DURATION }) => {
        const id = ++nextId;
        const entry = { id, label, type, timestamp: Date.now(), isNotification: true };

        setToasts(prev => [entry, ...prev]);

        timersRef.current[id] = setTimeout(() => {
            removeToast(id);
        }, duration);

        return id;
    }, [removeToast]);

    const undoAction = useCallback(async (id) => {
        let entry;
        if (id !== undefined) {
            entry = stackRef.current.find(a => a.id === id);
        } else {
            entry = stackRef.current[0]; // most recent
        }
        if (!entry) return false;

        try {
            await entry.undo();
            removeFromStack(entry.id);
            removeToast(entry.id);
            return true;
        } catch (err) {
            console.error('Undo failed:', err);
            removeFromStack(entry.id);
            removeToast(entry.id);
            return false;
        }
    }, [removeFromStack, removeToast]);

    const dismissToast = useCallback((id) => {
        removeToast(id);
    }, [removeToast]);

    return (
        <UndoContext.Provider value={{ toasts, pushUndo, showToast, undoAction, dismissToast }}>
            {children}
        </UndoContext.Provider>
    );
}

export const useUndo = () => {
    const context = useContext(UndoContext);
    if (!context) {
        return {
            toasts: [],
            pushUndo: () => {},
            showToast: () => {},
            undoAction: () => Promise.resolve(false),
            dismissToast: () => {},
        };
    }
    return context;
};
