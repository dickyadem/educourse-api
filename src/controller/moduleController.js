// ============================================================
// Controller - tabel `modules`
// ============================================================

const moduleService = require('../service/moduleService');
const courseService = require('../service/courseService');

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

async function getAllModules(req, res) {
  try {
    return res.status(200).json(await moduleService.getAllModules());
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getModuleById(req, res) {
  try {
    const module = await moduleService.getModuleById(req.params.id);
    if (!module) return sendError(res, 404, 'Modul tidak ditemukan');
    return res.status(200).json(module);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function addModule(req, res) {
  try {
    const { course_id, title, position } = req.body;

    if (!course_id || !title || position === undefined) {
      return sendError(res, 400, 'course_id, title, dan position wajib diisi');
    }
    if (position < 1) return sendError(res, 400, 'position minimal 1');
    if (!(await courseService.getCourseById(course_id))) {
      return sendError(res, 400, 'course_id tidak ditemukan');
    }

    const id = await moduleService.addModule({ course_id, title, position });
    return res.status(201).json(await moduleService.getModuleById(id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Position modul sudah dipakai pada kelas ini');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return sendError(res, 400, 'course_id tidak valid');
    }
    return sendError(res, 500, error.message);
  }
}

async function updateModule(req, res) {
  try {
    const { course_id, title, position } = req.body;

    if (![course_id, title, position].some((v) => v !== undefined)) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }
    if (position !== undefined && position < 1) {
      return sendError(res, 400, 'position minimal 1');
    }
    if (course_id !== undefined && !(await courseService.getCourseById(course_id))) {
      return sendError(res, 400, 'course_id tidak ditemukan');
    }

    const affected = await moduleService.updateModule(req.params.id, { course_id, title, position });
    if (!affected) return sendError(res, 404, 'Modul tidak ditemukan');

    return res.status(200).json(await moduleService.getModuleById(req.params.id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Position modul sudah dipakai pada kelas ini');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return sendError(res, 400, 'course_id tidak valid');
    }
    return sendError(res, 500, error.message);
  }
}

async function deleteModule(req, res) {
  try {
    const id = req.params.id;
    if (!(await moduleService.getModuleById(id))) {
      return sendError(res, 404, 'Modul tidak ditemukan');
    }

    const jumlahMateri = await moduleService.countMaterialsInModule(id);
    if (jumlahMateri > 0) {
      return sendError(res, 409, `Modul masih punya ${jumlahMateri} materi, tidak bisa dihapus`);
    }

    await moduleService.deleteModule(id);
    return res.status(200).json({ message: 'Modul berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllModules, getModuleById, addModule, updateModule, deleteModule };
