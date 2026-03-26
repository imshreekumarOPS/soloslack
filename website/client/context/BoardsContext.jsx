'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { boardsApi } from '@/lib/api/boardsApi';
import { cardsApi } from '@/lib/api/cardsApi';
import { columnsApi } from '@/lib/api/columnsApi';
import { useUndo } from '@/context/UndoContext';

const BoardsContext = createContext(null);

export function BoardsProvider({ children }) {
    const [boards, setBoards] = useState([]);
    const [activeBoard, setActiveBoard] = useState(null);
    const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { pushUndo, showToast } = useUndo();

    // Refs for snapshotting state inside undo callbacks without stale closures
    const activeBoardRef = useRef(null);
    activeBoardRef.current = activeBoard;

    const boardsRef = useRef([]);
    boardsRef.current = boards;

    // ─── Board operations ────────────────────────────────────────────────────

    const fetchBoards = useCallback(async () => {
        setLoading(true);
        try {
            const res = await boardsApi.getAll();
            setBoards(res.data);
        } catch (err) {
            console.error('Failed to fetch boards:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBoardFull = useCallback(async (id) => {
        setLoading(true);
        try {
            const res = await boardsApi.getBoardFull(id);
            setActiveBoard(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to fetch board:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createBoard = useCallback(async (data) => {
        const res = await boardsApi.create(data);
        setBoards(prev => [res.data.board, ...prev]);
        return res.data;
    }, []);

    const updateBoard = useCallback(async (id, data) => {
        const res = await boardsApi.update(id, data);
        setBoards(prev => prev.map(b => b._id === id ? res.data : b));
        if (activeBoard?.board?._id === id) {
            setActiveBoard(prev => ({ ...prev, board: res.data }));
        }
        return res.data;
    }, [activeBoard?.board?._id]);

    const deleteBoard = useCallback(async (id) => {
        // Snapshot for undo
        const boardSnapshot = boardsRef.current.find(b => b._id === id);

        await boardsApi.delete(id);
        setBoards(prev => prev.filter(b => b._id !== id));
        if (activeBoard?.board?._id === id) setActiveBoard(null);

        if (boardSnapshot) {
            pushUndo({
                label: `Archived "${boardSnapshot.name}"`,
                undo: async () => {
                    const res = await boardsApi.restore(id);
                    setBoards(prev => [res.data, ...prev]);
                },
            });
        }
    }, [activeBoard?.board?._id, pushUndo]);

    const reorderBoards = useCallback(async (newBoards) => {
        setBoards(newBoards);
        try {
            await boardsApi.reorder(newBoards.map((b, i) => ({ id: b._id, order: i })));
        } catch (err) {
            console.error('Failed to reorder boards:', err);
            fetchBoards();
        }
    }, [fetchBoards]);

    const importBoard = useCallback(async (data) => {
        const res = await boardsApi.import(data);
        await fetchBoards();
        return res.data;
    }, [fetchBoards]);

    // ─── Column operations ───────────────────────────────────────────────────

    const createColumn = useCallback(async (data) => {
        const res = await columnsApi.create(data);
        if (activeBoard?.board?._id === data.boardId) {
            setActiveBoard(prev => ({
                ...prev,
                columns: [...prev.columns, { ...res.data, cards: [] }],
            }));
        }
        return res.data;
    }, [activeBoard?.board?._id]);

    const updateColumn = useCallback(async (id, data) => {
        const res = await columnsApi.update(id, data);
        setActiveBoard(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                columns: prev.columns.map(col => col._id === id ? { ...col, ...res.data } : col),
            };
        });
        return res.data;
    }, []);

    const deleteColumn = useCallback(async (id) => {
        await columnsApi.delete(id);
        setActiveBoard(prev => {
            if (!prev) return prev;
            return { ...prev, columns: prev.columns.filter(col => col._id !== id) };
        });
    }, []);

    // ─── Card operations (optimistic updates + undo) ──────────────────────

    const createCard = useCallback(async ({ boardId, columnId, ...data }) => {
        try {
            const res = await cardsApi.create({ boardId, columnId, ...data });
            const newCard = res.data;
            setActiveBoard(prev => {
                if (!prev || prev.board._id !== boardId) return prev;
                return {
                    ...prev,
                    columns: prev.columns.map(col =>
                        col._id === columnId
                            ? { ...col, cards: [...col.cards, newCard] }
                            : col
                    ),
                };
            });
            return newCard;
        } catch (err) {
            if (err.message?.includes('WIP limit')) {
                showToast({ label: err.message, type: 'error' });
                return null;
            }
            throw err;
        }
    }, []);

    const updateCard = useCallback(async (cardId, data) => {
        // Optimistic update with provided data immediately
        setActiveBoard(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                columns: prev.columns.map(col => ({
                    ...col,
                    cards: col.cards.map(c => c._id === cardId ? { ...c, ...data } : c),
                })),
            };
        });

        // Persist and reconcile with server response
        const res = await cardsApi.update(cardId, data);
        const updated = res.data;
        setActiveBoard(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                columns: prev.columns.map(col => ({
                    ...col,
                    cards: col.cards.map(c => c._id === cardId ? updated : c),
                })),
            };
        });
        return updated;
    }, []);

    const deleteCard = useCallback(async (cardId) => {
        // Snapshot card for undo (re-creation)
        let cardSnapshot = null;
        const board = activeBoardRef.current;
        if (board) {
            for (const col of board.columns) {
                const card = col.cards.find(c => c._id === cardId);
                if (card) {
                    cardSnapshot = { ...card };
                    break;
                }
            }
        }

        await cardsApi.delete(cardId);
        setActiveBoard(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                columns: prev.columns.map(col => ({
                    ...col,
                    cards: col.cards.filter(c => c._id !== cardId),
                })),
            };
        });

        if (cardSnapshot) {
            pushUndo({
                label: `Deleted "${cardSnapshot.title}"`,
                undo: async () => {
                    const res = await cardsApi.create({
                        boardId: cardSnapshot.boardId,
                        columnId: cardSnapshot.columnId,
                        title: cardSnapshot.title,
                        description: cardSnapshot.description,
                        priority: cardSnapshot.priority,
                        dueDate: cardSnapshot.dueDate,
                        linkedNoteId: cardSnapshot.linkedNoteId,
                        labels: cardSnapshot.labels,
                        checklist: cardSnapshot.checklist,
                    });
                    const newCard = res.data;
                    setActiveBoard(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            columns: prev.columns.map(col =>
                                col._id === newCard.columnId
                                    ? { ...col, cards: [...col.cards, newCard] }
                                    : col
                            ),
                        };
                    });
                },
            });
        }
    }, [pushUndo]);

    // Optimistic move — no full re-fetch needed
    const moveCard = useCallback(async (cardId, { newColumnId, newOrder }) => {
        // Snapshot for rollback + undo
        let snapshot = null;
        let oldColumnId = null;
        let oldOrder = null;

        setActiveBoard(prev => {
            if (!prev) return prev;
            snapshot = prev;

            let movingCard = null;
            // Find old position
            for (const col of prev.columns) {
                const idx = col.cards.findIndex(c => c._id === cardId);
                if (idx !== -1) {
                    oldColumnId = col._id;
                    oldOrder = idx;
                    break;
                }
            }

            // Remove card from its current column
            const columns = prev.columns.map(col => {
                const idx = col.cards.findIndex(c => c._id === cardId);
                if (idx !== -1) {
                    movingCard = { ...col.cards[idx], columnId: newColumnId };
                    return { ...col, cards: col.cards.filter(c => c._id !== cardId) };
                }
                return col;
            });

            if (!movingCard) return prev;

            // Insert into destination column at the specified position
            return {
                ...prev,
                columns: columns.map(col => {
                    if (col._id !== newColumnId) return col;
                    const cards = [...col.cards];
                    cards.splice(newOrder, 0, movingCard);
                    return { ...col, cards };
                }),
            };
        });

        try {
            await cardsApi.moveCard(cardId, { newColumnId, newOrder });
        } catch (err) {
            // Revert optimistic update on failure
            if (snapshot) setActiveBoard(snapshot);
            if (err.message?.includes('WIP limit')) {
                showToast({ label: err.message, type: 'error' });
            } else {
                console.error('Failed to move card:', err);
            }
            return; // Don't push undo on failure
        }

        // Push undo for successful moves between columns
        if (oldColumnId && oldColumnId !== newColumnId) {
            pushUndo({
                label: 'Moved card',
                undo: async () => {
                    try {
                        await cardsApi.moveCard(cardId, { newColumnId: oldColumnId, newOrder: oldOrder });
                        // Re-fetch to get correct state
                        const boardId = activeBoardRef.current?.board?._id;
                        if (boardId) {
                            const res = await boardsApi.getBoardFull(boardId);
                            setActiveBoard(res.data);
                        }
                    } catch (err) {
                        console.error('Undo move failed:', err);
                    }
                },
            });
        }
    }, [pushUndo]);

    const bulkDeleteCards = useCallback(async (ids) => {
        // Snapshot cards for undo
        const cardSnapshots = [];
        const board = activeBoardRef.current;
        if (board) {
            const idSet = new Set(ids);
            for (const col of board.columns) {
                for (const card of col.cards) {
                    if (idSet.has(card._id)) {
                        cardSnapshots.push({ ...card });
                    }
                }
            }
        }

        await cardsApi.bulkDelete(ids);
        setActiveBoard(prev => {
            if (!prev) return prev;
            const idSet = new Set(ids);
            return {
                ...prev,
                columns: prev.columns.map(col => ({
                    ...col,
                    cards: col.cards.filter(c => !idSet.has(c._id)),
                })),
            };
        });

        if (cardSnapshots.length > 0) {
            pushUndo({
                label: `Deleted ${cardSnapshots.length} card${cardSnapshots.length > 1 ? 's' : ''}`,
                undo: async () => {
                    for (const snap of cardSnapshots) {
                        const res = await cardsApi.create({
                            boardId: snap.boardId,
                            columnId: snap.columnId,
                            title: snap.title,
                            description: snap.description,
                            priority: snap.priority,
                            dueDate: snap.dueDate,
                            linkedNoteId: snap.linkedNoteId,
                            labels: snap.labels,
                            checklist: snap.checklist,
                        });
                        const newCard = res.data;
                        setActiveBoard(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                columns: prev.columns.map(col =>
                                    col._id === newCard.columnId
                                        ? { ...col, cards: [...col.cards, newCard] }
                                        : col
                                ),
                            };
                        });
                    }
                },
            });
        }
    }, [pushUndo]);

    const bulkMoveCards = useCallback(async (ids, targetColumnId) => {
        // Snapshot original positions for undo
        const cardPositions = [];
        const board = activeBoardRef.current;
        if (board) {
            const idSet = new Set(ids);
            for (const col of board.columns) {
                for (const card of col.cards) {
                    if (idSet.has(card._id)) {
                        cardPositions.push({ cardId: card._id, columnId: col._id });
                    }
                }
            }
        }

        await cardsApi.bulkMove(ids, targetColumnId);
        // Re-fetch board to get correct ordering
        const boardId = activeBoardRef.current?.board?._id;
        if (boardId) {
            await fetchBoardFull(boardId);
        }

        if (cardPositions.length > 0) {
            pushUndo({
                label: `Moved ${cardPositions.length} card${cardPositions.length > 1 ? 's' : ''}`,
                undo: async () => {
                    // Group by original column and move back
                    const byColumn = {};
                    for (const pos of cardPositions) {
                        if (!byColumn[pos.columnId]) byColumn[pos.columnId] = [];
                        byColumn[pos.columnId].push(pos.cardId);
                    }
                    for (const [colId, cardIds] of Object.entries(byColumn)) {
                        await cardsApi.bulkMove(cardIds, colId);
                    }
                    const bid = activeBoardRef.current?.board?._id;
                    if (bid) await fetchBoardFull(bid);
                },
            });
        }
    }, [fetchBoardFull, pushUndo]);

    const bulkArchiveCards = useCallback(async (ids) => {
        // Snapshot cards for undo
        const cardSnapshots = [];
        const board = activeBoardRef.current;
        if (board) {
            const idSet = new Set(ids);
            for (const col of board.columns) {
                for (const card of col.cards) {
                    if (idSet.has(card._id)) {
                        cardSnapshots.push({ ...card, _columnId: col._id });
                    }
                }
            }
        }

        await cardsApi.bulkArchive(ids);
        setActiveBoard(prev => {
            if (!prev) return prev;
            const idSet = new Set(ids);
            return {
                ...prev,
                columns: prev.columns.map(col => ({
                    ...col,
                    cards: col.cards.filter(c => !idSet.has(c._id)),
                })),
            };
        });

        if (cardSnapshots.length > 0) {
            pushUndo({
                label: `Archived ${cardSnapshots.length} card${cardSnapshots.length > 1 ? 's' : ''}`,
                undo: async () => {
                    const res = await cardsApi.bulkUnarchive(ids);
                    const restoredCards = res.data;
                    setActiveBoard(prev => {
                        if (!prev) return prev;
                        const newColumns = prev.columns.map(col => ({ ...col, cards: [...col.cards] }));
                        for (const card of restoredCards) {
                            const colIdx = newColumns.findIndex(c => c._id === card.columnId.toString() || c._id === card.columnId);
                            if (colIdx !== -1) {
                                newColumns[colIdx].cards.push(card);
                            }
                        }
                        return { ...prev, columns: newColumns };
                    });
                },
            });
        }
    }, [pushUndo]);

    return (
        <BoardsContext.Provider value={{
            boards, activeBoard, loading, isCreateBoardModalOpen,
            setIsCreateBoardModalOpen,
            fetchBoards, fetchBoardFull,
            createBoard, updateBoard, deleteBoard, importBoard, reorderBoards,
            createColumn, updateColumn, deleteColumn,
            createCard, updateCard, deleteCard, moveCard,
            bulkDeleteCards, bulkMoveCards, bulkArchiveCards,
        }}>
            {children}
        </BoardsContext.Provider>
    );
}

export const useBoards = () => {
    const context = useContext(BoardsContext);
    if (!context) {
        return {
            boards: [], activeBoard: null, loading: false, isCreateBoardModalOpen: false,
            setIsCreateBoardModalOpen: () => {},
            fetchBoards: () => {}, fetchBoardFull: () => {},
            createBoard: () => {}, updateBoard: () => {}, deleteBoard: () => {}, importBoard: () => {}, reorderBoards: () => {},
            createColumn: () => {}, updateColumn: () => {}, deleteColumn: () => {},
            createCard: () => {}, updateCard: () => {}, deleteCard: () => {}, moveCard: () => {},
            bulkDeleteCards: () => {}, bulkMoveCards: () => {}, bulkArchiveCards: () => {},
        };
    }
    return context;
};
