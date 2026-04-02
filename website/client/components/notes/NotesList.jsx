import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, CheckSquare, X, Archive, Trash2, Tag, Upload } from 'lucide-react';
import { useNotes } from '@/context/NotesContext';
import { useWorkspaces } from '@/context/WorkspacesContext';
import NoteSearch from './NoteSearch';
import NoteItem from './NoteItem';
import ConfirmModal from '../ui/ConfirmModal';
import DocumentUploadModal from './DocumentUploadModal';
import { cn } from '@/lib/utils/cn';

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

export default function NotesList() {
    const { notes, activeNote, setActiveNote, fetchNotes, createNote, loading, bulkArchiveNotes, bulkDeleteNotes, bulkTagNotes } = useNotes();
    const { workspaces, activeWorkspaceId, setActiveWorkspaceId, fetchWorkspaces } = useWorkspaces();

    const [activeTag, setActiveTag] = useState(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedNoteIds, setSelectedNoteIds] = useState(new Set());
    const [bulkTagInput, setBulkTagInput] = useState('');
    const [showBulkTagInput, setShowBulkTagInput] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Refs let each handler always see the other's latest value without extra deps
    const searchQueryRef = useRef('');
    const activeTagRef = useRef(null);
    const wsIdRef = useRef(activeWorkspaceId);
    wsIdRef.current = activeWorkspaceId;

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    // Re-fetch notes when workspace changes
    useEffect(() => {
        const params = {};
        if (searchQueryRef.current) params.search = searchQueryRef.current;
        if (activeTagRef.current) params.tag = activeTagRef.current;
        if (activeWorkspaceId) params.workspaceId = activeWorkspaceId;
        fetchNotes(params);
    }, [activeWorkspaceId, fetchNotes]);

    // Derive unique tags from the notes currently in state
    const allTags = useMemo(() => {
        const seen = new Set();
        notes.forEach(n => n.tags?.forEach(t => seen.add(t)));
        // Ensure the active filter tag is always shown even if filtered out
        if (activeTag) seen.add(activeTag);
        return [...seen].sort();
    }, [notes, activeTag]);

    const buildParams = useCallback(() => {
        const params = {};
        if (searchQueryRef.current) params.search = searchQueryRef.current;
        if (activeTagRef.current) params.tag = activeTagRef.current;
        if (wsIdRef.current) params.workspaceId = wsIdRef.current;
        return params;
    }, []);

    const handleSearch = useCallback((search) => {
        searchQueryRef.current = search;
        fetchNotes(buildParams());
    }, [fetchNotes, buildParams]);

    const handleTagFilter = useCallback((tag) => {
        const newTag = activeTag === tag ? null : tag;
        setActiveTag(newTag);
        activeTagRef.current = newTag;
        fetchNotes(buildParams());
    }, [activeTag, fetchNotes, buildParams]);

    const handleNewNote = async () => {
        await createNote({ title: '', body: '', workspaceId: activeWorkspaceId || undefined });
    };

    const toggleSelectMode = () => {
        setSelectMode(prev => !prev);
        setSelectedNoteIds(new Set());
        setShowBulkTagInput(false);
    };

    const toggleNoteSelection = (noteId) => {
        setSelectedNoteIds(prev => {
            const next = new Set(prev);
            if (next.has(noteId)) next.delete(noteId);
            else next.add(noteId);
            return next;
        });
    };

    const selectAllNotes = () => {
        setSelectedNoteIds(new Set(notes.map(n => n._id)));
    };

    const handleBulkArchive = async () => {
        const ids = [...selectedNoteIds];
        if (ids.length === 0) return;
        await bulkArchiveNotes(ids);
        setSelectedNoteIds(new Set());
    };

    const handleBulkDelete = () => {
        if (selectedNoteIds.size === 0) return;
        setConfirmDelete(true);
    };

    const executeBulkDelete = async () => {
        const ids = [...selectedNoteIds];
        await bulkDeleteNotes(ids);
        setSelectedNoteIds(new Set());
    };

    const handleBulkTag = async () => {
        const tag = bulkTagInput.trim();
        const ids = [...selectedNoteIds];
        if (!tag || ids.length === 0) return;
        await bulkTagNotes(ids, tag);
        setBulkTagInput('');
        setShowBulkTagInput(false);
    };

    return (
        <div className="w-72 flex flex-col border-r border-border-subtle bg-surface-base h-full">
            <div className="p-4 flex items-center justify-between border-b border-border-subtle">
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Notes</h2>
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleSelectMode}
                        className={cn(
                            'p-1 rounded-md transition-colors',
                            selectMode
                                ? 'bg-accent/20 text-accent'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        )}
                        title={selectMode ? 'Exit select mode' : 'Select notes'}
                    >
                        <CheckSquare className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                        title="Upload document"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleNewNote}
                        className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                        title="New note"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Workspace filter */}
            {workspaces.length > 0 && (
                <div className="px-3 py-1.5 border-b border-border-subtle">
                    <select
                        value={activeWorkspaceId ?? ''}
                        onChange={(e) => setActiveWorkspaceId(e.target.value || null)}
                        className="w-full bg-surface-overlay border border-border-subtle rounded-md px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent/40"
                    >
                        <option value="">All Workspaces</option>
                        {workspaces.map(ws => (
                            <option key={ws._id} value={ws._id}>{ws.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <NoteSearch onSearch={handleSearch} />

            {/* Tag filter pills */}
            {allTags.length > 0 && (
                <div className="px-3 pb-2 pt-1.5 border-b border-border-subtle flex flex-wrap gap-1.5">
                    {allTags.map(tag => {
                        const isActive = activeTag === tag;
                        const style = getTagStyle(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => handleTagFilter(tag)}
                                style={isActive ? style : undefined}
                                className={
                                    isActive
                                        ? 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all'
                                        : 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border border-border-subtle text-text-muted hover:border-border-default hover:text-text-secondary transition-all'
                                }
                            >
                                #{tag}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Bulk actions toolbar */}
            {selectMode && selectedNoteIds.size > 0 && (
                <div className="px-3 py-2 border-b border-border-subtle bg-surface-raised/40 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-text-primary">
                            {selectedNoteIds.size} selected
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={selectAllNotes} className="text-[11px] text-accent hover:text-accent/80 font-medium">
                                All
                            </button>
                            <button onClick={toggleSelectMode} className="p-0.5 text-text-muted hover:text-text-primary">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setShowBulkTagInput(prev => !prev)}
                            className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-text-primary bg-surface-overlay px-2 py-1 rounded transition-colors"
                        >
                            <Tag className="w-3 h-3" /> Tag
                        </button>
                        <button
                            onClick={handleBulkArchive}
                            className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-amber-400 bg-surface-overlay px-2 py-1 rounded transition-colors"
                        >
                            <Archive className="w-3 h-3" /> Archive
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-red-400 bg-surface-overlay px-2 py-1 rounded transition-colors"
                        >
                            <Trash2 className="w-3 h-3" /> Delete
                        </button>
                    </div>
                    {showBulkTagInput && (
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                value={bulkTagInput}
                                onChange={(e) => setBulkTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleBulkTag(); }}
                                placeholder="Tag name"
                                className="flex-1 bg-surface-overlay border border-border-default rounded px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent"
                                autoFocus
                            />
                            <button
                                onClick={handleBulkTag}
                                disabled={!bulkTagInput.trim()}
                                className="px-2 py-1 rounded bg-accent/20 text-accent text-[11px] font-medium hover:bg-accent/30 disabled:opacity-30"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {loading && notes.length === 0 ? (
                    <div className="p-4 text-center text-xs text-text-muted">Loading...</div>
                ) : notes.length === 0 ? (
                    <div className="p-4 text-center text-xs text-text-muted">
                        {activeTag ? `No notes tagged #${activeTag}` : 'No notes found'}
                    </div>
                ) : (
                    notes.map((note) => (
                        <NoteItem
                            key={note._id}
                            note={note}
                            isActive={!selectMode && activeNote?._id === note._id}
                            onClick={() => selectMode ? toggleNoteSelection(note._id) : setActiveNote(note)}
                            selectMode={selectMode}
                            isSelected={selectedNoteIds.has(note._id)}
                        />
                    ))
                )}
            </div>

            <ConfirmModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={executeBulkDelete}
                title="Delete Notes"
                message={`Permanently delete ${selectedNoteIds.size} note${selectedNoteIds.size > 1 ? 's' : ''}? This cannot be undone.`}
                confirmText="Delete"
            />

            <DocumentUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                workspaceId={activeWorkspaceId}
                noteId={activeNote?._id}
                onUploadSuccess={() => fetchNotes(buildParams())}
            />
        </div>
    );
}
