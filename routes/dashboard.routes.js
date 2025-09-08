const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

router.get('/clients/stats', dashboardController.getClientStats);
router.get('/sessions/types', dashboardController.getSessionTypes);
router.get('/sessions/trends', dashboardController.getSessionTrends);
router.get('/finance/summary', dashboardController.getFinanceSummary);
router.get('/finance/trends', dashboardController.getFinanceTrends);

module.exports = router;




