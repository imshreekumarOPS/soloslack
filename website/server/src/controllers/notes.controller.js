const Note = require('../models/Note');
const File = require('../models/File');
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
        const { search, tag, limit = 50, skip = 0, workspaceId } = req.query;
        console.log(`[DEBUG] getNotes: search=${search}, tag=${tag}, workspaceId=${workspaceId}`);
        const query = { isArchived: false };
        let fileQuery = {}; // Ensure fileQuery is defined even if no workspaceId

        if (workspaceId) {
            const wsVal = (workspaceId === 'none' || workspaceId === 'null') ? null : workspaceId;
            query.workspaceId = wsVal;
            fileQuery.workspaceId = wsVal;
        }

        if (search && search.trim()) {
            query.$or = [
                { title: { $regex: search.trim(), $options: 'i' } },
                { body: { $regex: search.trim(), $options: 'i' } },
            ];
            fileQuery.name = { $regex: search.trim(), $options: 'i' };
        }

        if (tag && tag.trim()) {
            query.tags = tag.trim().toLowerCase();
        }

        const [notes, files, countNotes, countFiles] = await Promise.all([
            Note.find(query)
                .sort({ isPinned: -1, updatedAt: -1 })
                .limit(Number(skip) + Number(limit))
                .lean(),
            File.find(fileQuery)
                .sort({ updatedAt: -1 })
                .limit(Number(skip) + Number(limit))
                .lean(),
            Note.countDocuments(query),
            File.countDocuments(fileQuery),
        ]);
        console.log(`[DEBUG] Results: notesCount=${notes.length}, filesCount=${files.length}`);

        // Map files to look like notes
        const fileNotes = files.map(file => ({
            ...file,
            title: file.name,
            body: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
            type: 'file',
            isPinned: false,
            tags: ['file', (file.mimeType || '').split('/')[1] || 'generic'],
            updatedAt: file.updatedAt,
            createdAt: file.createdAt
        }));

        // Merge and sort
        const combined = [...notes.map(n => ({ ...n, type: 'note' })), ...fileNotes]
            .sort((a, b) => {
                if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            })
            .slice(Number(skip), Number(skip) + Number(limit));

        res.status(200).json({ success: true, count: countNotes + countFiles, data: combined });
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
        const { title, body, tags, isPinned, workspaceId } = req.body;

        const note = await Note.create({ title, body, tags, isPinned, workspaceId: workspaceId || null });

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

// @desc    Archive (soft-delete) note — also unlinks from cards
// @route   DELETE /api/notes/:id
exports.deleteNote = async (req, res, next) => {
    try {
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            { isArchived: true, archivedAt: new Date() },
            { new: true }
        );

        if (!note) {
            const error = new Error('Note not found');
            error.statusCode = 404;
            throw error;
        }

        // Unlink any cards that reference this note
        await Card.updateMany(
            { linkedNoteId: req.params.id },
            { $set: { linkedNoteId: null } }
        );

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// @desc    Restore note from archive
// @route   PATCH /api/notes/:id/restore
exports.restoreNote = async (req, res, next) => {
    try {
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            { isArchived: false, archivedAt: null },
            { new: true }
        ).lean();

        if (!note) {
            const error = new Error('Note not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ success: true, data: note });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk archive notes — also unlinks from cards
// @route   POST /api/notes/bulk-archive
exports.bulkArchiveNotes = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            const error = new Error('ids array is required');
            error.statusCode = 400;
            throw error;
        }

        // Unlink any cards that reference these notes
        await Card.updateMany(
            { linkedNoteId: { $in: ids } },
            { $set: { linkedNoteId: null } }
        );

        const result = await Note.updateMany(
            { _id: { $in: ids } },
            { $set: { isArchived: true, archivedAt: new Date() } }
        );

        res.status(200).json({ success: true, archived: result.modifiedCount });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk restore notes from archive (undo bulk-archive)
// @route   POST /api/notes/bulk-restore
exports.bulkRestoreNotes = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            const error = new Error('ids array is required');
            error.statusCode = 400;
            throw error;
        }

        await Note.updateMany(
            { _id: { $in: ids } },
            { $set: { isArchived: false, archivedAt: null } }
        );

        const notes = await Note.find({ _id: { $in: ids } }).lean();
        res.status(200).json({ success: true, data: notes, restored: notes.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk delete notes permanently
// @route   POST /api/notes/bulk-delete
exports.bulkDeleteNotes = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            const error = new Error('ids array is required');
            error.statusCode = 400;
            throw error;
        }

        await Card.updateMany(
            { linkedNoteId: { $in: ids } },
            { $set: { linkedNoteId: null } }
        );
        const result = await Note.deleteMany({ _id: { $in: ids } });

        res.status(200).json({ success: true, deleted: result.deletedCount });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk add tag to notes
// @route   POST /api/notes/bulk-tag
exports.bulkTagNotes = async (req, res, next) => {
    try {
        const { ids, tag } = req.body;
        if (!Array.isArray(ids) || ids.length === 0 || !tag?.trim()) {
            const error = new Error('ids array and tag are required');
            error.statusCode = 400;
            throw error;
        }

        const result = await Note.updateMany(
            { _id: { $in: ids } },
            { $addToSet: { tags: tag.trim().toLowerCase() } }
        );

        res.status(200).json({ success: true, modified: result.modifiedCount });
    } catch (error) {
        next(error);
    }
};

// @desc    Permanently delete note
// @route   DELETE /api/notes/:id/permanent
exports.permanentDeleteNote = async (req, res, next) => {
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
