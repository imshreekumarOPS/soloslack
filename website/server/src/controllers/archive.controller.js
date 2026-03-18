const Note = require('../models/Note');
const Board = require('../models/Board');

// @desc    Get all archived notes and boards
// @route   GET /api/archive
exports.getArchive = async (req, res, next) => {
    try {
        const [notes, boards] = await Promise.all([
            Note.find({ isArchived: true }).sort({ archivedAt: -1 }).lean(),
            Board.find({ isArchived: true }).sort({ archivedAt: -1 }).lean(),
        ]);

        res.status(200).json({ success: true, data: { notes, boards } });
    } catch (error) {
        next(error);
    }
};
