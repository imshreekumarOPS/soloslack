'use client';
import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const GROUPS = [
    {
        label: 'Global',
        shortcuts: [
            { keys: ['?'], description: 'Open this shortcut reference' },
            { keys: ['⌘', 'K'], description: 'Open unified search' },
            { keys: ['Alt', 'N'], description: 'Create a new note' },
            { keys: ['Alt', 'B'], description: 'Create a new board' },
        ],
    },
    {
        label: 'Search',
        shortcuts: [
            { keys: ['↑', '↓'], description: 'Navigate results' },
            { keys: ['↵'], description: 'Open selected result' },
            { keys: ['Esc'], description: 'Close search' },
        ],
    },
    {
        label: 'Notes',
        shortcuts: [
            { keys: ['Enter'], description: 'Add tag (in tag input)' },
            { keys: [','], description: 'Add tag (in tag input)' },
            { keys: ['Backspace'], description: 'Remove last tag (when input is empty)' },
        ],
    },
    {
        label: 'Cards & Columns',
        shortcuts: [
            { keys: ['Enter'], description: 'Add checklist item / confirm rename' },
            { keys: ['Esc'], description: 'Cancel rename / WIP limit edit' },
        ],
    },
    {
        label: 'Kanban drag & drop',
        shortcuts: [
            { keys: ['Space'], description: 'Pick up / drop a card' },
            { keys: ['Arrow keys'], description: 'Move card while picked up' },
            { keys: ['Esc'], description: 'Cancel drag' },
        ],
    },
];

function Kbd({ children }) {
    return (
        <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-surface-raised border border-border-default text-[11px] font-mono text-text-secondary leading-none min-w-[22px]">
            {children}
        </kbd>
    );
}

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            onMouseDown={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                className="relative w-full max-w-lg bg-surface-overlay border border-border-subtle rounded-2xl shadow-2xl overflow-hidden"
                onMouseDown={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                    <div className="flex items-center gap-2.5">
                        <Keyboard className="w-4 h-4 text-accent" />
                        <h2 className="text-sm font-semibold text-text-primary">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Groups */}
                <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-5">
                    {GROUPS.map(group => (
                        <section key={group.label}>
                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">
                                {group.label}
                            </p>
                            <div className="space-y-1">
                                {group.shortcuts.map((s, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between gap-4 py-1.5 px-2 rounded-lg hover:bg-surface-hover transition-colors"
                                    >
                                        <span className="text-sm text-text-secondary">{s.description}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {s.keys.map((k, j) => (
                                                <Kbd key={j}>{k}</Kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border-subtle">
                    <p className="text-[10px] text-text-muted text-center">
                        Press <Kbd>?</Kbd> anywhere (outside an input) to toggle this panel
                    </p>
                </div>
            </div>
        </div>
    );
}
