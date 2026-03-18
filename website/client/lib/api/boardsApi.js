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

export const boardsApi = {
    getAll: () => request('/boards'),
    getById: (id) => request(`/boards/${id}`),
    getBoardFull: (id) => request(`/boards/${id}/full`),
    create: (data) => request('/boards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d) => request(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    delete: (id) => request(`/boards/${id}`, { method: 'DELETE' }),
    import: (data) => request('/boards/import', { method: 'POST', body: JSON.stringify(data) }),
    reorder: (boards) => request('/boards/reorder', { method: 'PATCH', body: JSON.stringify({ boards }) }),
};
