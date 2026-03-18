const Note = require('../models/Note');
const Card = require('../models/Card');

const populateLinkedCards = (noteId) =>
    Card.find({ linkedNoteId: noteId, isArchived: false })
        .select('_id title priority boardId')
        .populate('boardId', 'name')
        .lean();

// @desc    Get all notes
// @route   GET /api/notes
exports.getNotes = async (req, res, next) => {
    try {
        const { search, tag, limit = 50, skip = 0 } = req.query;
        const query = {};

        if (search && search.trim()) {
            query.title = { $regex: search.trim(), $options: 'i' };
        }

        if (tag && tag.trim()) {
            query.tags = tag.trim().toLowerCase();
        }

        const [notes, count] = await Promise.all([
            Note.find(query)
                .sort({ isPinned: -1, updatedAt: -1 })
                .limit(Number(limit))
                .skip(Number(skip))
                .lean(),
            Note.countDocuments(query),
        ]);

        res.status(200).json({ success: true, count, data: notes });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single note with populated linked cards
// @route   GET /api/notes/:id
exports.getNoteById = async (req, res, next) => {
    try {
        const note = await Note.findById(req.params.id).lean();

        if (!note) {
            const error = new Error('Note not found');
            error.statusCode = 404;
            throw error;
        }

        const linkedCards = await populateLinkedCards(req.params.id);

        res.status(200).json({ success: true, data: { ...note, linkedCards } });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new note
// @route   POST /api/notes
exports.createNote = async (req, res, next) => {
    try {
        const { title, body, tags, isPinned } = req.body;

        const note = await Note.create({ title, body, tags, isPinned });

        res.status(201).json({ success: true, data: { ...note.toObject(), linkedCards: [] } });
    } catch (error) {
        next(error);
    }
};

// @desc    Update note
// @route   PATCH /api/notes/:id
exports.updateNote = async (req, res, next) => {
    try {
        // linkedCards is computed dynamically — never write it directly
        const { linkedCards: _ignored, ...updateData } = req.body;

        const note = await Note.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).lean();

        if (!note) {
            const error = new Error('Note not found');
            error.statusCode = 404;
            throw error;
        }

        const linkedCards = await populateLinkedCards(req.params.id);

        res.status(200).json({ success: true, data: { ...note, linkedCards } });
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

        await Card.updateMany({ linkedNoteId: req.params.id }, { $set: { linkedNoteId: null } });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
