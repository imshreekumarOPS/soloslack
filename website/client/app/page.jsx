'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNotes } from '@/context/NotesContext';
import { useBoards } from '@/context/BoardsContext';
import BoardCard from '@/components/kanban/BoardCard';
import NoteItem from '@/components/notes/NoteItem';
import CreateBoardModal from '@/components/kanban/CreateBoardModal';

export default function Dashboard() {
    const { notes, fetchNotes, setActiveNote } = useNotes();
    const { boards, fetchBoards, createBoard } = useBoards();
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);

    useEffect(() => {
        fetchNotes({ limit: 5 });
        fetchBoards();
    }, [fetchNotes, fetchBoards]);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12">
            <header>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome back!</h1>
                <p className="text-text-secondary">Here's what's happening in your workspace.</p>
            </header>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Recent Boards</h2>
                    <Link href="/boards" className="text-xs text-accent hover:underline">View all boards</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.slice(0, 3).map((board) => (
                        <BoardCard key={board._id} board={board} />
                    ))}
                    {boards.length === 0 && (
                        <div className="col-span-full p-8 border border-dashed border-border-subtle rounded-xl text-center text-text-muted">
                            No boards created yet.
                        </div>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <section className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-text-primary">Recent Notes</h2>
                        <Link href="/notes" className="text-xs text-accent hover:underline">View all notes</Link>
                    </div>
                    <div className="bg-surface-raised border border-border-subtle rounded-xl overflow-hidden">
                        {notes.length > 0 ? (
                            notes.map((note) => (
                                <NoteItem
                                    key={note._id}
                                    note={note}
                                    onClick={() => {
                                        setActiveNote(note);
                                        window.location.href = '/notes';
                                    }}
                                />
                            ))
                        ) : (
                            <div className="p-8 text-center text-text-muted">
                                No notes found.
                            </div>
                        )}
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-lg font-semibold text-text-primary">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link
                            href="/notes"
                            className="flex items-center gap-3 p-4 bg-surface-raised border border-border-subtle rounded-xl hover:bg-surface-hover transition-colors group"
                        >
                            <span className="text-2xl">📝</span>
                            <div>
                                <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Create New Note</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Alt + N</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setIsBoardModalOpen(true)}
                            className="w-full flex items-center gap-3 p-4 bg-surface-raised border border-border-subtle rounded-xl hover:bg-surface-hover transition-colors group text-left"
                        >
                            <span className="text-2xl">■</span>
                            <div>
                                <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Create New Board</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Alt + B</p>
                            </div>
                        </button>
                    </div>
                </section>
            </div>
            <CreateBoardModal
                isOpen={isBoardModalOpen}
                onClose={() => setIsBoardModalOpen(false)}
                onCreate={async (data) => {
                    await createBoard(data);
                    window.location.href = '/boards';
                }}
            />
        </div>
    );
}
