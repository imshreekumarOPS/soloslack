const Note = require('../models/Note');

// @desc    Get all notes
// @route   GET /api/notes
exports.getNotes = async (req, res, next) => {
    try {
        const { search, limit = 50, skip = 0 } = req.query;
        let query = {};

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const notes = await Note.find(query)
            .sort({ isPinned: -1, updatedAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .lean();

        const count = await Note.countDocuments(query);

        res.status(200).json({
            success: true,
            count,
            data: notes,
            message: 'Notes fetched successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single note
// @route   GET /api/notes/:id
exports.getNoteById = async (req, res, next) => {
    try {
        const note = await Note.findById(req.params.id).lean();

        if (!note) {
            const error = new Error('Note not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            data: note,
            message: 'Note fetched successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new note
// @route   POST /api/notes
exports.createNote = async (req, res, next) => {
    try {
        const { title, body, tags, isPinned } = req.body;

        if (!title) {
            const error = new Error('Title is required');
            error.statusCode = 400;
            throw error;
        }

        const note = await Note.create({
            title,
            body,
            tags,
            isPinned,
        });

        res.status(201).json({
            success: true,
            data: note,
            message: 'Note created successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update note
// @route   PATCH /api/notes/:id
exports.updateNote = async (req, res, next) => {
    try {
        const note = await Note.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!note) {
            const error = new Error('Note not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            data: note,
            message: 'Note updated successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
exports.deleteNote = async (req, res, next) => {
    try {
        const note = await Note.findByIdAndDelete(req.params.id);

        if (!note) {
            const error = new Error('Note not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
