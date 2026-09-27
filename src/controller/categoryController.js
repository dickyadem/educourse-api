// ============================================================
// Controller - tabel `categories`
// ============================================================

const categoryService = require('../service/categoryService');

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

// Memastikan slug aman dipakai di URL: huruf kecil, angka, dan strip saja.
function isValidSlug(slug) {
  return /^[a-z0-9-]+$/.test(slug);
}

// GET /categories
async function getAllCategories(req, res) {
  try {
    return res.status(200).json(await categoryService.getAllCategories());
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

// GET /categories/:id
async function getCategoryById(req, res) {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) return sendError(res, 404, 'Kategori tidak ditemukan');
    return res.status(200).json(category);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

// POST /categories
async function addCategory(req, res) {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) return sendError(res, 400, 'name dan slug wajib diisi');
    if (!isValidSlug(slug)) {
      return sendError(res, 400, 'slug hanya boleh huruf kecil, angka, dan strip');
    }

    if (await categoryService.getCategoryBySlug(slug)) {
      return sendError(res, 409, 'slug sudah digunakan');
    }

    await categoryService.addCategory({ name, slug });
    const category = await categoryService.getCategoryBySlug(slug);
    return res.status(201).json(category);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'slug sudah digunakan');
    return sendError(res, 500, error.message);
  }
}

// PATCH /categories/:id
async function updateCategory(req, res) {
  try {
    const { name, slug } = req.body;

    if (name === undefined && slug === undefined) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }
    if (slug !== undefined && !isValidSlug(slug)) {
      return sendError(res, 400, 'slug hanya boleh huruf kecil, angka, dan strip');
    }

    // Kalau slug diganti, pastikan tidak bentrok dengan kategori lain.
    if (slug !== undefined) {
      const lain = await categoryService.getCategoryBySlug(slug);
      if (lain && String(lain.id) !== String(req.params.id)) {
        return sendError(res, 409, 'slug sudah digunakan kategori lain');
      }
    }

    const affected = await categoryService.updateCategory(req.params.id, { name, slug });
    if (!affected) return sendError(res, 404, 'Kategori tidak ditemukan');

    return res.status(200).json(await categoryService.getCategoryById(req.params.id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'slug sudah digunakan');
    return sendError(res, 500, error.message);
  }
}

// DELETE /categories/:id
async function deleteCategory(req, res) {
  try {
    const id = req.params.id;
    if (!(await categoryService.getCategoryById(id))) {
      return sendError(res, 404, 'Kategori tidak ditemukan');
    }

    // Foreign key memakai ON DELETE RESTRICT, jadi kategori yang masih
    // dipakai kelas tidak boleh dihapus. Dicek di sini agar pesannya jelas.
    const jumlahKelas = await categoryService.countCoursesInCategory(id);
    if (jumlahKelas > 0) {
      return sendError(res, 409, `Kategori masih dipakai ${jumlahKelas} kelas, tidak bisa dihapus`);
    }

    await categoryService.deleteCategory(id);
    return res.status(200).json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllCategories, getCategoryById, addCategory, updateCategory, deleteCategory };
