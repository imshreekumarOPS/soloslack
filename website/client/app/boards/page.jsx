'use client';
import { useEffect, useState } from 'react';
import { useBoards } from '@/context/BoardsContext';
import BoardCard from '@/components/kanban/BoardCard';
import CreateBoardModal from '@/components/kanban/CreateBoardModal';

export default function BoardsPage() {
    const { boards, fetchBoards, createBoard, loading } = useBoards();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchBoards();
    }, [fetchBoards]);

    const handleNewBoard = async (data) => {
        await createBoard(data);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Your Boards</h1>
                    <p className="text-sm text-text-secondary">Manage your projects and tasks across multiple boards.</p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search boards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-surface-raised border border-border-subtle rounded-md px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent w-64"
                    />
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md transition-colors text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
                    >
                        <span>+</span> New Board
                    </button>
                </div>
            </header>

            <CreateBoardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleNewBoard}
            />

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
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 text-accent hover:underline text-sm"
                    >
                        Create your first board
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards
                        .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((board) => (
                            <BoardCard key={board._id} board={board} />
                        ))}
                </div>
            )}
        </div>
    );
}
