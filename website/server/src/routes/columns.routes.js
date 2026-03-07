const express = require('express');
const router = express.Router();
const { getColumns, createColumn, updateColumn, deleteColumn } = require('../controllers/columns.controller');

router.route('/')
    .get(getColumns)
    .post(createColumn);

router.route('/:id')
    .patch(updateColumn)
    .delete(deleteColumn);

module.exports = router;
