'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, FileText, LayoutDashboard, RotateCcw, Trash2, Clock } from 'lucide-react';
import { archiveApi } from '@/lib/api/archiveApi';
import { useNotes } from '@/context/NotesContext';
import { useBoards } from '@/context/BoardsContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { cn } from '@/lib/utils/cn';

function timeAgoShort(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

export default function ArchivePage() {
    const [tab, setTab] = useState('notes'); // 'notes' | 'boards'
    const [archivedNotes, setArchivedNotes] = useState([]);
    const [archivedBoards, setArchivedBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionPending, setActionPending] = useState(null); // id of item being acted on
    const [confirmAction, setConfirmAction] = useState(null); // { title, message, onConfirm }

    const { fetchNotes } = useNotes();
    const { fetchBoards } = useBoards();
    const router = useRouter();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await archiveApi.getAll();
            setArchivedNotes(res.data.notes);
            setArchivedBoards(res.data.boards);
        } catch (err) {
            console.error('Failed to load archive:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleRestoreNote = async (id) => {
        setActionPending(id);
        try {
            await archiveApi.restoreNote(id);
            setArchivedNotes(prev => prev.filter(n => n._id !== id));
            fetchNotes();
        } finally {
            setActionPending(null);
        }
    };

    const handlePermanentDeleteNote = (id) => {
        setConfirmAction({
            title: 'Delete Note',
            message: 'Permanently delete this note? This cannot be undone.',
            onConfirm: async () => {
                setActionPending(id);
                try {
                    await archiveApi.permanentDeleteNote(id);
                    setArchivedNotes(prev => prev.filter(n => n._id !== id));
                } finally {
                    setActionPending(null);
                }
            },
        });
    };

    const handleRestoreBoard = async (id) => {
        setActionPending(id);
        try {
            await archiveApi.restoreBoard(id);
            setArchivedBoards(prev => prev.filter(b => b._id !== id));
            fetchBoards();
        } finally {
            setActionPending(null);
        }
    };

    const handlePermanentDeleteBoard = (id) => {
        setConfirmAction({
            title: 'Delete Board',
            message: 'Permanently delete this board and all its cards? This cannot be undone.',
            onConfirm: async () => {
                setActionPending(id);
                try {
                    await archiveApi.permanentDeleteBoard(id);
                    setArchivedBoards(prev => prev.filter(b => b._id !== id));
                } finally {
                    setActionPending(null);
                }
            },
        });
    };

    const handleDeleteAllNotes = () => {
        if (archivedNotes.length === 0) return;
        setConfirmAction({
            title: 'Delete All Notes',
            message: `Permanently delete all ${archivedNotes.length} archived notes? This cannot be undone.`,
            onConfirm: async () => {
                setActionPending('all');
                try {
                    await Promise.all(archivedNotes.map(n => archiveApi.permanentDeleteNote(n._id)));
                    setArchivedNotes([]);
                } finally {
                    setActionPending(null);
                }
            },
        });
    };

    const handleDeleteAllBoards = () => {
        if (archivedBoards.length === 0) return;
        setConfirmAction({
            title: 'Delete All Boards',
            message: `Permanently delete all ${archivedBoards.length} archived boards and their cards? This cannot be undone.`,
            onConfirm: async () => {
                setActionPending('all');
                try {
                    await Promise.all(archivedBoards.map(b => archiveApi.permanentDeleteBoard(b._id)));
                    setArchivedBoards([]);
                } finally {
                    setActionPending(null);
                }
            },
        });
    };

    const noteCount = archivedNotes.length;
    const boardCount = archivedBoards.length;

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center text-text-muted">
                    <Archive className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-text-primary">Archive</h1>
                    <p className="text-xs text-text-muted">Archived items are hidden from the main views. Restore or permanently delete them here.</p>
                </div>
            </header>

            {/* Tabs + Delete All */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-surface-overlay border border-border-default rounded-lg p-1 w-fit">
                    <TabBtn active={tab === 'notes'} onClick={() => setTab('notes')} icon={<FileText className="w-3.5 h-3.5" />} label="Notes" count={noteCount} />
                    <TabBtn active={tab === 'boards'} onClick={() => setTab('boards')} icon={<LayoutDashboard className="w-3.5 h-3.5" />} label="Boards" count={boardCount} />
                </div>
                {((tab === 'notes' && noteCount > 0) || (tab === 'boards' && boardCount > 0)) && (
                    <button
                        onClick={tab === 'notes' ? handleDeleteAllNotes : handleDeleteAllBoards}
                        disabled={actionPending === 'all'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-colors disabled:opacity-40"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {actionPending === 'all' ? 'Deleting...' : `Delete All ${tab === 'notes' ? 'Notes' : 'Boards'}`}
                    </button>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-text-muted text-sm">Loading…</div>
            ) : tab === 'notes' ? (
                <ItemList
                    items={archivedNotes}
                    emptyLabel="No archived notes"
                    actionPending={actionPending}
                    renderIcon={() => <FileText className="w-4 h-4 text-indigo-400 shrink-0" />}
                    renderTitle={n => n.title || 'Untitled'}
                    renderMeta={n => n.body ? n.body.slice(0, 80).replace(/\n/g, ' ') + (n.body.length > 80 ? '…' : '') : 'No content'}
                    onRestore={n => handleRestoreNote(n._id)}
                    onDelete={n => handlePermanentDeleteNote(n._id)}
                />
            ) : (
                <ItemList
                    items={archivedBoards}
                    emptyLabel="No archived boards"
                    actionPending={actionPending}
                    renderIcon={() => <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />}
                    renderTitle={b => b.name}
                    renderMeta={b => b.description || 'No description'}
                    onRestore={b => handleRestoreBoard(b._id)}
                    onDelete={b => handlePermanentDeleteBoard(b._id)}
                />
            )}

            <ConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => confirmAction?.onConfirm()}
                title={confirmAction?.title || 'Confirm'}
                message={confirmAction?.message || ''}
                confirmText="Delete"
            />
        </div>
    );
}

function TabBtn({ active, onClick, icon, label, count }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                active ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
            )}
        >
            {icon}
            {label}
            {count > 0 && (
                <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none',
                    active ? 'bg-white/20 text-white' : 'bg-surface-raised text-text-muted'
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

function ItemList({ items, emptyLabel, actionPending, renderIcon, renderTitle, renderMeta, onRestore, onDelete }) {
    if (items.length === 0) {
        return (
            <div className="border border-dashed border-border-subtle rounded-2xl p-12 text-center">
                <Archive className="w-8 h-8 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">{emptyLabel}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {items.map(item => {
                const pending = actionPending === item._id;
                return (
                    <div
                        key={item._id}
                        className="flex items-center gap-4 p-4 bg-surface-raised border border-border-subtle rounded-xl hover:border-border-default transition-colors"
                    >
                        {renderIcon(item)}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{renderTitle(item)}</p>
                            <p className="text-xs text-text-muted truncate mt-0.5">{renderMeta(item)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted shrink-0 mr-2">
                            <Clock className="w-3 h-3" />
                            {timeAgoShort(item.archivedAt)}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={() => onRestore(item)}
                                disabled={pending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
                                title="Restore"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Restore
                            </button>
                            <button
                                onClick={() => onDelete(item)}
                                disabled={pending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                                title="Permanently delete"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
