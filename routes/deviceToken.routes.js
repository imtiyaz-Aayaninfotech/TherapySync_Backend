const express = require('express');
const router = express.Router();
const controller = require('../controllers/deviceToken.controller');

router.post('/', controller.createDeviceToken);

module.exports = router;
