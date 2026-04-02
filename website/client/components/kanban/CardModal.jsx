'use client';
import { useState, useEffect, useRef } from 'react';
import { FileText, Trash2, Eye, Edit3, Calendar, CheckSquare, Plus, X, Tag, MessageSquare, Pencil, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import MarkdownRenderer from '../notes/MarkdownRenderer';
import NotePicker from '../notes/NotePicker';
import ConfirmModal from '../ui/ConfirmModal';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { notesApi } from '@/lib/api/notesApi';
import { cardsApi } from '@/lib/api/cardsApi';
import { cn } from '@/lib/utils/cn';
import { timeAgo, toInputDateValue } from '@/lib/utils/formatDate';
import { LABEL_COLORS, getLabelColor } from '@/lib/utils/labelColors';
import { useAI } from '@/context/AIContext';
import { useUndo } from '@/context/UndoContext';
import { cardDescriptionPrompt } from '@/lib/ai/prompts';

const PRIORITIES = ['low', 'medium', 'high'];

export default function CardModal({ isOpen, onClose, card, onUpdate, onDelete }) {
    const { showToast } = useUndo();
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
    const [labels, setLabels] = useState([]);
    const [isLabelAdding, setIsLabelAdding] = useState(false);
    const [newLabelText, setNewLabelText] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('blue');
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentBody, setEditingCommentBody] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const newItemRef = useRef(null);
    const labelInputRef = useRef(null);
    const commentInputRef = useRef(null);

    const { askAI, isConfigured: aiConfigured } = useAI();

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
        setLabels(card.labels ?? []);
        setNewItemText('');
        setIsLabelAdding(false);
        setNewLabelText('');
        setNewLabelColor('blue');
        setMode('edit');
        setSaveStatus('idle');
    }, [card?._id]); // Only re-run when the card ID changes, not on every card update

    // Fetch comments when a card is opened
    useEffect(() => {
        if (!card?._id || !isOpen) {
            setComments([]);
            return;
        }
        let cancelled = false;
        setCommentsLoading(true);
        cardsApi.getComments(card._id)
            .then(res => { if (!cancelled) setComments(res.data); })
            .catch(() => { if (!cancelled) setComments([]); })
            .finally(() => { if (!cancelled) setCommentsLoading(false); });
        return () => { cancelled = true; };
    }, [card?._id, isOpen]);

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

    const handleLabelAdd = () => {
        const text = newLabelText.trim();
        if (!text || labels.length >= 6) return;
        const updated = [...labels, { text, color: newLabelColor }];
        setLabels(updated);
        setNewLabelText('');
        setNewLabelColor('blue');
        setIsLabelAdding(false);
        onUpdate(card._id, { labels: updated });
    };

    const handleLabelRemove = (index) => {
        const updated = labels.filter((_, i) => i !== index);
        setLabels(updated);
        onUpdate(card._id, { labels: updated });
    };

    const handleLabelKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleLabelAdd(); }
        if (e.key === 'Escape') { setIsLabelAdding(false); }
    };

    const handleCommentAdd = async () => {
        const body = newComment.trim();
        if (!body || !card) return;
        setNewComment('');
        try {
            const res = await cardsApi.createComment(card._id, body);
            setComments(prev => [res.data, ...prev]);
        } catch {
            setNewComment(body); // restore on failure
        }
    };

    const handleCommentUpdate = async (commentId) => {
        const body = editingCommentBody.trim();
        if (!body || !card) return;
        try {
            const res = await cardsApi.updateComment(card._id, commentId, body);
            setComments(prev => prev.map(c => c._id === commentId ? res.data : c));
            setEditingCommentId(null);
            setEditingCommentBody('');
        } catch { /* keep editing state on failure */ }
    };

    const handleCommentDelete = async (commentId) => {
        if (!card) return;
        setComments(prev => prev.filter(c => c._id !== commentId));
        try {
            await cardsApi.deleteComment(card._id, commentId);
        } catch {
            // Re-fetch on failure
            cardsApi.getComments(card._id).then(res => setComments(res.data)).catch(() => {});
        }
    };

    const handleGenerateDescription = async () => {
        if (!title.trim() || aiGenerating) return;
        setAiGenerating(true);
        try {
            const result = await askAI(cardDescriptionPrompt(title), { maxTokens: 1024 });
            const parsed = JSON.parse(result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
            const newDesc = parsed.description || '';
            const newChecklist = (parsed.checklist || []).map(text => ({ text: String(text).slice(0, 200), completed: false }));
            setDescription(newDesc);
            setChecklist(newChecklist);
            onUpdate(card._id, { description: newDesc, checklist: newChecklist });
        } catch (err) {
            showToast({ label: 'AI generation failed: ' + err.message, type: 'error' });
        } finally {
            setAiGenerating(false);
        }
    };

    const handleDelete = () => {
        setConfirmDelete(true);
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

                {/* Labels */}
                <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2 flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        Labels
                        {labels.length > 0 && (
                            <span className="text-text-muted font-normal">{labels.length}/6</span>
                        )}
                    </label>

                    {/* Existing labels */}
                    {labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {labels.map((label, i) => {
                                const c = getLabelColor(label.color);
                                return (
                                    <span
                                        key={i}
                                        className={cn(
                                            'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
                                            c.bg, c.text
                                        )}
                                    >
                                        {label.text}
                                        <button
                                            onClick={() => handleLabelRemove(i)}
                                            className="hover:opacity-70 transition-opacity"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Add label form */}
                    {isLabelAdding ? (
                        <div className="space-y-2 p-2 bg-surface-overlay/50 rounded-md border border-border-subtle">
                            <input
                                ref={labelInputRef}
                                type="text"
                                value={newLabelText}
                                onChange={(e) => setNewLabelText(e.target.value)}
                                onKeyDown={handleLabelKeyDown}
                                placeholder="Label name"
                                maxLength={30}
                                className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                                autoFocus
                            />
                            <div className="flex items-center gap-1.5">
                                {LABEL_COLORS.map((c) => (
                                    <button
                                        key={c.key}
                                        type="button"
                                        onClick={() => setNewLabelColor(c.key)}
                                        className={cn(
                                            'w-5 h-5 rounded-full transition-all',
                                            c.dot,
                                            newLabelColor === c.key
                                                ? 'ring-2 ring-offset-1 ring-offset-transparent ' + c.ring + ' scale-110'
                                                : 'opacity-50 hover:opacity-80'
                                        )}
                                        title={c.key}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleLabelAdd}
                                    disabled={!newLabelText.trim()}
                                    className="px-3 py-1 rounded-md bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 transition-colors disabled:opacity-30"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => setIsLabelAdding(false)}
                                    className="text-xs text-text-muted hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        labels.length < 6 && (
                            <button
                                onClick={() => setIsLabelAdding(true)}
                                className="text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add label
                            </button>
                        )
                    )}
                </section>

                {/* Description */}
                <section>
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-text-muted uppercase">Description</label>
                            {aiConfigured && (
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={aiGenerating || !title.trim()}
                                    title="Generate description with AI"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-30"
                                >
                                    <Sparkles className={cn('w-3 h-3', aiGenerating && 'animate-spin')} />
                                    {aiGenerating ? 'Generating...' : 'AI Generate'}
                                </button>
                            )}
                        </div>
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

                {/* Comments */}
                <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Comments
                        {comments.length > 0 && (
                            <span className="text-text-muted font-normal">{comments.length}</span>
                        )}
                    </label>

                    {/* New comment input */}
                    <div className="flex items-start gap-2 mb-3">
                        <textarea
                            ref={commentInputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentAdd(); }
                            }}
                            placeholder="Add a comment…"
                            rows={2}
                            className="flex-1 bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                        />
                        <button
                            onClick={handleCommentAdd}
                            disabled={!newComment.trim()}
                            className="p-2 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30 shrink-0 mt-0.5"
                            title="Post comment"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Comments list */}
                    {commentsLoading ? (
                        <p className="text-[10px] text-text-muted italic">Loading comments…</p>
                    ) : comments.length === 0 ? (
                        <p className="text-[10px] text-text-muted italic">No comments yet</p>
                    ) : (
                        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                            {comments.map(comment => (
                                <div
                                    key={comment._id}
                                    className="group bg-surface-overlay/50 border border-border-subtle rounded-md px-3 py-2"
                                >
                                    {editingCommentId === comment._id ? (
                                        <div className="space-y-1.5">
                                            <textarea
                                                value={editingCommentBody}
                                                onChange={(e) => setEditingCommentBody(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentUpdate(comment._id); }
                                                    if (e.key === 'Escape') { setEditingCommentId(null); }
                                                }}
                                                rows={2}
                                                className="w-full bg-surface-overlay border border-accent rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none resize-none"
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleCommentUpdate(comment._id)}
                                                    disabled={!editingCommentBody.trim()}
                                                    className="px-2.5 py-1 rounded-md bg-accent/20 text-accent text-[11px] font-medium hover:bg-accent/30 transition-colors disabled:opacity-30"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingCommentId(null)}
                                                    className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                                                {comment.body}
                                            </p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className="text-[10px] text-text-muted">
                                                    {timeAgo(comment.createdAt)}
                                                    {comment.updatedAt !== comment.createdAt && ' (edited)'}
                                                </span>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setEditingCommentId(comment._id); setEditingCommentBody(comment.body); }}
                                                        className="text-text-muted hover:text-accent transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCommentDelete(comment._id)}
                                                        className="text-text-muted hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
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

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => onDelete(card._id)}
                title="Delete Card"
                message="Delete this card? This cannot be undone."
                confirmText="Delete"
            />
        </Modal>
    );
}
