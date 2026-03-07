const Column = require('../models/Column');
const Card = require('../models/Card');

// @desc    Get all columns for a board
// @route   GET /api/columns
exports.getColumns = async (req, res, next) => {
    try {
        const { boardId } = req.query;
        if (!boardId) {
            const error = new Error('boardId is required');
            error.statusCode = 400;
            throw error;
        }

        const columns = await Column.find({ boardId }).sort({ order: 1 }).lean();
        res.status(200).json({
            success: true,
            count: columns.length,
            data: columns,
            message: 'Columns fetched successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new column
// @route   POST /api/columns
exports.createColumn = async (req, res, next) => {
    try {
        const { boardId, name, order } = req.body;
        if (!boardId || !name) {
            const error = new Error('boardId and name are required');
            error.statusCode = 400;
            throw error;
        }

        // Determine order if not provided
        let finalOrder = order;
        if (finalOrder === undefined) {
            const lastCol = await Column.findOne({ boardId }).sort({ order: -1 });
            finalOrder = lastCol ? lastCol.order + 1 : 0;
        }

        const column = await Column.create({ boardId, name, order: finalOrder });
        res.status(201).json({
            success: true,
            data: column,
            message: 'Column created successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update column
// @route   PATCH /api/columns/:id
exports.updateColumn = async (req, res, next) => {
    try {
        const column = await Column.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!column) {
            const error = new Error('Column not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: column,
            message: 'Column updated successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete column
// @route   DELETE /api/columns/:id
exports.deleteColumn = async (req, res, next) => {
    try {
        const columnId = req.params.id;
        const column = await Column.findById(columnId);
        if (!column) {
            const error = new Error('Column not found');
            error.statusCode = 404;
            throw error;
        }

        // Cascade delete cards in this column
        await Promise.all([
            Card.deleteMany({ columnId }),
            Column.findByIdAndDelete(columnId),
        ]);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
