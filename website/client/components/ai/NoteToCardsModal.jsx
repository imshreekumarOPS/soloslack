'use client';
import { useState } from 'react';
import { Sparkles, Plus, X, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAI } from '@/context/AIContext';
import { useBoards } from '@/context/BoardsContext';
import { boardsApi } from '@/lib/api/boardsApi';
import { cardsApi } from '@/lib/api/cardsApi';
import { noteToCardsPrompt } from '@/lib/ai/prompts';
import { cn } from '@/lib/utils/cn';

const PRIORITY_STYLE = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function NoteToCardsModal({ isOpen, onClose, noteTitle, noteBody }) {
    const { askAI } = useAI();
    const { boards } = useBoards();

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedBoard, setSelectedBoard] = useState('');
    const [selectedColumn, setSelectedColumn] = useState('');
    const [columns, setColumns] = useState([]);
    const [columnsLoading, setColumnsLoading] = useState(false);
    const [selectedCards, setSelectedCards] = useState(new Set());
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState(false);

    const handleBoardChange = async (boardId) => {
        setSelectedBoard(boardId);
        setSelectedColumn('');
        setColumns([]);
        if (!boardId) return;
        setColumnsLoading(true);
        try {
            const res = await boardsApi.getBoardFull(boardId);
            // API returns { success, data: { board, columns } }
            setColumns(res?.data?.columns || []);
        } catch {
            setColumns([]);
        } finally {
            setColumnsLoading(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setCards([]);
        setCreated(false);
        try {
            const result = await askAI(noteToCardsPrompt(noteTitle, noteBody), { maxTokens: 2048 });
            const parsed = JSON.parse(result.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
            if (Array.isArray(parsed)) {
                setCards(parsed);
                setSelectedCards(new Set(parsed.map((_, i) => i)));
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleCard = (i) => {
        setSelectedCards(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const handleCreate = async () => {
        if (!selectedColumn || !selectedBoard || selectedCards.size === 0) return;
        setCreating(true);
        setError('');
        try {
            for (const i of selectedCards) {
                const card = cards[i];
                await cardsApi.create({
                    columnId: selectedColumn,
                    boardId: selectedBoard,
                    title: card.title,
                    description: card.description || '',
                    priority: card.priority || 'medium',
                });
            }
            setCreated(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        setCards([]);
        setError('');
        setSelectedBoard('');
        setSelectedColumn('');
        setColumns([]);
        setSelectedCards(new Set());
        setCreated(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Break Note into Cards">
            <div className="space-y-4">
                {!cards.length && !loading && !created && (
                    <div className="text-center py-8">
                        <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                        <p className="text-sm text-text-primary font-medium mb-1">
                            AI will break &ldquo;{noteTitle || 'this note'}&rdquo; into actionable cards
                        </p>
                        <p className="text-xs text-text-muted mb-4">
                            The note content will be analyzed and converted into task cards
                        </p>
                        <button
                            onClick={handleGenerate}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-semibold hover:bg-purple-500/30 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" /> Generate Cards
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs text-purple-400">Analyzing note and generating cards...</p>
                    </div>
                )}

                {error && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                {created && (
                    <div className="text-center py-8">
                        <Check className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm text-emerald-400 font-medium mb-1">
                            {selectedCards.size} cards created successfully!
                        </p>
                        <button
                            onClick={handleClose}
                            className="mt-3 px-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}

                {cards.length > 0 && !created && (
                    <>
                        {/* Board & Column selector */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Board</label>
                                <select
                                    value={selectedBoard}
                                    onChange={(e) => handleBoardChange(e.target.value)}
                                    className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                                >
                                    <option value="">Select board...</option>
                                    {boards.map(b => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Column</label>
                                <select
                                    value={selectedColumn}
                                    onChange={(e) => setSelectedColumn(e.target.value)}
                                    disabled={!selectedBoard || columnsLoading}
                                    className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent disabled:opacity-40"
                                >
                                    <option value="">
                                        {columnsLoading ? 'Loading columns...' : 'Select column...'}
                                    </option>
                                    {columns.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Generated cards */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {cards.map((card, i) => (
                                <div
                                    key={i}
                                    onClick={() => toggleCard(i)}
                                    className={cn(
                                        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                                        selectedCards.has(i)
                                            ? 'bg-purple-500/5 border-purple-500/20'
                                            : 'bg-surface-overlay/30 border-border-subtle opacity-50'
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedCards.has(i)}
                                        onChange={() => toggleCard(i)}
                                        className="accent-purple-500 mt-0.5 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text-primary">{card.title}</p>
                                        {card.description && (
                                            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{card.description}</p>
                                        )}
                                    </div>
                                    <span className={cn(
                                        'text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0',
                                        PRIORITY_STYLE[card.priority] || PRIORITY_STYLE.medium
                                    )}>
                                        {card.priority || 'medium'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="text-xs text-text-muted hover:text-purple-400 transition-colors flex items-center gap-1"
                            >
                                <Sparkles className="w-3 h-3" /> Regenerate
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating || !selectedColumn || selectedCards.size === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40"
                            >
                                {creating ? (
                                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                )}
                                Create {selectedCards.size} Card{selectedCards.size !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
