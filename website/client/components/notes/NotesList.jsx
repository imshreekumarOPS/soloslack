import { useCallback, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNotes } from '@/context/NotesContext';
import NoteSearch from './NoteSearch';
import NoteItem from './NoteItem';

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
    const { notes, activeNote, setActiveNote, fetchNotes, createNote, loading } = useNotes();

    const [activeTag, setActiveTag] = useState(null);

    // Refs let each handler always see the other's latest value without extra deps
    const searchQueryRef = useRef('');
    const activeTagRef = useRef(null);

    // Derive unique tags from the notes currently in state
    const allTags = useMemo(() => {
        const seen = new Set();
        notes.forEach(n => n.tags?.forEach(t => seen.add(t)));
        // Ensure the active filter tag is always shown even if filtered out
        if (activeTag) seen.add(activeTag);
        return [...seen].sort();
    }, [notes, activeTag]);

    const handleSearch = useCallback((search) => {
        searchQueryRef.current = search;
        const params = {};
        if (search) params.search = search;
        if (activeTagRef.current) params.tag = activeTagRef.current;
        fetchNotes(params);
    }, [fetchNotes]);

    const handleTagFilter = useCallback((tag) => {
        const newTag = activeTag === tag ? null : tag;
        setActiveTag(newTag);
        activeTagRef.current = newTag;
        const params = {};
        if (searchQueryRef.current) params.search = searchQueryRef.current;
        if (newTag) params.tag = newTag;
        fetchNotes(params);
    }, [activeTag, fetchNotes]);

    const handleNewNote = async () => {
        await createNote({ title: '', body: '' });
    };

    return (
        <div className="w-72 flex flex-col border-r border-border-subtle bg-surface-base h-full">
            <div className="p-4 flex items-center justify-between border-b border-border-subtle">
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Notes</h2>
                <button
                    onClick={handleNewNote}
                    className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    title="New note"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

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
                                        ? 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all'
                                        : 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border border-border-subtle text-text-muted hover:border-border-default hover:text-text-secondary transition-all'
                                }
                            >
                                #{tag}
                            </button>
                        );
                    })}
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
                            isActive={activeNote?._id === note._id}
                            onClick={() => setActiveNote(note)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
