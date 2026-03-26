const express = require('express');
const router = express.Router();

router.use('/notes', require('./notes.routes'));
router.use('/boards', require('./boards.routes'));
router.use('/workspaces', require('./workspaces.routes'));
router.use('/columns', require('./columns.routes'));
router.use('/cards', require('./cards.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/search', require('./search.routes'));
router.use('/archive', require('./archive.routes'));

module.exports = router;
