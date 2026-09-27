// ============================================================
// Route - Mendefinisikan endpoint REST (Langkah 3)
// Setiap route memanggil service, tidak menulis query SQL.
// ============================================================

const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

// Ambil semua data
router.get('/', userController.getAllUsers);

// Tambah data baru
router.post('/', userController.addUser);

// Ambil satu data berdasarkan id
router.get('/:id', userController.getUserById);

// Ubah data berdasarkan id
router.patch('/:id', userController.updateUser);

// Hapus data berdasarkan id
router.delete('/:id', userController.deleteUser);

module.exports = router;
