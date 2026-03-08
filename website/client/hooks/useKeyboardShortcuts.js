'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/context/NotesContext';
import { useBoards } from '@/context/BoardsContext';

export default function useKeyboardShortcuts() {
    const router = useRouter();
    const { createNote } = useNotes();
    const { setIsCreateBoardModalOpen } = useBoards();

    useEffect(() => {
        const handleKeyDown = async (e) => {
            // Check if Alt key is pressed along with N or B
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
    }, [createNote, setIsCreateBoardModalOpen, router]);
}
