'use client';
import { useEffect } from 'react';
import { useNotes } from '@/context/NotesContext';
import NotesList from '@/components/notes/NotesList';
import NoteEditor from '@/components/notes/NoteEditor';

export default function NotesPage() {
    const { fetchNotes, activeNote } = useNotes();

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    return (
        <div className="flex h-full overflow-hidden">
            <NotesList />
            <div className="flex-1 overflow-auto relative">
                {activeNote ? (
                    <NoteEditor />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-4">
                        <span className="text-6xl">📝</span>
                        <p className="text-lg">Select a note to view or create a new one</p>
                    </div>
                )}
            </div>
        </div>
    );
}
