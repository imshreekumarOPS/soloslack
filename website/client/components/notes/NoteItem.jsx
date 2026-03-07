import { cn } from '@/lib/utils/cn';
import { timeAgo } from '@/lib/utils/formatDate';

export default function NoteItem({ note, isActive, onClick }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 border-b border-border-subtle cursor-pointer transition-colors hover:bg-surface-hover",
                isActive && "bg-accent-subtle border-l-2 border-accent hover:bg-accent-subtle"
            )}
        >
            <h4 className="text-sm font-medium text-text-primary truncate mb-1">
                {note.title || 'Untitled'}
            </h4>
            <p className="text-xs text-text-muted line-clamp-2">
                {note.body ? note.body.substring(0, 100) : 'No content'}
            </p>
            <div className="mt-2 text-[10px] text-text-muted">
                {timeAgo(note.updatedAt)}
            </div>
        </div>
    );
}
