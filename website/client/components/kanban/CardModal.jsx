'use client';
import { useState, useEffect, useRef } from 'react';
import { FileText, Trash2, Eye, Edit3, Calendar, CheckSquare, Plus, X } from 'lucide-react';
import Link from 'next/link';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import MarkdownRenderer from '../notes/MarkdownRenderer';
import NotePicker from '../notes/NotePicker';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { notesApi } from '@/lib/api/notesApi';
import { cn } from '@/lib/utils/cn';
import { timeAgo, toInputDateValue } from '@/lib/utils/formatDate';

const PRIORITIES = ['low', 'medium', 'high'];

export default function CardModal({ isOpen, onClose, card, onUpdate, onDelete }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [mode, setMode] = useState('edit');
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
    const [isNotePickerOpen, setIsNotePickerOpen] = useState(false);
    const [linkedNote, setLinkedNote] = useState(null);
    const [linkedNoteLoading, setLinkedNoteLoading] = useState(false);
    const [checklist, setChecklist] = useState([]);
    const [newItemText, setNewItemText] = useState('');
    const newItemRef = useRef(null);

    // Stable ref for onUpdate so it doesn't appear in debounce effect deps
    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;

    // Reset all local state when a DIFFERENT card is opened
    useEffect(() => {
        if (!card) return;
        setTitle(card.title ?? '');
        setDescription(card.description ?? '');
        setPriority(card.priority ?? 'medium');
        setDueDate(toInputDateValue(card.dueDate));
        setChecklist(card.checklist ?? []);
        setNewItemText('');
        setMode('edit');
        setSaveStatus('idle');
    }, [card?._id]); // Only re-run when the card ID changes, not on every card update

    // Fetch linked note title when linkedNoteId changes
    useEffect(() => {
        if (!card?.linkedNoteId) {
            setLinkedNote(null);
            return;
        }
        let cancelled = false;
        setLinkedNoteLoading(true);
        notesApi.getById(card.linkedNoteId)
            .then(res => { if (!cancelled) setLinkedNote(res.data); })
            .catch(() => { if (!cancelled) setLinkedNote(null); })
            .finally(() => { if (!cancelled) setLinkedNoteLoading(false); });
        return () => { cancelled = true; };
    }, [card?.linkedNoteId]);

    const debouncedTitle = useDebounce(title, 1000);
    const debouncedDesc = useDebounce(description, 1000);

    // Auto-save title + description after debounce
    useEffect(() => {
        if (!card || !isOpen) return;

        const hasTitleChanged = debouncedTitle !== (card.title ?? '');
        const hasDescChanged = debouncedDesc !== (card.description ?? '');
        if (!hasTitleChanged && !hasDescChanged) return;

        // Don't allow clearing a title that was previously set
        if (hasTitleChanged && debouncedTitle.trim() === '' && (card.title ?? '').trim() !== '') return;

        setSaveStatus('saving');
        onUpdateRef.current(card._id, { title: debouncedTitle, description: debouncedDesc })
            .then(() => {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 2000);
            })
            .catch(() => setSaveStatus('error'));

    // Intentionally NOT including onUpdate — we use onUpdateRef to keep it stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedTitle, debouncedDesc, card?._id, isOpen]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handlePriorityChange = (p) => {
        setPriority(p);
        onUpdate(card._id, { priority: p });
    };

    const handleDueDateChange = (e) => {
        const val = e.target.value; // 'YYYY-MM-DD' or ''
        setDueDate(val);
        onUpdate(card._id, { dueDate: val ? new Date(val).toISOString() : null });
    };

    const handleLinkNote = (note) => {
        onUpdate(card._id, { linkedNoteId: note._id });
    };

    const handleUnlinkNote = () => {
        setLinkedNote(null);
        onUpdate(card._id, { linkedNoteId: null });
    };

    const handleChecklistToggle = (index) => {
        const updated = checklist.map((item, i) =>
            i === index ? { ...item, completed: !item.completed } : item
        );
        setChecklist(updated);
        onUpdate(card._id, { checklist: updated });
    };

    const handleChecklistAdd = () => {
        const text = newItemText.trim();
        if (!text) return;
        const updated = [...checklist, { text, completed: false }];
        setChecklist(updated);
        setNewItemText('');
        onUpdate(card._id, { checklist: updated });
        newItemRef.current?.focus();
    };

    const handleChecklistDelete = (index) => {
        const updated = checklist.filter((_, i) => i !== index);
        setChecklist(updated);
        onUpdate(card._id, { checklist: updated });
    };

    const handleNewItemKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleChecklistAdd(); }
    };

    const handleDelete = () => {
        if (confirm('Delete this card? This cannot be undone.')) {
            onDelete(card._id);
        }
    };

    if (!card) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Task Detail">
            <div className="space-y-5">

                {/* Title */}
                <section>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase">Title</label>
                        {saveStatus === 'saving' && (
                            <span className="text-[10px] text-text-muted animate-pulse">Saving…</span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="text-[10px] text-green-400">Saved ✓</span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="text-[10px] text-red-400">Save failed</span>
                        )}
                    </div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                </section>

                {/* Priority */}
                <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Priority</label>
                    <div className="flex gap-2">
                        {PRIORITIES.map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePriorityChange(p)}
                                className={cn(
                                    'flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-all',
                                    priority === p
                                        ? p === 'low'
                                            ? 'bg-green-500/20 border-green-500 text-green-400'
                                            : p === 'medium'
                                                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                                : 'bg-red-500/20 border-red-500 text-red-400'
                                        : 'bg-surface-overlay border-border-default text-text-secondary hover:border-border-strong'
                                )}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Due Date */}
                <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" /> Due Date
                        </span>
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={handleDueDateChange}
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                </section>

                {/* Description */}
                <section>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase">Description</label>
                        <div className="flex bg-surface-overlay rounded-md p-0.5 border border-border-default">
                            <button
                                onClick={() => setMode('edit')}
                                className={cn(
                                    'px-2 py-0.5 text-[10px] rounded flex items-center gap-1 transition-colors',
                                    mode === 'edit' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                                )}
                            >
                                <Edit3 className="w-2.5 h-2.5" /> Edit
                            </button>
                            <button
                                onClick={() => setMode('preview')}
                                className={cn(
                                    'px-2 py-0.5 text-[10px] rounded flex items-center gap-1 transition-colors',
                                    mode === 'preview' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                                )}
                            >
                                <Eye className="w-2.5 h-2.5" /> Preview
                            </button>
                        </div>
                    </div>
                    {mode === 'edit' ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a detailed description (markdown supported)…"
                            className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[120px] resize-none font-mono"
                        />
                    ) : (
                        <div className="min-h-[120px] p-3 bg-surface-overlay/30 border border-border-subtle rounded-md">
                            {description ? (
                                <MarkdownRenderer content={description} />
                            ) : (
                                <p className="text-sm text-text-muted italic">No description</p>
                            )}
                        </div>
                    )}
                </section>

                {/* Checklist */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-text-muted uppercase flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5" />
                            Checklist
                            {checklist.length > 0 && (
                                <span className="text-text-muted font-normal">
                                    {checklist.filter(i => i.completed).length}/{checklist.length}
                                </span>
                            )}
                        </label>
                    </div>

                    {/* Progress bar */}
                    {checklist.length > 0 && (
                        <div className="mb-3 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100)}%`,
                                    backgroundColor: checklist.every(i => i.completed) ? '#4ade80' : '#818cf8',
                                }}
                            />
                        </div>
                    )}

                    {/* Items */}
                    <div className="space-y-1 mb-2">
                        {checklist.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 group px-1 py-0.5 rounded hover:bg-surface-overlay/50">
                                <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => handleChecklistToggle(idx)}
                                    className="accent-accent w-3.5 h-3.5 shrink-0 cursor-pointer"
                                />
                                <span className={cn(
                                    'text-sm flex-1',
                                    item.completed ? 'line-through text-text-muted' : 'text-text-primary'
                                )}>
                                    {item.text}
                                </span>
                                <button
                                    onClick={() => handleChecklistDelete(idx)}
                                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add new item */}
                    <div className="flex items-center gap-2">
                        <input
                            ref={newItemRef}
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={handleNewItemKeyDown}
                            placeholder="Add an item…"
                            className="flex-1 bg-surface-overlay border border-border-default rounded-md px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                        />
                        <button
                            onClick={handleChecklistAdd}
                            disabled={!newItemText.trim()}
                            className="p-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </section>

                {/* Linked Note */}
                <section className="bg-surface-base/50 p-4 rounded-lg border border-border-subtle">
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Linked Note</label>
                    {card.linkedNoteId ? (
                        <div className="flex items-center justify-between p-2 bg-accent/5 border border-accent/20 rounded-md">
                            <Link
                                href="/notes"
                                onClick={onClose}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
                            >
                                <FileText className="w-4 h-4 text-accent shrink-0" />
                                <span className="text-sm font-medium text-accent truncate">
                                    {linkedNoteLoading ? 'Loading…' : linkedNote?.title || 'Linked Note'}
                                </span>
                            </Link>
                            <button
                                onClick={handleUnlinkNote}
                                className="text-xs text-text-muted hover:text-red-400 transition-colors shrink-0 ml-2"
                            >
                                Unlink
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsNotePickerOpen(true)}
                            className="w-full py-2 border border-dashed border-border-default rounded-md text-xs text-text-muted hover:text-text-primary hover:border-accent transition-all"
                        >
                            + Link to a Note
                        </button>
                    )}
                </section>

                <NotePicker
                    isOpen={isNotePickerOpen}
                    onClose={() => setIsNotePickerOpen(false)}
                    onSelect={handleLinkNote}
                />

                {/* Footer */}
                <section className="pt-4 border-t border-border-subtle flex items-center justify-between">
                    <button
                        onClick={handleDelete}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Card
                    </button>
                    <span className="text-[10px] text-text-muted italic">
                        Updated {timeAgo(card.updatedAt)}
                    </span>
                </section>
            </div>
        </Modal>
    );
}
