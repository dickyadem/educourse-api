// ============================================================
// Route - tabel `assessments`
// ============================================================

const express = require('express');
const router = express.Router();
const assessmentController = require('../controller/assessmentController');

router.get('/', assessmentController.getAllAssessments);
router.post('/', assessmentController.addAssessment);
router.get('/:id', assessmentController.getAssessmentById);
router.patch('/:id', assessmentController.updateAssessment);
router.delete('/:id', assessmentController.deleteAssessment);

module.exports = router;
