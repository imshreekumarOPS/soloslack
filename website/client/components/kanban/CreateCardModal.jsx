'use client';
import { useState } from 'react';
import Modal from '../ui/Modal';
import { cn } from '@/lib/utils/cn';

const PRIORITIES = ['low', 'medium', 'high'];

export default function CreateCardModal({ isOpen, onClose, onCreate }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const reset = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Task title is required');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            await onCreate({
                title: title.trim(),
                description: description.trim(),
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            });
            reset();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create card');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Task">
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Title */}
                <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                        Task Title <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Design landing page"
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                        autoFocus
                    />
                    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Priority</label>
                    <div className="flex gap-2">
                        {PRIORITIES.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={cn(
                                    'flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-all',
                                    priority === p
                                        ? p === 'low'
                                            ? 'bg-green-500/20 border-green-500 text-green-400'
                                            : p === 'medium'
                                                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                                : 'bg-red-500/20 border-red-500 text-red-400'
                                        : 'bg-surface-overlay border-border-default text-text-secondary hover:border-border-strong'
                                )}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Due Date */}
                <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                        Due Date <span className="text-text-muted font-normal normal-case">(optional)</span>
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What needs to be done? (markdown supported)"
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[90px] resize-none transition-colors font-mono"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !title.trim()}
                        className="bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-md transition-all text-sm font-semibold"
                    >
                        {isSubmitting ? 'Creating…' : 'Create Task'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
