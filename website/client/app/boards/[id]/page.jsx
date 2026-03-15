'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBoards } from '@/context/BoardsContext';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import CardModal from '@/components/kanban/CardModal';
import CreateColumnModal from '@/components/kanban/CreateColumnModal';
import CreateCardModal from '@/components/kanban/CreateCardModal';
import ImportBoardModal from '@/components/kanban/ImportBoardModal';
import { cardsApi } from '@/lib/api/cardsApi';

export default function BoardViewPage() {
    const { id } = useParams();
    const { activeBoard, fetchBoardFull, moveCard, createColumn, updateColumn, deleteColumn, importBoard, loading } = useBoards();
    const [selectedCard, setSelectedCard] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [activeColumnId, setActiveColumnId] = useState(null);

    useEffect(() => {
        if (id) {
            fetchBoardFull(id);
        }
    }, [id, fetchBoardFull]);

    const handleMoveCard = async (cardId, destination) => {
        await moveCard(cardId, destination);
    };

    const handleAddCard = (columnId) => {
        setActiveColumnId(columnId);
        setIsCardModalOpen(true);
    };

    const handleCreateCard = async (data) => {
        await cardsApi.create({
            boardId: id,
            columnId: activeColumnId,
            ...data,
        });
        fetchBoardFull(id);
    };

    const handleAddColumn = async (data) => {
        await createColumn({
            boardId: id,
            ...data,
        });
    };

    const handleCardClick = (card) => {
        setSelectedCard(card);
        setIsModalOpen(true);
    };

    const handleUpdateCard = async (cardId, data) => {
        await cardsApi.update(cardId, data);
        // Optimistically update if needed, but for now re-fetch
        // fetchBoardFull(id);
    };

    const handleDeleteCard = async (cardId) => {
        await cardsApi.delete(cardId);
        fetchBoardFull(id);
    };

    const handleExport = () => {
        if (!activeBoard) return;

        // Clean up data for export - only include necessary fields
        const exportData = {
            board: {
                name: activeBoard.board.name,
                description: activeBoard.board.description
            },
            columns: activeBoard.columns.map(col => ({
                name: col.name,
                order: col.order,
                cards: (col.cards || []).map(card => ({
                    title: card.title,
                    description: card.description,
                    priority: card.priority,
                    tags: card.tags,
                    order: card.order,
                    dueDate: card.dueDate,
                    linkedNoteId: card.linkedNoteId
                }))
            }))
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeBoard.board.name.replace(/\s+/g, '_')}_export.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = async (data) => {
        try {
            const res = await importBoard(data);
            if (res && res.boardId) {
                window.location.href = `/boards/${res.boardId}`;
            }
        } catch (err) {
            throw err; // Let modal handle error display
        }
    };

    if (loading && !activeBoard) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin text-accent text-3xl">◌</div>
            </div>
        );
    }

    if (!activeBoard) return null;

    // Group cards by column for the board component
    const cardsByColumn = {};
    activeBoard.columns.forEach(col => {
        cardsByColumn[col._id] = col.cards || [];
    });

    return (
        <div className="h-full flex flex-col overflow-hidden bg-surface-base">
            <header className="h-14 border-b border-border-subtle px-6 flex items-center justify-between shrink-0 bg-surface-raised/20">
                <div className="min-w-0">
                    <h1 className="text-lg font-bold text-text-primary truncate">{activeBoard.board.name}</h1>
                    <p className="text-xs text-text-muted truncate">{activeBoard.board.description}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-primary px-3 py-1.5 rounded-md transition-colors flex items-center gap-2"
                    >
                        <span>Import</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-primary px-3 py-1.5 rounded-md transition-colors flex items-center gap-2"
                    >
                        <span>Export</span>
                    </button>
                    <button
                        onClick={() => setIsColumnModalOpen(true)}
                        className="text-xs font-semibold bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                    >
                        + Add Column
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden">
                <KanbanBoard
                    board={activeBoard.board}
                    columns={activeBoard.columns}
                    cardsByColumn={cardsByColumn}
                    onMoveCard={handleMoveCard}
                    onAddCard={handleAddCard}
                    onAddColumn={() => setIsColumnModalOpen(true)}
                    onCardClick={handleCardClick}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                />
            </div>

            <CardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                card={selectedCard}
                onUpdate={handleUpdateCard}
                onDelete={handleDeleteCard}
            />
            <CreateColumnModal
                isOpen={isColumnModalOpen}
                onClose={() => setIsColumnModalOpen(false)}
                onCreate={handleAddColumn}
            />
            <CreateCardModal
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                onCreate={handleCreateCard}
            />
            <ImportBoardModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
            />
        </div>
    );
}
