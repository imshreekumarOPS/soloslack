const express = require('express');
const router = express.Router();
const { getArchive } = require('../controllers/archive.controller');

router.get('/', getArchive);

module.exports = router;
