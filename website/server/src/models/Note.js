const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: '',
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        body: {
            type: String,
            default: '',
        },
        tags: [
            {
                type: String,
                trim: true,
                maxlength: 50,
            }
        ],
        isPinned: {
            type: Boolean,
            default: false,
        },
        linkedCards: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Card',
            }
        ],
    },
    { timestamps: true }
);

noteSchema.index({ title: 'text' });
noteSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
