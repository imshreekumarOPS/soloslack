const Comment = require('../models/Comment');
const Card = require('../models/Card');

// @desc    Get all comments for a card
// @route   GET /api/cards/:cardId/comments
exports.getComments = async (req, res, next) => {
    try {
        const { cardId } = req.params;

        const card = await Card.findById(cardId);
        if (!card) {
            const error = new Error('Card not found');
            error.statusCode = 404;
            throw error;
        }

        const comments = await Comment.find({ cardId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a comment on a card
// @route   POST /api/cards/:cardId/comments
exports.createComment = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const { body } = req.body;

        if (!body || !body.trim()) {
            const error = new Error('Comment body is required');
            error.statusCode = 400;
            throw error;
        }

        const card = await Card.findById(cardId);
        if (!card) {
            const error = new Error('Card not found');
            error.statusCode = 404;
            throw error;
        }

        const comment = await Comment.create({ cardId, body: body.trim() });

        res.status(201).json({
            success: true,
            data: comment,
            message: 'Comment created successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a comment
// @route   PATCH /api/cards/:cardId/comments/:commentId
exports.updateComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { body } = req.body;

        if (!body || !body.trim()) {
            const error = new Error('Comment body is required');
            error.statusCode = 400;
            throw error;
        }

        const comment = await Comment.findByIdAndUpdate(
            commentId,
            { body: body.trim() },
            { new: true, runValidators: true }
        );

        if (!comment) {
            const error = new Error('Comment not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            data: comment,
            message: 'Comment updated successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a comment
// @route   DELETE /api/cards/:cardId/comments/:commentId
exports.deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findByIdAndDelete(commentId);
        if (!comment) {
            const error = new Error('Comment not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
