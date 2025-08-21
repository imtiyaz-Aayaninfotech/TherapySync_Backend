// routes/pricingRoutes.js
const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricing.controller');

router.post('/', pricingController.createPricing);
router.get('/', pricingController.getAllPricings);
router.get('/:id', pricingController.getPricingById);
router.put('/:id', pricingController.updatePricing);
router.delete('/:id', pricingController.deletePricing);

module.exports = router;
