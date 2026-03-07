const express = require('express');
const router = express.Router();
const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/notes.controller');

router.route('/')
    .get(getNotes)
    .post(createNote);

router.route('/:id')
    .get(getNoteById)
    .patch(updateNote)
    .delete(deleteNote);

module.exports = router;
