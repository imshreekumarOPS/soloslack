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

export const notesApi = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/notes${qs ? '?' + qs : ''}`);
    },
    getById: (id) => request(`/notes/${id}`),
    create: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d) => request(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    delete: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
    restore: (id) => request(`/notes/${id}/restore`, { method: 'PATCH' }),
    bulkArchive: (ids) => request('/notes/bulk-archive', { method: 'POST', body: JSON.stringify({ ids }) }),
    bulkDelete: (ids) => request('/notes/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    bulkRestore: (ids) => request('/notes/bulk-restore', { method: 'POST', body: JSON.stringify({ ids }) }),
    bulkTag: (ids, tag) => request('/notes/bulk-tag', { method: 'POST', body: JSON.stringify({ ids, tag }) }),
};
