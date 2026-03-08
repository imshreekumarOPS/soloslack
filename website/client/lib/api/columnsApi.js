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

export const columnsApi = {
    getAll: (boardId) => request(`/columns?boardId=${boardId}`),
    create: (data) => request('/columns', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/columns/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/columns/${id}`, { method: 'DELETE' }),
};
