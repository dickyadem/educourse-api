// ============================================================
// Route - tabel `tutors`
// ============================================================

const express = require('express');
const router = express.Router();
const tutorController = require('../controller/tutorController');

router.get('/', tutorController.getAllTutors);
router.post('/', tutorController.addTutor);
router.get('/:id', tutorController.getTutorById);
router.patch('/:id', tutorController.updateTutor);
router.delete('/:id', tutorController.deleteTutor);

module.exports = router;
