import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function NoteSearch({ onSearch }) {
    const [query, setQuery] = useState('');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            onSearch(query);
        }, 400);

        return () => clearTimeout(timer);
    }, [query, onSearch]);

    const handleClear = () => {
        setQuery('');
        // onSearch('') will fire via the useEffect above
    };

    return (
        <div className="p-3 border-b border-border-subtle">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-3.5 h-3.5 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search notes…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-surface-overlay border border-border-default rounded-md pl-9 pr-8 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                        title="Clear search"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
