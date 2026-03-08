'use client';
import { useState } from 'react';
import Modal from '../ui/Modal';

export default function CreateColumnModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Column name is required');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            await onCreate({ name: name.trim() });
            setName('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create column');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Column">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
                        Column Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. In Review"
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                        autoFocus
                    />
                    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !name.trim()}
                        className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-all text-sm font-semibold shadow-lg shadow-accent/20"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Column'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
