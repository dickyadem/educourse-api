// ============================================================
// Service layer -Implementing DML (Langkah 2)
// Semua query SQL untuk tabel `users` hidup di sini.
// Route/controller tidak boleh menulis query langsung.
// ============================================================

const { pool } = require('../config/database');

// ------------------------------------------------------------
// SELECT - ambil semua data
// SELECT * FROM users ORDER BY created_at DESC
// ------------------------------------------------------------
async function getAllUsers() {
  const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  return rows;
}

// ------------------------------------------------------------
// SELECT by Id - ambil data berdasarkan id
// users.id adalah UID Firebase berupa string, bukan angka auto-increment
// ------------------------------------------------------------
async function getUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

// ------------------------------------------------------------
// SELECT by atribut lain - contoh: cari pengguna berdasarkan email
// ------------------------------------------------------------
async function getUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

// ------------------------------------------------------------
// INSERT - tambah data baru
// role dan created_at/updated_at memakai nilai default database.
// ------------------------------------------------------------
async function addUser({ id, name, email, phone = null, photo_url = null, role = 'student' }) {
  const [result] = await pool.query(
    'INSERT INTO users (id, name, email, phone, photo_url, role) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, email, phone, photo_url, role]
  );
  return result.insertId;
}

// ------------------------------------------------------------
// UPDATE - ubah data secara spesifik (by id)
// Hanya kolom yang benar-benar dikirim yang ikut di-SET.
// Kalau phone dan photo_url ikut di-SET dengan NULL setiap PATCH, maka
// request yang cuma mengubah nama akan ikut menghapus nomor telepon.
// updated_at diperbarui otomatis oleh ON UPDATE CURRENT_TIMESTAMP.
// ------------------------------------------------------------
async function updateUser(id, data) {
  const kolom = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    photo_url: data.photo_url,
    role: data.role,
  };

  const sets = [];
  const nilai = [];
  for (const [namaKolom, isiKolom] of Object.entries(kolom)) {
    if (isiKolom === undefined) continue;
    sets.push(`${namaKolom} = ?`);
    nilai.push(isiKolom);
  }

  if (sets.length === 0) return 0;

  nilai.push(id);
  const [result] = await pool.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
    nilai
  );
  return result.affectedRows;
}

// ------------------------------------------------------------
// DELETE - hapus data secara spesifik (by id)
// ------------------------------------------------------------
async function deleteUser(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  addUser,
  updateUser,
  deleteUser,
};
