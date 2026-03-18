'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBoards } from '@/context/BoardsContext';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import BoardCalendar from '@/components/kanban/BoardCalendar';
import CardModal from '@/components/kanban/CardModal';
import CreateColumnModal from '@/components/kanban/CreateColumnModal';
import CreateCardModal from '@/components/kanban/CreateCardModal';
import ImportBoardModal from '@/components/kanban/ImportBoardModal';
import { exportBoardToJson } from '@/lib/utils/exportUtils';
import { Download, Upload, Plus, AlertCircle, LayoutDashboard, CalendarDays } from 'lucide-react';

export default function BoardViewPage() {
    const { id } = useParams();
    const {
        activeBoard, fetchBoardFull, loading,
        moveCard, createCard, updateCard, deleteCard,
        createColumn, updateColumn, deleteColumn,
        importBoard,
    } = useBoards();

    const [selectedCardId, setSelectedCardId] = useState(null);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [activeColumnId, setActiveColumnId] = useState(null);
    const [view, setView] = useState('kanban'); // 'kanban' | 'calendar'

    useEffect(() => {
        if (id) fetchBoardFull(id);
    }, [id, fetchBoardFull]);

    // Derive live card from activeBoard — always in sync with optimistic updates
    const selectedCard = useMemo(() => {
        if (!selectedCardId || !activeBoard) return null;
        return activeBoard.columns.flatMap(c => c.cards).find(c => c._id === selectedCardId) ?? null;
    }, [selectedCardId, activeBoard]);

    // Memoize cardsByColumn so KanbanBoard's sync effect only fires on real changes
    const cardsByColumn = useMemo(() => {
        if (!activeBoard) return {};
        return Object.fromEntries(
            activeBoard.columns.map(col => [col._id, col.cards ?? []])
        );
    }, [activeBoard]);

    // Board stats for the header
    const stats = useMemo(() => {
        if (!activeBoard) return null;
        const allCards = activeBoard.columns.flatMap(c => c.cards);
        const now = new Date();
        return {
            total: allCards.length,
            high: allCards.filter(c => c.priority === 'high').length,
            overdue: allCards.filter(c => c.dueDate && new Date(c.dueDate) < now).length,
        };
    }, [activeBoard]);

    // ─── Handlers ───────────────────────────────────────────────────────────

    const handleCardClick = useCallback((card) => {
        setSelectedCardId(card._id);
        setIsCardModalOpen(true);
    }, []);

    const handleCloseCardModal = useCallback(() => {
        setIsCardModalOpen(false);
        setSelectedCardId(null);
    }, []);

    const handleAddCard = useCallback((columnId) => {
        setActiveColumnId(columnId);
        setIsCreateCardModalOpen(true);
    }, []);

    const handleCreateCard = useCallback(async (data) => {
        await createCard({ boardId: id, columnId: activeColumnId, ...data });
    }, [createCard, id, activeColumnId]);

    const handleAddColumn = useCallback(async (data) => {
        await createColumn({ boardId: id, ...data });
    }, [createColumn, id]);

    const handleUpdateCard = useCallback(async (cardId, data) => {
        return await updateCard(cardId, data);
    }, [updateCard]);

    const handleDeleteCard = useCallback(async (cardId) => {
        await deleteCard(cardId);
        setIsCardModalOpen(false);
        setSelectedCardId(null);
    }, [deleteCard]);

    const handleExport = useCallback(() => {
        if (activeBoard) exportBoardToJson(activeBoard);
    }, [activeBoard]);

    const handleImport = useCallback(async (data) => {
        const res = await importBoard(data);
        if (res?.boardId) window.location.href = `/boards/${res.boardId}`;
    }, [importBoard]);

    // ─── Render ──────────────────────────────────────────────────────────────

    if (loading && !activeBoard) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-text-muted">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading board…</span>
                </div>
            </div>
        );
    }

    if (!activeBoard) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-text-muted">
                    <AlertCircle className="w-10 h-10 opacity-30" />
                    <span className="text-sm">Board not found</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-surface-base">
            {/* Board header */}
            <header className="h-14 border-b border-border-subtle px-6 flex items-center justify-between shrink-0 bg-surface-raised/20">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                        <h1 className="text-base font-bold text-text-primary truncate leading-tight">
                            {activeBoard.board.name}
                        </h1>
                        {activeBoard.board.description && (
                            <p className="text-xs text-text-muted truncate">{activeBoard.board.description}</p>
                        )}
                    </div>

                    {/* Stats pills */}
                    {stats && stats.total > 0 && (
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <span className="text-[10px] bg-surface-overlay border border-border-subtle px-2 py-0.5 rounded-full text-text-muted">
                                {stats.total} card{stats.total !== 1 ? 's' : ''}
                            </span>
                            {stats.high > 0 && (
                                <span className="text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full text-red-400">
                                    {stats.high} high
                                </span>
                            )}
                            {stats.overdue > 0 && (
                                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-amber-400">
                                    {stats.overdue} overdue
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* View toggle */}
                    <div className="flex bg-surface-overlay rounded-md p-0.5 border border-border-default mr-1">
                        <button
                            onClick={() => setView('kanban')}
                            className={`p-1.5 rounded flex items-center gap-1 text-xs transition-colors ${view === 'kanban' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
                            title="Kanban view"
                        >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`p-1.5 rounded flex items-center gap-1 text-xs transition-colors ${view === 'calendar' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
                            title="Calendar view"
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                        title="Import board"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleExport}
                        className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                        title="Export board as JSON"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsColumnModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-accent hover:bg-accent/90 text-white px-3 py-1.5 rounded-md transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Column
                    </button>
                </div>
            </header>

            {/* Board body */}
            <div className="flex-1 overflow-hidden">
                {view === 'kanban' ? (
                    <KanbanBoard
                        columns={activeBoard.columns}
                        cardsByColumn={cardsByColumn}
                        onMoveCard={moveCard}
                        onAddCard={handleAddCard}
                        onAddColumn={() => setIsColumnModalOpen(true)}
                        onCardClick={handleCardClick}
                        onUpdateColumn={updateColumn}
                        onDeleteColumn={deleteColumn}
                    />
                ) : (
                    <BoardCalendar
                        columns={activeBoard.columns}
                        onCardClick={handleCardClick}
                    />
                )}
            </div>

            {/* Modals */}
            <CardModal
                isOpen={isCardModalOpen}
                onClose={handleCloseCardModal}
                card={selectedCard}
                onUpdate={handleUpdateCard}
                onDelete={handleDeleteCard}
            />
            <CreateCardModal
                isOpen={isCreateCardModalOpen}
                onClose={() => setIsCreateCardModalOpen(false)}
                onCreate={handleCreateCard}
            />
            <CreateColumnModal
                isOpen={isColumnModalOpen}
                onClose={() => setIsColumnModalOpen(false)}
                onCreate={handleAddColumn}
            />
            <ImportBoardModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
            />
        </div>
    );
}
