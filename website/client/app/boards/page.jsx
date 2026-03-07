'use client';
import { useEffect } from 'react';
import { useBoards } from '@/context/BoardsContext';
import BoardCard from '@/components/kanban/BoardCard';

export default function BoardsPage() {
    const { boards, fetchBoards, createBoard, loading } = useBoards();

    useEffect(() => {
        fetchBoards();
    }, [fetchBoards]);

    const handleNewBoard = async () => {
        const name = prompt('Enter board name:');
        if (name) {
            await createBoard({ name });
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Your Boards</h1>
                    <p className="text-sm text-text-secondary">Manage your projects and tasks across multiple boards.</p>
                </div>
                <button
                    onClick={handleNewBoard}
                    className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md transition-colors text-sm font-semibold flex items-center gap-2"
                >
                    <span>+</span> New Board
                </button>
            </header>

            {loading && boards.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-surface-raised/50 border border-border-subtle rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : boards.length === 0 ? (
                <div className="bg-surface-raised border border-border-subtle rounded-xl p-12 text-center text-text-muted">
                    <span className="text-4xl mb-4 block">■</span>
                    <p className="text-lg">No boards found</p>
                    <button
                        onClick={handleNewBoard}
                        className="mt-4 text-accent hover:underline text-sm"
                    >
                        Create your first board
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.map((board) => (
                        <BoardCard key={board._id} board={board} />
                    ))}
                </div>
            )}
        </div>
    );
}
