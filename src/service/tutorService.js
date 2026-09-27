// ============================================================
// Service layer - tabel `tutors`
// Profil pengajar. Tidak punya kolom email karena bukan akun login.
// ============================================================

const { pool } = require('../config/database');

async function getAllTutors() {
  const [rows] = await pool.query('SELECT * FROM tutors ORDER BY name ASC');
  return rows;
}

async function getTutorById(id) {
  const [rows] = await pool.query('SELECT * FROM tutors WHERE id = ?', [id]);
  return rows[0] || null;
}

// SELECT by atribut lain: cari tutor berdasarkan nama
async function getTutorByName(name) {
  const [rows] = await pool.query('SELECT * FROM tutors WHERE name = ?', [name]);
  return rows[0] || null;
}

async function addTutor({ name, job_title, bio, photo_url = null }) {
  const [result] = await pool.query(
    'INSERT INTO tutors (name, job_title, bio, photo_url) VALUES (?, ?, ?, ?)',
    [name, job_title, bio, photo_url]
  );
  return result.insertId;
}

async function updateTutor(id, { name, job_title, bio, photo_url }) {
  const [result] = await pool.query(
    `UPDATE tutors
        SET name      = COALESCE(?, name),
            job_title = COALESCE(?, job_title),
            bio       = COALESCE(?, bio),
            photo_url = ?
      WHERE id = ?`,
    [name ?? null, job_title ?? null, bio ?? null, photo_url ?? null, id]
  );
  return result.affectedRows;
}

async function deleteTutor(id) {
  const [result] = await pool.query('DELETE FROM tutors WHERE id = ?', [id]);
  return result.affectedRows;
}

// Cek pemakaian sebelum delete, supaya pesan error tidak berupa error FK mentah.
async function countCoursesInTutor(id) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM courses WHERE tutor_id = ?', [id]);
  return rows[0].total;
}

module.exports = {
  getAllTutors,
  getTutorById,
  getTutorByName,
  addTutor,
  updateTutor,
  deleteTutor,
  countCoursesInTutor,
};
