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
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createNote = async (data) => {
        const res = await notesApi.create(data);
        setNotes(prev => [res.data, ...prev]);
        setActiveNote(res.data);
        return res.data;
    };

    const updateNote = async (id, data) => {
        const res = await notesApi.update(id, data);
        setNotes(prev => prev.map(n => n._id === id ? res.data : n));
        setActiveNote(currentActive => {
            if (currentActive?._id === id) {
                return res.data;
            }
            return currentActive;
        });
    };

    const deleteNote = async (id) => {
        await notesApi.delete(id);
        setNotes(prev => prev.filter(n => n._id !== id));
        setActiveNote(currentActive => {
            if (currentActive?._id === id) {
                return null;
            }
            return currentActive;
        });
    };

    return (
        <NotesContext.Provider value={{
            notes, activeNote, loading,
            setActiveNote, fetchNotes, createNote, updateNote, deleteNote
        }}>
            {children}
        </NotesContext.Provider>
    );
}

export const useNotes = () => {
    const context = useContext(NotesContext);
    return context || { notes: [], activeNote: null, loading: false, fetchNotes: () => { }, createNote: () => { }, updateNote: () => { }, deleteNote: () => { } };
};
