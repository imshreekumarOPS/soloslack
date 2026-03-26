'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { workspacesApi } from '@/lib/api/workspacesApi';

const WorkspacesContext = createContext(null);

export function WorkspacesProvider({ children }) {
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(null); // null = all items
    const [loading, setLoading] = useState(false);

    const fetchWorkspaces = useCallback(async () => {
        setLoading(true);
        try {
            const res = await workspacesApi.getAll();
            setWorkspaces(res.data);
        } catch (err) {
            console.error('Failed to fetch workspaces:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createWorkspace = useCallback(async (data) => {
        const res = await workspacesApi.create(data);
        setWorkspaces(prev => [...prev, { ...res.data, boardCount: 0, noteCount: 0 }]);
        return res.data;
    }, []);

    const updateWorkspace = useCallback(async (id, data) => {
        const res = await workspacesApi.update(id, data);
        setWorkspaces(prev => prev.map(w => w._id === id ? { ...w, ...res.data } : w));
        return res.data;
    }, []);

    const deleteWorkspace = useCallback(async (id) => {
        await workspacesApi.delete(id);
        setWorkspaces(prev => prev.filter(w => w._id !== id));
        if (activeWorkspaceId === id) setActiveWorkspaceId(null);
    }, [activeWorkspaceId]);

    const reorderWorkspaces = useCallback(async (newWorkspaces) => {
        setWorkspaces(newWorkspaces);
        try {
            await workspacesApi.reorder(newWorkspaces.map((w, i) => ({ id: w._id, order: i })));
        } catch (err) {
            console.error('Failed to reorder workspaces:', err);
            fetchWorkspaces();
        }
    }, [fetchWorkspaces]);

    return (
        <WorkspacesContext.Provider value={{
            workspaces, activeWorkspaceId, loading,
            setActiveWorkspaceId,
            fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, reorderWorkspaces,
        }}>
            {children}
        </WorkspacesContext.Provider>
    );
}

export const useWorkspaces = () => {
    const context = useContext(WorkspacesContext);
    if (!context) {
        return {
            workspaces: [], activeWorkspaceId: null, loading: false,
            setActiveWorkspaceId: () => {},
            fetchWorkspaces: () => {}, createWorkspace: () => {},
            updateWorkspace: () => {}, deleteWorkspace: () => {}, reorderWorkspaces: () => {},
        };
    }
    return context;
};
