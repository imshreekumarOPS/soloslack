'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { boardsApi } from '@/lib/api/boardsApi';
import { cardsApi } from '@/lib/api/cardsApi';
import { columnsApi } from '@/lib/api/columnsApi';

const BoardsContext = createContext(null);

export function BoardsProvider({ children }) {
    const [boards, setBoards] = useState([]);
    const [activeBoard, setActiveBoard] = useState(null);
    const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

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
        await boardsApi.delete(id);
        setBoards(prev => prev.filter(b => b._id !== id));
        if (activeBoard?.board?._id === id) setActiveBoard(null);
    }, [activeBoard?.board?._id]);

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

    // ─── Card operations (optimistic updates) ───────────────────────────────

    const createCard = useCallback(async ({ boardId, columnId, ...data }) => {
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
    }, []);

    // Optimistic move — no full re-fetch needed
    const moveCard = useCallback(async (cardId, { newColumnId, newOrder }) => {
        setActiveBoard(prev => {
            if (!prev) return prev;
            let movingCard = null;

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

        await cardsApi.moveCard(cardId, { newColumnId, newOrder });
    }, []);

    return (
        <BoardsContext.Provider value={{
            boards, activeBoard, loading, isCreateBoardModalOpen,
            setIsCreateBoardModalOpen,
            fetchBoards, fetchBoardFull,
            createBoard, updateBoard, deleteBoard, importBoard,
            createColumn, updateColumn, deleteColumn,
            createCard, updateCard, deleteCard, moveCard,
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
            createBoard: () => {}, updateBoard: () => {}, deleteBoard: () => {}, importBoard: () => {},
            createColumn: () => {}, updateColumn: () => {}, deleteColumn: () => {},
            createCard: () => {}, updateCard: () => {}, deleteCard: () => {}, moveCard: () => {},
        };
    }
    return context;
};
