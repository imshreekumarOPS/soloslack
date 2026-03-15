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

    const fetchBoards = useCallback(async () => {
        setLoading(true);
        try {
            const res = await boardsApi.getAll();
            setBoards(res.data);
        } catch (err) {
            console.error(err);
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createBoard = async (data) => {
        const res = await boardsApi.create(data);
        setBoards(prev => [res.data.board, ...prev]);
        return res.data;
    };

    const createColumn = async (data) => {
        const res = await columnsApi.create(data);
        // If we have an active board, add the new column to it
        if (activeBoard?.board?._id === data.boardId) {
            setActiveBoard(prev => ({
                ...prev,
                columns: [...prev.columns, { ...res.data, cards: [] }]
            }));
        }
        return res.data;
    };

    const updateColumn = async (id, data) => {
        const res = await columnsApi.update(id, data);
        if (activeBoard?.board?._id) {
            setActiveBoard(prev => ({
                ...prev,
                columns: prev.columns.map(col => col._id === id ? { ...col, ...res.data } : col)
            }));
        }
        return res.data;
    };

    const deleteColumn = async (id) => {
        await columnsApi.delete(id);
        if (activeBoard?.board?._id) {
            setActiveBoard(prev => ({
                ...prev,
                columns: prev.columns.filter(col => col._id !== id)
            }));
        }
    };

    const updateBoard = async (id, data) => {
        const res = await boardsApi.update(id, data);
        setBoards(prev => prev.map(b => b._id === id ? res.data : b));
        if (activeBoard?.board?._id === id) {
            setActiveBoard(prev => ({ ...prev, board: res.data }));
        }
    };

    const deleteBoard = async (id) => {
        await boardsApi.delete(id);
        setBoards(prev => prev.filter(b => b._id !== id));
        if (activeBoard?.board?._id === id) setActiveBoard(null);
    };

    const moveCard = async (cardId, destination) => {
        await cardsApi.moveCard(cardId, destination);
        // After move, we should probably re-fetch the full board to be safe, 
        // or optimistically update the local state.
        // For now, re-fetch if we have an active board.
        if (activeBoard?.board?._id) {
            fetchBoardFull(activeBoard.board._id);
        }
    };

    const importBoard = async (data) => {
        const res = await boardsApi.import(data);
        await fetchBoards();
        return res.data;
    };

    return (
        <BoardsContext.Provider value={{
            boards, activeBoard, loading, isCreateBoardModalOpen,
            setIsCreateBoardModalOpen, fetchBoards, fetchBoardFull, createBoard, updateBoard, deleteBoard, moveCard, createColumn, updateColumn, deleteColumn, importBoard
        }}>
            {children}
        </BoardsContext.Provider>
    );
}

export const useBoards = () => {
    const context = useContext(BoardsContext);
    return context || { boards: [], activeBoard: null, loading: false, isCreateBoardModalOpen: false, setIsCreateBoardModalOpen: () => { }, fetchBoards: () => { }, fetchBoardFull: () => { }, createBoard: () => { }, updateBoard: () => { }, deleteBoard: () => { }, moveCard: () => { }, createColumn: () => { }, updateColumn: () => { }, deleteColumn: () => { } };
};
