// ============================================================
// Controller - tabel `courses`
// ============================================================

const courseService = require('../service/courseService');
const categoryService = require('../service/categoryService');
const tutorService = require('../service/tutorService');

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

const STATUS_VALID = ['draft', 'published', 'archived'];

function isValidSlug(slug) {
  return /^[a-z0-9-]+$/.test(slug);
}

async function getAllCourses(req, res) {
  try {
    return res.status(200).json(await courseService.getAllCourses());
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getCourseById(req, res) {
  try {
    const course = await courseService.getCourseById(req.params.id);
    if (!course) return sendError(res, 404, 'Kelas tidak ditemukan');
    return res.status(200).json(course);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function addCourse(req, res) {
  try {
    const { category_id, tutor_id, slug, title, description, image_url, image_alt, price_amount, status = 'draft' } = req.body;

    if (!category_id || !tutor_id || !slug || !title || !description || !image_url || !image_alt || price_amount === undefined) {
      return sendError(res, 400, 'category_id, tutor_id, slug, title, description, image_url, image_alt, dan price_amount wajib diisi');
    }
    if (!isValidSlug(slug)) {
      return sendError(res, 400, 'slug hanya boleh huruf kecil, angka, dan strip');
    }
    if (price_amount < 0) return sendError(res, 400, 'price_amount tidak boleh negatif');
    if (!STATUS_VALID.includes(status)) {
      return sendError(res, 400, `status hanya boleh ${STATUS_VALID.join(', ')}`);
    }

    // Validasi relasi: kategori dan tutor harus benar-benar ada.
    if (!(await categoryService.getCategoryById(category_id))) {
      return sendError(res, 400, 'category_id tidak ditemukan');
    }
    if (!(await tutorService.getTutorById(tutor_id))) {
      return sendError(res, 400, 'tutor_id tidak ditemukan');
    }
    if (await courseService.getCourseBySlug(slug)) {
      return sendError(res, 409, 'slug sudah digunakan');
    }

    const id = await courseService.addCourse({
      category_id, tutor_id, slug, title, description, image_url, image_alt, price_amount, status,
    });
    return res.status(201).json(await courseService.getCourseById(id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'slug sudah digunakan');
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'category_id atau tutor_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function updateCourse(req, res) {
  try {
    const { category_id, tutor_id, slug, title, description, image_url, image_alt, price_amount, status } = req.body;

    if (![category_id, tutor_id, slug, title, description, image_url, image_alt, price_amount, status].some((v) => v !== undefined)) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }
    if (slug !== undefined && !isValidSlug(slug)) {
      return sendError(res, 400, 'slug hanya boleh huruf kecil, angka, dan strip');
    }
    if (price_amount !== undefined && price_amount < 0) {
      return sendError(res, 400, 'price_amount tidak boleh negatif');
    }
    if (status !== undefined && !STATUS_VALID.includes(status)) {
      return sendError(res, 400, `status hanya boleh ${STATUS_VALID.join(', ')}`);
    }

    // Hanya validasi relasi bila field-nya benar-benar dikirim.
    if (category_id !== undefined && !(await categoryService.getCategoryById(category_id))) {
      return sendError(res, 400, 'category_id tidak ditemukan');
    }
    if (tutor_id !== undefined && !(await tutorService.getTutorById(tutor_id))) {
      return sendError(res, 400, 'tutor_id tidak ditemukan');
    }
    if (slug !== undefined) {
      const lain = await courseService.getCourseBySlug(slug);
      if (lain && String(lain.id) !== String(req.params.id)) {
        return sendError(res, 409, 'slug sudah digunakan kelas lain');
      }
    }

    const affected = await courseService.updateCourse(req.params.id, {
      category_id, tutor_id, slug, title, description, image_url, image_alt, price_amount, status,
    });
    if (!affected) return sendError(res, 404, 'Kelas tidak ditemukan');

    return res.status(200).json(await courseService.getCourseById(req.params.id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'slug sudah digunakan');
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'category_id atau tutor_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function deleteCourse(req, res) {
  try {
    const id = req.params.id;
    if (!(await courseService.getCourseById(id))) {
      return sendError(res, 404, 'Kelas tidak ditemukan');
    }

    // Kelas yang sudah terjual atau sudah berisi materi tidak boleh dihapus,
    // karena akan merusak riwayat order, enrollment, dan struktur materi.
    const d = await courseService.countDependencies(id);
    if (d.orders > 0 || d.enrollments > 0 || d.modules > 0) {
      return sendError(
        res, 409,
        `Kelas tidak bisa dihapus karena punya ${d.modules} modul, ${d.orders} order, ${d.enrollments} enrollment`
      );
    }

    await courseService.deleteCourse(id);
    return res.status(200).json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllCourses, getCourseById, addCourse, updateCourse, deleteCourse };
