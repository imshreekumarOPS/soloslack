const express = require('express');
const router = express.Router();
const { getBoards, getBoardById, getBoardFull, createBoard, updateBoard, deleteBoard, importBoard } = require('../controllers/boards.controller');

router.route('/')
    .get(getBoards)
    .post(createBoard);

router.post('/import', importBoard);

router.route('/:id')
    .get(getBoardById)
    .patch(updateBoard)
    .delete(deleteBoard);

router.get('/:id/full', getBoardFull);

module.exports = router;
