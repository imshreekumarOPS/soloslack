'use client';
import { useState, useRef, useCallback } from 'react';
import { Search, Sparkles, FileText, LayoutDashboard, X } from 'lucide-react';
import { useAI } from '@/context/AIContext';
import { cosineSimilarity } from '@/lib/ai/providers';
import { cn } from '@/lib/utils/cn';
import { timeAgo } from '@/lib/utils/formatDate';

/**
 * Semantic search component.
 * Embeds notes and cards, then finds results by meaning, not just keywords.
 */
export default function SemanticSearch({ notes, boards, onSelectNote, onSelectBoard }) {
    const { embed, isConfigured } = useAI();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const embeddingsCache = useRef(new Map());
    const inputRef = useRef(null);

    const getEmbedding = useCallback(async (text, id) => {
        if (embeddingsCache.current.has(id)) return embeddingsCache.current.get(id);
        const embedding = await embed(text);
        embeddingsCache.current.set(id, embedding);
        return embedding;
    }, [embed]);

    const handleSearch = async () => {
        if (!query.trim() || loading) return;
        setLoading(true);
        setError('');
        setResults([]);

        try {
            // Get query embedding
            const queryEmbedding = await embed(query);

            // Build items to search through
            const items = [];

            for (const note of notes) {
                const text = `${note.title || ''} ${note.body?.substring(0, 500) || ''}`.trim();
                if (!text) continue;
                items.push({
                    type: 'note',
                    id: note._id,
                    title: note.title || 'Untitled',
                    snippet: note.body?.substring(0, 120) || '',
                    text,
                    item: note,
                    date: note.updatedAt,
                });
            }

            // Also search card titles from all boards
            for (const board of boards) {
                if (board.columns) {
                    for (const col of board.columns) {
                        for (const card of col.cards || []) {
                            const text = `${card.title} ${card.description?.substring(0, 300) || ''}`.trim();
                            items.push({
                                type: 'card',
                                id: card._id,
                                title: card.title,
                                snippet: card.description?.substring(0, 120) || '',
                                text,
                                boardName: board.name,
                                boardId: board._id,
                                date: card.updatedAt,
                            });
                        }
                    }
                }
            }

            // Get embeddings for all items (cached)
            const scored = [];
            // Process in batches of 5 to respect rate limits
            for (let i = 0; i < items.length; i += 5) {
                const batch = items.slice(i, i + 5);
                const embeddings = await Promise.all(
                    batch.map(item => getEmbedding(item.text, item.id))
                );
                for (let j = 0; j < batch.length; j++) {
                    const score = cosineSimilarity(queryEmbedding, embeddings[j]);
                    scored.push({ ...batch[j], score });
                }
            }

            // Sort by similarity and take top results
            scored.sort((a, b) => b.score - a.score);
            setResults(scored.filter(r => r.score > 0.3).slice(0, 10));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isConfigured) return null;

    return (
        <>
            <button
                onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                title="Semantic AI Search"
            >
                <Sparkles className="w-3 h-3" />
                <Search className="w-3 h-3" />
                AI Search
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="relative w-full max-w-lg mx-4 bg-surface-overlay border border-border-subtle rounded-2xl shadow-2xl overflow-hidden">
                        {/* Search input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
                            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search by meaning... e.g. 'deployment issues'"
                                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                            />
                            {loading && (
                                <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin shrink-0" />
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-text-muted hover:text-text-primary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-[50vh] overflow-y-auto">
                            {error && (
                                <p className="text-xs text-red-400 px-4 py-3">{error}</p>
                            )}

                            {!loading && results.length === 0 && query && (
                                <p className="text-xs text-text-muted px-4 py-6 text-center">
                                    {error ? '' : 'Press Enter to search by meaning'}
                                </p>
                            )}

                            {results.map((r, i) => (
                                <button
                                    key={`${r.type}-${r.id}`}
                                    onClick={() => {
                                        if (r.type === 'note') {
                                            onSelectNote?.(r.item);
                                        } else {
                                            onSelectBoard?.(r.boardId);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-start gap-3 border-b border-border-subtle/30"
                                >
                                    <div className={cn(
                                        'mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0',
                                        r.type === 'note'
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                                            : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                                    )}>
                                        {r.type === 'note' ? <FileText size={13} /> : <LayoutDashboard size={13} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate">{r.title}</p>
                                        {r.snippet && (
                                            <p className="text-xs text-text-muted truncate mt-0.5">{r.snippet}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-text-muted capitalize">{r.type}</span>
                                            {r.boardName && (
                                                <span className="text-[10px] text-text-muted">{r.boardName}</span>
                                            )}
                                            <span className="text-[10px] text-purple-400 font-mono">
                                                {(r.score * 100).toFixed(0)}% match
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer hint */}
                        <div className="px-4 py-2 border-t border-border-subtle bg-surface-base/50">
                            <p className="text-[10px] text-text-muted">
                                Powered by AI embeddings · searches by meaning, not just keywords
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
