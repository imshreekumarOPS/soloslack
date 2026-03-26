import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare } from 'lucide-react';
import Badge from '../ui/Badge';
import AnimatedIcon from '../ui/AnimatedIcon';
import { cn } from '@/lib/utils/cn';
import { stripMarkdown } from '@/lib/utils/markdown';
import { formatDueDate, getDueDateStatus } from '@/lib/utils/formatDate';
import { getLabelColor } from '@/lib/utils/labelColors';

export default function KanbanCard({ card, onClick, isOverlay, selectMode, isSelected, onToggleSelection, isMultiDragging }) {
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
        disabled: isOverlay || (selectMode && !isSelected),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const content = (
        <div
            className={cn(
                'bg-surface-overlay border border-border-subtle rounded-lg p-3 transition-all group relative',
                selectMode && isSelected ? 'cursor-grab active:cursor-grabbing' : selectMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
                !selectMode && 'hover:border-border-strong hover:bg-surface-hover',
                isDragging && 'opacity-40 ring-2 ring-accent',
                isMultiDragging && !isDragging && 'opacity-30',
                isOverlay && 'cursor-grabbing border-accent ring-2 ring-accent/40 shadow-2xl scale-[1.02]',
                selectMode && isSelected && !isDragging && !isMultiDragging && 'ring-2 ring-accent border-accent bg-accent/5',
            )}
            onClick={!isOverlay ? onClick : undefined}
            {...(!isOverlay && (!selectMode || isSelected) ? { ...attributes, ...listeners } : {})}
        >
            {/* Selection checkbox */}
            {selectMode && (
                <div
                    className="absolute top-2 right-2 z-10"
                    onClick={(e) => { e.stopPropagation(); onToggleSelection?.(); }}
                >
                    <div className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected
                            ? 'bg-accent border-accent'
                            : 'border-border-default bg-surface-overlay hover:border-accent/50'
                    )}>
                        {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Priority badge */}
            <div className="flex items-start justify-between mb-2">
                <Badge priority={card.priority} />
            </div>

            {/* Labels */}
            {card.labels?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {card.labels.map((label, i) => {
                        const c = getLabelColor(label.color);
                        return (
                            <span
                                key={i}
                                className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded-full', c.bg, c.text)}
                            >
                                {label.text}
                            </span>
                        );
                    })}
                </div>
            )}

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
                            'text-[11px]',
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

            {/* Footer: due date + linked note + comments indicator */}
            {(dueDateText || card.linkedNoteId || card.commentCount > 0) && (
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    {dueDateText && (
                        <span
                            className={cn(
                                'flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded',
                                dueDateStatus === 'overdue' && 'bg-red-500/10 text-red-400',
                                dueDateStatus === 'soon' && 'bg-amber-500/10 text-amber-400',
                                dueDateStatus === 'normal' && 'bg-surface-raised text-text-muted'
                            )}
                        >
                            <Calendar className="w-3 h-3" />
                            {dueDateText}
                        </span>
                    )}

                    {card.linkedNoteId && (
                        <span className="flex items-center gap-1 text-[11px] text-accent bg-accent/5 px-1.5 py-0.5 rounded">
                            <AnimatedIcon type="notes" active className="w-3 h-3" />
                            Note
                        </span>
                    )}

                    {card.commentCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-text-muted bg-surface-raised px-1.5 py-0.5 rounded">
                            <MessageSquare className="w-3 h-3" />
                            {card.commentCount}
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
