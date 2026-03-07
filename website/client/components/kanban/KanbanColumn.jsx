import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ column, cards, onCardClick, onAddCard }) {
    return (
        <div className="w-72 flex flex-col shrink-0 bg-surface-raised/40 rounded-xl border border-border-subtle overflow-hidden max-h-full">
            <header className="p-3 flex items-center justify-between border-b border-border-subtle bg-surface-raised/60">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                        {column.name}
                    </h3>
                    <span className="text-[10px] bg-surface-overlay px-1.5 py-0.5 rounded-full text-text-muted font-bold">
                        {cards.length}
                    </span>
                </div>
                <button className="text-text-muted hover:text-text-primary transition-colors">···</button>
            </header>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
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
                    <span className="text-lg leading-none">+</span> Add Card
                </button>
            </footer>
        </div>
    );
}
