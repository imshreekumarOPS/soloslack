const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
    {
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
    },
    { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
