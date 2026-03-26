const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
    {
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            default: null,
        },
        name: {
            type: String,
            required: [true, 'Board name is required'],
            trim: true,
            maxlength: [100, 'Board name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        order: { type: Number, default: 0 },
        isArchived: { type: Boolean, default: false },
        archivedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
