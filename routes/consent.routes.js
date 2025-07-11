const express = require('express');
const router = express.Router();
const controller = require('../controllers/Consent.controller');

router.post('/', controller.createConsent);
router.get('/', controller.getAllConsents);
router.get('/:id', controller.getConsentById);
router.put('/:id', controller.updateConsent);
router.delete('/:id', controller.deleteConsent);
router.get('/category/:category_id', controller.getConsentsByCategoryId)

module.exports = router;
