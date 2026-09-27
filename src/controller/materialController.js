// ============================================================
// Controller - tabel `materials`
// ============================================================

const materialService = require('../service/materialService');
const moduleService = require('../service/moduleService');

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

const TYPE_VALID = ['video', 'summary', 'pretest', 'quiz', 'exam'];

// Aturan isi konten dari dokumen skema:
// video wajib punya content_url;
// summary wajib punya content_text atau content_url;
// tipe penilaian menyimpan soal, jadi tidak butuh URL maupun teks.
function validateContent(type, content_url, content_text) {
  if (type === 'video' && !content_url) {
    return 'Materi video wajib mengisi content_url';
  }
  if (type === 'summary' && !content_url && !content_text) {
    return 'Materi rangkuman wajib mengisi content_text atau content_url';
  }
  return null;
}

async function getAllMaterials(req, res) {
  try {
    return res.status(200).json(await materialService.getAllMaterials());
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getMaterialById(req, res) {
  try {
    const material = await materialService.getMaterialById(req.params.id);
    if (!material) return sendError(res, 404, 'Materi tidak ditemukan');
    return res.status(200).json(material);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function addMaterial(req, res) {
  try {
    const { module_id, title, type, content_url, content_text, duration_seconds = 0, position, is_preview = false } = req.body;

    if (!module_id || !title || !type || position === undefined) {
      return sendError(res, 400, 'module_id, title, type, dan position wajib diisi');
    }
    if (!TYPE_VALID.includes(type)) {
      return sendError(res, 400, `type hanya boleh ${TYPE_VALID.join(', ')}`);
    }
    if (position < 1) return sendError(res, 400, 'position minimal 1');
    if (duration_seconds < 0) return sendError(res, 400, 'duration_seconds tidak boleh negatif');

    const galatKonten = validateContent(type, content_url, content_text);
    if (galatKonten) return sendError(res, 400, galatKonten);

    if (!(await moduleService.getModuleById(module_id))) {
      return sendError(res, 400, 'module_id tidak ditemukan');
    }

    const id = await materialService.addMaterial({
      module_id, title, type, content_url, content_text, duration_seconds, position, is_preview,
    });
    return res.status(201).json(await materialService.getMaterialById(id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Position materi sudah dipakai pada modul ini');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'module_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function updateMaterial(req, res) {
  try {
    const { module_id, title, type, content_url, content_text, duration_seconds, position, is_preview } = req.body;

    if (![module_id, title, type, content_url, content_text, duration_seconds, position, is_preview].some((v) => v !== undefined)) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }
    if (type !== undefined && !TYPE_VALID.includes(type)) {
      return sendError(res, 400, `type hanya boleh ${TYPE_VALID.join(', ')}`);
    }
    if (position !== undefined && position < 1) return sendError(res, 400, 'position minimal 1');
    if (duration_seconds !== undefined && duration_seconds < 0) {
      return sendError(res, 400, 'duration_seconds tidak boleh negatif');
    }
    if (module_id !== undefined && !(await moduleService.getModuleById(module_id))) {
      return sendError(res, 400, 'module_id tidak ditemukan');
    }

    const affected = await materialService.updateMaterial(req.params.id, {
      module_id, title, type, content_url, content_text, duration_seconds, position, is_preview,
    });
    if (!affected) return sendError(res, 404, 'Materi tidak ditemukan');

    // type ikut berubah, jadi aturan isi konten dicek ulang dengan nilai terbaru.
    const terbaru = await materialService.getMaterialById(req.params.id);
    const galatKonten = validateContent(terbaru.type, terbaru.content_url, terbaru.content_text);
    if (galatKonten) return sendError(res, 400, galatKonten);

    return res.status(200).json(terbaru);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Position materi sudah dipakai pada modul ini');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'module_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function deleteMaterial(req, res) {
  try {
    const id = req.params.id;
    if (!(await materialService.getMaterialById(id))) {
      return sendError(res, 404, 'Materi tidak ditemukan');
    }

    const d = await materialService.countDependencies(id);
    if (d.assessments > 0 || d.progress > 0) {
      return sendError(
        res, 409,
        `Materi tidak bisa dihapus karena punya ${d.assessments} assessment dan ${d.progress} progres`
      );
    }

    await materialService.deleteMaterial(id);
    return res.status(200).json({ message: 'Materi berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllMaterials, getMaterialById, addMaterial, updateMaterial, deleteMaterial };
