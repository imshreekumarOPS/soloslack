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

export const cardsApi = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/cards${qs ? '?' + qs : ''}`);
    },
    getUpcoming: () => request('/cards/upcoming'),
    getById: (id) => request(`/cards/${id}`),
    create: (data) => request('/cards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d) => request(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    moveCard: (id, data) => request(`/cards/${id}/move`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/cards/${id}`, { method: 'DELETE' }),
    bulkDelete: (ids) => request('/cards/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    bulkMove: (ids, targetColumnId) => request('/cards/bulk-move', { method: 'POST', body: JSON.stringify({ ids, targetColumnId }) }),
    bulkArchive: (ids) => request('/cards/bulk-archive', { method: 'POST', body: JSON.stringify({ ids }) }),
    bulkUnarchive: (ids) => request('/cards/bulk-unarchive', { method: 'POST', body: JSON.stringify({ ids }) }),

    // Comments
    getComments: (cardId) => request(`/cards/${cardId}/comments`),
    createComment: (cardId, body) => request(`/cards/${cardId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
    updateComment: (cardId, commentId, body) => request(`/cards/${cardId}/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ body }) }),
    deleteComment: (cardId, commentId) => request(`/cards/${cardId}/comments/${commentId}`, { method: 'DELETE' }),
};
