import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { timeAgo } from '@/lib/utils/formatDate';
import { stripMarkdown } from '@/lib/utils/markdown';

const TAG_PALETTE = [
    { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', color: '#818cf8' },
    { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.35)',  color: '#4ade80' },
    { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)', color: '#a78bfa' },
    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#fbbf24' },
    { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.35)', color: '#f472b6' },
    { bg: 'rgba(6,182,212,0.15)',  border: 'rgba(6,182,212,0.35)',  color: '#22d3ee' },
    { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)', color: '#fb923c' },
    { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.35)', color: '#2dd4bf' },
];

function getTagStyle(tag) {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) | 0;
    const c = TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
    return { backgroundColor: c.bg, borderColor: c.border, color: c.color };
}

export default function NoteItem({ note, isActive, onClick }) {
    const cleanBody = stripMarkdown(note.body);

    return (
        <div
            onClick={onClick}
            className={cn(
                'p-3 border-b border-border-subtle cursor-pointer transition-colors hover:bg-surface-hover',
                isActive && 'bg-accent-subtle border-l-2 border-accent hover:bg-accent-subtle'
            )}
        >
            <div className="flex items-start gap-1.5 mb-1">
                {note.isPinned && (
                    <Pin className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                )}
                <h4 className="text-sm font-medium text-text-primary truncate flex-1">
                    {note.title || 'Untitled'}
                </h4>
            </div>
            <p className="text-xs text-text-muted line-clamp-2">
                {cleanBody || 'No content'}
            </p>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-text-muted">{timeAgo(note.updatedAt)}</span>
                {note.tags?.slice(0, 3).map(tag => (
                    <span
                        key={tag}
                        style={getTagStyle(tag)}
                        className="inline-block px-1.5 py-px rounded-full text-[9px] font-medium border leading-tight"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}
