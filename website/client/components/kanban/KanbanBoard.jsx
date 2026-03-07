import { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

export default function KanbanBoard({ board, columns, cardsByColumn, onMoveCard, onAddCard, onCardClick }) {
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) {
            setActiveId(null);
            return;
        }

        const activeCardId = active.id;
        const overId = over.id;

        // Find the column the user dropped it over
        // If dropped over a card, find its column
        let overColumnId = null;
        const isOverColumn = columns.some(c => c._id === overId);

        if (isOverColumn) {
            overColumnId = overId;
        } else {
            // Find which column contains the overId (card)
            for (const colId in cardsByColumn) {
                if (cardsByColumn[colId].some(c => c._id === overId)) {
                    overColumnId = colId;
                    break;
                }
            }
        }

        if (!overColumnId) {
            setActiveId(null);
            return;
        }

        // Determine new order position
        const colCards = cardsByColumn[overColumnId] || [];
        const overIndex = colCards.findIndex(c => c._id === overId);
        const newOrder = overIndex >= 0 ? overIndex : colCards.length;

        onMoveCard(activeCardId, { newColumnId: overColumnId, newOrder });
        setActiveId(null);
    };

    const activeCard = activeId ? Object.values(cardsByColumn).flat().find(c => c._id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 p-6 h-full overflow-x-auto items-start bg-surface-base">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col._id}
                        column={col}
                        cards={cardsByColumn[col._id] || []}
                        onCardClick={onCardClick}
                        onAddCard={onAddCard}
                    />
                ))}

                <button className="w-72 h-12 flex items-center justify-center border-2 border-dashed border-border-subtle rounded-xl text-text-muted hover:text-text-primary hover:border-accent transition-all shrink-0">
                    + Add Column
                </button>
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.5',
                        },
                    },
                }),
            }}>
                {activeId && activeCard ? (
                    <KanbanCard card={activeCard} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
