'use client';
import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import { notesApi } from '@/lib/api/notesApi';
import NoteSearch from './NoteSearch';
import { timeAgo } from '@/lib/utils/formatDate';

export default function NotePicker({ isOpen, onClose, onSelect }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNotes = async (search = '') => {
        setLoading(true);
        try {
            const res = await notesApi.getAll({ search, limit: 10 });
            setNotes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotes();
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select a Note">
            <div className="space-y-4 min-h-[400px] flex flex-col">
                <NoteSearch onSearch={fetchNotes} />
                
                <div className="flex-1 overflow-y-auto space-y-2 mt-2">
                    {loading ? (
                        <div className="p-10 text-center text-text-muted text-sm">Loading notes...</div>
                    ) : notes.length === 0 ? (
                        <div className="p-10 text-center text-text-muted text-sm">No notes found</div>
                    ) : (
                        notes.map(note => (
                            <button
                                key={note._id}
                                onClick={() => {
                                    onSelect(note);
                                    onClose();
                                }}
                                className="w-full text-left p-3 rounded-lg border border-border-subtle hover:border-accent hover:bg-surface-hover transition-all flex items-start gap-3 group"
                            >
                                <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-text-primary truncate">{note.title}</h4>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                                        Updated {timeAgo(note.updatedAt)}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
}
