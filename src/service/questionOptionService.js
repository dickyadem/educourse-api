// ============================================================
// Service layer - tabel `question_options`
// Opsi jawaban beserta kunci jawaban tiap soal.
// ============================================================

const { pool } = require('../config/database');

async function getAllOptions() {
  const [rows] = await pool.query(
    `SELECT o.*, q.question_text
       FROM question_options o
       JOIN questions q ON q.id = o.question_id
      ORDER BY o.question_id, o.position`
  );
  return rows;
}

async function getOptionById(id) {
  const [rows] = await pool.query(
    `SELECT o.*, q.question_text
       FROM question_options o
       JOIN questions q ON q.id = o.question_id
      WHERE o.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getOptionsByQuestion(questionId) {
  const [rows] = await pool.query(
    'SELECT * FROM question_options WHERE question_id = ? ORDER BY position',
    [questionId]
  );
  return rows;
}

// Menghitung kunci jawaban pada satu soal. Dipakai controller untuk
// menegakkan aturan "tepat satu opsi benar".
async function countCorrectInQuestion(questionId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM question_options WHERE question_id = ? AND is_correct = TRUE',
    [questionId]
  );
  return rows[0].total;
}

async function countOptionsInQuestion(questionId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM question_options WHERE question_id = ?',
    [questionId]
  );
  return rows[0].total;
}

async function addOption({ question_id, option_text, is_correct = false, position }) {
  const [result] = await pool.query(
    'INSERT INTO question_options (question_id, option_text, is_correct, position) VALUES (?, ?, ?, ?)',
    [question_id, option_text, is_correct, position]
  );
  return result.insertId;
}

async function updateOption(id, data) {
  const kolom = {
    option_text: data.option_text,
    is_correct: data.is_correct,
    position: data.position,
    question_id: data.question_id,
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
    `UPDATE question_options SET ${sets.join(', ')} WHERE id = ?`,
    nilai
  );
  return result.affectedRows;
}

// Melepas kunci jawaban dari satu opsi, lalu menandai opsi lain sebagai
// satu-satunya jawaban benar. Dipakai saat pindah jawaban benar.
async function clearCorrectFlag(questionId, exceptOptionId = null) {
  if (exceptOptionId === null) {
    await pool.query('UPDATE question_options SET is_correct = FALSE WHERE question_id = ?', [questionId]);
  } else {
    await pool.query(
      'UPDATE question_options SET is_correct = FALSE WHERE question_id = ? AND id <> ?',
      [questionId, exceptOptionId]
    );
  }
}

async function deleteOption(id) {
  const [result] = await pool.query('DELETE FROM question_options WHERE id = ?', [id]);
  return result.affectedRows;
}

// Opsi yang sudah jadi jawaban peserta tidak boleh dihapus.
async function countAnswersUsingOption(id) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM attempt_answers WHERE selected_option_id = ?',
    [id]
  );
  return rows[0].total;
}

module.exports = {
  getAllOptions,
  getOptionById,
  getOptionsByQuestion,
  countCorrectInQuestion,
  countOptionsInQuestion,
  addOption,
  updateOption,
  clearCorrectFlag,
  deleteOption,
  countAnswersUsingOption,
};
