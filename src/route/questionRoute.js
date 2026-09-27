// ============================================================
// Route - tabel `questions`
// ============================================================

const express = require('express');
const router = express.Router();
const questionController = require('../controller/questionController');

router.get('/', questionController.getAllQuestions);
router.post('/', questionController.addQuestion);
router.get('/:id', questionController.getQuestionById);
router.patch('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
