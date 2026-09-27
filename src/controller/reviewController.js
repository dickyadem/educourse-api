// ============================================================
// Controller - tabel `reviews`
// ============================================================

const reviewService = require('../service/reviewService');
const { pool } = require('../config/database');

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

async function getAllReviews(req, res) {
  try {
    return res.status(200).json(await reviewService.getAllReviews());
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getReviewById(req, res) {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    if (!review) return sendError(res, 404, 'Ulasan tidak ditemukan');
    return res.status(200).json(review);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

// GET /reviews/summary?course_id=1 -> rata-rata rating dan jumlah ulasan
async function getCourseRatingSummary(req, res) {
  try {
    const courseId = req.query.course_id;
    if (!courseId) return sendError(res, 400, 'query course_id wajib diisi');
    return res.status(200).json(await reviewService.getCourseRatingSummary(courseId));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function addReview(req, res) {
  try {
    const { enrollment_id, rating, review_text, batch_label } = req.body;
    if (!enrollment_id || rating === undefined || !review_text) {
      return sendError(res, 400, 'enrollment_id, rating, dan review_text wajib diisi');
    }
    if (rating < 1 || rating > 5) {
      return sendError(res, 400, 'rating harus antara 1 dan 5');
    }

    // Ulasan hanya sah kalau enrollment-nya benar-benar ada dan sudah selesai.
    const [enrollment] = await pool.query('SELECT * FROM enrollments WHERE id = ?', [enrollment_id]);
    if (!enrollment.length) {
      return sendError(res, 400, 'enrollment_id tidak ditemukan');
    }
    if (!enrollment[0].completed_at) {
      return sendError(res, 400, 'Kelas belum selesai, tidak bisa menulis ulasan');
    }

    // Satu enrollment hanya boleh punya satu ulasan.
    if (await reviewService.getReviewByEnrollment(enrollment_id)) {
      return sendError(res, 409, 'Enrollment ini sudah punya ulasan');
    }

    const id = await reviewService.addReview({ enrollment_id, rating, review_text, batch_label });
    return res.status(201).json(await reviewService.getReviewById(id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'Enrollment ini sudah punya ulasan');
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'enrollment_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function updateReview(req, res) {
  try {
    const { rating, review_text, batch_label } = req.body;
    if (![rating, review_text, batch_label].some((v) => v !== undefined)) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return sendError(res, 400, 'rating harus antara 1 dan 5');
    }

    const affected = await reviewService.updateReview(req.params.id, { rating, review_text, batch_label });
    if (!affected) return sendError(res, 404, 'Ulasan tidak ditemukan');

    return res.status(200).json(await reviewService.getReviewById(req.params.id));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function deleteReview(req, res) {
  try {
    const id = req.params.id;
    if (!(await reviewService.getReviewById(id))) {
      return sendError(res, 404, 'Ulasan tidak ditemukan');
    }
    await reviewService.deleteReview(id);
    return res.status(200).json({ message: 'Ulasan berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllReviews, getReviewById, getCourseRatingSummary, addReview, updateReview, deleteReview };
