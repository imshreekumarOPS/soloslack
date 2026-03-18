'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { notesApi } from '@/lib/api/notesApi';

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
    const [notes, setNotes] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [loading, setLoading] = useState(false);

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
        await notesApi.delete(id);
        setNotes(prev => prev.filter(n => n._id !== id));
        setActiveNote(current => (current?._id === id ? null : current));
    }, []);

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

    return (
        <NotesContext.Provider value={{
            notes, activeNote, loading,
            setActiveNote, fetchNotes, createNote, updateNote, deleteNote, refreshActiveNote,
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
        };
    }
    return context;
};
