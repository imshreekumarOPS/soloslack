const Workspace = require('../models/Workspace');
const Board = require('../models/Board');
const Note = require('../models/Note');
const Card = require('../models/Card');
const Column = require('../models/Column');
const Comment = require('../models/Comment');

// @desc    Get all workspaces with board/note counts
// @route   GET /api/workspaces
exports.getWorkspaces = async (req, res, next) => {
    try {
        const workspaces = await Workspace.find({ isArchived: false })
            .sort({ order: 1, updatedAt: -1 })
            .lean();

        // Aggregate counts per workspace in parallel
        const ids = workspaces.map(w => w._id);
        const [boardCounts, noteCounts] = await Promise.all([
            Board.aggregate([
                { $match: { workspaceId: { $in: ids }, isArchived: false } },
                { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
            ]),
            Note.aggregate([
                { $match: { workspaceId: { $in: ids }, isArchived: false } },
                { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
            ]),
        ]);

        const boardMap = Object.fromEntries(boardCounts.map(c => [c._id.toString(), c.count]));
        const noteMap = Object.fromEntries(noteCounts.map(c => [c._id.toString(), c.count]));

        const data = workspaces.map(w => ({
            ...w,
            boardCount: boardMap[w._id.toString()] ?? 0,
            noteCount: noteMap[w._id.toString()] ?? 0,
        }));

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single workspace
// @route   GET /api/workspaces/:id
exports.getWorkspaceById = async (req, res, next) => {
    try {
        const workspace = await Workspace.findById(req.params.id).lean();
        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ success: true, data: workspace });
    } catch (error) {
        next(error);
    }
};

// @desc    Create workspace
// @route   POST /api/workspaces
exports.createWorkspace = async (req, res, next) => {
    try {
        const { name, description, color } = req.body;
        if (!name || !name.trim()) {
            const error = new Error('Workspace name is required');
            error.statusCode = 400;
            throw error;
        }

        const lastWorkspace = await Workspace.findOne({ isArchived: false }).sort({ order: -1 });
        const order = lastWorkspace ? lastWorkspace.order + 1 : 0;

        const workspace = await Workspace.create({
            name: name.trim(),
            description,
            color,
            order,
        });

        res.status(201).json({ success: true, data: workspace, message: 'Workspace created successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Update workspace
// @route   PATCH /api/workspaces/:id
exports.updateWorkspace = async (req, res, next) => {
    try {
        const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ success: true, data: workspace, message: 'Workspace updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete workspace (soft-delete) — cascades to boards, cards, comments, and notes
// @route   DELETE /api/workspaces/:id
exports.deleteWorkspace = async (req, res, next) => {
    try {
        const workspace = await Workspace.findByIdAndUpdate(
            req.params.id,
            { isArchived: true, archivedAt: new Date() },
            { new: true }
        );
        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            throw error;
        }

        // 1. Find all boards in this workspace
        const boardIds = await Board.find({ workspaceId: req.params.id }).distinct('_id');

        // 2. Find all cards in those boards
        const cardIds = boardIds.length > 0
            ? await Card.find({ boardId: { $in: boardIds } }).distinct('_id')
            : [];

        // 3. Cascade: delete comments, then cards, columns, and archive boards
        await Promise.all([
            cardIds.length > 0 ? Comment.deleteMany({ cardId: { $in: cardIds } }) : Promise.resolve(),
            cardIds.length > 0 ? Card.deleteMany({ boardId: { $in: boardIds } }) : Promise.resolve(),
            boardIds.length > 0 ? Column.deleteMany({ boardId: { $in: boardIds } }) : Promise.resolve(),
            Board.deleteMany({ workspaceId: req.params.id }),
        ]);

        // 4. Unlink cards that referenced notes in this workspace, then delete notes
        const noteIds = await Note.find({ workspaceId: req.params.id }).distinct('_id');
        if (noteIds.length > 0) {
            await Card.updateMany(
                { linkedNoteId: { $in: noteIds } },
                { $set: { linkedNoteId: null } }
            );
        }
        await Note.deleteMany({ workspaceId: req.params.id });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// @desc    Reorder workspaces
// @route   PATCH /api/workspaces/reorder
exports.reorderWorkspaces = async (req, res, next) => {
    try {
        const { workspaces } = req.body;
        if (!Array.isArray(workspaces)) {
            const error = new Error('workspaces must be an array');
            error.statusCode = 400;
            throw error;
        }
        await Promise.all(workspaces.map(({ id, order }) => Workspace.findByIdAndUpdate(id, { order })));
        res.status(200).json({ success: true, message: 'Workspaces reordered successfully' });
    } catch (error) {
        next(error);
    }
};
