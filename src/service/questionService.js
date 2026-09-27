// ============================================================
// Service layer - tabel `questions`
// ============================================================

const { pool } = require('../config/database');

async function getAllQuestions() {
  const [rows] = await pool.query(
    `SELECT q.*, a.passing_score, mt.title AS material_title
       FROM questions q
       JOIN assessments a  ON a.id = q.assessment_id
       JOIN materials  mt ON mt.id = a.material_id
      ORDER BY q.assessment_id, q.position`
  );
  return rows;
}

async function getQuestionById(id) {
  const [rows] = await pool.query(
    `SELECT q.*, a.passing_score, mt.title AS material_title
       FROM questions q
       JOIN assessments a  ON a.id = q.assessment_id
       JOIN materials  mt ON mt.id = a.material_id
      WHERE q.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getQuestionsByAssessment(assessmentId) {
  const [rows] = await pool.query(
    'SELECT * FROM questions WHERE assessment_id = ? ORDER BY position',
    [assessmentId]
  );
  return rows;
}

async function addQuestion({ assessment_id, question_text, position }) {
  const [result] = await pool.query(
    'INSERT INTO questions (assessment_id, question_text, position) VALUES (?, ?, ?)',
    [assessment_id, question_text, position]
  );
  return result.insertId;
}

async function updateQuestion(id, data) {
  const kolom = {
    assessment_id: data.assessment_id,
    question_text: data.question_text,
    position: data.position,
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
    `UPDATE questions SET ${sets.join(', ')} WHERE id = ?`,
    nilai
  );
  return result.affectedRows;
}

async function deleteQuestion(id) {
  const [result] = await pool.query('DELETE FROM questions WHERE id = ?', [id]);
  return result.affectedRows;
}

// Opsi dan jawaban peserta menempel ke soal, jadi soal yang sudah dipakai
// attempt tidak boleh dihapus agar riwayat jawaban tetap konsisten.
async function countOptions(id) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM question_options WHERE question_id = ?', [id]);
  return rows[0].total;
}

module.exports = {
  getAllQuestions,
  getQuestionById,
  getQuestionsByAssessment,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  countOptions,
};
