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
import { exportBoardToJson, exportBoardToCsv } from '@/lib/utils/exportUtils';
import { Download, Upload, Plus, AlertCircle, LayoutDashboard, CalendarDays, CheckSquare, X, Trash2, Archive, ArrowRight, FileJson, FileSpreadsheet } from 'lucide-react';
import { useUndo } from '@/context/UndoContext';
import { cn } from '@/lib/utils/cn';

export default function BoardViewPage() {
    const { id } = useParams();
    const {
        activeBoard, fetchBoardFull, loading,
        moveCard, createCard, updateCard, deleteCard,
        createColumn, updateColumn, deleteColumn,
        importBoard,
        bulkDeleteCards, bulkMoveCards, bulkArchiveCards,
    } = useBoards();
    const { showToast } = useUndo();

    const [selectedCardId, setSelectedCardId] = useState(null);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [activeColumnId, setActiveColumnId] = useState(null);
    const [view, setView] = useState('kanban'); // 'kanban' | 'calendar'
    const [selectMode, setSelectMode] = useState(false);
    const [selectedCardIds, setSelectedCardIds] = useState(new Set());
    const [bulkMoveTarget, setBulkMoveTarget] = useState(null); // column id for move dropdown
    const [showExportMenu, setShowExportMenu] = useState(false);

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

    const handleExportJson = useCallback(() => {
        if (activeBoard) exportBoardToJson(activeBoard);
        setShowExportMenu(false);
    }, [activeBoard]);

    const handleExportCsv = useCallback(() => {
        if (activeBoard) exportBoardToCsv(activeBoard);
        setShowExportMenu(false);
    }, [activeBoard]);

    const handleImport = useCallback(async (data) => {
        const res = await importBoard(data);
        if (res?.boardId) window.location.href = `/boards/${res.boardId}`;
    }, [importBoard]);

    const toggleSelectMode = useCallback(() => {
        setSelectMode(prev => !prev);
        setSelectedCardIds(new Set());
        setBulkMoveTarget(null);
    }, []);

    const toggleCardSelection = useCallback((cardId) => {
        setSelectedCardIds(prev => {
            const next = new Set(prev);
            if (next.has(cardId)) next.delete(cardId);
            else next.add(cardId);
            return next;
        });
    }, []);

    const selectAllCards = useCallback(() => {
        if (!activeBoard) return;
        const allIds = activeBoard.columns.flatMap(c => c.cards.map(card => card._id));
        setSelectedCardIds(new Set(allIds));
    }, [activeBoard]);

    const handleBulkDelete = useCallback(async () => {
        const ids = [...selectedCardIds];
        if (ids.length === 0) return;
        if (!confirm(`Delete ${ids.length} card${ids.length > 1 ? 's' : ''} permanently?`)) return;
        await bulkDeleteCards(ids);
        setSelectedCardIds(new Set());
    }, [selectedCardIds, bulkDeleteCards]);

    const handleBulkArchive = useCallback(async () => {
        const ids = [...selectedCardIds];
        if (ids.length === 0) return;
        await bulkArchiveCards(ids);
        setSelectedCardIds(new Set());
    }, [selectedCardIds, bulkArchiveCards]);

    // Accepts (ids, targetColumnId) from drag-drop or (targetColumnId) from toolbar
    const handleBulkMove = useCallback(async (idsOrColumnId, maybeColumnId) => {
        let ids, targetColumnId;
        if (Array.isArray(idsOrColumnId)) {
            ids = idsOrColumnId;
            targetColumnId = maybeColumnId;
        } else {
            ids = [...selectedCardIds];
            targetColumnId = idsOrColumnId;
        }
        if (ids.length === 0) return;
        try {
            await bulkMoveCards(ids, targetColumnId);
            setSelectedCardIds(new Set());
            setBulkMoveTarget(null);
        } catch (err) {
            showToast({ label: err.message, type: 'error' });
        }
    }, [selectedCardIds, bulkMoveCards]);

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
                    {/* Select mode toggle */}
                    <button
                        onClick={toggleSelectMode}
                        className={cn(
                            'p-1.5 rounded-md transition-colors',
                            selectMode
                                ? 'bg-accent/20 text-accent'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        )}
                        title={selectMode ? 'Exit select mode' : 'Select cards'}
                    >
                        <CheckSquare className="w-4 h-4" />
                    </button>

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
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(prev => !prev)}
                            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                            title="Export board"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        {showExportMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 bg-surface-overlay border border-border-subtle rounded-lg shadow-xl py-1 min-w-[170px] z-50">
                                    <button
                                        onClick={handleExportJson}
                                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center gap-2"
                                    >
                                        <FileJson className="w-3.5 h-3.5" /> Export as JSON
                                    </button>
                                    <button
                                        onClick={handleExportCsv}
                                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center gap-2"
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5" /> Export as CSV
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
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
                        onBulkMoveCards={handleBulkMove}
                        onAddCard={handleAddCard}
                        onAddColumn={() => setIsColumnModalOpen(true)}
                        onCardClick={selectMode ? null : handleCardClick}
                        onUpdateColumn={updateColumn}
                        onDeleteColumn={deleteColumn}
                        selectMode={selectMode}
                        selectedCardIds={selectedCardIds}
                        onToggleCardSelection={toggleCardSelection}
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

            {/* Bulk actions toolbar */}
            {selectMode && selectedCardIds.size > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-surface-overlay border border-border-default rounded-xl shadow-2xl px-4 py-2.5 animate-in slide-in-from-bottom-4">
                    <span className="text-xs font-semibold text-text-primary mr-1">
                        {selectedCardIds.size} selected
                    </span>

                    <button
                        onClick={selectAllCards}
                        className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
                    >
                        Select all
                    </button>

                    <div className="w-px h-5 bg-border-subtle mx-1" />

                    {/* Move to column */}
                    <div className="relative">
                        <button
                            onClick={() => setBulkMoveTarget(prev => prev ? null : 'open')}
                            className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-hover hover:bg-surface-active px-2.5 py-1.5 rounded-md transition-colors"
                        >
                            <ArrowRight className="w-3.5 h-3.5" /> Move
                        </button>
                        {bulkMoveTarget && (
                            <div className="absolute bottom-full mb-2 left-0 bg-surface-overlay border border-border-subtle rounded-lg shadow-xl py-1 min-w-[160px] z-50">
                                {activeBoard.columns.map(col => (
                                    <button
                                        key={col._id}
                                        onClick={() => handleBulkMove(col._id)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                                    >
                                        {col.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleBulkArchive}
                        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-amber-400 bg-surface-hover hover:bg-amber-500/10 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                        <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-red-400 bg-surface-hover hover:bg-red-500/10 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>

                    <div className="w-px h-5 bg-border-subtle mx-1" />

                    <button
                        onClick={toggleSelectMode}
                        className="p-1 text-text-muted hover:text-text-primary transition-colors"
                        title="Cancel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
