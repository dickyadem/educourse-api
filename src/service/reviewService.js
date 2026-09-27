// ============================================================
// Service layer - tabel `reviews`
// Rating dan ulasan peserta yang sudah memiliki kelas.
// ============================================================

const { pool } = require('../config/database');

// JOIN ke user, course, dan material supaya ulasan bisa langsung ditampilkan
// tanpa query tambahan dari frontend.
async function getAllReviews() {
  const [rows] = await pool.query(
    `SELECT rv.*,
            u.name  AS user_name,
            c.title AS course_title,
            c.id    AS course_id
       FROM reviews rv
       JOIN enrollments e ON e.id = rv.enrollment_id
       JOIN users       u ON u.id = e.user_id
       JOIN courses     c ON c.id = e.course_id
      ORDER BY rv.created_at DESC`
  );
  return rows;
}

async function getReviewById(id) {
  const [rows] = await pool.query(
    `SELECT rv.*,
            u.name  AS user_name,
            c.title AS course_title,
            c.id    AS course_id
       FROM reviews rv
       JOIN enrollments e ON e.id = rv.enrollment_id
       JOIN users       u ON u.id = e.user_id
       JOIN courses     c ON c.id = e.course_id
      WHERE rv.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// Ulasan per kelas, sekaligus rata-rata rating dan jumlahnya.
// Dokumentasi skema juga melarang menyimpan nilai turunan, jadi dihitung saat baca.
async function getCourseRatingSummary(courseId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS jumlah,
            COALESCE(ROUND(AVG(rating), 2), 0) AS rata_rata
       FROM reviews rv
       JOIN enrollments e ON e.id = rv.enrollment_id
      WHERE e.course_id = ?`,
    [courseId]
  );
  return rows[0];
}

async function addReview({ enrollment_id, rating, review_text, batch_label = null }) {
  const [result] = await pool.query(
    'INSERT INTO reviews (enrollment_id, rating, review_text, batch_label) VALUES (?, ?, ?, ?)',
    [enrollment_id, rating, review_text, batch_label]
  );
  return result.insertId;
}

async function updateReview(id, data) {
  const kolom = {
    rating: data.rating,
    review_text: data.review_text,
    batch_label: data.batch_label,
  };
  const sets = [];
  const nilai = [];
  for (const [nama, isi] of Object.entries(kolom)) {
    if (isi === undefined) continue;
    sets.push(`${nama} = ?`);
    nilai.push(isi);
  }
  if (sets.length === 0) return 0;

  nilai.push(id);
  const [result] = await pool.query(
    `UPDATE reviews SET ${sets.join(', ')} WHERE id = ?`,
    nilai
  );
  return result.affectedRows;
}

async function deleteReview(id) {
  const [result] = await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
  return result.affectedRows;
}

async function getReviewByEnrollment(enrollmentId) {
  const [rows] = await pool.query('SELECT * FROM reviews WHERE enrollment_id = ?', [enrollmentId]);
  return rows[0] || null;
}

module.exports = {
  getAllReviews,
  getReviewById,
  getCourseRatingSummary,
  addReview,
  updateReview,
  deleteReview,
  getReviewByEnrollment,
};
