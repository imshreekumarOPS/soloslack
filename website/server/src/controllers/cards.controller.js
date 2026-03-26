const Card = require('../models/Card');
const Column = require('../models/Column');
const Note = require('../models/Note');
const Comment = require('../models/Comment');

// Check if adding a card to a column would exceed its WIP limit
async function checkWipLimit(columnId, excludeCardId = null) {
    const column = await Column.findById(columnId).lean();
    if (!column || column.wipLimit === null) return; // no limit set

    const query = { columnId, isArchived: false };
    if (excludeCardId) query._id = { $ne: excludeCardId };
    const count = await Card.countDocuments(query);

    if (count >= column.wipLimit) {
        const error = new Error(
            `Column "${column.name}" has reached its WIP limit of ${column.wipLimit}`
        );
        error.statusCode = 409;
        error.code = 'WIP_LIMIT_EXCEEDED';
        throw error;
    }
}

// @desc    Get cards that are overdue or due within the next 7 days
// @route   GET /api/cards/upcoming
exports.getUpcomingCards = async (req, res, next) => {
    try {
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const cards = await Card.find({
            dueDate: { $ne: null, $lte: sevenDaysLater },
            isArchived: false,
        })
            .sort({ dueDate: 1 })
            .limit(20)
            .populate('boardId', 'name accentColor')
            .lean();

        res.status(200).json({ success: true, count: cards.length, data: cards });
    } catch (error) {
        next(error);
    }
};

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

        // Enforce WIP limit
        await checkWipLimit(columnId);

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
            ...(req.body.labels && { labels: req.body.labels }),
            ...(req.body.checklist && { checklist: req.body.checklist }),
        });

        // 1.5 Handle reciprocal linking to Note
        if (linkedNoteId) {
            await Note.findByIdAndUpdate(linkedNoteId, {
                $addToSet: { linkedCards: card._id }
            });
        }

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
        const oldCard = await Card.findById(req.params.id);
        if (!oldCard) {
            const error = new Error('Card not found');
            error.statusCode = 404;
            throw error;
        }

        const card = await Card.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        // Handle reciprocal linking change
        if (req.body.linkedNoteId !== undefined) {
            const oldNoteId = oldCard.linkedNoteId;
            const newNoteId = req.body.linkedNoteId;

            if (oldNoteId?.toString() !== newNoteId?.toString()) {
                // Remove from old note
                if (oldNoteId) {
                    await Note.findByIdAndUpdate(oldNoteId, {
                        $pull: { linkedCards: card._id }
                    });
                }
                // Add to new note
                if (newNoteId) {
                    await Note.findByIdAndUpdate(newNoteId, {
                        $addToSet: { linkedCards: card._id }
                    });
                }
            }
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

        const oldColumnId = card.columnId.toString();
        const targetColumnId = newColumnId.toString();

        // Enforce WIP limit when moving to a different column
        if (oldColumnId !== targetColumnId) {
            await checkWipLimit(targetColumnId, cardId);
        }

        // 1. Update the card itself
        card.columnId = targetColumnId;
        card.order = newOrder;
        await card.save();

        // 2. Re-index the destination column
        const destCards = await Card.find({ columnId: targetColumnId, isArchived: false, _id: { $ne: card._id } })
            .sort({ order: 1, updatedAt: -1 });

        // Insert moving card at newOrder position
        const newColumnCards = [...destCards];
        newColumnCards.splice(newOrder, 0, card);

        const destOps = newColumnCards.map((c, i) => ({
            updateOne: {
                filter: { _id: c._id },
                update: { $set: { order: i } },
            },
        }));

        if (destOps.length > 0) {
            await Card.bulkWrite(destOps);
        }

        // 3. Re-index the source column if it's different
        if (oldColumnId !== targetColumnId) {
            const sourceCards = await Card.find({ columnId: oldColumnId, isArchived: false })
                .sort({ order: 1 });
            const sourceOps = sourceCards.map((c, i) => ({
                updateOne: {
                    filter: { _id: c._id },
                    update: { $set: { order: i } },
                },
            }));
            if (sourceOps.length > 0) {
                await Card.bulkWrite(sourceOps);
            }
        }

        res.status(200).json({
            success: true,
            data: card,
            message: 'Card moved successfully',
        });
    } catch (error) {
        console.error('Move Card Error:', error);
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

        // Remove from linked note if exists
        if (card.linkedNoteId) {
            await Note.findByIdAndUpdate(card.linkedNoteId, {
                $pull: { linkedCards: card._id }
            });
        }

        // Cascade delete comments
        await Comment.deleteMany({ cardId: card._id });

        // Re-index column
        await reindexColumn(card.columnId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk delete cards
// @route   POST /api/cards/bulk-delete
exports.bulkDeleteCards = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            const error = new Error('ids array is required');
            error.statusCode = 400;
            throw error;
        }

        const cards = await Card.find({ _id: { $in: ids } });
        const affectedColumns = new Set();

        for (const card of cards) {
            affectedColumns.add(card.columnId.toString());
            if (card.linkedNoteId) {
                await Note.findByIdAndUpdate(card.linkedNoteId, {
                    $pull: { linkedCards: card._id },
                });
            }
        }

        await Promise.all([
            Card.deleteMany({ _id: { $in: ids } }),
            Comment.deleteMany({ cardId: { $in: ids } }),
        ]);

        for (const colId of affectedColumns) {
            await reindexColumn(colId);
        }

        res.status(200).json({ success: true, deleted: cards.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk move cards to a target column
// @route   POST /api/cards/bulk-move
exports.bulkMoveCards = async (req, res, next) => {
    try {
        const { ids, targetColumnId } = req.body;
        if (!Array.isArray(ids) || ids.length === 0 || !targetColumnId) {
            const error = new Error('ids array and targetColumnId are required');
            error.statusCode = 400;
            throw error;
        }

        // Check WIP limit on target column
        const column = await Column.findById(targetColumnId).lean();
        if (!column) {
            const error = new Error('Target column not found');
            error.statusCode = 404;
            throw error;
        }
        if (column.wipLimit !== null) {
            const currentCount = await Card.countDocuments({ columnId: targetColumnId, isArchived: false, _id: { $nin: ids } });
            if (currentCount + ids.length > column.wipLimit) {
                const error = new Error(`Moving ${ids.length} cards would exceed WIP limit of ${column.wipLimit} on "${column.name}"`);
                error.statusCode = 409;
                error.code = 'WIP_LIMIT_EXCEEDED';
                throw error;
            }
        }

        const cards = await Card.find({ _id: { $in: ids } });
        const sourceColumns = new Set();

        // Get the current max order in the target column
        const lastCard = await Card.findOne({ columnId: targetColumnId, isArchived: false }).sort({ order: -1 });
        let nextOrder = lastCard ? lastCard.order + 1 : 0;

        for (const card of cards) {
            sourceColumns.add(card.columnId.toString());
            card.columnId = targetColumnId;
            card.order = nextOrder++;
            await card.save();
        }

        // Re-index source and target columns
        for (const colId of sourceColumns) {
            await reindexColumn(colId);
        }
        await reindexColumn(targetColumnId);

        res.status(200).json({ success: true, moved: cards.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk archive cards
// @route   POST /api/cards/bulk-archive
exports.bulkArchiveCards = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            const error = new Error('ids array is required');
            error.statusCode = 400;
            throw error;
        }

        const cards = await Card.find({ _id: { $in: ids } });
        const affectedColumns = new Set();

        for (const card of cards) {
            affectedColumns.add(card.columnId.toString());
        }

        await Card.updateMany(
            { _id: { $in: ids } },
            { $set: { isArchived: true } }
        );

        for (const colId of affectedColumns) {
            await reindexColumn(colId);
        }

        res.status(200).json({ success: true, archived: cards.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk unarchive cards (undo bulk-archive)
// @route   POST /api/cards/bulk-unarchive
exports.bulkUnarchiveCards = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            const error = new Error('ids array is required');
            error.statusCode = 400;
            throw error;
        }

        await Card.updateMany(
            { _id: { $in: ids } },
            { $set: { isArchived: false } }
        );

        const cards = await Card.find({ _id: { $in: ids } }).lean();
        const affectedColumns = new Set(cards.map(c => c.columnId.toString()));
        for (const colId of affectedColumns) {
            await reindexColumn(colId);
        }

        res.status(200).json({ success: true, data: cards, restored: cards.length });
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
