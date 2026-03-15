import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ column, cards, onCardClick, onAddCard, onUpdateColumn, onDeleteColumn }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(column.name);
    const menuRef = useRef(null);
    const inputRef = useRef(null);

    const { setNodeRef } = useDroppable({
        id: column._id,
    });

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleRename = async () => {
        if (newName.trim() && newName !== column.name) {
            await onUpdateColumn(column._id, { name: newName.trim() });
        }
        setIsEditing(false);
        setIsMenuOpen(false);
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete the column "${column.name}" and all its cards?`)) {
            await onDeleteColumn(column._id);
        }
        setIsMenuOpen(false);
    };

    return (
        <div className="w-72 flex flex-col shrink-0 bg-surface-raised/40 rounded-xl border border-border-subtle overflow-hidden max-h-full">
            <header className="p-3 flex items-center justify-between border-b border-border-subtle bg-surface-raised/60">
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
                                if (e.key === 'Escape') {
                                    setNewName(column.name);
                                    setIsEditing(false);
                                }
                            }}
                            className="bg-surface-overlay text-sm font-semibold text-text-primary px-1 rounded border border-accent outline-none w-full"
                        />
                    ) : (
                        <>
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider truncate">
                                {column.name}
                            </h3>
                            <span className="text-[10px] bg-surface-overlay px-1.5 py-0.5 rounded-full text-text-muted font-bold">
                                {cards.length}
                            </span>
                        </>
                    )}
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-1 w-40 bg-surface-overlay border border-border-subtle rounded-lg shadow-xl z-50 overflow-hidden py-1">
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-2"
                            >
                                <Edit2 className="w-3.5 h-3.5" /> Rename
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-full text-left px-3 py-2 text-xs text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[150px]"
            >
                <SortableContext items={cards.map(c => c._id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <KanbanCard
                            key={card._id}
                            card={card}
                            onClick={() => onCardClick(card)}
                        />
                    ))}
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
