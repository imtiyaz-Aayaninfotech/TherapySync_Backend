const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userResponse.controller');

router.post('/', ctrl.submitResponse);
router.get('/', ctrl.getAllUserResponses);
router.get('/all/full', ctrl.getAllFullUserResponses);
router.get('/:userId', ctrl.getUserResponses);
router.get('/:userId/:questionnaireId', ctrl.getUserResponseByQuestionnaire);
router.put('/:id', ctrl.updateUserResponse);
router.delete('/:id', ctrl.deleteUserResponse);

module.exports = router;
         