const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
    {
        columnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Column',
            required: [true, 'columnId is required'],
        },
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            required: [true, 'boardId is required'],
        },
        title: {
            type: String,
            required: [true, 'Card title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            default: '',
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        priority: {
            type: String,
            enum: {
                values: ['low', 'medium', 'high'],
                message: 'Priority must be low, medium, or high',
            },
            default: 'medium',
        },
        order: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        linkedNoteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Note',
            default: null,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

cardSchema.index({ columnId: 1, order: 1 });
cardSchema.index({ boardId: 1 });
cardSchema.index({ boardId: 1, isArchived: 1 });

module.exports = mongoose.model('Card', cardSchema);
