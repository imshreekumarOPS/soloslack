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
    onBulkMoveCards,
    onAddCard,
    onAddColumn,
    onCardClick,
    onUpdateColumn,
    onDeleteColumn,
    selectMode = false,
    selectedCardIds = new Set(),
    onToggleCardSelection,
}) {
    const [activeId, setActiveId] = useState(null);
    const [localCardsByColumn, setLocalCardsByColumn] = useState(cardsByColumn);
    const [multiDragTarget, setMultiDragTarget] = useState(null); // column id during multi-drag

    // Is the current drag a multi-card drag?
    const isMultiDrag = selectMode && activeId && selectedCardIds.size > 1 && selectedCardIds.has(activeId);

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
        setMultiDragTarget(null);
    };

    /** Check if a column would exceed WIP limit with N extra cards */
    const wouldExceedWipLimit = (columnId, extraCount, excludeIds = new Set()) => {
        const col = columns.find(c => c._id === columnId);
        if (!col || col.wipLimit === null) return false;
        const current = (localCardsByColumn[columnId] ?? []).filter(c => !excludeIds.has(c._id)).length;
        return current + extraCount > col.wipLimit;
    };

    /** Check if a single card move would exceed WIP limit */
    const isColumnFull = (columnId) => {
        const col = columns.find(c => c._id === columnId);
        if (!col || col.wipLimit === null) return false;
        const cards = localCardsByColumn[columnId] ?? [];
        return cards.length >= col.wipLimit;
    };

    const handleDragOver = ({ active, over }) => {
        if (!over) return;

        // ── Multi-drag: only track which column we're over ──────────────
        if (isMultiDrag) {
            const overColumn = findColumn(over.id);
            if (!overColumn) return;

            // Check WIP limit for the batch
            if (wouldExceedWipLimit(overColumn, selectedCardIds.size, selectedCardIds)) {
                setMultiDragTarget(null);
                return;
            }

            if (overColumn !== multiDragTarget) {
                setMultiDragTarget(overColumn);

                // Visual feedback: move all selected cards to target column
                setLocalCardsByColumn(() => {
                    const next = {};
                    // Start from original server state, not accumulated local moves
                    for (const colId of Object.keys(cardsByColumn)) {
                        next[colId] = cardsByColumn[colId].filter(c => !selectedCardIds.has(c._id));
                    }
                    // Append all selected cards to target column
                    const selectedCards = Object.values(cardsByColumn).flat().filter(c => selectedCardIds.has(c._id));
                    next[overColumn] = [...next[overColumn], ...selectedCards];
                    return next;
                });
            }
            return;
        }

        // ── Single-card drag (existing logic) ───────────────────────────
        const activeColumn = findColumn(active.id);
        const overColumn = findColumn(over.id);
        if (!activeColumn || !overColumn) return;

        if (activeColumn === overColumn) {
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

        if (isColumnFull(overColumn)) return;

        setLocalCardsByColumn(prev => {
            const activeItems = prev[activeColumn];
            const overItems = prev[overColumn];
            const activeIndex = activeItems.findIndex(c => c._id === active.id);
            const overIndex = overItems.findIndex(c => c._id === over.id);

            let insertAt;
            if (over.id in prev) {
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
            setLocalCardsByColumn(cardsByColumn);
            setMultiDragTarget(null);
            return;
        }

        // ── Multi-drag drop ─────────────────────────────────────────────
        if (isMultiDrag && multiDragTarget) {
            const ids = [...selectedCardIds];
            setMultiDragTarget(null);
            onBulkMoveCards?.(ids, multiDragTarget);
            return;
        }

        // ── Single-card drop (existing logic) ───────────────────────────
        const activeColumn = findColumn(active.id);
        const overColumn = findColumn(over.id);
        if (!activeColumn || !overColumn) return;

        const sourceColumn = Object.keys(cardsByColumn).find(key =>
            cardsByColumn[key].some(card => card._id === active.id)
        );
        if (sourceColumn !== overColumn && isColumnFull(overColumn)) {
            setLocalCardsByColumn(cardsByColumn);
            return;
        }

        const destCards = localCardsByColumn[overColumn];
        const newOrder = destCards.findIndex(c => c._id === active.id);

        onMoveCard(active.id, {
            newColumnId: overColumn,
            newOrder: newOrder < 0 ? 0 : newOrder,
        });
    };

    const handleDragCancel = () => {
        setActiveId(null);
        setMultiDragTarget(null);
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
                        selectMode={selectMode}
                        selectedCardIds={selectedCardIds}
                        onToggleCardSelection={onToggleCardSelection}
                        isMultiDragging={isMultiDrag}
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
                {activeCard ? (
                    isMultiDrag ? (
                        <div className="relative">
                            {/* Stacked cards behind */}
                            <div className="absolute top-1.5 left-1.5 w-full h-full bg-surface-overlay/60 border border-border-subtle rounded-lg" />
                            <div className="absolute top-0.5 left-0.5 w-full h-full bg-surface-overlay/80 border border-border-subtle rounded-lg" />
                            {/* Top card */}
                            <div className="relative">
                                <KanbanCard card={activeCard} isOverlay />
                                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                                    {selectedCardIds.size}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <KanbanCard card={activeCard} isOverlay />
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
