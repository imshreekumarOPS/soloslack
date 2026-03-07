const Card = require('../models/Card');

// @desc    Get all cards for a column or board
// @route   GET /api/cards
exports.getCards = async (req, res, next) => {
    try {
        const { columnId, boardId, includeArchived = 'false' } = req.query;
        let query = {};

        if (columnId) query.columnId = columnId;
        if (boardId) query.boardId = boardId;
        if (includeArchived === 'false') query.isArchived = false;

        if (!columnId && !boardId) {
            const error = new Error('columnId or boardId is required');
            error.statusCode = 400;
            throw error;
        }

        const cards = await Card.find(query).sort({ order: 1 }).lean();
        res.status(200).json({
            success: true,
            count: cards.length,
            data: cards,
            message: 'Cards fetched successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single card
// @route   GET /api/cards/:id
exports.getCardById = async (req, res, next) => {
    try {
        const card = await Card.findById(req.params.id).lean();
        if (!card) {
            const error = new Error('Card not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: card,
            message: 'Card fetched successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new card
// @route   POST /api/cards
exports.createCard = async (req, res, next) => {
    try {
        const { columnId, boardId, title, description, priority, dueDate, linkedNoteId } = req.body;
        if (!columnId || !boardId || !title) {
            const error = new Error('columnId, boardId, and title are required');
            error.statusCode = 400;
            throw error;
        }

        // Determine order
        const lastCard = await Card.findOne({ columnId, isArchived: false }).sort({ order: -1 });
        const order = lastCard ? lastCard.order + 1 : 0;

        const card = await Card.create({
            columnId,
            boardId,
            title,
            description,
            priority,
            dueDate,
            linkedNoteId,
            order,
        });

        res.status(201).json({
            success: true,
            data: card,
            message: 'Card created successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update card
// @route   PATCH /api/cards/:id
exports.updateCard = async (req, res, next) => {
    try {
        const card = await Card.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!card) {
            const error = new Error('Card not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: card,
            message: 'Card updated successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Move card (Drag & Drop)
// @route   PATCH /api/cards/:id/move
exports.moveCard = async (req, res, next) => {
    try {
        const { newColumnId, newOrder } = req.body;
        const cardId = req.params.id;

        if (newColumnId === undefined || newOrder === undefined) {
            const error = new Error('newColumnId and newOrder are required');
            error.statusCode = 400;
            throw error;
        }

        const card = await Card.findById(cardId);
        if (!card) {
            const error = new Error('Card not found');
            error.statusCode = 404;
            throw error;
        }

        const oldColumnId = card.columnId;

        // Update the card
        card.columnId = newColumnId;
        card.order = newOrder;
        await card.save();

        // Re-index source column
        const sourceCards = await Card.find({ columnId: oldColumnId, _id: { $ne: card._id }, isArchived: false }).sort({ order: 1 });
        const sourceOps = sourceCards.map((c, i) => ({
            updateOne: {
                filter: { _id: c._id },
                update: { $set: { order: i < newOrder && oldColumnId.toString() === newColumnId.toString() ? i : i >= newOrder && oldColumnId.toString() === newColumnId.toString() ? i + 1 : i } },
            },
        }));
        // Simplified re-indexing: just re-index everything in both columns
        await reindexColumn(oldColumnId);
        if (oldColumnId.toString() !== newColumnId.toString()) {
            await reindexColumn(newColumnId);
        }

        res.status(200).json({
            success: true,
            data: card,
            message: 'Card moved successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete card
// @route   DELETE /api/cards/:id
exports.deleteCard = async (req, res, next) => {
    try {
        const card = await Card.findByIdAndDelete(req.params.id);
        if (!card) {
            const error = new Error('Card not found');
            error.statusCode = 404;
            throw error;
        }
        // Re-index column
        await reindexColumn(card.columnId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// Helper function to re-index cards in a column
async function reindexColumn(columnId) {
    const cards = await Card.find({ columnId, isArchived: false }).sort({ order: 1 });
    const ops = cards.map((c, i) => ({
        updateOne: {
            filter: { _id: c._id },
            update: { $set: { order: i } },
        },
    }));
    if (ops.length > 0) {
        await Card.bulkWrite(ops);
    }
}
