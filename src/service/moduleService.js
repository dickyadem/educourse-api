// ============================================================
// Service layer - tabel `modules`
// Kelompok material dalam satu kelas.
// ============================================================

const { pool } = require('../config/database');

async function getAllModules() {
  const [rows] = await pool.query(
    `SELECT m.*, c.title AS course_title
       FROM modules m
       JOIN courses c ON c.id = m.course_id
      ORDER BY m.course_id, m.position`
  );
  return rows;
}

async function getModuleById(id) {
  const [rows] = await pool.query(
    `SELECT m.*, c.title AS course_title
       FROM modules m
       JOIN courses c ON c.id = m.course_id
      WHERE m.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// SELECT berdasarkan atribut lain: modul milik satu kelas
async function getModulesByCourse(courseId) {
  const [rows] = await pool.query(
    'SELECT * FROM modules WHERE course_id = ? ORDER BY position',
    [courseId]
  );
  return rows;
}

async function addModule({ course_id, title, position }) {
  const [result] = await pool.query(
    'INSERT INTO modules (course_id, title, position) VALUES (?, ?, ?)',
    [course_id, title, position]
  );
  return result.insertId;
}

async function updateModule(id, { course_id, title, position }) {
  const [result] = await pool.query(
    `UPDATE modules
        SET course_id = COALESCE(?, course_id),
            title     = COALESCE(?, title),
            position  = COALESCE(?, position)
      WHERE id = ?`,
    [course_id ?? null, title ?? null, position ?? null, id]
  );
  return result.affectedRows;
}

async function deleteModule(id) {
  const [result] = await pool.query('DELETE FROM modules WHERE id = ?', [id]);
  return result.affectedRows;
}

async function countMaterialsInModule(id) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM materials WHERE module_id = ?', [id]);
  return rows[0].total;
}

module.exports = {
  getAllModules,
  getModuleById,
  getModulesByCourse,
  addModule,
  updateModule,
  deleteModule,
  countMaterialsInModule,
};
