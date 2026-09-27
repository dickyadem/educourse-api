// ============================================================
// Route - tabel `question_options`
// ============================================================

const express = require('express');
const router = express.Router();
const questionOptionController = require('../controller/questionOptionController');

router.get('/', questionOptionController.getAllOptions);
router.post('/', questionOptionController.addOption);
router.get('/:id', questionOptionController.getOptionById);
router.patch('/:id', questionOptionController.updateOption);
router.delete('/:id', questionOptionController.deleteOption);

module.exports = router;
