import { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { Plus } from 'lucide-react';

export default function KanbanBoard({
    columns,
    cardsByColumn,
    onMoveCard,
    onAddCard,
    onAddColumn,
    onCardClick,
    onUpdateColumn,
    onDeleteColumn,
}) {
    const [activeId, setActiveId] = useState(null);
    const [localCardsByColumn, setLocalCardsByColumn] = useState(cardsByColumn);

    // Sync local state when the server-driven prop changes (after a move completes, etc.)
    useEffect(() => {
        setLocalCardsByColumn(cardsByColumn);
    }, [cardsByColumn]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    /** Find the column ID that contains a given card/column ID */
    const findColumn = (id) => {
        if (id in localCardsByColumn) return id; // it's a column ID
        return Object.keys(localCardsByColumn).find(key =>
            localCardsByColumn[key].some(card => card._id === id)
        );
    };

    const handleDragStart = ({ active }) => {
        setActiveId(active.id);
    };

    const handleDragOver = ({ active, over }) => {
        if (!over) return;

        const activeColumn = findColumn(active.id);
        const overColumn = findColumn(over.id);
        if (!activeColumn || !overColumn) return;

        if (activeColumn === overColumn) {
            // Within-column reorder: update local state for visual feedback
            const items = localCardsByColumn[activeColumn];
            const oldIndex = items.findIndex(c => c._id === active.id);
            const newIndex = items.findIndex(c => c._id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                setLocalCardsByColumn(prev => ({
                    ...prev,
                    [activeColumn]: arrayMove(prev[activeColumn], oldIndex, newIndex),
                }));
            }
            return;
        }

        // Cross-column: move card into the destination column
        setLocalCardsByColumn(prev => {
            const activeItems = prev[activeColumn];
            const overItems = prev[overColumn];
            const activeIndex = activeItems.findIndex(c => c._id === active.id);
            const overIndex = overItems.findIndex(c => c._id === over.id);

            let insertAt;
            if (over.id in prev) {
                // Dropped directly on the column container — append
                insertAt = overItems.length;
            } else {
                insertAt = overIndex >= 0 ? overIndex : overItems.length;
            }

            return {
                ...prev,
                [activeColumn]: activeItems.filter(c => c._id !== active.id),
                [overColumn]: [
                    ...overItems.slice(0, insertAt),
                    activeItems[activeIndex],
                    ...overItems.slice(insertAt),
                ],
            };
        });
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);

        if (!over) {
            // Drag cancelled — revert to server state
            setLocalCardsByColumn(cardsByColumn);
            return;
        }

        const activeColumn = findColumn(active.id);
        const overColumn = findColumn(over.id);
        if (!activeColumn || !overColumn) return;

        // localCardsByColumn is already in the correct visual order (updated by handleDragOver)
        const destCards = localCardsByColumn[overColumn];
        const newOrder = destCards.findIndex(c => c._id === active.id);

        onMoveCard(active.id, {
            newColumnId: overColumn,
            newOrder: newOrder < 0 ? 0 : newOrder,
        });
    };

    const handleDragCancel = () => {
        setActiveId(null);
        setLocalCardsByColumn(cardsByColumn);
    };

    const activeCard = activeId
        ? Object.values(cardsByColumn).flat().find(c => c._id === activeId)
        : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="flex gap-5 p-6 h-full overflow-x-auto items-start bg-surface-base">
                {columns.map(col => (
                    <KanbanColumn
                        key={col._id}
                        column={col}
                        cards={localCardsByColumn[col._id] ?? []}
                        onCardClick={onCardClick}
                        onAddCard={onAddCard}
                        onUpdateColumn={onUpdateColumn}
                        onDeleteColumn={onDeleteColumn}
                    />
                ))}

                <button
                    onClick={onAddColumn}
                    className="w-64 h-12 flex items-center justify-center gap-2 border-2 border-dashed border-border-subtle rounded-xl text-text-muted text-sm hover:text-text-primary hover:border-accent transition-all shrink-0"
                >
                    <Plus className="w-4 h-4" /> Add Column
                </button>
            </div>

            <DragOverlay
                dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: { active: { opacity: '0.4' } },
                    }),
                }}
            >
                {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
