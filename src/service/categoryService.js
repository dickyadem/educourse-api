// ============================================================
// Service layer - Implementing DML (Langkah 2)
// Tabel `categories`: master data kategori kelas.
// ============================================================

const { pool } = require('../config/database');

// SELECT semua, diurutkan agar rapi di tampilan
async function getAllCategories() {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
  return rows;
}

// SELECT by id
async function getCategoryById(id) {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
}

// SELECT by atribut lain: slug dipakai untuk mencari berdasarkan URL
async function getCategoryBySlug(slug) {
  const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
  return rows[0] || null;
}

// INSERT
async function addCategory({ name, slug }) {
  const [result] = await pool.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [
    name,
    slug,
  ]);
  return result.insertId;
}

// UPDATE by id. COALESCE membuat kolom yang tidak dikirim tetap utuh.
async function updateCategory(id, { name, slug }) {
  const [result] = await pool.query(
    'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug) WHERE id = ?',
    [name ?? null, slug ?? null, id]
  );
  return result.affectedRows;
}

// DELETE by id
async function deleteCategory(id) {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows;
}

// Menghitung jumlah kelas pada kategori, dipakai controller sebelum delete
// supaya pesan error lebih informatif daripada error FK mentah.
async function countCoursesInCategory(id) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM courses WHERE category_id = ?', [id]);
  return rows[0].total;
}

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  addCategory,
  updateCategory,
  deleteCategory,
  countCoursesInCategory,
};
