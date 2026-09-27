// ============================================================
// Service layer - tabel `materials`
// Video, rangkuman, pretest, quiz, dan ujian akhir.
// ============================================================

const { pool } = require('../config/database');

async function getAllMaterials() {
  const [rows] = await pool.query(
    `SELECT mt.*, mo.title AS module_title
       FROM materials mt
       JOIN modules mo ON mo.id = mt.module_id
      ORDER BY mt.module_id, mt.position`
  );
  return rows;
}

async function getMaterialById(id) {
  const [rows] = await pool.query(
    `SELECT mt.*, mo.title AS module_title
       FROM materials mt
       JOIN modules mo ON mo.id = mt.module_id
      WHERE mt.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getMaterialsByModule(moduleId) {
  const [rows] = await pool.query(
    'SELECT * FROM materials WHERE module_id = ? ORDER BY position',
    [moduleId]
  );
  return rows;
}

// SELECT berdasarkan tipe: berguna untuk menyaring quiz atau ujian akhir
async function getMaterialsByType(type) {
  const [rows] = await pool.query('SELECT * FROM materials WHERE type = ? ORDER BY position', [type]);
  return rows;
}

async function addMaterial({ module_id, title, type, content_url = null, content_text = null, duration_seconds = 0, position, is_preview = false }) {
  const [result] = await pool.query(
    `INSERT INTO materials
       (module_id, title, type, content_url, content_text, duration_seconds, position, is_preview)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [module_id, title, type, content_url, content_text, duration_seconds, position, is_preview]
  );
  return result.insertId;
}

// UPDATE by id.
// Hanya kolom yang benar-benar dikirim yang ikut di-SET.
// Kalau content_url ikut di-SET dengan NULL setiap PATCH, maka request
// yang cuma mengubah judul akan ikut menghapus URL video.
async function updateMaterial(id, data) {
  const kolom = {
    module_id: data.module_id,
    title: data.title,
    type: data.type,
    content_url: data.content_url,
    content_text: data.content_text,
    duration_seconds: data.duration_seconds,
    position: data.position,
    is_preview: data.is_preview,
  };

  const sets = [];
  const nilai = [];
  for (const [nama, nilaiKolom] of Object.entries(kolom)) {
    if (nilaiKolom === undefined) continue;
    sets.push(`${nama} = ?`);
    nilai.push(nilaiKolom);
  }

  if (sets.length === 0) return 0;

  nilai.push(id);
  const [result] = await pool.query(
    `UPDATE materials SET ${sets.join(', ')} WHERE id = ?`,
    nilai
  );
  return result.affectedRows;
}

async function deleteMaterial(id) {
  const [result] = await pool.query('DELETE FROM materials WHERE id = ?', [id]);
  return result.affectedRows;
}

// Cek dependensi sebelum delete. Assessment, progress, dan jawaban soal
// semuanya menempel ke material dan tidak boleh hilang.
async function countDependencies(id) {
  const [rows] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM assessments       WHERE material_id = ?) AS assessments,
       (SELECT COUNT(*) FROM material_progress WHERE material_id  = ?) AS progress`,
    [id, id]
  );
  return rows[0];
}

module.exports = {
  getAllMaterials,
  getMaterialById,
  getMaterialsByModule,
  getMaterialsByType,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  countDependencies,
};
