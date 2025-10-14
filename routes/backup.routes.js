const express = require('express');
const router = express.Router();
const { downloadBackupJSON } = require('../controllers/backup.controller');

router.post('/backup', downloadBackupJSON);

module.exports = router;
