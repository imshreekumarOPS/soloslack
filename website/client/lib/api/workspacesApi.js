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

export const workspacesApi = {
    getAll: () => request('/workspaces'),
    getById: (id) => request(`/workspaces/${id}`),
    create: (data) => request('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/workspaces/${id}`, { method: 'DELETE' }),
    reorder: (workspaces) => request('/workspaces/reorder', { method: 'PATCH', body: JSON.stringify({ workspaces }) }),
};
