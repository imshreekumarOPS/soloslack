import { useState, useEffect } from 'react';
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

export default function KanbanBoard({ board, columns, cardsByColumn, onMoveCard, onAddCard, onAddColumn, onCardClick }) {
    const [activeId, setActiveId] = useState(null);
    const [localCardsByColumn, setLocalCardsByColumn] = useState(cardsByColumn);

    // Sync local state when props change
    useEffect(() => {
        setLocalCardsByColumn(cardsByColumn);
    }, [cardsByColumn]);

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

    const findColumn = (id) => {
        if (id in localCardsByColumn) return id;
        return Object.keys(localCardsByColumn).find((key) =>
            localCardsByColumn[key].some((card) => card._id === id)
        );
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeColumn = findColumn(activeId);
        const overColumn = findColumn(overId);

        if (!activeColumn || !overColumn || activeColumn === overColumn) return;

        setLocalCardsByColumn((prev) => {
            const activeItems = prev[activeColumn];
            const overItems = prev[overColumn];

            const activeIndex = activeItems.findIndex((item) => item._id === activeId);
            const overIndex = overItems.findIndex((item) => item._id === overId);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length;
            } else {
                const isBelowLastItem = over && overIndex === overItems.length - 1;
                const modifier = isBelowLastItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
            }

            return {
                ...prev,
                [activeColumn]: prev[activeColumn].filter((item) => item._id !== activeId),
                [overColumn]: [
                    ...prev[overColumn].slice(0, newIndex),
                    prev[activeColumn][activeIndex],
                    ...prev[overColumn].slice(newIndex, prev[overColumn].length)
                ]
            };
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        const activeId = active.id;

        if (!over) {
            setActiveId(null);
            setLocalCardsByColumn(cardsByColumn);
            return;
        }

        const overId = over.id;
        const activeColumn = findColumn(activeId);
        const overColumn = findColumn(overId);

        if (!activeColumn || !overColumn) {
            setActiveId(null);
            return;
        }

        const destCards = localCardsByColumn[overColumn];
        const newOrder = destCards.findIndex((item) => item._id === activeId);

        onMoveCard(activeId, { newColumnId: overColumn, newOrder });
        setActiveId(null);
    };

    const activeCard = activeId ? Object.values(cardsByColumn).flat().find(c => c._id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 p-6 h-full overflow-x-auto items-start bg-surface-base">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col._id}
                        column={col}
                        cards={localCardsByColumn[col._id] || []}
                        onCardClick={onCardClick}
                        onAddCard={onAddCard}
                    />
                ))}

                <button
                    onClick={onAddColumn}
                    className="w-72 h-12 flex items-center justify-center border-2 border-dashed border-border-subtle rounded-xl text-text-muted hover:text-text-primary hover:border-accent transition-all shrink-0"
                >
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
