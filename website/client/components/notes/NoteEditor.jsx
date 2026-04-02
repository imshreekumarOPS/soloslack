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
import { exportNoteToMarkdown, exportNoteToPdf } from '@/lib/utils/exportUtils';
import { Link as LinkIcon, Trash2, Save, Pin, PinOff, Eye, Edit3, X, Hash, Download, Maximize2, Minimize2, FileText, FileDown, Sparkles, ListChecks, Tags, Wand2, Type, ShrinkIcon, Expand, CheckCheck, Eraser, Send, MessageSquare, ExternalLink, File as FileIcon } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useAI } from '@/context/AIContext';
import { useUndo } from '@/context/UndoContext';
import { fileApi } from '@/lib/api/fileApi';
import { noteSummaryPrompt, autoTagPrompt, writingAssistantPrompt, noteToCardsPrompt } from '@/lib/ai/prompts';
import NoteToCardsModal from '../ai/NoteToCardsModal';
import ConfirmModal from '../ui/ConfirmModal';

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
    const { askAI, isConfigured: aiConfigured } = useAI();
    const { showToast } = useUndo();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
    const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // AI states
    const [aiLoading, setAiLoading] = useState(null); // 'summary' | 'tags' | 'writing' | 'prompt' | null
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [showNoteToCards, setShowNoteToCards] = useState(false);
    const [showAIMenu, setShowAIMenu] = useState(false);
    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const [aiPromptText, setAiPromptText] = useState('');
    const aiPromptInputRef = useRef(null);
    const previewRef = useRef(null);

    // File rendering states
    const [fileContent, setFileContent] = useState(null);
    const [fetchingContent, setFetchingContent] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Writing assistant
    const [writingSelection, setWritingSelection] = useState(null); // { start, end, text }
    const [showWritingMenu, setShowWritingMenu] = useState(false);
    const [writingMenuPos, setWritingMenuPos] = useState({ top: 0, left: 0 });

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
        setFileContent(null);
        setFetchingContent(false);
        setFetchError(null);
        noteIdRef.current = activeNote._id;
        savedRef.current = { title: activeNote.title || '', body: activeNote.body || '' };
    }, [activeNote?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch file content if activeNote is a renderable file
    useEffect(() => {
        if (!activeNote || activeNote.type !== 'file' || !activeNote.url) return;

        const renderableMimes = ['text/plain', 'text/markdown', 'application/octet-stream'];
        const isRenderable = renderableMimes.includes(activeNote.mimeType) || 
                            activeNote.name?.endsWith('.md') || 
                            activeNote.name?.endsWith('.txt');

        if (!isRenderable) return;

        const fetchContent = async () => {
            setFetchingContent(true);
            setFetchError(null);
            try {
                const content = await fileApi.fetchFileContent(activeNote.url);
                setFileContent(content);
            } catch (err) {
                console.error('Failed to fetch file content:', err);
                setFetchError('Failed to load file content. Please check your connection or CORS settings.');
            } finally {
                setFetchingContent(false);
            }
        };

        fetchContent();
    }, [activeNote?._id, activeNote?.url, activeNote?.type]);

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
        setConfirmDelete(true);
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
            // Clear the card's linkedNoteId; swallow 404 if card was already deleted
            await cardsApi.update(cardId, { linkedNoteId: null }).catch(() => {});
            // Refresh to recompute linkedCards (server-side query filters out deleted cards)
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
        exportNoteToMarkdown({ ...activeNote, title, body, tags });
        setShowExportMenu(false);
    };

    const handleExportPdf = () => {
        if (!activeNote) return;
        const renderedHtml = previewRef.current?.innerHTML || '';
        const result = exportNoteToPdf({ ...activeNote, title, body, tags }, renderedHtml);
        if (result === false) {
            showToast({ label: 'Please allow pop-ups to export as PDF', type: 'error' });
        }
        setShowExportMenu(false);
    };

    // ── AI: Smart Summary ─────────────────────────────────────────────────────
    const handleAISummary = async () => {
        if (!body.trim() || aiLoading) return;
        setAiLoading('summary');
        try {
            const result = await askAI(noteSummaryPrompt(title, body), { maxTokens: 512 });
            const summary = `> **AI Summary**\n${result.text.split('\n').map(l => `> ${l}`).join('\n')}\n\n`;
            setBody(summary + body);
        } catch (err) {
            showToast({ label: 'AI Summary failed: ' + err.message, type: 'error' });
        } finally {
            setAiLoading(null);
        }
    };

    // ── AI: Auto-tag ────────────────────────────────────────────────────────
    const handleAutoTag = async () => {
        if (!body.trim() || aiLoading) return;
        setAiLoading('tags');
        try {
            const result = await askAI(autoTagPrompt(title, body), { maxTokens: 100, temperature: 0.5 });
            const parsed = JSON.parse(result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
            if (Array.isArray(parsed)) {
                const newSuggestions = parsed
                    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
                    .filter(t => t && !tags.includes(t))
                    .slice(0, 3);
                setSuggestedTags(newSuggestions);
            }
        } catch (err) {
            showToast({ label: 'Auto-tag failed: ' + err.message, type: 'error' });
        } finally {
            setAiLoading(null);
        }
    };

    const handleAcceptTag = async (tag) => {
        const newTags = [...tags, tag];
        setTags(newTags);
        setSuggestedTags(prev => prev.filter(t => t !== tag));
        await updateNote(activeNote._id, { tags: newTags });
    };

    const handleDismissTag = (tag) => {
        setSuggestedTags(prev => prev.filter(t => t !== tag));
    };

    // ── AI: Writing Assistant ────────────────────────────────────────────────
    const handleTextSelect = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta || mode !== 'edit') return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        if (start === end) {
            setShowWritingMenu(false);
            setWritingSelection(null);
            return;
        }
        const text = body.slice(start, end);
        setWritingSelection({ start, end, text });

        // Position the floating menu near the selection
        const rect = ta.getBoundingClientRect();
        const lineHeight = 20;
        const beforeText = body.slice(0, start);
        const lines = beforeText.split('\n').length;
        const top = rect.top + Math.min(lines * lineHeight, rect.height - 40) - ta.scrollTop - 40;
        const left = rect.left + 16;
        setWritingMenuPos({ top: Math.max(top, rect.top - 40), left });
        setShowWritingMenu(true);
    }, [body, mode]);

    const handleWritingAction = async (action) => {
        if (!writingSelection || aiLoading) return;
        setShowWritingMenu(false);
        setAiLoading('writing');
        try {
            const result = await askAI(writingAssistantPrompt(writingSelection.text, action), { maxTokens: 1024 });
            const newBody = body.slice(0, writingSelection.start) + result.text + body.slice(writingSelection.end);
            setBody(newBody);
        } catch (err) {
            showToast({ label: 'Writing assistant failed: ' + err.message, type: 'error' });
        } finally {
            setAiLoading(null);
            setWritingSelection(null);
        }
    };

    // ── AI: Custom Prompt ──────────────────────────────────────────────────────
    const handleAIPromptSubmit = async () => {
        const prompt = aiPromptText.trim();
        if (!prompt || aiLoading) return;
        setAiLoading('prompt');
        try {
            const messages = [
                {
                    role: 'system',
                    content: 'You are a helpful AI assistant embedded in a note-taking app. The user may provide their note as context. Respond in markdown. Be concise and helpful.',
                },
            ];
            if (body.trim()) {
                messages.push({
                    role: 'user',
                    content: `Here is my current note for context:\n\nTitle: ${title}\n\n${body}\n\n---\n\n${prompt}`,
                });
            } else {
                messages.push({ role: 'user', content: prompt });
            }
            const result = await askAI(messages, { maxTokens: 1024 });
            setBody(prev => prev + `\n\n${result.text}`);
            setAiPromptText('');
            setShowAIPrompt(false);
        } catch (err) {
            showToast({ label: 'AI prompt failed: ' + err.message, type: 'error' });
        } finally {
            setAiLoading(null);
        }
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
                            <span className="text-[11px] text-text-muted shrink-0 hidden sm:inline">
                                {words.toLocaleString()} {words === 1 ? 'word' : 'words'} · {mins} min read
                            </span>
                        );
                    })()}
                    {saveStatus === 'saving' && (
                        <span className="text-[11px] text-text-muted animate-pulse shrink-0">Saving…</span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-[11px] text-green-400 shrink-0">Saved ✓</span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-[11px] text-red-400 shrink-0">Save failed</span>
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

                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(prev => !prev)}
                            className="p-1.5 rounded-md text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                            title="Export note"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        {showExportMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 bg-surface-overlay border border-border-subtle rounded-lg shadow-xl py-1 min-w-[170px] z-50">
                                    <button
                                        onClick={handleExportMd}
                                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center gap-2"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> Export as Markdown
                                    </button>
                                    <button
                                        onClick={handleExportPdf}
                                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center gap-2"
                                    >
                                        <FileDown className="w-3.5 h-3.5" /> Export as PDF
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* AI Actions Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => aiConfigured && setShowAIMenu(prev => !prev)}
                            className={cn(
                                'p-1.5 rounded-md transition-colors',
                                aiConfigured
                                    ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                                    : 'text-text-muted opacity-40 cursor-not-allowed'
                            )}
                            title={aiConfigured ? 'AI features' : 'Configure AI in Settings'}
                            disabled={!aiConfigured}
                        >
                            <Sparkles className={cn('w-4 h-4', aiLoading && 'animate-spin')} />
                        </button>
                        {aiConfigured && showAIMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowAIMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 bg-surface-overlay border border-border-subtle rounded-xl shadow-2xl py-1.5 min-w-[200px] z-50">
                                    <p className="px-3 py-1 text-[11px] font-semibold text-purple-400 uppercase tracking-widest">AI Actions</p>
                                    <button
                                        onClick={() => { handleAISummary(); setShowAIMenu(false); }}
                                        disabled={aiLoading || !body.trim()}
                                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-purple-500/10 hover:text-purple-300 transition-colors flex items-center gap-2 disabled:opacity-30"
                                    >
                                        <ListChecks className="w-3.5 h-3.5" /> Summarize note
                                    </button>
                                    <button
                                        onClick={() => { handleAutoTag(); setShowAIMenu(false); }}
                                        disabled={aiLoading || !body.trim()}
                                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-purple-500/10 hover:text-purple-300 transition-colors flex items-center gap-2 disabled:opacity-30"
                                    >
                                        <Tags className="w-3.5 h-3.5" /> Suggest tags
                                    </button>
                                    <button
                                        onClick={() => { setShowNoteToCards(true); setShowAIMenu(false); }}
                                        disabled={aiLoading || !body.trim()}
                                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-purple-500/10 hover:text-purple-300 transition-colors flex items-center gap-2 disabled:opacity-30"
                                    >
                                        <ListChecks className="w-3.5 h-3.5" /> Break into cards
                                    </button>
                                    <div className="mx-2 my-1 border-t border-border-subtle" />
                                    <button
                                        onClick={() => {
                                            setShowAIPrompt(prev => !prev);
                                            setShowAIMenu(false);
                                            setTimeout(() => aiPromptInputRef.current?.focus(), 100);
                                        }}
                                        disabled={aiLoading}
                                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-purple-500/10 hover:text-purple-300 transition-colors flex items-center gap-2 disabled:opacity-30"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" /> Custom prompt
                                    </button>
                                    <div className="mx-2 my-1 border-t border-border-subtle" />
                                    <p className="px-3 py-0.5 text-[11px] text-text-muted">Select text for writing assistant</p>
                                </div>
                            </>
                        )}
                    </div>

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

            {/* AI Custom Prompt Bar */}
            {showAIPrompt && aiConfigured && (
                <div className="border-b border-purple-500/20 bg-purple-500/5 px-6 py-3 flex items-center gap-3 shrink-0">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <input
                        ref={aiPromptInputRef}
                        type="text"
                        value={aiPromptText}
                        onChange={(e) => setAiPromptText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAIPromptSubmit();
                            } else if (e.key === 'Escape') {
                                setShowAIPrompt(false);
                                setAiPromptText('');
                            }
                        }}
                        placeholder="Ask AI anything… (uses note as context)"
                        className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted"
                        disabled={aiLoading === 'prompt'}
                    />
                    <button
                        onClick={handleAIPromptSubmit}
                        disabled={!aiPromptText.trim() || aiLoading === 'prompt'}
                        className="p-1.5 rounded-md text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Send prompt"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setShowAIPrompt(false); setAiPromptText(''); }}
                        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                <div className={cn('p-8 mx-auto w-full transition-all duration-300', focusMode ? 'max-w-4xl' : 'max-w-3xl')}>
                    {activeNote.type === 'file' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-surface-overlay border border-border-subtle flex items-center justify-center text-text-secondary">
                                    <FileIcon className="w-8 h-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-3xl font-bold text-text-primary break-words">{activeNote.title || 'Untitled'}</h1>
                                    <p className="text-sm text-text-muted mt-1">Uploaded {timeAgo(activeNote.createdAt)}</p>
                                </div>
                            </div>

                            {/* Tags for files */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-2">
                                <Hash className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                {activeNote.tags?.map(tag => (
                                    <span
                                        key={tag}
                                        style={getTagStyle(tag)}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                                <div className="p-5 rounded-2xl bg-surface-overlay border border-border-subtle hover:border-accent/30 transition-colors group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-mono text-text-muted">{(activeNote.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-text-primary mb-2">File Details</h4>
                                    <p className="text-xs text-text-secondary leading-relaxed mb-4">
                                        Type: {activeNote.mimeType || 'Unknown'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={activeNote.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download
                                        </a>
                                        <a
                                            href={activeNote.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-base hover:bg-surface-hover text-text-primary border border-border-subtle rounded-lg text-xs font-semibold transition-all active:scale-95"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Open
                                        </a>
                                    </div>
                                </div>

                                {activeNote.mimeType?.startsWith('image/') && (
                                    <div className="rounded-2xl border border-border-subtle overflow-hidden bg-surface-overlay flex items-center justify-center p-2 min-h-[200px]">
                                        <img
                                            src={activeNote.url}
                                            alt={activeNote.title}
                                            className="max-w-full max-h-[300px] object-contain rounded-lg shadow-lg"
                                            onClick={() => window.open(activeNote.url, '_blank')}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Rendered File Content */}
                            {(fetchingContent || fileContent || fetchError) && (
                                <div className="mt-8 pt-8 border-t border-border-subtle">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-surface-overlay border border-border-subtle flex items-center justify-center text-text-muted">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-text-primary">Document Preview</h3>
                                        {fetchingContent && (
                                            <span className="text-xs text-text-muted animate-pulse">Loading content...</span>
                                        )}
                                    </div>

                                    {fetchingContent ? (
                                        <div className="space-y-3">
                                            <div className="h-4 bg-surface-hover rounded w-3/4 animate-pulse" />
                                            <div className="h-4 bg-surface-hover rounded w-full animate-pulse" />
                                            <div className="h-4 bg-surface-hover rounded w-5/6 animate-pulse" />
                                        </div>
                                    ) : fetchError ? (
                                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                            <p className="text-sm text-red-400">{fetchError}</p>
                                            <button 
                                                onClick={() => window.location.reload()}
                                                className="text-xs text-red-400 underline mt-2 hover:text-red-300"
                                            >
                                                Try refreshing the page
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert max-w-none">
                                            <MarkdownRenderer content={fileContent} onWikiLink={handleWikiLink} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        mode === 'edit' ? (
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
                                    {/* AI suggested tags */}
                                    {suggestedTags.map(tag => (
                                        <span
                                            key={`suggest-${tag}`}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-dashed border-purple-500/30 bg-purple-500/10 text-purple-400"
                                        >
                                            <Sparkles className="w-2.5 h-2.5" />
                                            {tag}
                                            <button
                                                onClick={() => handleAcceptTag(tag)}
                                                className="hover:opacity-60 transition-opacity ml-0.5 text-emerald-400"
                                                title="Accept"
                                            >
                                                <CheckCheck className="w-2.5 h-2.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDismissTag(tag)}
                                                className="hover:opacity-60 transition-opacity text-red-400"
                                                title="Dismiss"
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
                                        onMouseUp={handleTextSelect}
                                        placeholder="Write in markdown… use [[Note Title]] to link notes"
                                        className="w-full min-h-[60vh] bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted resize-none font-mono text-sm leading-relaxed"
                                    />

                                    {/* Wiki autocomplete picker */}
                                    {wikiQuery !== null && wikiSuggestions.length > 0 && (
                                        <div
                                            className="fixed z-50 w-64 bg-surface-overlay border border-border-subtle rounded-xl shadow-2xl overflow-hidden"
                                            style={{ top: wikiPickerPos.top, left: wikiPickerPos.left }}
                                        >
                                            <p className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-widest border-b border-border-subtle bg-surface-base/60">
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
                                                    <span className="text-[11px] opacity-50">↗</span>
                                                    <span className="truncate">{n.title}</span>
                                                </button>
                                            ))}
                                            <p className="px-3 py-1 text-[11px] text-text-muted">
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
                            <div ref={previewRef}>
                                <MarkdownRenderer
                                    content={preprocessWikiLinks(body, notes)}
                                    onWikiLink={handleWikiLink}
                                />
                            </div>
                            </div>
                        )
                    )}

                    {/* Hidden preview — always renders markdown so PDF export captures mermaid diagrams */}
                    {mode === 'edit' && (
                        <div ref={previewRef} className="fixed -left-[9999px] w-[720px]" aria-hidden="true">
                            <MarkdownRenderer
                                content={preprocessWikiLinks(body, notes)}
                            />
                        </div>
                    )}

                    {/* Linked Cards */}
                    <div className="mt-16 pt-6 border-t border-border-subtle">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">
                                Linked Cards ({activeNote.linkedCards?.length ?? 0})
                            </h3>
                            <button
                                onClick={() => setIsCardPickerOpen(true)}
                                className="text-[11px] text-accent hover:text-accent/70 transition-colors"
                            >
                                + Link card
                            </button>
                        </div>

                        {activeNote.linkedCards?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {activeNote.linkedCards.filter(c => c?._id).map((card) => (
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
                                            <span className="text-text-muted text-[11px] shrink-0">
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
                            <p className="text-[11px] text-text-muted italic">No cards linked yet</p>
                        )}
                    </div>
                </div>
            </div>

            <CardPicker
                isOpen={isCardPickerOpen}
                onClose={() => setIsCardPickerOpen(false)}
                onSelect={handleLinkCard}
            />

            {/* Writing Assistant floating menu */}
            {showWritingMenu && writingSelection && aiConfigured && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowWritingMenu(false)} />
                    <div
                        className="fixed z-50 bg-surface-overlay border border-purple-500/20 rounded-xl shadow-2xl py-1 min-w-[160px]"
                        style={{ top: writingMenuPos.top, left: writingMenuPos.left }}
                    >
                        <p className="px-3 py-1 text-[11px] font-semibold text-purple-400 uppercase tracking-widest">
                            <Sparkles className="w-2.5 h-2.5 inline mr-1" />
                            Writing AI
                        </p>
                        {[
                            { action: 'expand', icon: <Expand className="w-3 h-3" />, label: 'Expand' },
                            { action: 'rewrite', icon: <Wand2 className="w-3 h-3" />, label: 'Rewrite' },
                            { action: 'fix', icon: <CheckCheck className="w-3 h-3" />, label: 'Fix Grammar' },
                            { action: 'simplify', icon: <Type className="w-3 h-3" />, label: 'Simplify' },
                            { action: 'shorten', icon: <Eraser className="w-3 h-3" />, label: 'Shorten' },
                        ].map(({ action, icon, label }) => (
                            <button
                                key={action}
                                onClick={() => handleWritingAction(action)}
                                disabled={aiLoading}
                                className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-purple-500/10 hover:text-purple-300 transition-colors flex items-center gap-2 disabled:opacity-30"
                            >
                                {icon} {label}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* AI loading overlay */}
            {aiLoading && (
                <div className="fixed bottom-6 right-6 z-50 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-xl backdrop-blur-sm">
                    <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    <span className="text-xs font-medium text-purple-400">
                        {aiLoading === 'summary' ? 'Generating summary...' : aiLoading === 'tags' ? 'Suggesting tags...' : aiLoading === 'prompt' ? 'Processing prompt...' : 'AI is thinking...'}
                    </span>
                </div>
            )}

            {/* Note → Cards Modal */}
            <NoteToCardsModal
                isOpen={showNoteToCards}
                onClose={() => setShowNoteToCards(false)}
                noteTitle={title}
                noteBody={body}
            />

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => deleteNote(activeNote._id)}
                title="Delete Note"
                message="Delete this note? This cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
}
