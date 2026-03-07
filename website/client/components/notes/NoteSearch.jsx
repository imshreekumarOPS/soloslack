import { useState, useEffect } from 'react';

export default function NoteSearch({ onSearch }) {
    const [query, setQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query, onSearch]);

    return (
        <div className="p-3 border-b border-border-subtle">
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
                <input
                    type="text"
                    placeholder="Search notes..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-surface-overlay border border-border-default rounded-md pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
            </div>
        </div>
    );
}
