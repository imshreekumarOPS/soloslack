const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

router.get('/env', settingsController.getEnv);
router.post('/env', settingsController.updateEnv);

module.exports = router;
