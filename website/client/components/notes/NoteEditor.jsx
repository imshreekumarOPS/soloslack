'use client';
import { useState, useEffect, useCallback } from 'react';
import { useNotes } from '@/context/NotesContext';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { timeAgo } from '@/lib/utils/formatDate';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '@/lib/utils/cn';

export default function NoteEditor() {
    const { activeNote, updateNote, deleteNote } = useNotes();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [mode, setMode] = useState('edit'); // 'edit' or 'preview'
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved'

    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title);
            setBody(activeNote.body);
            setSaveStatus('idle');
        }
    }, [activeNote]);

    const debouncedTitle = useDebounce(title, 1500);
    const debouncedBody = useDebounce(body, 1500);

    const handleAutoSave = useCallback(async () => {
        if (!activeNote) return;
        if (debouncedTitle === activeNote.title && debouncedBody === activeNote.body) return;

        setSaveStatus('saving');
        try {
            await updateNote(activeNote._id, { title: debouncedTitle, body: debouncedBody });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            setSaveStatus('error');
            console.error(err);
        }
    }, [debouncedTitle, debouncedBody, activeNote, updateNote]);

    useEffect(() => {
        handleAutoSave();
    }, [debouncedTitle, debouncedBody, handleAutoSave]);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this note?')) {
            deleteNote(activeNote._id);
        }
    };

    if (!activeNote) return null;

    return (
        <div className="flex flex-col h-full bg-surface-base">
            <header className="h-14 border-b border-border-subtle px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-text-muted">
                        Updated {timeAgo(activeNote.updatedAt)}
                    </span>
                    {saveStatus === 'saving' && (
                        <span className="text-[10px] text-text-muted animate-pulse">Saving...</span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-[10px] text-success">Saved ✓</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-surface-overlay rounded-md p-1 border border-border-default mr-4">
                        <button
                            onClick={() => setMode('edit')}
                            className={cn(
                                "px-3 py-1 text-xs rounded-sm transition-colors",
                                mode === 'edit' ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => setMode('preview')}
                            className={cn(
                                "px-3 py-1 text-xs rounded-sm transition-colors",
                                mode === 'preview' ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            Preview
                        </button>
                    </div>

                    <button
                        onClick={handleDelete}
                        className="p-1.5 rounded-md text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Delete Note"
                    >
                        🗑
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                {mode === 'edit' ? (
                    <div className="space-y-6 h-full flex flex-col">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Note Title"
                            className="text-3xl font-bold bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted w-full"
                        />
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write in markdown..."
                            className="flex-1 min-h-[500px] bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted w-full resize-none font-sans text-md leading-relaxed"
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold text-text-primary">{title || 'Untitled'}</h1>
                        <MarkdownRenderer content={body} />
                    </div>
                )}

                {/* Linked Cards Section */}
                {activeNote.linkedCards?.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-border-subtle">
                        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Linked Kanban Cards</h3>
                        <div className="flex flex-wrap gap-3">
                            {activeNote.linkedCards.map(cardId => (
                                <div key={cardId} className="px-3 py-2 bg-surface-raised border border-border-subtle rounded-lg text-xs flex items-center gap-2">
                                    <span className="text-md">■</span>
                                    <span className="text-text-primary">{cardId}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
