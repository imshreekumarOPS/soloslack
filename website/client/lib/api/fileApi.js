const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const fileApi = {
    async uploadFile(file, workspaceId = null, noteId = null) {
        const formData = new FormData();
        formData.append('file', file);
        if (workspaceId) formData.append('workspaceId', workspaceId);
        if (noteId) formData.append('noteId', noteId);

        const response = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload file');
        }

        return await response.json();
    },

    async getFiles(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/files?${query}`);
        if (!response.ok) throw new Error('Failed to fetch files');
        return await response.json();
    },

    async fetchFileContent(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch file content');
        return await response.text();
    }
};
