const BASE = process.env.NEXT_PUBLIC_API_URL;

const request = async (url, options = {}) => {
    const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
    }
    if (res.status === 204) return null;
    return res.json();
};

export const archiveApi = {
    getAll: () => request('/archive'),
    restoreNote: (id) => request(`/notes/${id}/restore`, { method: 'PATCH' }),
    permanentDeleteNote: (id) => request(`/notes/${id}/permanent`, { method: 'DELETE' }),
    restoreBoard: (id) => request(`/boards/${id}/restore`, { method: 'PATCH' }),
    permanentDeleteBoard: (id) => request(`/boards/${id}/permanent`, { method: 'DELETE' }),
};
