export const exportBoardToJson = (boardData) => {
    if (!boardData || !boardData.board) return;

    // Clean up data for export - only include necessary fields
    const exportData = {
        board: {
            name: boardData.board.name,
            description: boardData.board.description
        },
        columns: boardData.columns.map(col => ({
            name: col.name,
            order: col.order,
            cards: (col.cards || []).map(card => ({
                title: card.title,
                description: card.description,
                priority: card.priority,
                tags: card.tags,
                order: card.order,
                dueDate: card.dueDate,
                linkedNoteId: card.linkedNoteId
            }))
        }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${boardData.board.name.replace(/\s+/g, '_')}_export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
