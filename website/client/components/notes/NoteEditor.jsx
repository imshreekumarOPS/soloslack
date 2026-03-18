'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNotes } from '@/context/NotesContext';

// Replace [[Title]] with [Title](wiki://id) for rendering; unresolved → wiki://unresolved
function preprocessWikiLinks(content, notes) {
    if (!content || !notes?.length) return content;
    return content.replace(/\[\[([^\][\n]+)\]\]/g, (match, title) => {
        const note = notes.find(n => n.title?.toLowerCase() === title.trim().toLowerCase());
        return note
            ? `[${title}](wiki://${note._id})`
            : `[${title}](wiki://unresolved)`;
    });
}
import { timeAgo } from '@/lib/utils/formatDate';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '@/lib/utils/cn';
import CardPicker from '../kanban/CardPicker';
import { cardsApi } from '@/lib/api/cardsApi';
import { Link as LinkIcon, Trash2, Save, Pin, PinOff, Eye, Edit3, X, Hash, Download, Maximize2, Minimize2 } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

// Deterministic tag color from a fixed palette
const TAG_PALETTE = [
    { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', color: '#818cf8' },
    { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.35)',  color: '#4ade80' },
    { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)', color: '#a78bfa' },
    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#fbbf24' },
    { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.35)', color: '#f472b6' },
    { bg: 'rgba(6,182,212,0.15)',  border: 'rgba(6,182,212,0.35)',  color: '#22d3ee' },
    { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)', color: '#fb923c' },
    { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.35)', color: '#2dd4bf' },
];

function getTagStyle(tag) {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) | 0;
    const c = TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
    return { backgroundColor: c.bg, borderColor: c.border, color: c.color };
}

const SAVE_DELAY_MS = 1500;

const PRIORITY_DOT = {
    high: 'bg-red-400',
    medium: 'bg-amber-400',
    low: 'bg-green-400',
};

export default function NoteEditor() {
    const { notes, activeNote, setActiveNote, updateNote, deleteNote, refreshActiveNote } = useNotes();
    const { focusMode, setFocusMode } = useSettings();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
    const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);

    // Wiki autocomplete
    const [wikiQuery, setWikiQuery] = useState(null); // null = closed
    const [wikiPickerPos, setWikiPickerPos] = useState({ top: 0, left: 0 });
    const [wikiSelectedIdx, setWikiSelectedIdx] = useState(0);
    const textareaRef = useRef(null);

    // Refs give closures stable access to the latest values without causing re-renders
    const titleRef = useRef('');
    const bodyRef = useRef('');
    const noteIdRef = useRef(null);
    // Tracks the content we last successfully saved to the server
    const savedRef = useRef({ title: '', body: '' });
    const saveTimerRef = useRef(null);

    // Keep refs in sync with current state
    titleRef.current = title;
    bodyRef.current = body;

    const performSave = useCallback(async (id, t, b) => {
        setSaveStatus('saving');
        try {
            await updateNote(id, { title: t, body: b });
            savedRef.current = { title: t, body: b };
            setSaveStatus('saved');
            // Clear 'saved' indicator after 2s, but only if nothing else changed it
            setTimeout(() => setSaveStatus(s => (s === 'saved' ? 'idle' : s)), 2000);
        } catch {
            setSaveStatus('error');
        }
    }, [updateNote]);

    // Reset editor state when the active note changes
    useEffect(() => {
        if (!activeNote) return;

        // Before switching: flush pending auto-save for the previous note
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }

        const prevId = noteIdRef.current;
        if (prevId && prevId !== activeNote._id) {
            const t = titleRef.current;
            const b = bodyRef.current;
            const hasUnsaved = t !== savedRef.current.title || b !== savedRef.current.body;
            if (hasUnsaved) {
                // Fire-and-forget: save previous note before switching
                updateNote(prevId, { title: t, body: b });
            }
        }

        // Initialize editor with the new note's content
        setTitle(activeNote.title || '');
        setBody(activeNote.body || '');
        setTags(activeNote.tags || []);
        setTagInput('');
        setMode('edit');
        setSaveStatus('idle');
        noteIdRef.current = activeNote._id;
        savedRef.current = { title: activeNote.title || '', body: activeNote.body || '' };
    }, [activeNote?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Schedule auto-save whenever title or body changes
    useEffect(() => {
        if (!noteIdRef.current) return;

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(() => {
            const t = titleRef.current;
            const b = bodyRef.current;
            const id = noteIdRef.current;
            if (!id) return;
            const hasChanged = t !== savedRef.current.title || b !== savedRef.current.body;
            if (hasChanged) performSave(id, t, b);
        }, SAVE_DELAY_MS);

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [title, body]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleManualSave = async () => {
        if (!activeNote) return;
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        await performSave(activeNote._id, title, body);
    };

    const handleDelete = () => {
        if (confirm('Delete this note? This cannot be undone.')) {
            deleteNote(activeNote._id);
        }
    };

    const handleLinkCard = async (card) => {
        try {
            await cardsApi.update(card._id, { linkedNoteId: activeNote._id });
            await refreshActiveNote(activeNote._id);
        } catch (err) {
            console.error('Failed to link card:', err);
        }
    };

    const handleUnlinkCard = async (cardId) => {
        try {
            await cardsApi.update(cardId, { linkedNoteId: null });
            await refreshActiveNote(activeNote._id);
        } catch (err) {
            console.error('Failed to unlink card:', err);
        }
    };

    const handlePinToggle = async () => {
        if (!activeNote) return;
        await updateNote(activeNote._id, { isPinned: !activeNote.isPinned });
    };

    const handleExportMd = () => {
        if (!activeNote) return;
        const date = new Date(activeNote.updatedAt).toISOString().split('T')[0];
        const frontmatter = [
            '---',
            `title: "${title || 'Untitled'}"`,
            tags.length > 0 ? `tags: [${tags.map(t => `"${t}"`).join(', ')}]` : 'tags: []',
            `date: ${date}`,
            '---',
            '',
        ].join('\n');
        const content = frontmatter + (body || '');
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(title || 'untitled').replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Wiki link autocomplete ────────────────────────────────────────────────

    const wikiSuggestions = useMemo(() => {
        if (wikiQuery === null) return [];
        const q = wikiQuery.toLowerCase();
        return notes
            .filter(n => n._id !== activeNote?._id && n.title && n.title.toLowerCase().includes(q))
            .slice(0, 8);
    }, [wikiQuery, notes, activeNote]);

    const handleBodyChange = (e) => {
        const val = e.target.value;
        setBody(val);

        // Detect [[... before cursor (no newline, not yet closed)
        const pos = e.target.selectionStart;
        const before = val.slice(0, pos);
        const m = before.match(/\[\[([^\][\n]*)$/);
        if (m) {
            const rect = e.target.getBoundingClientRect();
            // Estimate caret line from scrollTop + lineHeight
            const lineHeight = 20;
            const lines = before.split('\n').length;
            const approxTop = rect.top + Math.min(lines * lineHeight, rect.height - 40) - e.target.scrollTop;
            setWikiPickerPos({ top: Math.min(approxTop + lineHeight, window.innerHeight - 240), left: rect.left + 16 });
            setWikiQuery(m[1]);
            setWikiSelectedIdx(0);
        } else {
            setWikiQuery(null);
        }
    };

    const insertWikiLink = (note) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const pos = ta.selectionStart;
        const before = body.slice(0, pos);
        const openIdx = before.lastIndexOf('[[');
        const newBody = body.slice(0, openIdx) + `[[${note.title}]]` + body.slice(pos);
        setBody(newBody);
        setWikiQuery(null);
        setTimeout(() => {
            ta.focus();
            const newPos = openIdx + note.title.length + 4;
            ta.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleTextareaKeyDown = (e) => {
        if (e.key === 'Escape' && wikiQuery === null && focusMode) {
            setFocusMode(false);
            return;
        }
        if (wikiQuery === null) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setWikiSelectedIdx(i => Math.min(i + 1, wikiSuggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setWikiSelectedIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && wikiSuggestions[wikiSelectedIdx]) {
            e.preventDefault();
            insertWikiLink(wikiSuggestions[wikiSelectedIdx]);
        } else if (e.key === 'Escape') {
            setWikiQuery(null);
        }
    };

    // Focus mode keyboard shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
                e.preventDefault();
                setFocusMode(f => !f);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [setFocusMode]);

    const handleWikiLink = (noteId) => {
        const target = notes.find(n => n._id === noteId);
        if (target) setActiveNote(target);
    };

    const handleAddTag = async (raw) => {
        const tag = raw.trim().toLowerCase().replace(/,/g, '');
        if (!tag || tags.includes(tag) || tag.length > 30) return;
        const newTags = [...tags, tag];
        setTags(newTags);
        setTagInput('');
        await updateNote(activeNote._id, { tags: newTags });
    };

    const handleRemoveTag = async (tag) => {
        const newTags = tags.filter(t => t !== tag);
        setTags(newTags);
        await updateNote(activeNote._id, { tags: newTags });
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag(tagInput);
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            handleRemoveTag(tags[tags.length - 1]);
        }
    };

    if (!activeNote) return null;

    return (
        <div className="flex flex-col h-full bg-surface-base">
            {/* Toolbar */}
            <header className="h-14 border-b border-border-subtle px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-text-muted shrink-0">
                        {timeAgo(activeNote.updatedAt)}
                    </span>
                    {/* Word count + reading time */}
                    {(() => {
                        const words = body.trim() ? body.trim().split(/\s+/).length : 0;
                        const mins = Math.max(1, Math.ceil(words / 200));
                        return (
                            <span className="text-[10px] text-text-muted shrink-0 hidden sm:inline">
                                {words.toLocaleString()} {words === 1 ? 'word' : 'words'} · {mins} min read
                            </span>
                        );
                    })()}
                    {saveStatus === 'saving' && (
                        <span className="text-[10px] text-text-muted animate-pulse shrink-0">Saving…</span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-[10px] text-green-400 shrink-0">Saved ✓</span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-[10px] text-red-400 shrink-0">Save failed</span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {/* Edit / Preview toggle */}
                    <div className="flex bg-surface-overlay rounded-md p-0.5 border border-border-default mr-2">
                        <button
                            onClick={() => setMode('edit')}
                            className={cn(
                                'px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-colors',
                                mode === 'edit'
                                    ? 'bg-accent text-white'
                                    : 'text-text-secondary hover:text-text-primary'
                            )}
                        >
                            <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                            onClick={() => setMode('preview')}
                            className={cn(
                                'px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-colors',
                                mode === 'preview'
                                    ? 'bg-accent text-white'
                                    : 'text-text-secondary hover:text-text-primary'
                            )}
                        >
                            <Eye className="w-3 h-3" /> Preview
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCardPickerOpen(true)}
                        className="p-1.5 rounded-md text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Link to a Kanban card"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handlePinToggle}
                        className={cn(
                            'p-1.5 rounded-md transition-colors',
                            activeNote.isPinned
                                ? 'text-accent bg-accent/10 hover:bg-accent/20'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        )}
                        title={activeNote.isPinned ? 'Unpin note' : 'Pin note'}
                    >
                        {activeNote.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={handleManualSave}
                        className="p-1.5 rounded-md text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Save now"
                    >
                        <Save className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleExportMd}
                        className="p-1.5 rounded-md text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Export as .md"
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleDelete}
                        className="p-1.5 rounded-md text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Delete note"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-border-subtle mx-1" />

                    <button
                        onClick={() => setFocusMode(f => !f)}
                        className={cn(
                            'p-1.5 rounded-md transition-colors',
                            focusMode
                                ? 'text-accent bg-accent/10 hover:bg-accent/20'
                                : 'text-text-secondary hover:text-accent hover:bg-accent/10'
                        )}
                        title={focusMode ? 'Exit focus mode (Esc)' : 'Focus mode (Ctrl+Shift+F)'}
                    >
                        {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </header>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                <div className={cn('p-8 mx-auto w-full transition-all duration-300', focusMode ? 'max-w-4xl' : 'max-w-3xl')}>
                    {mode === 'edit' ? (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Untitled"
                                className="text-3xl font-bold bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted w-full"
                            />
                            {/* Tag bar — edit mode */}
                            <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                                <Hash className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                {tags.map(tag => (
                                    <span
                                        key={tag}
                                        style={getTagStyle(tag)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:opacity-60 transition-opacity ml-0.5"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    onBlur={() => tagInput && handleAddTag(tagInput)}
                                    placeholder={tags.length === 0 ? 'Add tags…' : '+tag'}
                                    className="text-xs bg-transparent outline-none text-text-secondary placeholder:text-text-muted min-w-[70px]"
                                />
                            </div>
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={body}
                                    onChange={handleBodyChange}
                                    onKeyDown={handleTextareaKeyDown}
                                    placeholder="Write in markdown… use [[Note Title]] to link notes"
                                    className="w-full min-h-[60vh] bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted resize-none font-mono text-sm leading-relaxed"
                                />

                                {/* Wiki autocomplete picker */}
                                {wikiQuery !== null && wikiSuggestions.length > 0 && (
                                    <div
                                        className="fixed z-50 w-64 bg-surface-overlay border border-border-subtle rounded-xl shadow-2xl overflow-hidden"
                                        style={{ top: wikiPickerPos.top, left: wikiPickerPos.left }}
                                    >
                                        <p className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest border-b border-border-subtle bg-surface-base/60">
                                            Link note
                                        </p>
                                        {wikiSuggestions.map((n, i) => (
                                            <button
                                                key={n._id}
                                                onMouseDown={(e) => { e.preventDefault(); insertWikiLink(n); }}
                                                className={cn(
                                                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors border-b border-border-subtle/40',
                                                    i === wikiSelectedIdx ? 'bg-accent/10 text-accent' : 'text-text-primary hover:bg-surface-hover'
                                                )}
                                            >
                                                <span className="text-[10px] opacity-50">↗</span>
                                                <span className="truncate">{n.title}</span>
                                            </button>
                                        ))}
                                        <p className="px-3 py-1 text-[10px] text-text-muted">
                                            ↑↓ navigate · Enter select · Esc dismiss
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold text-text-primary">{title || 'Untitled'}</h1>
                            {/* Tag bar — preview mode */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                    {tags.map(tag => (
                                        <span
                                            key={tag}
                                            style={getTagStyle(tag)}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <MarkdownRenderer
                                content={preprocessWikiLinks(body, notes)}
                                onWikiLink={handleWikiLink}
                            />
                        </div>
                    )}

                    {/* Linked Cards */}
                    <div className="mt-16 pt-6 border-t border-border-subtle">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                                Linked Cards ({activeNote.linkedCards?.length ?? 0})
                            </h3>
                            <button
                                onClick={() => setIsCardPickerOpen(true)}
                                className="text-[10px] text-accent hover:text-accent/70 transition-colors"
                            >
                                + Link card
                            </button>
                        </div>

                        {activeNote.linkedCards?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {activeNote.linkedCards.map((card) => (
                                    <div
                                        key={card._id}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-lg text-xs group"
                                    >
                                        <span
                                            className={cn(
                                                'w-1.5 h-1.5 rounded-full shrink-0',
                                                PRIORITY_DOT[card.priority] ?? 'bg-text-muted'
                                            )}
                                        />
                                        <span className="text-text-primary truncate max-w-[160px]">
                                            {card.title}
                                        </span>
                                        {card.boardId?.name && (
                                            <span className="text-text-muted text-[9px] shrink-0">
                                                · {card.boardId.name}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleUnlinkCard(card._id)}
                                            className="ml-1 opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
                                            title="Unlink card"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
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
