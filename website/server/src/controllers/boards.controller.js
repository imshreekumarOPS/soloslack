const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');

// @desc    Get all boards
// @route   GET /api/boards
exports.getBoards = async (req, res, next) => {
    try {
        const boards = await Board.find({ isArchived: false }).sort({ order: 1, isPinned: -1, updatedAt: -1 }).lean();
        res.status(200).json({
            success: true,
            count: boards.length,
            data: boards,
            message: 'Boards fetched successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single board
// @route   GET /api/boards/:id
exports.getBoardById = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id).lean();
        if (!board) {
            const error = new Error('Board not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: board,
            message: 'Board fetched successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get full board (with columns and cards)
// @route   GET /api/boards/:id/full
exports.getBoardFull = async (req, res, next) => {
    try {
        const board = await Board.findById(req.params.id).lean();
        if (!board) {
            const error = new Error('Board not found');
            error.statusCode = 404;
            throw error;
        }

        const [columns, cards] = await Promise.all([
            Column.find({ boardId: board._id }).sort({ order: 1 }).lean(),
            Card.find({ boardId: board._id, isArchived: false }).sort({ order: 1 }).lean(),
        ]);

        const columnsWithCards = columns.map(col => ({
            ...col,
            cards: cards.filter(c => c.columnId.toString() === col._id.toString()),
        }));

        res.status(200).json({
            success: true,
            data: {
                board,
                columns: columnsWithCards,
            },
            message: 'Board loaded successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new board
// @route   POST /api/boards
exports.createBoard = async (req, res, next) => {
    try {
        const { name, description, columns: templateColumns } = req.body;
        if (!name) {
            const error = new Error('Board name is required');
            error.statusCode = 400;
            throw error;
        }

        const board = await Board.create({ name, description });

        // Use provided template columns or fall back to defaults
        const colNames = (Array.isArray(templateColumns) && templateColumns.length > 0)
            ? templateColumns
            : ['To Do', 'In Progress', 'Done'];

        const columnDocs = colNames.map((colName, index) => ({
            boardId: board._id,
            name: colName,
            order: index,
        }));

        const createdColumns = await Column.insertMany(columnDocs);

        res.status(201).json({
            success: true,
            data: {
                board,
                columns: createdColumns,
            },
            message: 'Board created successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update board
// @route   PATCH /api/boards/:id
exports.updateBoard = async (req, res, next) => {
    try {
        const board = await Board.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!board) {
            const error = new Error('Board not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: board,
            message: 'Board updated successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Archive (soft-delete) board
// @route   DELETE /api/boards/:id
exports.deleteBoard = async (req, res, next) => {
    try {
        const board = await Board.findByIdAndUpdate(
            req.params.id,
            { isArchived: true, archivedAt: new Date() },
            { new: true }
        );
        if (!board) {
            const error = new Error('Board not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// @desc    Restore board from archive
// @route   PATCH /api/boards/:id/restore
exports.restoreBoard = async (req, res, next) => {
    try {
        const board = await Board.findByIdAndUpdate(
            req.params.id,
            { isArchived: false, archivedAt: null },
            { new: true }
        ).lean();
        if (!board) {
            const error = new Error('Board not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ success: true, data: board });
    } catch (error) {
        next(error);
    }
};

// @desc    Permanently delete board
// @route   DELETE /api/boards/:id/permanent
exports.permanentDeleteBoard = async (req, res, next) => {
    try {
        const boardId = req.params.id;
        const board = await Board.findById(boardId);
        if (!board) {
            const error = new Error('Board not found');
            error.statusCode = 404;
            throw error;
        }
        await Promise.all([
            Card.deleteMany({ boardId }),
            Column.deleteMany({ boardId }),
            Board.findByIdAndDelete(boardId),
        ]);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
// @desc    Reorder boards
// @route   PATCH /api/boards/reorder
exports.reorderBoards = async (req, res, next) => {
    try {
        const { boards } = req.body;
        if (!Array.isArray(boards)) {
            const error = new Error('boards must be an array');
            error.statusCode = 400;
            throw error;
        }
        await Promise.all(boards.map(({ id, order }) => Board.findByIdAndUpdate(id, { order })));
        res.status(200).json({ success: true, message: 'Boards reordered successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Import board (with columns and cards)
// @route   POST /api/boards/import
exports.importBoard = async (req, res, next) => {
    try {
        const { board, columns } = req.body;

        if (!board || !board.name) {
            const error = new Error('Invalid board data');
            error.statusCode = 400;
            throw error;
        }

        // 1. Create the new board
        const newBoard = await Board.create({
            name: `${board.name} (Imported)`,
            description: board.description,
        });

        // 2. Create columns and preserve cards
        if (columns && Array.isArray(columns)) {
            for (const col of columns) {
                const newColumn = await Column.create({
                    boardId: newBoard._id,
                    name: col.name,
                    order: col.order,
                });

                if (col.cards && Array.isArray(col.cards)) {
                    const cardsToCreate = col.cards.map(card => ({
                        boardId: newBoard._id,
                        columnId: newColumn._id,
                        title: card.title,
                        description: card.description,
                        priority: card.priority,
                        tags: card.tags,
                        order: card.order,
                        dueDate: card.dueDate,
                        linkedNoteId: card.linkedNoteId,
                    }));
                    await Card.insertMany(cardsToCreate);
                }
            }
        }

        res.status(201).json({
            success: true,
            data: { boardId: newBoard._id },
            message: 'Board imported successfully',
        });
    } catch (error) {
        next(error);
    }
};
