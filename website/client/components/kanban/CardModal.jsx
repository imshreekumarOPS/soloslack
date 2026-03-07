import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useBoards } from '@/context/BoardsContext';
import { cn } from '@/lib/utils/cn';

export default function CardModal({ isOpen, onClose, card, onUpdate, onDelete }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');

    useEffect(() => {
        if (card) {
            setTitle(card.title || '');
            setDescription(card.description || '');
            setPriority(card.priority || 'medium');
        }
    }, [card]);

    const debouncedTitle = useDebounce(title, 1000);
    const debouncedDesc = useDebounce(description, 1000);

    useEffect(() => {
        if (card && (debouncedTitle !== card.title || debouncedDesc !== card.description)) {
            onUpdate(card._id, { title: debouncedTitle, description: debouncedDesc });
        }
    }, [debouncedTitle, debouncedDesc, card, onUpdate]);

    const handlePriorityChange = (p) => {
        setPriority(p);
        onUpdate(card._id, { priority: p });
    };

    if (!card) return null;

    const priorities = ['low', 'medium', 'high'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Task Detail">
            <div className="space-y-6">
                <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                </section>

                <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Priority</label>
                    <div className="flex gap-2">
                        {priorities.map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePriorityChange(p)}
                                className={cn(
                                    "flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-all",
                                    priority === p
                                        ? (p === 'low' ? "bg-green-500/20 border-green-500 text-green-400" :
                                            p === 'medium' ? "bg-amber-500/20 border-amber-500 text-amber-400" :
                                                "bg-red-500/20 border-red-500 text-red-400")
                                        : "bg-surface-overlay border-border-default text-text-secondary hover:border-border-strong"
                                )}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a more detailed description..."
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[120px] resize-none"
                    />
                </section>

                <section className="bg-surface-base/50 p-4 rounded-lg border border-border-subtle">
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Linked Note</label>
                    {card.linkedNoteId ? (
                        <div className="flex items-center justify-between p-2 bg-accent-subtle/20 border border-accent/20 rounded-md">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📄</span>
                                <span className="text-sm font-medium text-accent">Linked to a Note</span>
                            </div>
                            <button
                                onClick={() => handlePriorityChange(null)} // Reuse update for now or add specific
                                className="text-xs text-text-muted hover:text-red-400"
                            >
                                Unlink
                            </button>
                        </div>
                    ) : (
                        <button className="w-full py-2 border border-dashed border-border-default rounded-md text-xs text-text-muted hover:text-text-primary hover:border-accent transition-all">
                            + Link to a Note
                        </button>
                    )}
                </section>

                <section className="pt-4 border-t border-border-subtle flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (confirm('Delete this card?')) {
                                onDelete(card._id);
                                onClose();
                            }
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
                    >
                        <span>🗑</span> Delete Card
                    </button>

                    <div className="text-[10px] text-text-muted italic">
                        Last updated {new Date(card.updatedAt).toLocaleString()}
                    </div>
                </section>
            </div>
        </Modal>
    );
}
