import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, Plus, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { cn } from '@/lib/utils/cn';

export default function KanbanColumn({ column, cards, onCardClick, onAddCard, onUpdateColumn, onDeleteColumn }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(column.name);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isWipEditing, setIsWipEditing] = useState(false);
    const [wipInput, setWipInput] = useState('');
    const menuRef = useRef(null);
    const inputRef = useRef(null);
    const wipInputRef = useRef(null);

    const wipLimit = column.wipLimit ?? null;
    const isOverLimit = wipLimit !== null && cards.length > wipLimit;

    const { setNodeRef } = useDroppable({ id: column._id });

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsMenuOpen(false);
                setIsWipEditing(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus rename input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Focus WIP input when it opens
    useEffect(() => {
        if (isWipEditing && wipInputRef.current) {
            wipInputRef.current.focus();
            wipInputRef.current.select();
        }
    }, [isWipEditing]);

    const handleRename = async () => {
        if (newName.trim() && newName.trim() !== column.name) {
            await onUpdateColumn(column._id, { name: newName.trim() });
        } else {
            setNewName(column.name); // revert if unchanged or empty
        }
        setIsEditing(false);
        setIsMenuOpen(false);
    };

    const handleDelete = async () => {
        setIsMenuOpen(false);
        if (window.confirm(`Delete column "${column.name}" and all its ${cards.length} card${cards.length !== 1 ? 's' : ''}?`)) {
            await onDeleteColumn(column._id);
        }
    };

    const openWipEditor = () => {
        setWipInput(wipLimit !== null ? String(wipLimit) : '');
        setIsWipEditing(true);
    };

    const handleWipSave = async () => {
        const val = parseInt(wipInput, 10);
        const newLimit = wipInput === '' ? null : (Number.isFinite(val) && val >= 1 ? val : wipLimit);
        await onUpdateColumn(column._id, { wipLimit: newLimit });
        setIsWipEditing(false);
        setIsMenuOpen(false);
    };

    const handleWipRemove = async () => {
        await onUpdateColumn(column._id, { wipLimit: null });
        setIsWipEditing(false);
        setIsMenuOpen(false);
    };

    // ── Collapsed view ────────────────────────────────────────────────────────
    if (isCollapsed) {
        return (
            <div className="w-10 shrink-0 flex flex-col items-center bg-surface-raised/40 rounded-xl border border-border-subtle overflow-hidden max-h-full py-3 gap-3">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="text-text-muted hover:text-text-primary transition-colors"
                    title="Expand column"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center justify-center">
                    <span
                        className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider select-none"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                        {column.name}
                    </span>
                </div>
                <span className={cn(
                    'text-[10px] px-1 py-0.5 rounded-full font-bold',
                    isOverLimit
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-surface-overlay text-text-muted'
                )}>
                    {wipLimit !== null ? `${cards.length}/${wipLimit}` : cards.length}
                </span>
            </div>
        );
    }

    // ── Expanded view ─────────────────────────────────────────────────────────
    return (
        <div className={cn(
            'w-72 flex flex-col shrink-0 bg-surface-raised/40 rounded-xl border overflow-hidden max-h-full transition-colors',
            isOverLimit ? 'border-red-500/60' : 'border-border-subtle'
        )}>
            <header className={cn(
                'p-3 flex items-center justify-between border-b gap-2 transition-colors',
                isOverLimit
                    ? 'border-red-500/40 bg-red-500/10'
                    : 'border-border-subtle bg-surface-raised/60'
            )}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') { setNewName(column.name); setIsEditing(false); }
                            }}
                            className="bg-surface-overlay text-sm font-semibold text-text-primary px-1 rounded border border-accent outline-none w-full"
                        />
                    ) : (
                        <>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider truncate">
                                {column.name}
                            </h3>
                            <span className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0',
                                isOverLimit
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-surface-overlay text-text-muted'
                            )}>
                                {wipLimit !== null ? `${cards.length}/${wipLimit}` : cards.length}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                    {/* Collapse button */}
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-1 text-text-muted hover:text-text-primary transition-colors rounded"
                        title="Collapse column"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Column menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(o => !o)}
                            className="p-1 text-text-muted hover:text-text-primary transition-colors rounded"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-48 bg-surface-overlay border border-border-subtle rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                <button
                                    onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover transition-colors flex items-center gap-2"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Rename
                                </button>

                                {/* WIP limit */}
                                {isWipEditing ? (
                                    <div className="px-3 py-2 space-y-1.5">
                                        <span className="text-[10px] text-text-muted uppercase font-semibold tracking-wide">WIP Limit</span>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                ref={wipInputRef}
                                                type="number"
                                                min="1"
                                                value={wipInput}
                                                onChange={e => setWipInput(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleWipSave();
                                                    if (e.key === 'Escape') { setIsWipEditing(false); }
                                                }}
                                                placeholder="e.g. 5"
                                                className="w-full bg-surface-raised border border-border-default rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
                                            />
                                            <button
                                                onClick={handleWipSave}
                                                className="shrink-0 px-2 py-1 rounded bg-accent/20 text-accent text-xs hover:bg-accent/30 transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                        {wipLimit !== null && (
                                            <button
                                                onClick={handleWipRemove}
                                                className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
                                            >
                                                Remove limit
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={openWipEditor}
                                        className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover transition-colors flex items-center gap-2"
                                    >
                                        <Gauge className="w-3.5 h-3.5" />
                                        {wipLimit !== null ? `WIP limit: ${wipLimit}` : 'Set WIP limit'}
                                    </button>
                                )}

                                <div className="my-1 border-t border-border-subtle" />
                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Cards list — droppable target */}
            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]',
                    cards.length === 0 && 'flex items-center justify-center'
                )}
            >
                <SortableContext items={cards.map(c => c._id)} strategy={verticalListSortingStrategy}>
                    {cards.length === 0 ? (
                        <p className="text-[10px] text-text-muted italic select-none">Drop cards here</p>
                    ) : (
                        cards.map(card => (
                            <KanbanCard
                                key={card._id}
                                card={card}
                                onClick={() => onCardClick(card)}
                            />
                        ))
                    )}
                </SortableContext>
            </div>

            <footer className="p-2 border-t border-border-subtle bg-surface-raised/60">
                <button
                    onClick={() => onAddCard(column._id)}
                    className="w-full text-left p-2 text-xs text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-md transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Card
                </button>
            </footer>
        </div>
    );
}
