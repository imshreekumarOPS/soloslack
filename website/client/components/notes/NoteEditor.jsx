'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotes } from '@/context/NotesContext';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { timeAgo } from '@/lib/utils/formatDate';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '@/lib/utils/cn';
import CardPicker from '../kanban/CardPicker';
import { cardsApi } from '@/lib/api/cardsApi';
import { notesApi } from '@/lib/api/notesApi';
import { Link as LinkIcon, Trash2, Square, Save } from 'lucide-react';

export default function NoteEditor() {
    const { activeNote, updateNote, deleteNote } = useNotes();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [mode, setMode] = useState('edit'); // 'edit' or 'preview'
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved'
    const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);

    // Track content in refs to prevent closure staleness during note switches
    const contentRef = useRef({ title: '', body: '' });
    const activeNoteIdRef = useRef(activeNote?._id);

    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title || '');
            setBody(activeNote.body || '');
            contentRef.current = { title: activeNote.title || '', body: activeNote.body || '' };
            activeNoteIdRef.current = activeNote._id;
            setSaveStatus('idle');
        }
    }, [activeNote?._id]); // Only reset when ID changes

    // Update ref whenever state changes
    useEffect(() => {
        contentRef.current = { title, body };
    }, [title, body]);

    const debouncedTitle = useDebounce(title, 1500);
    const debouncedBody = useDebounce(body, 1500);

    const handleAutoSave = useCallback(async () => {
        // Prevent race condition: ensure we are saving the note that matches the content
        if (!activeNote || activeNoteIdRef.current !== activeNote._id) return;
        
        const hasChanged = debouncedTitle !== activeNote.title || debouncedBody !== activeNote.body;
        if (!hasChanged) return;

        if (!debouncedTitle.trim()) {
            setSaveStatus('error');
            return;
        }

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

    // Immediate save on note switch or unmount
    useEffect(() => {
        const currentId = activeNote?._id;
        const initialTitle = activeNote?.title;
        const initialBody = activeNote?.body;

        return () => {
            // Check if there are unsaved changes on unmount/switch
            if (currentId && (contentRef.current.title !== initialTitle || contentRef.current.body !== initialBody)) {
                // If title is empty, we don't save to avoid breaking validation
                if (contentRef.current.title.trim()) {
                    updateNote(currentId, { 
                        title: contentRef.current.title, 
                        body: contentRef.current.body 
                    });
                }
            }
        };
    }, [activeNote?._id, updateNote]); // Critical: dependency is ID, cleanup handles the save

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this note?')) {
            deleteNote(activeNote._id);
        }
    };

    const handleLinkCard = async (card) => {
        try {
            await cardsApi.update(card._id, { linkedNoteId: activeNote._id });
            // Re-fetch the note to update linkedCards list
            const res = await notesApi.getById(activeNote._id);
            // We use setActiveNote from context to update the UI
            // But activeNote is managed by context, so we should probably call a refresh function if it existed
            // For now, let's just trigger a "dummy" update that includes the current title to avoid validation error
            await updateNote(activeNote._id, { title: activeNote.title });
        } catch (err) {
            console.error('Failed to link card:', err);
        }
    };

    const handleManualSave = async () => {
        if (!activeNote || !title.trim()) return;
        setSaveStatus('saving');
        try {
            await updateNote(activeNote._id, { title, body });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            setSaveStatus('error');
            console.error(err);
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

                    <button
                        onClick={() => setIsCardPickerOpen(true)}
                        className="ml-4 text-[10px] bg-accent/10 text-accent hover:bg-accent/20 px-2 py-1 rounded transition-colors font-bold flex items-center gap-1.5"
                    >
                        <LinkIcon className="w-3.5 h-3.5" /> Link Card
                    </button>
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
                        onClick={handleManualSave}
                        className="p-1.5 rounded-md text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Save Note"
                    >
                        <Save className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleDelete}
                        className="p-1.5 rounded-md text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Delete Note"
                    >
                        <Trash2 className="w-4 h-4" />
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
                <div className="mt-12 pt-8 border-t border-border-subtle">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Linked Kanban Cards</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {activeNote.linkedCards?.length > 0 ? (
                            activeNote.linkedCards.map(cardId => (
                                <div key={cardId} className="px-3 py-2 bg-surface-raised border border-border-subtle rounded-lg text-xs flex items-center gap-2">
                                    <Square className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                                    <span className="text-text-primary text-[10px] truncate max-w-[150px]">{cardId}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-text-muted italic">No cards linked yet</p>
                        )}
                    </div>
                </div>
            </div>

            <CardPicker
                isOpen={isCardPickerOpen}
                onClose={() => setIsCardPickerOpen(false)}
                onSelect={handleLinkCard}
            />
        </div>
    );
}
