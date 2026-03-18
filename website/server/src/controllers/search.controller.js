const Note = require('../models/Note');
const Card = require('../models/Card');

// @desc    Full-text search across notes (title + body) and cards (title + description)
// @route   GET /api/search?q=
exports.search = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.status(200).json({ success: true, data: { notes: [], cards: [] } });
        }

        const regex = { $regex: q.trim(), $options: 'i' };

        const [notes, cards] = await Promise.all([
            Note.find({ $or: [{ title: regex }, { body: regex }] })
                .select('_id title body updatedAt')
                .sort({ updatedAt: -1 })
                .limit(10)
                .lean(),

            Card.find({
                isArchived: false,
                $or: [{ title: regex }, { description: regex }],
            })
                .select('_id title description priority boardId')
                .populate('boardId', '_id name')
                .sort({ updatedAt: -1 })
                .limit(10)
                .lean(),
        ]);

        res.status(200).json({ success: true, data: { notes, cards } });
    } catch (error) {
        next(error);
    }
};
