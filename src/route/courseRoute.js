// ============================================================
// Route - tabel `courses`
// ============================================================

const express = require('express');
const router = express.Router();
const courseController = require('../controller/courseController');

router.get('/', courseController.getAllCourses);
router.post('/', courseController.addCourse);
router.get('/:id', courseController.getCourseById);
router.patch('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
