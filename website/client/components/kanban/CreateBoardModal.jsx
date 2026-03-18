'use client';
import { useState } from 'react';
import { LayoutTemplate, Bug, Zap, FileText, Map, Users } from 'lucide-react';
import Modal from '../ui/Modal';
import { cn } from '@/lib/utils/cn';

// ── Template definitions ──────────────────────────────────────────

const TEMPLATES = [
    {
        id: 'blank',
        Icon: LayoutTemplate,
        name: 'Blank Board',
        description: 'Start with the classic 3-column setup',
        columns: ['To Do', 'In Progress', 'Done'],
        defaultName: '',
        color: '#6366f1', // indigo
    },
    {
        id: 'bug-tracker',
        Icon: Bug,
        name: 'Bug Tracker',
        description: 'Triage and resolve issues end-to-end',
        columns: ['New', 'Investigating', 'In Fix', 'Testing', 'Resolved'],
        defaultName: 'Bug Tracker',
        color: '#ef4444', // red
    },
    {
        id: 'sprint',
        Icon: Zap,
        name: 'Sprint Board',
        description: 'Agile sprint planning and execution',
        columns: ['Backlog', 'Sprint', 'In Progress', 'Review', 'Done'],
        defaultName: 'Sprint Board',
        color: '#f59e0b', // amber
    },
    {
        id: 'content',
        Icon: FileText,
        name: 'Content Pipeline',
        description: 'Manage content from idea to published',
        columns: ['Ideas', 'Research', 'Writing', 'Editing', 'Published'],
        defaultName: 'Content Pipeline',
        color: '#8b5cf6', // violet
    },
    {
        id: 'roadmap',
        Icon: Map,
        name: 'Product Roadmap',
        description: 'Prioritise features across Now / Next / Later',
        columns: ['Now', 'Next', 'Later', 'Ideas', 'Shipped'],
        defaultName: 'Product Roadmap',
        color: '#06b6d4', // cyan
    },
    {
        id: 'hiring',
        Icon: Users,
        name: 'Hiring Pipeline',
        description: 'Track candidates through every stage',
        columns: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'],
        defaultName: 'Hiring Pipeline',
        color: '#22c55e', // emerald
    },
];

// ── Component ─────────────────────────────────────────────────────

export default function CreateBoardModal({ isOpen, onClose, onCreate }) {
    const [selectedId, setSelectedId] = useState('blank');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const selectedTemplate = TEMPLATES.find(t => t.id === selectedId);

    const handleSelectTemplate = (template) => {
        setSelectedId(template.id);
        // Auto-fill name unless the user has typed something custom
        if (template.defaultName) {
            setName(template.defaultName);
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Board name is required');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            await onCreate({
                name: name.trim(),
                description: description.trim(),
                columns: selectedTemplate.columns,
            });
            // Reset
            setSelectedId('blank');
            setName('');
            setDescription('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create board');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedId('blank');
        setName('');
        setDescription('');
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Board">
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── Template grid ── */}
                <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                        Choose a template
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {TEMPLATES.map((template) => {
                            const isActive = selectedId === template.id;
                            const { Icon } = template;
                            return (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleSelectTemplate(template)}
                                    className={cn(
                                        'relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all duration-150',
                                        isActive
                                            ? 'border-accent bg-accent/8 ring-1 ring-accent/30'
                                            : 'border-border-subtle bg-surface-overlay hover:border-border-default hover:bg-surface-hover'
                                    )}
                                >
                                    {/* Icon */}
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                        style={{
                                            backgroundColor: `${template.color}22`,
                                            color: template.color,
                                        }}
                                    >
                                        <Icon size={14} />
                                    </div>

                                    {/* Name */}
                                    <span
                                        className={cn(
                                            'text-[11px] font-semibold leading-tight',
                                            isActive ? 'text-accent' : 'text-text-primary'
                                        )}
                                    >
                                        {template.name}
                                    </span>

                                    {/* Active dot */}
                                    {isActive && (
                                        <span
                                            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Column preview ── */}
                <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Columns
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {selectedTemplate.columns.map((col, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 rounded-full text-[11px] font-medium border border-border-default text-text-secondary bg-surface-overlay"
                            >
                                {col}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Name ── */}
                <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Board Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        placeholder="e.g. Project Overdrive"
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                        autoFocus
                    />
                    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
                </div>

                {/* ── Description ── */}
                <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What's this board about?"
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[72px] resize-none transition-colors"
                    />
                </div>

                {/* ── Actions ── */}
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
                        disabled={isSubmitting || !name.trim()}
                        className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-all text-sm font-semibold shadow-lg shadow-accent/20"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Board'}
                    </button>
                </div>

            </form>
        </Modal>
    );
}
