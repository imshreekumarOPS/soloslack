'use client';
import { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Trash2, Search, Archive, GripVertical, FolderOpen, Plus, X, Pencil, MoreHorizontal, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useBoards } from '@/context/BoardsContext';
import { useWorkspaces } from '@/context/WorkspacesContext';
import { useSettings } from '@/context/SettingsContext';
import { cn } from '@/lib/utils/cn';
import CreateBoardModal from '@/components/kanban/CreateBoardModal';
import DeleteBoardModal from '@/components/kanban/DeleteBoardModal';
import AnimatedIcon from '@/components/ui/AnimatedIcon';
import ConfirmModal from '@/components/ui/ConfirmModal';
import UnifiedSearch from '@/components/ui/UnifiedSearch';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BOARD_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#ef4444', '#f97316'];

const WORKSPACE_COLOR_MAP = {
    indigo:  { dot: '#6366f1', bg: 'rgba(99,102,241,0.15)',  active: 'rgba(99,102,241,0.25)' },
    emerald: { dot: '#10b981', bg: 'rgba(16,185,129,0.15)',  active: 'rgba(16,185,129,0.25)' },
    violet:  { dot: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  active: 'rgba(139,92,246,0.25)' },
    amber:   { dot: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  active: 'rgba(245,158,11,0.25)' },
    rose:    { dot: '#f43f5e', bg: 'rgba(244,63,94,0.15)',   active: 'rgba(244,63,94,0.25)' },
    cyan:    { dot: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   active: 'rgba(6,182,212,0.25)' },
    orange:  { dot: '#f97316', bg: 'rgba(249,115,22,0.15)',  active: 'rgba(249,115,22,0.25)' },
    teal:    { dot: '#14b8a6', bg: 'rgba(20,184,166,0.15)',  active: 'rgba(20,184,166,0.25)' },
};

const WS_COLORS = Object.keys(WORKSPACE_COLOR_MAP);

function getBoardColor(index) {
    return BOARD_COLORS[index % BOARD_COLORS.length];
}

function SortableBoardItem({ board, index, pathname, onDeleteClick }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: board._id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn('relative group', isDragging && 'opacity-50 z-50')}
        >
            <span
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 cursor-grab opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-text-muted touch-none"
                {...attributes}
                {...listeners}
                title="Drag to reorder"
            >
                <GripVertical className="w-3 h-3" />
            </span>
            <Link
                href={`/boards/${board._id}`}
                className={cn(
                    'flex items-center gap-2.5 pl-6 pr-3 py-2 text-sm rounded-lg transition-all duration-200',
                    pathname === `/boards/${board._id}`
                        ? 'bg-surface-hover text-text-primary font-medium'
                        : 'text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary'
                )}
            >
                <span
                    className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{ backgroundColor: getBoardColor(index) }}
                />
                <span className="truncate pr-6">{board.name}</span>
            </Link>
            <button
                onClick={(e) => onDeleteClick(e, board)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete Board"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default function Sidebar() {
    const pathname = usePathname();
    const { boards, fetchBoards, createBoard, setIsCreateBoardModalOpen, reorderBoards } = useBoards();
    const { workspaces, activeWorkspaceId, setActiveWorkspaceId, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces();
    const { theme, updateTheme, focusMode } = useSettings();
    const [boardsExpanded, setBoardsExpanded] = useState(true);
    const [workspacesExpanded, setWorkspacesExpanded] = useState(true);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [settingsHovered, setSettingsHovered] = useState(false);
    const [boardSearch, setBoardSearch] = useState('');
    const [deletingBoard, setDeletingBoard] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

    // Workspace inline create/edit state
    const [isCreatingWs, setIsCreatingWs] = useState(false);
    const [newWsName, setNewWsName] = useState('');
    const [newWsColor, setNewWsColor] = useState('indigo');
    const [editingWsId, setEditingWsId] = useState(null);
    const [editingWsName, setEditingWsName] = useState('');
    const [wsMenuId, setWsMenuId] = useState(null);
    const [confirmDeleteWs, setConfirmDeleteWs] = useState(null);
    const wsMenuRef = useRef(null);
    const wsInputRef = useRef(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = boards.findIndex(b => b._id === active.id);
        const newIndex = boards.findIndex(b => b._id === over.id);
        reorderBoards(arrayMove(boards, oldIndex, newIndex));
    };

    useEffect(() => {
        fetchBoards();
        fetchWorkspaces();
    }, [fetchBoards, fetchWorkspaces]);

    // Close workspace menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wsMenuRef.current && !wsMenuRef.current.contains(e.target)) setWsMenuId(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Filter boards by active workspace
    const filteredBoards = activeWorkspaceId
        ? boards.filter(b => b.workspaceId === activeWorkspaceId)
        : boards;

    const handleCreateWs = async () => {
        const name = newWsName.trim();
        if (!name) return;
        await createWorkspace({ name, color: newWsColor });
        setNewWsName('');
        setNewWsColor('indigo');
        setIsCreatingWs(false);
    };

    const handleRenameWs = async (id) => {
        const name = editingWsName.trim();
        if (!name) { setEditingWsId(null); return; }
        await updateWorkspace(id, { name });
        setEditingWsId(null);
        setEditingWsName('');
    };

    const handleDeleteWs = (id) => {
        setConfirmDeleteWs(id);
        setWsMenuId(null);
    };

    const executeDeleteWs = async () => {
        if (confirmDeleteWs) {
            await deleteWorkspace(confirmDeleteWs);
            setConfirmDeleteWs(null);
        }
    };

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
        {
            name: 'Archive',
            path: '/archive',
            type: 'archive'
        },
        {
            name: 'AI Analytics',
            path: '/analytics',
            type: 'analytics'
        },
    ];

    const isActive = (path) => {
        if (path === '/') return pathname === '/';
        return pathname === path || pathname.startsWith(path);
    };

    return (
        <aside className={cn(
            "h-screen bg-surface-raised border-r border-border-subtle flex flex-col shrink-0 relative overflow-hidden transition-all duration-300 ease-in-out",
            focusMode ? "w-0 border-none" : "w-64"
        )}>
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
                    <p className="text-[11px] text-text-muted font-medium uppercase tracking-widest leading-none">Notes + Kanban</p>
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
                    <kbd className="text-[11px] font-mono bg-surface-raised px-1.5 py-0.5 rounded border border-border-subtle leading-none">
                        ⌘K
                    </kbd>
                </button>
            </div>

            {/* ===== Navigation ===== */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="text-[11px] text-text-muted uppercase tracking-widest font-semibold px-3 mb-2">
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
                            {item.type === 'archive' ? (
                                <Archive className="w-5 h-5" />
                            ) : item.type === 'analytics' ? (
                                <BarChart3 className="w-5 h-5" />
                            ) : (
                                <AnimatedIcon
                                    type={item.type}
                                    active={hoveredItem === item.name || isActive(item.path)}
                                    className="w-5 h-5"
                                />
                            )}
                        </span>
                        {item.name}
                        {isActive(item.path) && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        )}
                    </Link>
                ))}

                {/* ===== Workspaces Section ===== */}
                <div className="mt-6 pt-4">
                    <button
                        onClick={() => setWorkspacesExpanded(!workspacesExpanded)}
                        className="w-full flex items-center justify-between px-3 mb-2 group"
                    >
                        <span className="text-[11px] text-text-muted uppercase tracking-widest font-semibold group-hover:text-text-secondary transition-colors">
                            Workspaces
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-[11px] text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded-md font-mono">
                                {workspaces.length}
                            </span>
                            <svg
                                className={cn(
                                    "w-3.5 h-3.5 text-text-muted transition-transform duration-200",
                                    workspacesExpanded ? "rotate-0" : "-rotate-90"
                                )}
                                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </span>
                    </button>

                    {workspacesExpanded && (
                        <div className="space-y-0.5 animate-fade-in">
                            {/* "All" item to clear workspace filter */}
                            <button
                                onClick={() => setActiveWorkspaceId(null)}
                                className={cn(
                                    'w-full flex items-center gap-2.5 pl-6 pr-3 py-1.5 text-xs rounded-lg transition-all duration-200',
                                    activeWorkspaceId === null
                                        ? 'bg-surface-hover text-text-primary font-medium'
                                        : 'text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary'
                                )}
                            >
                                <FolderOpen className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                                <span className="truncate">All Items</span>
                            </button>

                            {/* Workspace items */}
                            {workspaces.map((ws) => {
                                const c = WORKSPACE_COLOR_MAP[ws.color] ?? WORKSPACE_COLOR_MAP.indigo;
                                const isActive = activeWorkspaceId === ws._id;

                                return (
                                    <div key={ws._id} className="relative group">
                                        {editingWsId === ws._id ? (
                                            <div className="px-3 py-1">
                                                <input
                                                    type="text"
                                                    value={editingWsName}
                                                    onChange={(e) => setEditingWsName(e.target.value)}
                                                    onBlur={() => handleRenameWs(ws._id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRenameWs(ws._id);
                                                        if (e.key === 'Escape') setEditingWsId(null);
                                                    }}
                                                    className="w-full bg-surface-overlay text-xs font-medium text-text-primary px-2 py-1 rounded border border-accent outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setActiveWorkspaceId(isActive ? null : ws._id)}
                                                className={cn(
                                                    'w-full flex items-center gap-2.5 pl-6 pr-8 py-1.5 text-xs rounded-lg transition-all duration-200',
                                                    isActive
                                                        ? 'font-medium text-text-primary'
                                                        : 'text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary'
                                                )}
                                                style={isActive ? { backgroundColor: c.active } : undefined}
                                            >
                                                <span
                                                    className="w-2.5 h-2.5 rounded shrink-0"
                                                    style={{ backgroundColor: c.dot }}
                                                />
                                                <span className="truncate flex-1 text-left">{ws.name}</span>
                                                <span className="text-[11px] text-text-muted font-mono shrink-0">
                                                    {(ws.boardCount ?? 0) + (ws.noteCount ?? 0)}
                                                </span>
                                            </button>
                                        )}

                                        {/* Context menu trigger */}
                                        {editingWsId !== ws._id && (
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2" ref={wsMenuId === ws._id ? wsMenuRef : undefined}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setWsMenuId(prev => prev === ws._id ? null : ws._id); }}
                                                    className="p-1 rounded text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                                </button>
                                                {wsMenuId === ws._id && (
                                                    <div className="absolute right-0 top-full mt-1 w-36 bg-surface-overlay border border-border-subtle rounded-lg shadow-xl z-50 py-1">
                                                        <button
                                                            onClick={() => { setEditingWsId(ws._id); setEditingWsName(ws.name); setWsMenuId(null); }}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover flex items-center gap-2"
                                                        >
                                                            <Pencil className="w-3 h-3" /> Rename
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteWs(ws._id)}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-3 h-3" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Create workspace inline */}
                            {isCreatingWs ? (
                                <div className="px-3 py-1.5 space-y-1.5">
                                    <input
                                        ref={wsInputRef}
                                        type="text"
                                        value={newWsName}
                                        onChange={(e) => setNewWsName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateWs();
                                            if (e.key === 'Escape') setIsCreatingWs(false);
                                        }}
                                        placeholder="Workspace name"
                                        className="w-full bg-surface-overlay border border-border-default rounded-md px-2 py-1 text-[11px] text-text-primary focus:outline-none focus:border-accent"
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-1">
                                        {WS_COLORS.map(key => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setNewWsColor(key)}
                                                className={cn(
                                                    'w-4 h-4 rounded transition-all',
                                                    newWsColor === key ? 'ring-2 ring-offset-1 ring-offset-transparent scale-110' : 'opacity-50 hover:opacity-80'
                                                )}
                                                style={{
                                                    backgroundColor: WORKSPACE_COLOR_MAP[key].dot,
                                                    ...(newWsColor === key ? { ringColor: WORKSPACE_COLOR_MAP[key].dot } : {}),
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleCreateWs}
                                            disabled={!newWsName.trim()}
                                            className="px-2.5 py-1 rounded bg-accent/20 text-accent text-[11px] font-medium hover:bg-accent/30 disabled:opacity-30"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => setIsCreatingWs(false)}
                                            className="text-[11px] text-text-muted hover:text-text-primary"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreatingWs(true)}
                                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-text-muted hover:text-accent hover:bg-accent/5 rounded-lg transition-all duration-200 group"
                                >
                                    <span className="w-4 h-4 rounded border border-dashed border-text-muted/40 group-hover:border-accent/60 flex items-center justify-center transition-colors">
                                        <Plus className="w-2.5 h-2.5" />
                                    </span>
                                    New Workspace
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ===== Boards Section ===== */}
                <div className="mt-4 pt-3">
                    <button
                        onClick={() => setBoardsExpanded(!boardsExpanded)}
                        className="w-full flex items-center justify-between px-3 mb-2 group"
                    >
                        <span className="text-[11px] text-text-muted uppercase tracking-widest font-semibold group-hover:text-text-secondary transition-colors">
                            {activeWorkspaceId ? 'Boards in Workspace' : 'Boards'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-[11px] text-text-muted bg-surface-overlay px-1.5 py-0.5 rounded-md font-mono">
                                {filteredBoards.length}
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
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext
                                    items={filteredBoards.filter(b => b.name.toLowerCase().includes(boardSearch.toLowerCase())).map(b => b._id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {filteredBoards
                                        .filter(b => b.name.toLowerCase().includes(boardSearch.toLowerCase()))
                                        .map((board, i) => (
                                            <SortableBoardItem
                                                key={board._id}
                                                board={board}
                                                index={i}
                                                pathname={pathname}
                                                onDeleteClick={handleDeleteClick}
                                            />
                                        ))
                                    }
                                </SortableContext>
                            </DndContext>
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

            <ConfirmModal
                isOpen={!!confirmDeleteWs}
                onClose={() => setConfirmDeleteWs(null)}
                onConfirm={executeDeleteWs}
                title="Delete Workspace"
                message="Delete this workspace? Boards and notes inside will become uncategorized."
                confirmText="Delete"
            />
        </aside>
    );
}
