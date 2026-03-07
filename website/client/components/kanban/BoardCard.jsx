import Link from 'next/link';

export default function BoardCard({ board }) {
    return (
        <Link
            href={`/boards/${board._id}`}
            className="bg-surface-raised border border-border-subtle rounded-xl p-5 hover:border-accent hover:bg-surface-hover transition-all group shadow-sm hover:shadow-accent/5"
        >
            <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">■</span>
                <span className="text-[10px] text-text-muted group-hover:text-accent transition-colors font-bold uppercase tracking-widest">Open Board →</span>
            </div>
            <h3 className="text-md font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">
                {board.name}
            </h3>
            <p className="text-xs text-text-secondary line-clamp-2">
                {board.description || 'No description provided.'}
            </p>

            <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-4">
                <div className="text-[10px] text-text-muted">
                    Updated {new Date(board.updatedAt).toLocaleDateString()}
                </div>
            </div>
        </Link>
    );
}
