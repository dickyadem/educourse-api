// ============================================================
// Service layer - tabel `courses`
// Satu kelas punya tepat satu kategori dan satu tutor.
// ============================================================

const { pool } = require('../config/database');

// SELECT semua. JOIN supaya respons tidak perlu query terpisah di frontend.
async function getAllCourses() {
  const [rows] = await pool.query(
    `SELECT c.*,
            cat.name AS category_name,
            cat.slug AS category_slug,
            t.name  AS tutor_name,
            t.job_title AS tutor_job_title
       FROM courses c
       JOIN categories cat ON cat.id = c.category_id
       JOIN tutors t       ON t.id   = c.tutor_id
      ORDER BY c.created_at DESC`
  );
  return rows;
}

// SELECT by id
async function getCourseById(id) {
  const [rows] = await pool.query(
    `SELECT c.*,
            cat.name AS category_name,
            cat.slug AS category_slug,
            t.name  AS tutor_name,
            t.job_title AS tutor_job_title
       FROM courses c
       JOIN categories cat ON cat.id = c.category_id
       JOIN tutors t       ON t.id   = c.tutor_id
      WHERE c.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// SELECT by atribut lain: slug dipakai untuk halaman detail kelas
async function getCourseBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT c.*,
            cat.name AS category_name,
            cat.slug AS category_slug,
            t.name  AS tutor_name,
            t.job_title AS tutor_job_title
       FROM courses c
       JOIN categories cat ON cat.id = c.category_id
       JOIN tutors t       ON t.id   = c.tutor_id
      WHERE c.slug = ?`,
    [slug]
  );
  return rows[0] || null;
}

// INSERT
async function addCourse({ category_id, tutor_id, slug, title, description, image_url, image_alt, price_amount, status = 'draft' }) {
  const [result] = await pool.query(
    `INSERT INTO courses
       (category_id, tutor_id, slug, title, description, image_url, image_alt, price_amount, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id, tutor_id, slug, title, description, image_url, image_alt, price_amount, status]
  );
  return result.insertId;
}

// UPDATE by id
async function updateCourse(id, { category_id, tutor_id, slug, title, description, image_url, image_alt, price_amount, status }) {
  const [result] = await pool.query(
    `UPDATE courses
        SET category_id  = COALESCE(?, category_id),
            tutor_id     = COALESCE(?, tutor_id),
            slug         = COALESCE(?, slug),
            title        = COALESCE(?, title),
            description  = COALESCE(?, description),
            image_url    = COALESCE(?, image_url),
            image_alt    = COALESCE(?, image_alt),
            price_amount = COALESCE(?, price_amount),
            status       = COALESCE(?, status)
      WHERE id = ?`,
    [category_id ?? null, tutor_id ?? null, slug ?? null, title ?? null, description ?? null,
     image_url ?? null, image_alt ?? null, price_amount ?? null, status ?? null, id]
  );
  return result.affectedRows;
}

async function deleteCourse(id) {
  const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);
  return result.affectedRows;
}

// Hitung dependensi sebelum delete. Semuanya memakai ON DELETE RESTRICT,
// jadi kelas yang sudah terjual atau punya materi tidak boleh dihapus.
async function countDependencies(id) {
  const [rows] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM orders        WHERE course_id = ?) AS orders,
       (SELECT COUNT(*) FROM enrollments   WHERE course_id = ?) AS enrollments,
       (SELECT COUNT(*) FROM modules       WHERE course_id = ?) AS modules`,
    [id, id, id]
  );
  return rows[0];
}

module.exports = {
  getAllCourses,
  getCourseById,
  getCourseBySlug,
  addCourse,
  updateCourse,
  deleteCourse,
  countDependencies,
};
