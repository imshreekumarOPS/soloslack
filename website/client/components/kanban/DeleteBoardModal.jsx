'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useBoards } from '@/context/BoardsContext';
import { exportBoardToJson } from '@/lib/utils/exportUtils';
import { Trash2, Download, AlertTriangle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function DeleteBoardModal({ isOpen, onClose, boardId, boardName }) {
    const { deleteBoard, fetchBoardFull } = useBoards();
    const pathname = usePathname();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteBoard(boardId);
            onClose();
            // If we are on the board we just deleted, redirect home
            if (pathname === `/boards/${boardId}`) {
                router.push('/');
            }
        } catch (err) {
            console.error('Failed to delete board:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const boardData = await fetchBoardFull(boardId);
            exportBoardToJson(boardData);
        } catch (err) {
            console.error('Failed to export board:', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Board">
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-red-500 mb-1">Warning: Irreversible Action</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-text-primary">"{boardName}"</span>? 
                            This will permanently remove all columns, cards, and associated data.
                        </p>
                    </div>
                </div>

                <div className="bg-surface-overlay rounded-xl p-4 border border-border-subtle">
                    <p className="text-xs text-text-muted mb-4">
                        We recommend exporting your board data before deletion if you might need it later.
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={isExporting || isDeleting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-border-default hover:bg-surface-hover text-text-primary transition-all disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exporting...' : 'Export Board Data (JSON)'}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border border-border-default hover:bg-surface-hover text-text-primary transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || isExporting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
