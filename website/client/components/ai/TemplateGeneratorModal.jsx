'use client';
import { useState } from 'react';
import { Sparkles, Plus, Check, LayoutTemplate } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAI } from '@/context/AIContext';
import { useBoards } from '@/context/BoardsContext';
import { templateGeneratorPrompt } from '@/lib/ai/prompts';
import { cn } from '@/lib/utils/cn';

export default function TemplateGeneratorModal({ isOpen, onClose }) {
    const { askAI } = useAI();
    const { createBoard, createCard } = useBoards();

    const [prompt, setPrompt] = useState('');
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState(false);

    const PRESETS = [
        'Sprint planning for a 2-week agile sprint',
        'Bug tracking and triage pipeline',
        'Content creation pipeline (blog, social media)',
        'Product launch checklist',
        'Job search tracker',
        'Home renovation project',
    ];

    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        setError('');
        setTemplate(null);
        setCreated(false);
        try {
            const result = await askAI(templateGeneratorPrompt(prompt), { maxTokens: 2048 });
            const parsed = JSON.parse(result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
            setTemplate(parsed);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!template || creating) return;
        setCreating(true);
        setError('');
        try {
            // Reshape AI template to match server's expected format:
            // { board: { name, description }, columns: [{ name, cards: [...] }] }
            const { boardsApi } = await import('@/lib/api/boardsApi');
            const payload = {
                board: { name: template.name, description: template.description },
                columns: (template.columns || []).map((col, i) => ({
                    name: col.name,
                    order: i,
                    wipLimit: col.wipLimit ?? null,
                    cards: (col.cards || []).map((card, j) => ({
                        title: card.title,
                        description: card.description || '',
                        priority: card.priority || 'medium',
                        order: j,
                    })),
                })),
            };
            await boardsApi.import(payload);
            setCreated(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        setPrompt('');
        setTemplate(null);
        setError('');
        setCreated(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="AI Template Generator">
            <div className="space-y-4">
                {!template && !loading && !created && (
                    <>
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">
                                Describe your project
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. I'm planning a product launch for a mobile app..."
                                className="w-full bg-surface-overlay border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-purple-500/40 min-h-[80px] resize-none"
                                autoFocus
                            />
                        </div>

                        {/* Presets */}
                        <div>
                            <p className="text-[10px] font-semibold text-text-muted uppercase mb-2">Quick presets</p>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPrompt(p)}
                                        className={cn(
                                            'px-2.5 py-1 rounded-lg text-[11px] border transition-all',
                                            prompt === p
                                                ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                                                : 'bg-surface-overlay/50 border-border-subtle text-text-muted hover:text-text-primary hover:border-border-strong'
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim()}
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-semibold hover:bg-purple-500/30 transition-colors disabled:opacity-40"
                        >
                            <Sparkles className="w-4 h-4" /> Generate Template
                        </button>
                    </>
                )}

                {loading && (
                    <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs text-purple-400">Generating board template...</p>
                    </div>
                )}

                {error && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                {created && (
                    <div className="text-center py-8">
                        <Check className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm text-emerald-400 font-medium mb-1">Board created from template!</p>
                        <button
                            onClick={handleClose}
                            className="mt-3 px-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}

                {template && !created && (
                    <>
                        {/* Template preview */}
                        <div className="bg-surface-overlay/30 border border-border-subtle rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4 text-purple-400" />
                                <h3 className="text-sm font-bold text-text-primary">{template.name}</h3>
                            </div>
                            {template.description && (
                                <p className="text-xs text-text-muted">{template.description}</p>
                            )}
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {template.columns?.map((col, ci) => (
                                    <div key={ci} className="shrink-0 w-44">
                                        <div className="text-[11px] font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                                            {col.name}
                                            <span className="text-text-muted font-normal">{col.cards?.length || 0}</span>
                                        </div>
                                        <div className="space-y-1">
                                            {col.cards?.map((card, cdi) => (
                                                <div
                                                    key={cdi}
                                                    className="bg-surface-overlay border border-border-subtle rounded-md px-2 py-1.5"
                                                >
                                                    <p className="text-[11px] text-text-primary font-medium truncate">{card.title}</p>
                                                    <span className={cn(
                                                        'text-[9px] font-semibold',
                                                        card.priority === 'high' ? 'text-red-400' :
                                                        card.priority === 'low' ? 'text-green-400' : 'text-amber-400'
                                                    )}>
                                                        {card.priority}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                onClick={() => { setTemplate(null); }}
                                className="text-xs text-text-muted hover:text-purple-400 transition-colors flex items-center gap-1"
                            >
                                <Sparkles className="w-3 h-3" /> Regenerate
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={creating}
                                className="inline-flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40"
                            >
                                {creating ? (
                                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                )}
                                Import Board
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
