'use client';
import { useState, useEffect } from 'react';
import { LayoutList } from 'lucide-react';
import Modal from '../ui/Modal';
import { boardsApi } from '@/lib/api/boardsApi';
import { cardsApi } from '@/lib/api/cardsApi';

export default function CardPicker({ isOpen, onClose, onSelect }) {
    const [boards, setBoards] = useState([]);
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            boardsApi.getAll().then(res => setBoards(res.data));
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedBoardId) {
            setLoading(true);
            cardsApi.getAll({ boardId: selectedBoardId }).then(res => {
                setCards(res.data);
                setLoading(false);
            });
        } else {
            setCards([]);
        }
    }, [selectedBoardId]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select a Card">
            <div className="space-y-4 min-h-[400px] flex flex-col">
                <section>
                    <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Select Board</label>
                    <select
                        value={selectedBoardId}
                        onChange={(e) => setSelectedBoardId(e.target.value)}
                        className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    >
                        <option value="">Choose a board...</option>
                        {boards.map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                    </select>
                </section>

                <div className="flex-1 overflow-y-auto space-y-2 mt-2">
                    {!selectedBoardId ? (
                        <div className="p-10 text-center text-text-muted text-sm italic">Select a board to see cards</div>
                    ) : loading ? (
                        <div className="p-10 text-center text-text-muted text-sm">Loading cards...</div>
                    ) : cards.length === 0 ? (
                        <div className="p-10 text-center text-text-muted text-sm">No cards found on this board</div>
                    ) : (
                        cards.map(card => (
                            <button
                                key={card._id}
                                onClick={() => {
                                    onSelect(card);
                                    onClose();
                                }}
                                className="w-full text-left p-3 rounded-lg border border-border-subtle hover:border-accent hover:bg-surface-hover transition-all flex items-start gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <LayoutList size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-text-primary truncate">{card.title}</h4>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                                        Priority: {card.priority}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
}
