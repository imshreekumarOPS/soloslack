import { useNotes } from '@/context/NotesContext';
import NoteSearch from './NoteSearch';
import NoteItem from './NoteItem';

export default function NotesList() {
    const { notes, activeNote, setActiveNote, fetchNotes, createNote, loading } = useNotes();

    const handleSearch = (search) => {
        fetchNotes({ search });
    };

    const handleNewNote = async () => {
        await createNote({ title: 'New Note', body: '' });
    };

    return (
        <div className="w-72 flex flex-col border-r border-border-subtle bg-surface-base h-full">
            <div className="p-4 flex items-center justify-between border-b border-border-subtle">
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Notes</h2>
                <button
                    onClick={handleNewNote}
                    className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    title="New Note"
                >
                    <span className="text-lg">+</span>
                </button>
            </div>

            <NoteSearch onSearch={handleSearch} />

            <div className="flex-1 overflow-y-auto">
                {loading && notes.length === 0 ? (
                    <div className="p-4 text-center text-xs text-text-muted">Loading...</div>
                ) : notes.length === 0 ? (
                    <div className="p-4 text-center text-xs text-text-muted">No notes found</div>
                ) : (
                    notes.map((note) => (
                        <NoteItem
                            key={note._id}
                            note={note}
                            isActive={activeNote?._id === note._id}
                            onClick={() => setActiveNote(note)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
