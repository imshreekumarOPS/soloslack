const express = require('express');
const router = express.Router();

router.use('/notes', require('./notes.routes'));
router.use('/boards', require('./boards.routes'));
router.use('/columns', require('./columns.routes'));
router.use('/cards', require('./cards.routes'));
router.use('/settings', require('./settings.routes'));

module.exports = router;
