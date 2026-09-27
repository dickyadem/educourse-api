// ============================================================
// Route - tabel `reviews`
// ============================================================

const express = require('express');
const router = express.Router();
const reviewController = require('../controller/reviewController');

// Diletakkan sebelum /:id supaya "summary" tidak tertangkap sebagai id.
router.get('/summary', reviewController.getCourseRatingSummary);

router.get('/', reviewController.getAllReviews);
router.post('/', reviewController.addReview);
router.get('/:id', reviewController.getReviewById);
router.patch('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
