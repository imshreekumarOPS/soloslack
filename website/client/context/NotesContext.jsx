'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { notesApi } from '@/lib/api/notesApi';
import { useUndo } from '@/context/UndoContext';

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
    const [notes, setNotes] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [loading, setLoading] = useState(false);
    const { pushUndo } = useUndo();

    // Ref for snapshotting notes inside undo callbacks without stale closures
    const notesRef = useRef([]);
    notesRef.current = notes;

    const fetchNotes = useCallback(async (params) => {
        setLoading(true);
        try {
            const res = await notesApi.getAll(params);
            setNotes(res.data);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createNote = useCallback(async (data) => {
        const res = await notesApi.create(data);
        setNotes(prev => [res.data, ...prev]);
        setActiveNote(res.data);
        return res.data;
    }, []);

    const updateNote = useCallback(async (id, data) => {
        const res = await notesApi.update(id, data);
        setNotes(prev => prev.map(n => n._id === id ? { ...n, ...res.data } : n));
        setActiveNote(current => (current?._id === id ? res.data : current));
        return res.data;
    }, []);

    const deleteNote = useCallback(async (id) => {
        // Snapshot for undo (this is a soft delete / archive)
        const noteSnapshot = notesRef.current.find(n => n._id === id);

        await notesApi.delete(id);
        setNotes(prev => prev.filter(n => n._id !== id));
        setActiveNote(current => (current?._id === id ? null : current));

        if (noteSnapshot) {
            pushUndo({
                label: `Archived "${noteSnapshot.title || 'Untitled'}"`,
                undo: async () => {
                    const res = await notesApi.restore(id);
                    setNotes(prev => [res.data, ...prev]);
                },
            });
        }
    }, [pushUndo]);

    // Refresh activeNote from server (e.g. after linking a card)
    const refreshActiveNote = useCallback(async (id) => {
        try {
            const res = await notesApi.getById(id);
            setActiveNote(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to refresh note:', err);
        }
    }, []);

    const bulkArchiveNotes = useCallback(async (ids) => {
        // Snapshot for undo
        const idSet = new Set(ids);
        const noteSnapshots = notesRef.current.filter(n => idSet.has(n._id));

        await notesApi.bulkArchive(ids);
        setNotes(prev => prev.filter(n => !idSet.has(n._id)));
        setActiveNote(current => (current && idSet.has(current._id) ? null : current));

        if (noteSnapshots.length > 0) {
            pushUndo({
                label: `Archived ${noteSnapshots.length} note${noteSnapshots.length > 1 ? 's' : ''}`,
                undo: async () => {
                    const res = await notesApi.bulkRestore(ids);
                    setNotes(prev => [...res.data, ...prev]);
                },
            });
        }
    }, [pushUndo]);

    const bulkDeleteNotes = useCallback(async (ids) => {
        // Snapshot for undo (this is a hard delete — undo re-creates)
        const idSet = new Set(ids);
        const noteSnapshots = notesRef.current.filter(n => idSet.has(n._id));

        await notesApi.bulkDelete(ids);
        setNotes(prev => prev.filter(n => !idSet.has(n._id)));
        setActiveNote(current => (current && idSet.has(current._id) ? null : current));

        if (noteSnapshots.length > 0) {
            pushUndo({
                label: `Deleted ${noteSnapshots.length} note${noteSnapshots.length > 1 ? 's' : ''}`,
                undo: async () => {
                    const created = [];
                    for (const snap of noteSnapshots) {
                        const res = await notesApi.create({
                            title: snap.title,
                            body: snap.body,
                            tags: snap.tags,
                            isPinned: snap.isPinned,
                            workspaceId: snap.workspaceId,
                        });
                        created.push(res.data);
                    }
                    setNotes(prev => [...created, ...prev]);
                },
            });
        }
    }, [pushUndo]);

    const bulkTagNotes = useCallback(async (ids, tag) => {
        await notesApi.bulkTag(ids, tag);
        const idSet = new Set(ids);
        const normalizedTag = tag.trim().toLowerCase();
        setNotes(prev => prev.map(n =>
            idSet.has(n._id) && !n.tags?.includes(normalizedTag)
                ? { ...n, tags: [...(n.tags ?? []), normalizedTag] }
                : n
        ));
    }, []);

    return (
        <NotesContext.Provider value={{
            notes, activeNote, loading,
            setActiveNote, fetchNotes, createNote, updateNote, deleteNote, refreshActiveNote,
            bulkArchiveNotes, bulkDeleteNotes, bulkTagNotes,
        }}>
            {children}
        </NotesContext.Provider>
    );
}

export const useNotes = () => {
    const context = useContext(NotesContext);
    if (!context) {
        return {
            notes: [], activeNote: null, loading: false,
            setActiveNote: () => {}, fetchNotes: () => {}, createNote: () => {},
            updateNote: () => {}, deleteNote: () => {}, refreshActiveNote: () => {},
            bulkArchiveNotes: () => {}, bulkDeleteNotes: () => {}, bulkTagNotes: () => {},
        };
    }
    return context;
};
