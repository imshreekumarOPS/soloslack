'use client';
import { NotesProvider } from "@/context/NotesContext";
import { BoardsProvider, useBoards } from "@/context/BoardsContext";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import CreateBoardModal from "@/components/kanban/CreateBoardModal";

function KeyboardShortcuts() {
    useKeyboardShortcuts();
    return null;
}

function GlobalModals() {
    const { isCreateBoardModalOpen, setIsCreateBoardModalOpen, createBoard } = useBoards();

    return (
        <CreateBoardModal
            isOpen={isCreateBoardModalOpen}
            onClose={() => setIsCreateBoardModalOpen(false)}
            onCreate={async (data) => {
                await createBoard(data);
                window.location.href = `/boards`;
            }}
        />
    );
}

export function AppProviders({ children }) {
    return (
        <NotesProvider>
            <BoardsProvider>
                <KeyboardShortcuts />
                <GlobalModals />
                {children}
            </BoardsProvider>
        </NotesProvider>
    );
}
