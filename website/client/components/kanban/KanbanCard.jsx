import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';
import Badge from '../ui/Badge';
import AnimatedIcon from '../ui/AnimatedIcon';
import { cn } from '@/lib/utils/cn';
import { stripMarkdown } from '@/lib/utils/markdown';
import { formatDueDate, getDueDateStatus } from '@/lib/utils/formatDate';

export default function KanbanCard({ card, onClick, isOverlay }) {
    const cleanDescription = stripMarkdown(card.description);
    const checklistTotal = card.checklist?.length ?? 0;
    const checklistDone = card.checklist?.filter(i => i.completed).length ?? 0;
    const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
    const dueDateText = formatDueDate(card.dueDate);
    const dueDateStatus = getDueDateStatus(card.dueDate);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card._id,
        disabled: isOverlay,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const content = (
        <div
            className={cn(
                'bg-surface-overlay border border-border-subtle rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-border-strong hover:bg-surface-hover transition-all group',
                isDragging && 'opacity-40 ring-2 ring-accent',
                isOverlay && 'cursor-grabbing border-accent ring-2 ring-accent/40 shadow-2xl scale-[1.02]'
            )}
            onClick={!isOverlay ? onClick : undefined}
            {...(!isOverlay ? { ...attributes, ...listeners } : {})}
        >
            {/* Priority badge */}
            <div className="flex items-start justify-between mb-2">
                <Badge priority={card.priority} />
            </div>

            {/* Title */}
            <h5 className="text-sm font-medium text-text-primary mb-1 group-hover:text-accent transition-colors leading-snug">
                {card.title}
            </h5>

            {/* Description preview */}
            {cleanDescription && (
                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                    {cleanDescription}
                </p>
            )}

            {/* Checklist progress */}
            {checklistTotal > 0 && (
                <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                            'text-[10px]',
                            checklistDone === checklistTotal ? 'text-green-400' : 'text-text-muted'
                        )}>
                            {checklistDone}/{checklistTotal}
                        </span>
                    </div>
                    <div className="h-1 bg-surface-raised rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${checklistPct}%`,
                                backgroundColor: checklistDone === checklistTotal ? '#4ade80' : '#818cf8',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Footer: due date + linked note indicator */}
            {(dueDateText || card.linkedNoteId) && (
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    {dueDateText && (
                        <span
                            className={cn(
                                'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded',
                                dueDateStatus === 'overdue' && 'bg-red-500/10 text-red-400',
                                dueDateStatus === 'soon' && 'bg-amber-500/10 text-amber-400',
                                dueDateStatus === 'normal' && 'bg-surface-raised text-text-muted'
                            )}
                        >
                            <Calendar className="w-2.5 h-2.5" />
                            {dueDateText}
                        </span>
                    )}

                    {card.linkedNoteId && (
                        <span className="flex items-center gap-1 text-[10px] text-accent bg-accent/5 px-1.5 py-0.5 rounded">
                            <AnimatedIcon type="notes" active className="w-3 h-3" />
                            Note
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    if (isOverlay) return content;

    return (
        <div ref={setNodeRef} style={style}>
            {content}
        </div>
    );
}
