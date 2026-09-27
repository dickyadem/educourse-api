// ============================================================
// Controller - menerjemahkan HTTP <-> service
// Validasi payload dan pembentukan status code di sini.
// ============================================================

const userService = require('../service/userService');

// Helper supaya format error konsisten di semua endpoint.
function sendError(res, status, message) {
  return res.status(status).json({ message });
}

// GET /users -> SELECT semua data
async function getAllUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

// GET /users/:id -> SELECT by id
async function getUserById(req, res) {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return sendError(res, 404, 'User tidak ditemukan');
    return res.status(200).json(user);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

// POST /users -> INSERT data baru
async function addUser(req, res) {
  try {
    const { id, name, email, phone, photo_url, role } = req.body;

    if (!id || !name || !email) {
      return sendError(res, 400, 'id, name, dan email wajib diisi');
    }

    // Cek id dan email sekaligus. id adalah primary key, jadi duplikat
    // harus ditolak lebih awal supaya tidak jadi error 500 dari database.
    const idAda = await userService.getUserById(id);
    if (idAda) {
      return sendError(res, 409, 'ID sudah digunakan');
    }

    const emailAda = await userService.getUserByEmail(email);
    if (emailAda) {
      return sendError(res, 409, 'Email sudah terdaftar');
    }

    await userService.addUser({ id, name, email, phone, photo_url, role });
    const user = await userService.getUserById(id);
    return res.status(201).json(user);
  } catch (error) {
    // Jaring pengaman: kalau ada dua request datang bersamaan, pengecekan
    // di atas bisa terlewat dan database yang menolak. Ubah jadi 409,
    // bukan 500, karena ini masalah data yang sudah ada.
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'ID atau email sudah digunakan');
    }
    return sendError(res, 500, error.message);
  }
}

// PATCH /users/:id -> UPDATE data by id
async function updateUser(req, res) {
  try {
    const { name, email, phone, photo_url, role } = req.body;

    if (![name, email, phone, photo_url, role].some((v) => v !== undefined)) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }

    if (role && !['student', 'admin'].includes(role)) {
      return sendError(res, 400, 'role hanya boleh student atau admin');
    }

    const affected = await userService.updateUser(req.params.id, {
      name, email, phone, photo_url, role,
    });
    if (!affected) return sendError(res, 404, 'User tidak ditemukan');

    const user = await userService.getUserById(req.params.id);
    return res.status(200).json(user);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

// DELETE /users/:id -> DELETE data by id
async function deleteUser(req, res) {
  try {
    const affected = await userService.deleteUser(req.params.id);
    if (!affected) return sendError(res, 404, 'User tidak ditemukan');
    return res.status(200).json({ message: 'User berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllUsers, getUserById, addUser, updateUser, deleteUser };
