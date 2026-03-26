'use client';
import { useState } from 'react';
import { Plus, X, Sparkles, CheckSquare } from 'lucide-react';
import Modal from '../ui/Modal';
import { cn } from '@/lib/utils/cn';
import { LABEL_COLORS, getLabelColor } from '@/lib/utils/labelColors';
import { useAI } from '@/context/AIContext';
import { cardDescriptionPrompt } from '@/lib/ai/prompts';

const PRIORITIES = ['low', 'medium', 'high'];

export default function CreateCardModal({ isOpen, onClose, onCreate }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [labels, setLabels] = useState([]);
    const [isLabelAdding, setIsLabelAdding] = useState(false);
    const [newLabelText, setNewLabelText] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('blue');
    const [checklist, setChecklist] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const { askAI, isConfigured: aiConfigured } = useAI();

    const reset = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setChecklist([]);
        setLabels([]);
        setIsLabelAdding(false);
        setNewLabelText('');
        setNewLabelColor('blue');
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
                labels: labels.length > 0 ? labels : undefined,
                checklist: checklist.length > 0 ? checklist : undefined,
            });
            reset();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create card');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!title.trim() || aiGenerating) return;
        setAiGenerating(true);
        try {
            const result = await askAI(cardDescriptionPrompt(title), { maxTokens: 1024 });
            const parsed = JSON.parse(result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
            setDescription(parsed.description || '');
            setChecklist((parsed.checklist || []).map(text => ({ text: String(text).slice(0, 200), completed: false })));
        } catch (err) {
            setError('AI generation failed: ' + err.message);
        } finally {
            setAiGenerating(false);
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
                    <div className="flex items-center gap-2 mb-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase">Description</label>
                        {aiConfigured && (
                            <button
                                type="button"
                                onClick={handleGenerateDescription}
                                disabled={aiGenerating || !title.trim()}
                                title="Generate description with AI"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-30"
                            >
                                <Sparkles className={cn('w-3 h-3', aiGenerating && 'animate-spin')} />
                                {aiGenerating ? 'Generating...' : 'AI Generate'}
                            </button>
                        )}
                    </div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What needs to be done? (markdown supported)"
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[90px] resize-none transition-colors font-mono"
                    />
                </div>

                {/* AI-generated Checklist Preview */}
                {checklist.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-text-muted uppercase">
                                Checklist <span className="text-purple-400 font-normal normal-case">(AI generated)</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setChecklist([])}
                                className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="space-y-1 bg-surface-overlay/50 border border-border-subtle rounded-lg p-2.5">
                            {checklist.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                    <CheckSquare className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                                    <span className="text-text-primary">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Labels */}
                <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                        Labels <span className="text-text-muted font-normal normal-case">(optional, up to 6)</span>
                    </label>

                    {labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {labels.map((label, i) => {
                                const c = getLabelColor(label.color);
                                return (
                                    <span
                                        key={i}
                                        className={cn(
                                            'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
                                            c.bg, c.text
                                        )}
                                    >
                                        {label.text}
                                        <button
                                            type="button"
                                            onClick={() => setLabels(labels.filter((_, j) => j !== i))}
                                            className="hover:opacity-70 transition-opacity"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {isLabelAdding ? (
                        <div className="space-y-2 p-2 bg-surface-overlay/50 rounded-md border border-border-subtle">
                            <input
                                type="text"
                                value={newLabelText}
                                onChange={(e) => setNewLabelText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const text = newLabelText.trim();
                                        if (text && labels.length < 6) {
                                            setLabels([...labels, { text, color: newLabelColor }]);
                                            setNewLabelText('');
                                            setNewLabelColor('blue');
                                            setIsLabelAdding(false);
                                        }
                                    }
                                    if (e.key === 'Escape') setIsLabelAdding(false);
                                }}
                                placeholder="Label name"
                                maxLength={30}
                                className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                                autoFocus
                            />
                            <div className="flex items-center gap-1.5">
                                {LABEL_COLORS.map((c) => (
                                    <button
                                        key={c.key}
                                        type="button"
                                        onClick={() => setNewLabelColor(c.key)}
                                        className={cn(
                                            'w-5 h-5 rounded-full transition-all',
                                            c.dot,
                                            newLabelColor === c.key
                                                ? 'ring-2 ring-offset-1 ring-offset-transparent ' + c.ring + ' scale-110'
                                                : 'opacity-50 hover:opacity-80'
                                        )}
                                        title={c.key}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const text = newLabelText.trim();
                                        if (text && labels.length < 6) {
                                            setLabels([...labels, { text, color: newLabelColor }]);
                                            setNewLabelText('');
                                            setNewLabelColor('blue');
                                            setIsLabelAdding(false);
                                        }
                                    }}
                                    disabled={!newLabelText.trim()}
                                    className="px-3 py-1 rounded-md bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 transition-colors disabled:opacity-30"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsLabelAdding(false)}
                                    className="text-xs text-text-muted hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        labels.length < 6 && (
                            <button
                                type="button"
                                onClick={() => setIsLabelAdding(true)}
                                className="text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add label
                            </button>
                        )
                    )}
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
