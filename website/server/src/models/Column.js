const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
    {
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            required: [true, 'boardId is required'],
        },
        name: {
            type: String,
            required: [true, 'Column name is required'],
            trim: true,
            maxlength: [50, 'Column name cannot exceed 50 characters'],
        },
        order: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        wipLimit: {
            type: Number,
            default: null,
            min: [1, 'WIP limit must be at least 1'],
        },
    },
    { timestamps: true }
);

columnSchema.index({ boardId: 1, order: 1 });

module.exports = mongoose.model('Column', columnSchema);
