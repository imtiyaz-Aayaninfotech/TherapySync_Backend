const express = require('express');
const router = express.Router();
const controller = require('../controllers/agreement.controller');

router.post('/', controller.createAgreement);
router.get('/', controller.getAllAgreements);
router.get('/:id', controller.getAgreementById);
router.put('/:id', controller.updateAgreement);
router.delete('/:id', controller.deleteAgreement);
router.get('/category/:category_id', controller.getAgreementsByCategoryId)

module.exports = router;
