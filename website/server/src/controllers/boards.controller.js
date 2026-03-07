const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');

// @desc    Get all boards
// @route   GET /api/boards
exports.getBoards = async (req, res, next) => {
    try {
        const boards = await Board.find().sort({ updatedAt: -1 }).lean();
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
        const { name, description } = req.body;
        if (!name) {
            const error = new Error('Board name is required');
            error.statusCode = 400;
            throw error;
        }

        const board = await Board.create({ name, description });

        // Create default columns
        const defaultCols = ['To Do', 'In Progress', 'Done'];
        const columnDocs = defaultCols.map((colName, index) => ({
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

// @desc    Delete board
// @route   DELETE /api/boards/:id
exports.deleteBoard = async (req, res, next) => {
    try {
        const boardId = req.params.id;
        const board = await Board.findById(boardId);
        if (!board) {
            const error = new Error('Board not found');
            error.statusCode = 404;
            throw error;
        }

        // Cascade delete columns and cards
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
