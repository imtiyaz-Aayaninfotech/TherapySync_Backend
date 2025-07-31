const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/questionnaire.controller');

router.post('/', ctrl.createQuestionnaire);
router.get('/', ctrl.getAllQuestionnaires);
router.get('/:id', ctrl.getQuestionnaireById);
router.put('/:id', ctrl.updateQuestionnaire);
router.delete('/:id', ctrl.deleteQuestionnaire);

module.exports = router;