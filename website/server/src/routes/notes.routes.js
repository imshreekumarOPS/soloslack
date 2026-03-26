const express = require('express');
const router = express.Router();
const { getNotes, getNoteById, createNote, updateNote, deleteNote, restoreNote, permanentDeleteNote, bulkArchiveNotes, bulkRestoreNotes, bulkDeleteNotes, bulkTagNotes } = require('../controllers/notes.controller');

router.route('/')
    .get(getNotes)
    .post(createNote);

// Bulk operations — must be before /:id
router.post('/bulk-archive', bulkArchiveNotes);
router.post('/bulk-delete', bulkDeleteNotes);
router.post('/bulk-restore', bulkRestoreNotes);
router.post('/bulk-tag', bulkTagNotes);

router.patch('/:id/restore', restoreNote);
router.delete('/:id/permanent', permanentDeleteNote);

router.route('/:id')
    .get(getNoteById)
    .patch(updateNote)
    .delete(deleteNote);

module.exports = router;
