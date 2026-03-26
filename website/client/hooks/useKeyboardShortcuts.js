'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/context/NotesContext';
import { useBoards } from '@/context/BoardsContext';
import { useUndo } from '@/context/UndoContext';

export default function useKeyboardShortcuts() {
    const router = useRouter();
    const { createNote } = useNotes();
    const { setIsCreateBoardModalOpen } = useBoards();
    const { undoAction } = useUndo();

    useEffect(() => {
        const handleKeyDown = async (e) => {
            // Ctrl/Cmd + Z — global undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                // Don't intercept undo inside text inputs / textareas / contenteditable
                const tag = e.target?.tagName;
                const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;
                if (!isEditable) {
                    e.preventDefault();
                    await undoAction();
                }
            }

            // Alt + N — new note
            if (e.altKey) {
                if (e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    await createNote({ title: 'New Note', body: '' });
                    router.push('/notes');
                } else if (e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    setIsCreateBoardModalOpen(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [createNote, setIsCreateBoardModalOpen, router, undoAction]);
}
