const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        default: null
    },
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('File', fileSchema);
