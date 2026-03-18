'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useBoards } from '@/context/BoardsContext';
import { useSettings } from '@/context/SettingsContext';
import { cn } from '@/lib/utils/cn';
import CreateBoardModal from '@/components/kanban/CreateBoardModal';
import DeleteBoardModal from '@/components/kanban/DeleteBoardModal';
import AnimatedIcon from '@/components/ui/AnimatedIcon';
import UnifiedSearch from '@/components/ui/UnifiedSearch';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';

const BOARD_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#ef4444', '#f97316'];

function getBoardColor(index) {
    return BOARD_COLORS[index % BOARD_COLORS.length];
}

export default function Sidebar() {
    const pathname = usePathname();
    const { boards, fetchBoards, createBoard, setIsCreateBoardModalOpen } = useBoards();
    const { theme, updateTheme } = useSettings();
    const [boardsExpanded, setBoardsExpanded] = useState(true);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [settingsHovered, setSettingsHovered] = useState(false);
    const [boardSearch, setBoardSearch] = useState('');
    const [deletingBoard, setDeletingBoard] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

    useEffect(() => {
        fetchBoards();
    }, [fetchBoards]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            const inInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;

            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(o => !o);
                return;
            }

            if (!inInput && e.key === '?') {
                e.preventDefault();
                setIsShortcutsOpen(o => !o);
                return;
            }

            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                window.location.href = '/notes';
                return;
            }

            if (e.altKey && e.key === 'b') {
                e.preventDefault();
                setIsCreateBoardModalOpen(true);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [setIsCreateBoardModalOpen]);

    const handleNewBoard = () => {
        setIsCreateBoardModalOpen(true);
    };

    const handleCreateBoard = async (data) => {
        await createBoard(data);
    };
    
    const handleDeleteClick = (e, board) => {
        e.preventDefault();
        e.stopPropagation();
        setDeletingBoard(board);
        setIsDeleteModalOpen(true);
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    <Image 
                        src="/soloslack_icon_preview.svg" 
                        alt="SoloSlack Logo" 
                        width={40} 
                        height={40}
                        priority
                        className="transition-opacity duration-300"
                    />
                </div>
                <div>
                    <h1 className="text-base font-bold text-text-primary tracking-tight">SoloSlack</h1>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest leading-none">Notes + Kanban</p>
                </div>
            </div>

            {/* ===== Divider ===== */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

            {/* ===== Search trigger ===== */}
            <div className="px-3 pt-3">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-overlay border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default transition-all"
                >
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 text-left text-xs">Search…</span>
                    <kbd className="text-[10px] font-mono bg-surface-raised px-1.5 py-0.5 rounded border border-border-subtle leading-none">
                        ⌘K
                    </kbd>
                </button>
            </div>

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
                            <div className="px-3 mb-2">
                                <input
                                    type="text"
                                    placeholder="Filter boards..."
                                    value={boardSearch}
                                    onChange={(e) => setBoardSearch(e.target.value)}
                                    className="w-full bg-surface-overlay border border-border-subtle rounded-md px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent/40"
                                />
                            </div>
                            {boards
                                .filter(b => b.name.toLowerCase().includes(boardSearch.toLowerCase()))
                                .map((board, i) => (
                                <div key={board._id} className="relative group">
                                    <Link
                                        href={`/boards/${board._id}`}
                                        className={cn(
                                            "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200",
                                            pathname === `/boards/${board._id}`
                                                ? "bg-surface-hover text-text-primary font-medium"
                                                : "text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary"
                                        )}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                                            style={{ backgroundColor: getBoardColor(i) }}
                                        />
                                        <span className="truncate pr-6">{board.name}</span>
                                    </Link>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, board)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete Board"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
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
                <Link
                    href="/settings"
                    onMouseEnter={() => setSettingsHovered(true)}
                    onMouseLeave={() => setSettingsHovered(false)}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 group",
                        pathname === '/settings'
                            ? "bg-accent/15 text-accent font-semibold border border-accent/20"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent"
                    )}
                >
                    <span className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors overflow-hidden",
                        pathname === '/settings' ? "bg-accent/20" : "bg-surface-overlay group-hover:bg-surface-active"
                    )}>
                        <AnimatedIcon
                            type="settings"
                            active={settingsHovered || pathname === '/settings'}
                            className="w-4 h-4"
                        />
                    </span>
                    Settings
                    <svg className={cn(
                        "w-3.5 h-3.5 ml-auto transition-all",
                        pathname === '/settings' ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </Link>
            </div>

            {/* ===== Theme Toggle ===== */}
            <div className="px-3 pb-4">
                <button
                    onClick={() => updateTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all duration-200"
                >
                    <span className="w-8 h-8 rounded-lg bg-surface-overlay flex items-center justify-center">
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </span>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>

            <DeleteBoardModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                boardId={deletingBoard?._id}
                boardName={deletingBoard?.name}
            />

            <UnifiedSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />

            <KeyboardShortcutsModal
                isOpen={isShortcutsOpen}
                onClose={() => setIsShortcutsOpen(false)}
            />
        </aside>
    );
}
