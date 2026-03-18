'use client';
import { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useNotes } from '@/context/NotesContext';
import { useSettings } from '@/context/SettingsContext';
import NotesList from '@/components/notes/NotesList';
import NoteEditor from '@/components/notes/NoteEditor';
import { cn } from '@/lib/utils/cn';

export default function NotesPage() {
    const { fetchNotes, activeNote } = useNotes();
    const { focusMode } = useSettings();

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    return (
        <div className="flex h-full overflow-hidden">
            <div className={cn(
                'shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
                focusMode ? 'w-0' : 'w-72'
            )}>
                <NotesList />
            </div>
            <div className="flex-1 overflow-auto relative">
                {activeNote ? (
                    <NoteEditor />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-4">
                        <FileText className="w-16 h-16 opacity-20" />
                        <p className="text-lg">Select a note to view or create a new one</p>
                    </div>
                )}
            </div>
        </div>
    );
}
