import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '../ui/Badge';
import { cn } from '@/lib/utils/cn';

export default function KanbanCard({ card, onClick, isOverlay }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: card._id,
        disabled: isOverlay
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const cardContent = (
        <div
            className={cn(
                "bg-surface-overlay border border-border-subtle rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-border-strong hover:bg-surface-hover transition-all group",
                isDragging && "opacity-50 ring-2 ring-accent",
                isOverlay && "cursor-grabbing border-accent ring-2 ring-accent/50 shadow-2xl scale-105"
            )}
            onClick={!isOverlay ? onClick : undefined}
            {...(!isOverlay ? { ...attributes, ...listeners } : {})}
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

    if (isOverlay) {
        return cardContent;
    }

    return (
        <div ref={setNodeRef} style={style}>
            {cardContent}
        </div>
    );
}
