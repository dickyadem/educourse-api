// ============================================================
// Service layer - tabel `assessments`
// Konfigurasi penilaian untuk material pretest/quiz/exam.
// ============================================================

const { pool } = require('../config/database');

async function getAllAssessments() {
  const [rows] = await pool.query(
    `SELECT a.*, mt.title AS material_title, mt.type AS material_type
       FROM assessments a
       JOIN materials mt ON mt.id = a.material_id
      ORDER BY a.id`
  );
  return rows;
}

async function getAssessmentById(id) {
  const [rows] = await pool.query(
    `SELECT a.*, mt.title AS material_title, mt.type AS material_type
       FROM assessments a
       JOIN materials mt ON mt.id = a.material_id
      WHERE a.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// SELECT berdasarkan atribut lain: assessment milik satu material
async function getAssessmentByMaterial(materialId) {
  const [rows] = await pool.query('SELECT * FROM assessments WHERE material_id = ?', [materialId]);
  return rows[0] || null;
}

async function addAssessment({ material_id, passing_score = 60 }) {
  const [result] = await pool.query(
    'INSERT INTO assessments (material_id, passing_score) VALUES (?, ?)',
    [material_id, passing_score]
  );
  return result.insertId;
}

async function updateAssessment(id, data) {
  const kolom = { material_id: data.material_id, passing_score: data.passing_score };
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
    `UPDATE assessments SET ${sets.join(', ')} WHERE id = ?`,
    nilai
  );
  return result.affectedRows;
}

async function deleteAssessment(id) {
  const [result] = await pool.query('DELETE FROM assessments WHERE id = ?', [id]);
  return result.affectedRows;
}

// Cek dependensi sebelum delete: soal dan attempt soal melekat di assessment.
async function countDependencies(id) {
  const [rows] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM questions           WHERE assessment_id = ?) AS questions,
       (SELECT COUNT(*) FROM assessment_attempts WHERE assessment_id = ?) AS attempts`,
    [id, id]
  );
  return rows[0];
}

module.exports = {
  getAllAssessments,
  getAssessmentById,
  getAssessmentByMaterial,
  addAssessment,
  updateAssessment,
  deleteAssessment,
  countDependencies,
};
