const mongoose = require('mongoose');

const WORKSPACE_COLORS = ['indigo', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'orange', 'teal'];

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Workspace name is required'],
            trim: true,
            maxlength: [80, 'Workspace name cannot exceed 80 characters'],
        },
        description: {
            type: String,
            default: '',
            maxlength: [300, 'Description cannot exceed 300 characters'],
        },
        color: {
            type: String,
            enum: WORKSPACE_COLORS,
            default: 'indigo',
        },
        order: { type: Number, default: 0 },
        isArchived: { type: Boolean, default: false },
        archivedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

workspaceSchema.index({ order: 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
module.exports.WORKSPACE_COLORS = WORKSPACE_COLORS;
