'use client';
import { useState } from 'react';
import { Sparkles, ArrowUp, ArrowDown, ArrowRight, Check, X } from 'lucide-react';
import { useAI } from '@/context/AIContext';
import { autoPrioritizePrompt } from '@/lib/ai/prompts';
import { cn } from '@/lib/utils/cn';

const PRIORITY_ICON = {
    high: <ArrowUp className="w-3 h-3 text-red-400" />,
    medium: <ArrowRight className="w-3 h-3 text-amber-400" />,
    low: <ArrowDown className="w-3 h-3 text-green-400" />,
};

const PRIORITY_STYLE = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export default function AutoPrioritize({ cards, onUpdateCard }) {
    const { askAI, isConfigured } = useAI();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isConfigured || !cards?.length) return null;

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        setSuggestions([]);
        try {
            const result = await askAI(autoPrioritizePrompt(cards), { maxTokens: 1024, temperature: 0.3 });
            const parsed = JSON.parse(result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
            if (Array.isArray(parsed)) {
                // Match card IDs with actual cards
                const matched = parsed
                    .map(s => {
                        const card = cards.find(c => c._id === s.cardId);
                        return card ? { ...s, card } : null;
                    })
                    .filter(Boolean);
                setSuggestions(matched);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (suggestion) => {
        if (onUpdateCard) {
            await onUpdateCard(suggestion.cardId, { priority: suggestion.suggestedPriority });
        }
        setSuggestions(prev => prev.filter(s => s.cardId !== suggestion.cardId));
    };

    const handleDismiss = (cardId) => {
        setSuggestions(prev => prev.filter(s => s.cardId !== cardId));
    };

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-amber-500 inline-block shrink-0" />
                    Priority Suggestions
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </h2>
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-40"
                >
                    {loading ? (
                        <div className="w-3 h-3 border border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    ) : (
                        <Sparkles className="w-3 h-3" />
                    )}
                    {loading ? 'Analyzing...' : 'Analyze'}
                </button>
            </div>

            {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            {suggestions.length > 0 && (
                <div className="space-y-2">
                    {suggestions.map((s) => (
                        <div
                            key={s.cardId}
                            className="flex items-center gap-3 p-3 bg-surface-raised border border-border-subtle rounded-xl"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate">{s.card?.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-flex items-center gap-1', PRIORITY_STYLE[s.card?.priority])}>
                                        {PRIORITY_ICON[s.card?.priority]} {s.card?.priority}
                                    </span>
                                    <span className="text-[10px] text-text-muted">→</span>
                                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-flex items-center gap-1', PRIORITY_STYLE[s.suggestedPriority])}>
                                        {PRIORITY_ICON[s.suggestedPriority]} {s.suggestedPriority}
                                    </span>
                                </div>
                                {s.reason && (
                                    <p className="text-[10px] text-text-muted mt-1">{s.reason}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleAccept(s)}
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                    title="Accept"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDismiss(s.cardId)}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                    title="Dismiss"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && suggestions.length === 0 && !error && (
                <div className="border border-dashed border-amber-500/20 rounded-xl p-5 text-center">
                    <p className="text-xs text-text-muted">
                        AI will analyze your cards and suggest priority adjustments
                    </p>
                </div>
            )}
        </section>
    );
}
