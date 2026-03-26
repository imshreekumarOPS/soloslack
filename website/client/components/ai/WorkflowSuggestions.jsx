'use client';
import { useState } from 'react';
import { Sparkles, AlertTriangle, Gauge, Clock, Lightbulb } from 'lucide-react';
import { useAI } from '@/context/AIContext';
import { workflowSuggestionsPrompt } from '@/lib/ai/prompts';
import { cn } from '@/lib/utils/cn';

const TYPE_CONFIG = {
    bottleneck: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    wip: { icon: <Gauge className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    stale: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    optimization: { icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

export default function WorkflowSuggestions({ board }) {
    const { askAI, isConfigured } = useAI();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isConfigured || !board) return null;

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        setSuggestions([]);
        try {
            // Prepare board data for analysis
            const boardData = {
                name: board.name,
                columns: (board.columns || []).map(col => ({
                    name: col.name,
                    wipLimit: col.wipLimit,
                    cardCount: (col.cards || []).length,
                    cards: (col.cards || []).slice(0, 10).map(c => ({
                        title: c.title,
                        priority: c.priority,
                        dueDate: c.dueDate,
                        hasDescription: !!c.description,
                        checklistItems: c.checklist?.length || 0,
                        checklistDone: c.checklist?.filter(i => i.completed).length || 0,
                        updatedAt: c.updatedAt,
                    })),
                })),
            };

            const result = await askAI(workflowSuggestionsPrompt(boardData), { maxTokens: 1024, temperature: 0.5 });
            const parsed = JSON.parse(result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
            if (Array.isArray(parsed)) {
                setSuggestions(parsed);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Workflow Insights
                </h3>
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-40"
                >
                    {loading ? (
                        <div className="w-2.5 h-2.5 border border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    ) : (
                        <Sparkles className="w-2.5 h-2.5" />
                    )}
                    {loading ? 'Analyzing...' : 'Analyze'}
                </button>
            </div>

            {error && (
                <p className="text-[10px] text-red-400">{error}</p>
            )}

            {suggestions.length > 0 && (
                <div className="space-y-2">
                    {suggestions.map((s, i) => {
                        const config = TYPE_CONFIG[s.type] || TYPE_CONFIG.optimization;
                        return (
                            <div
                                key={i}
                                className={cn('flex items-start gap-2 p-2.5 rounded-lg border', config.color)}
                            >
                                <span className="mt-0.5 shrink-0">{config.icon}</span>
                                <div>
                                    <p className="text-xs font-medium">{s.title}</p>
                                    <p className="text-[10px] opacity-70 mt-0.5">{s.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
