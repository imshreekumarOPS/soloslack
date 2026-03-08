import Link from 'next/link';

const ACCENT_COLORS = [
    'accent-strip-0',
    'accent-strip-1',
    'accent-strip-2',
    'accent-strip-3',
    'accent-strip-4',
    'accent-strip-5',
    'accent-strip-6',
    'accent-strip-7',
];

function getAccentClass(name, index) {
    // Use index for deterministic but varied color assignment
    const colorIndex = (index ?? 0) % ACCENT_COLORS.length;
    return ACCENT_COLORS[colorIndex];
}

export default function BoardCard({ board, index = 0 }) {
    const accentClass = getAccentClass(board.name, index);

    return (
        <Link
            href={`/boards/${board._id}`}
            className="group relative bg-surface-raised border border-border-subtle rounded-2xl overflow-hidden hover:border-accent/40 transition-all duration-300 card-glow flex flex-col"
        >
            {/* Accent strip */}
            <div className={`absolute top-0 left-0 w-1 h-full ${accentClass} rounded-l-2xl`} />

            <div className="p-5 pl-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${accentClass} opacity-20 flex items-center justify-center`}>
                        <span className="text-white text-sm font-bold opacity-100">
                            {(board.name || 'B')[0].toUpperCase()}
                        </span>
                    </div>
                    <span className="text-[10px] text-text-muted group-hover:text-accent transition-colors font-bold uppercase tracking-widest">
                        Open →
                    </span>
                </div>

                <h3 className="text-md font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">
                    {board.name}
                </h3>
                <p className="text-xs text-text-secondary line-clamp-2 flex-1">
                    {board.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${accentClass}`} />
                    <span className="text-[10px] text-text-muted">
                        Updated {new Date(board.updatedAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </Link>
    );
}
