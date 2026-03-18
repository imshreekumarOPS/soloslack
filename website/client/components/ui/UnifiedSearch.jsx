'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, FileText, LayoutDashboard, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/context/NotesContext';
import { cn } from '@/lib/utils/cn';

function getSnippet(text, query, maxLen = 90) {
    if (!text) return '';
    const t = text.trim();
    if (t.length <= maxLen) return t;
    const idx = t.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return t.substring(0, maxLen) + '…';
    const start = Math.max(0, idx - 30);
    const end = Math.min(t.length, start + maxLen);
    return (start > 0 ? '…' : '') + t.substring(start, end) + (end < t.length ? '…' : '');
}

export default function UnifiedSearch({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ notes: [], cards: [] });
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const router = useRouter();
    const { setActiveNote } = useNotes();

    // Reset + focus on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults({ notes: [], cards: [] });
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 40);
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults({ notes: [], cards: [] });
            return;
        }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const base = process.env.NEXT_PUBLIC_API_URL;
                const res = await fetch(`${base}/search?q=${encodeURIComponent(query.trim())}`);
                const data = await res.json();
                if (data.success) {
                    setResults(data.data);
                    setSelectedIndex(0);
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const allResults = [
        ...results.notes.map(n => ({ type: 'note', item: n })),
        ...results.cards.map(c => ({ type: 'card', item: c })),
    ];

    const handleSelect = useCallback((entry) => {
        if (entry.type === 'note') {
            setActiveNote(entry.item);
            router.push('/notes');
        } else {
            router.push(`/boards/${entry.item.boardId?._id}`);
        }
        onClose();
    }, [setActiveNote, router, onClose]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && allResults[selectedIndex]) {
            handleSelect(allResults[selectedIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh] px-4"
            onMouseDown={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-xl bg-surface-overlay border border-border-subtle rounded-2xl shadow-2xl overflow-hidden"
                onMouseDown={e => e.stopPropagation()}
            >
                {/* Input row */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
                    <Search className="w-4 h-4 text-text-muted shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search notes and cards…"
                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                    />
                    {loading && (
                        <span className="text-[10px] text-text-muted animate-pulse shrink-0">Searching…</span>
                    )}
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {!query.trim() && (
                        <p className="px-4 py-8 text-sm text-text-muted text-center">
                            Type to search across your notes and cards
                        </p>
                    )}

                    {query.trim() && !loading && allResults.length === 0 && (
                        <p className="px-4 py-8 text-sm text-text-muted text-center">
                            No results for &ldquo;{query}&rdquo;
                        </p>
                    )}

                    {results.notes.length > 0 && (
                        <section>
                            <p className="px-4 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest bg-surface-base/60 border-b border-border-subtle">
                                Notes
                            </p>
                            {results.notes.map((note, i) => (
                                <button
                                    key={note._id}
                                    onClick={() => handleSelect({ type: 'note', item: note })}
                                    className={cn(
                                        'w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border-subtle/40 transition-colors',
                                        selectedIndex === i ? 'bg-accent/10' : 'hover:bg-surface-hover'
                                    )}
                                >
                                    <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate">
                                            {note.title || 'Untitled'}
                                        </p>
                                        {note.body && (
                                            <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                                                {getSnippet(note.body, query)}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </section>
                    )}

                    {results.cards.length > 0 && (
                        <section>
                            <p className="px-4 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest bg-surface-base/60 border-b border-border-subtle">
                                Cards
                            </p>
                            {results.cards.map((card, i) => {
                                const globalIdx = results.notes.length + i;
                                return (
                                    <button
                                        key={card._id}
                                        onClick={() => handleSelect({ type: 'card', item: card })}
                                        className={cn(
                                            'w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border-subtle/40 transition-colors',
                                            selectedIndex === globalIdx ? 'bg-accent/10' : 'hover:bg-surface-hover'
                                        )}
                                    >
                                        <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">
                                                    {card.title}
                                                </p>
                                                {card.boardId?.name && (
                                                    <span className="text-[10px] text-text-muted shrink-0">
                                                        · {card.boardId.name}
                                                    </span>
                                                )}
                                            </div>
                                            {card.description && (
                                                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                                                    {getSnippet(card.description, query)}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </section>
                    )}
                </div>

                {/* Footer hints */}
                <div className="px-4 py-2 border-t border-border-subtle flex items-center gap-4 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-surface-raised border border-border-subtle font-mono">↑↓</kbd>
                        navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-surface-raised border border-border-subtle font-mono">↵</kbd>
                        open
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-surface-raised border border-border-subtle font-mono">Esc</kbd>
                        close
                    </span>
                </div>
            </div>
        </div>
    );
}
