'use client';
import { NotesProvider } from "@/context/NotesContext";
import { BoardsProvider, useBoards } from "@/context/BoardsContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { WorkspacesProvider } from "@/context/WorkspacesContext";
import { UndoProvider } from "@/context/UndoContext";
import { AIProvider } from "@/context/AIContext";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import CreateBoardModal from "@/components/kanban/CreateBoardModal";
import ToastContainer from "@/components/ui/ToastContainer";

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
        <SettingsProvider>
            <AIProvider>
                <UndoProvider>
                    <WorkspacesProvider>
                        <NotesProvider>
                            <BoardsProvider>
                                <KeyboardShortcuts />
                                <GlobalModals />
                                {children}
                                <ToastContainer />
                            </BoardsProvider>
                        </NotesProvider>
                    </WorkspacesProvider>
                </UndoProvider>
            </AIProvider>
        </SettingsProvider>
    );
}
