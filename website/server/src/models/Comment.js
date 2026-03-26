const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        cardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Card',
            required: [true, 'cardId is required'],
        },
        body: {
            type: String,
            required: [true, 'Comment body is required'],
            trim: true,
            maxlength: [2000, 'Comment cannot exceed 2000 characters'],
        },
    },
    { timestamps: true }
);

commentSchema.index({ cardId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
