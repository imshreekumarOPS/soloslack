'use client';
import { useState } from 'react';
import { Sparkles, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { useAI } from '@/context/AIContext';
import { weeklyDigestPrompt } from '@/lib/ai/prompts';
import MarkdownRenderer from '../notes/MarkdownRenderer';

export default function WeeklyDigest({ notes, boards, upcomingCards }) {
    const { askAI, isConfigured } = useAI();
    const [digest, setDigest] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isConfigured) return null;

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        try {
            const now = new Date();
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

            const recentNotes = notes.filter(n => new Date(n.updatedAt) >= weekAgo);
            const overdueCards = upcomingCards.filter(c => new Date(c.dueDate) < now);
            const dueSoonCards = upcomingCards.filter(c => new Date(c.dueDate) >= now);

            const stats = {
                notesCreatedOrUpdated: recentNotes.length,
                totalNotes: notes.length,
                totalBoards: boards.length,
                overdueCards: overdueCards.length,
                cardsDueSoon: dueSoonCards.length,
                recentNoteTitles: recentNotes.slice(0, 5).map(n => n.title || 'Untitled'),
                boardNames: boards.slice(0, 5).map(b => b.name),
            };

            const result = await askAI(weeklyDigestPrompt(stats), { maxTokens: 512, temperature: 0.8 });
            setDigest(result.text);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-purple-500 inline-block shrink-0" />
                    Weekly Digest
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </h2>
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-40"
                >
                    {loading ? (
                        <div className="w-3 h-3 border border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    ) : digest ? (
                        <RefreshCw className="w-3 h-3" />
                    ) : (
                        <Sparkles className="w-3 h-3" />
                    )}
                    {loading ? 'Generating...' : digest ? 'Refresh' : 'Generate'}
                </button>
            </div>

            {!digest && !loading && !error && (
                <div className="border border-dashed border-purple-500/20 rounded-xl p-6 text-center">
                    <TrendingUp className="w-6 h-6 text-purple-400/50 mx-auto mb-2" />
                    <p className="text-xs text-text-muted">
                        Get an AI-powered summary of your week's productivity
                    </p>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            {digest && (
                <div className="bg-purple-500/5 border border-purple-500/15 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest">This Week</span>
                    </div>
                    <div className="text-sm text-text-primary leading-relaxed prose-sm">
                        <MarkdownRenderer content={digest} />
                    </div>
                </div>
            )}
        </section>
    );
}
