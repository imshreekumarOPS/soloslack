'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBoards } from '@/context/BoardsContext';
import { cn } from '@/lib/utils/cn';
import CreateBoardModal from '@/components/kanban/CreateBoardModal';
import AnimatedIcon from '@/components/ui/AnimatedIcon';

const BOARD_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#ef4444', '#f97316'];

function getBoardColor(index) {
    return BOARD_COLORS[index % BOARD_COLORS.length];
}

export default function Sidebar() {
    const pathname = usePathname();
    const { boards, fetchBoards, createBoard, setIsCreateBoardModalOpen } = useBoards();
    const [boardsExpanded, setBoardsExpanded] = useState(true);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [settingsHovered, setSettingsHovered] = useState(false);

    useEffect(() => {
        fetchBoards();
    }, [fetchBoards]);

    const handleNewBoard = () => {
        setIsCreateBoardModalOpen(true);
    };

    const handleCreateBoard = async (data) => {
        await createBoard(data);
    };

    const navItems = [
        {
            name: 'Dashboard',
            path: '/',
            type: 'dashboard'
        },
        {
            name: 'Notes',
            path: '/notes',
            type: 'notes'
        },
        {
            name: 'Boards',
            path: '/boards',
            type: 'boards'
        },
    ];

    const isActive = (path) => {
        if (path === '/') return pathname === '/';
        return pathname === path || pathname.startsWith(path);
    };

    return (
        <aside className="w-64 h-screen bg-surface-raised border-r border-border-subtle flex flex-col shrink-0 relative overflow-hidden">
            {/* Subtle gradient overlay at top */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/[0.03] to-transparent pointer-events-none" />

            {/* ===== Logo / Brand ===== */}
            <div className="relative p-5 pb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl icon-gradient-indigo flex items-center justify-center shadow-lg shadow-accent/20">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-base font-bold text-text-primary tracking-tight">Notban</h1>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">Notes + Kanban</p>
                </div>
            </div>

            {/* ===== Divider ===== */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

            {/* ===== Navigation ===== */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold px-3 mb-2">
                    Navigation
                </p>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        onMouseEnter={() => setHoveredItem(item.name)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200",
                            isActive(item.path)
                                ? "bg-accent/15 text-accent font-semibold shadow-sm shadow-accent/10 border border-accent/20"
                                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent"
                        )}
                    >
                        <span className={cn(
                            "transition-colors",
                            isActive(item.path) ? "text-accent" : "text-text-muted"
                        )}>
                            <AnimatedIcon
                                type={item.type}
                                active={hoveredItem === item.name || isActive(item.path)}
                                className="w-5 h-5"
                            />
                        </span>
                        {item.name}
                        {isActive(item.path) && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        )}
                    </Link>
                ))}

                {/* ===== Boards Section ===== */}
                <div className="mt-6 pt-4">
                    <button
                        onClick={() => setBoardsExpanded(!boardsExpanded)}
                        className="w-full flex items-center justify-between px-3 mb-2 group"
                    >
                        <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold group-hover:text-text-secondary transition-colors">
                            Boards
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-[10px] text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded-md font-mono">
                                {boards.length}
                            </span>
                            <svg
                                className={cn(
                                    "w-3.5 h-3.5 text-text-muted transition-transform duration-200",
                                    boardsExpanded ? "rotate-0" : "-rotate-90"
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </span>
                    </button>

                    {boardsExpanded && (
                        <div className="space-y-0.5 animate-fade-in">
                            {boards.map((board, i) => (
                                <Link
                                    key={board._id}
                                    href={`/boards/${board._id}`}
                                    className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 group",
                                        pathname === `/boards/${board._id}`
                                            ? "bg-surface-hover text-text-primary font-medium"
                                            : "text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary"
                                    )}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                                        style={{ backgroundColor: getBoardColor(i) }}
                                    />
                                    <span className="truncate">{board.name}</span>
                                </Link>
                            ))}
                            <button
                                onClick={handleNewBoard}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-muted hover:text-accent hover:bg-accent/5 rounded-lg transition-all duration-200 group"
                            >
                                <span className="w-5 h-5 rounded-md border border-dashed border-text-muted/40 group-hover:border-accent/60 flex items-center justify-center transition-colors">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </span>
                                New Board
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* ===== Bottom Divider ===== */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

            {/* ===== Footer / Settings ===== */}
            <div className="relative p-3">
                <button
                    onMouseEnter={() => setSettingsHovered(true)}
                    onMouseLeave={() => setSettingsHovered(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-xl transition-all duration-200 group"
                >
                    <span className="w-8 h-8 rounded-lg bg-surface-overlay flex items-center justify-center group-hover:bg-surface-active transition-colors overflow-hidden">
                        <AnimatedIcon
                            type="settings"
                            active={settingsHovered}
                            className="w-4 h-4"
                        />
                    </span>
                    Settings
                    <svg className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

        </aside >
    );
}
