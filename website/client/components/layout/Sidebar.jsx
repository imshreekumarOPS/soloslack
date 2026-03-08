'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBoards } from '@/context/BoardsContext';
import { cn } from '@/lib/utils/cn';
import CreateBoardModal from '@/components/kanban/CreateBoardModal';
import { useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const { boards, fetchBoards, createBoard } = useBoards();
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchBoards();
    }, [fetchBoards]);

    const handleNewBoard = () => {
        setIsModalOpen(true);
    };

    const handleCreateBoard = async (data) => {
        await createBoard(data);
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: '⊞' },
        { name: 'Notes', path: '/notes', icon: '📝' },
        { name: 'Boards', path: '/boards', icon: '■' },
    ];

    return (
        <aside className="w-60 h-screen bg-surface-raised border-r border-border-subtle flex flex-col shrink-0">
            <div className="p-4 flex items-center justify-between">
                <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <span>📋</span> Notban
                </h1>
                <button className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-surface-hover">
                    ⚙
                </button>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                            pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
                                ? "bg-accent-subtle text-accent font-medium"
                                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                        )}
                    >
                        <span>{item.icon}</span>
                        {item.name}
                    </Link>
                ))}

                <div className="mt-8">
                    <h3 className="text-xs text-text-muted uppercase tracking-widest px-3 mb-2 font-semibold">
                        Boards
                    </h3>
                    <div className="space-y-1">
                        {boards.map((board) => (
                            <Link
                                key={board._id}
                                href={`/boards/${board._id}`}
                                className={cn(
                                    "block px-6 py-1.5 text-sm rounded-md transition-colors",
                                    pathname === `/boards/${board._id}`
                                        ? "text-accent font-medium"
                                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                                )}
                            >
                                · {board.name}
                            </Link>
                        ))}
                        <button
                            onClick={handleNewBoard}
                            className="w-full text-left px-6 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
                        >
                            <span className="text-lg">+</span> New Board
                        </button>
                    </div>
                </div>
            </nav>
            <CreateBoardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateBoard}
            />
        </aside>
    );
}
