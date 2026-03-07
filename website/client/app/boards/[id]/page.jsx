'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBoards } from '@/context/BoardsContext';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import CardModal from '@/components/kanban/CardModal';
import { cardsApi } from '@/lib/api/cardsApi';

export default function BoardViewPage() {
    const { id } = useParams();
    const { activeBoard, fetchBoardFull, moveCard, loading } = useBoards();
    const [selectedCard, setSelectedCard] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchBoardFull(id);
        }
    }, [id, fetchBoardFull]);

    const handleMoveCard = async (cardId, destination) => {
        await moveCard(cardId, destination);
    };

    const handleAddCard = async (columnId) => {
        const title = prompt('Enter card title:');
        if (title) {
            await cardsApi.create({
                boardId: id,
                columnId,
                title,
            });
            fetchBoardFull(id);
        }
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
                <div>
                    <h1 className="text-lg font-bold text-text-primary">{activeBoard.board.name}</h1>
                    <p className="text-xs text-text-muted">{activeBoard.board.description}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="text-xs font-semibold bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-md transition-colors">
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
                    onCardClick={handleCardClick}
                />
            </div>

            <CardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                card={selectedCard}
                onUpdate={handleUpdateCard}
                onDelete={handleDeleteCard}
            />
        </div>
    );
}
