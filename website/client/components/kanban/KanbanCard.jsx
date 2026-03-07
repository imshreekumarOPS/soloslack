import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '../ui/Badge';
import { cn } from '@/lib/utils/cn';

export default function KanbanCard({ card, onClick }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: card._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={cn(
                "bg-surface-overlay border border-border-subtle rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-border-strong hover:bg-surface-hover transition-all group",
                isDragging && "opacity-50 ring-2 ring-accent"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <Badge priority={card.priority} />
            </div>

            <h5 className="text-sm font-medium text-text-primary mb-1 group-hover:text-accent transition-colors">
                {card.title}
            </h5>

            {card.description && (
                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                    {card.description}
                </p>
            )}

            {card.linkedNoteId && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-accent-hover font-medium bg-accent-subtle/30 w-fit px-1.5 py-0.5 rounded">
                    <span>📄</span> Linked Note
                </div>
            )}
        </div>
    );
}
