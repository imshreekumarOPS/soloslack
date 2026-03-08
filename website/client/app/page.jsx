'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNotes } from '@/context/NotesContext';
import { useBoards } from '@/context/BoardsContext';
import BoardCard from '@/components/kanban/BoardCard';
import CreateBoardModal from '@/components/kanban/CreateBoardModal';
import { timeAgo } from '@/lib/utils/formatDate';
import AnimatedIcon from '@/components/ui/AnimatedIcon';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function getFormattedDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function Dashboard() {
    const { notes, fetchNotes, setActiveNote } = useNotes();
    const { boards, fetchBoards, createBoard, setIsCreateBoardModalOpen } = useBoards();

    useEffect(() => {
        fetchNotes({ limit: 5 });
        fetchBoards();
    }, [fetchNotes, fetchBoards]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            {/* ===== Hero Greeting ===== */}
            <header className="animate-fade-in-up stagger-1">
                <h1 className="text-4xl md:text-5xl font-extrabold gradient-text mb-2 leading-tight">
                    {getGreeting()}!
                </h1>
                <p className="text-text-secondary text-sm">
                    {getFormattedDate()} — Here&apos;s your workspace at a glance.
                </p>
            </header>

            {/* ===== Stats Row ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up stagger-2">
                <div className="stat-card-indigo rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02] duration-300">
                    <div className="w-12 h-12 rounded-xl icon-gradient-indigo flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden p-1">
                        <AnimatedIcon type="notes" active={true} className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-text-primary">{notes.length}</p>
                        <p className="text-xs text-text-muted uppercase tracking-widest font-semibold">Notes</p>
                    </div>
                </div>
                <div className="stat-card-emerald rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02] duration-300">
                    <div className="w-12 h-12 rounded-xl icon-gradient-emerald flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden p-1">
                        <AnimatedIcon type="boards" active={true} className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-text-primary">{boards.length}</p>
                        <p className="text-xs text-text-muted uppercase tracking-widest font-semibold">Boards</p>
                    </div>
                </div>
                <div className="stat-card-amber rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02] duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden p-1">
                        <AnimatedIcon type="bolt" active={true} className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-primary">Stay productive</p>
                        <p className="text-xs text-text-muted uppercase tracking-widest font-semibold">Keep it up!</p>
                    </div>
                </div>
            </div>

            {/* ===== Recent Boards ===== */}
            <section className="animate-fade-in-up stagger-3">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <span className="w-1.5 h-5 rounded-full bg-accent inline-block"></span>
                        Recent Boards
                    </h2>
                    <Link href="/boards" className="text-xs text-accent hover:text-accent-hover transition-colors font-semibold uppercase tracking-wider">
                        View all →
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {boards.slice(0, 3).map((board, i) => (
                        <BoardCard key={board._id} board={board} index={i} />
                    ))}
                    {boards.length === 0 && (
                        <div className="col-span-full p-10 border border-dashed border-border-subtle rounded-2xl text-center text-text-muted glass">
                            <p className="text-lg mb-1">No boards yet</p>
                            <p className="text-xs">Create your first board to get started</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ===== Bottom Grid: Notes + Quick Actions ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up stagger-4">
                {/* Recent Notes */}
                <section className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <span className="w-1.5 h-5 rounded-full bg-emerald-500 inline-block"></span>
                            Recent Notes
                        </h2>
                        <Link href="/notes" className="text-xs text-accent hover:text-accent-hover transition-colors font-semibold uppercase tracking-wider">
                            View all →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {notes.length > 0 ? (
                            notes.map((note, i) => (
                                <div
                                    key={note._id}
                                    onClick={() => {
                                        setActiveNote(note);
                                        window.location.href = '/notes';
                                    }}
                                    className="group bg-surface-raised border border-border-subtle rounded-xl p-4 cursor-pointer hover:border-accent/40 hover:bg-surface-hover transition-all duration-300 card-glow flex items-start gap-4"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold shrink-0 mt-0.5">
                                        {(note.title || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                                            {note.title || 'Untitled'}
                                        </h4>
                                        <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                                            {note.body ? note.body.substring(0, 120) : 'No content'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-text-muted whitespace-nowrap mt-1">
                                        {timeAgo(note.updatedAt)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 border border-dashed border-border-subtle rounded-2xl text-center text-text-muted glass">
                                <p className="text-lg mb-1">No notes yet</p>
                                <p className="text-xs">Start writing your first note</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-5">
                        <span className="w-1.5 h-5 rounded-full bg-amber-500 inline-block"></span>
                        Quick Actions
                    </h2>
                    <div className="space-y-3">
                        <Link
                            href="/notes"
                            className="group flex items-center gap-4 p-4 bg-surface-raised border border-border-subtle rounded-xl hover:border-indigo-500/40 hover:bg-surface-hover transition-all duration-300 card-glow"
                        >
                            <div className="w-11 h-11 rounded-xl icon-gradient-indigo flex items-center justify-center text-white text-lg shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden p-1">
                                <AnimatedIcon type="notes" active={true} className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Create New Note</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-0.5">Alt + N</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setIsCreateBoardModalOpen(true)}
                            className="w-full group flex items-center gap-4 p-4 bg-surface-raised border border-border-subtle rounded-xl hover:border-emerald-500/40 hover:bg-surface-hover transition-all duration-300 card-glow text-left"
                        >
                            <div className="w-11 h-11 rounded-xl icon-gradient-emerald flex items-center justify-center text-white text-lg shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden p-1">
                                <AnimatedIcon type="boards" active={true} className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">Create New Board</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-0.5">Alt + B</p>
                            </div>
                        </button>
                    </div>
                </section>
            </div>

        </div>
    );
}
