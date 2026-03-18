const express = require('express');
const router = express.Router();
const { getNotes, getNoteById, createNote, updateNote, deleteNote, restoreNote, permanentDeleteNote } = require('../controllers/notes.controller');

router.route('/')
    .get(getNotes)
    .post(createNote);

router.patch('/:id/restore', restoreNote);
router.delete('/:id/permanent', permanentDeleteNote);

router.route('/:id')
    .get(getNoteById)
    .patch(updateNote)
    .delete(deleteNote);

module.exports = router;
