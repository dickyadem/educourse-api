// ============================================================
// Controller - tabel `assessments`
// ============================================================

const assessmentService = require('../service/assessmentService');
const materialService = require('../service/materialService');

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

// Hanya material penilaian yang boleh punya assessment.
// Video dan rangkuman tidak menyimpan soal, jadi tidak boleh punya.
const TIPE_PENILAIAN = ['pretest', 'quiz', 'exam'];

async function getAllAssessments(req, res) {
  try {
    return res.status(200).json(await assessmentService.getAllAssessments());
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getAssessmentById(req, res) {
  try {
    const assessment = await assessmentService.getAssessmentById(req.params.id);
    if (!assessment) return sendError(res, 404, 'Assessment tidak ditemukan');
    return res.status(200).json(assessment);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function addAssessment(req, res) {
  try {
    const { material_id, passing_score = 60 } = req.body;
    if (!material_id) return sendError(res, 400, 'material_id wajib diisi');
    if (passing_score < 0 || passing_score > 100) {
      return sendError(res, 400, 'passing_score harus antara 0 dan 100');
    }

    const material = await materialService.getMaterialById(material_id);
    if (!material) return sendError(res, 400, 'material_id tidak ditemukan');
    if (!TIPE_PENILAIAN.includes(material.type)) {
      return sendError(
        res, 400,
        `Assessment hanya untuk material bertipe ${TIPE_PENILAIAN.join(', ')}, bukan ${material.type}`
      );
    }
    // material_id UNIQUE, jadi satu material hanya boleh punya satu assessment.
    if (await assessmentService.getAssessmentByMaterial(material_id)) {
      return sendError(res, 409, 'Material ini sudah punya assessment');
    }

    const id = await assessmentService.addAssessment({ material_id, passing_score });
    return res.status(201).json(await assessmentService.getAssessmentById(id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'Material ini sudah punya assessment');
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'material_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function updateAssessment(req, res) {
  try {
    const { material_id, passing_score } = req.body;
    if (![material_id, passing_score].some((v) => v !== undefined)) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }
    if (passing_score !== undefined && (passing_score < 0 || passing_score > 100)) {
      return sendError(res, 400, 'passing_score harus antara 0 dan 100');
    }
    if (material_id !== undefined) {
      const material = await materialService.getMaterialById(material_id);
      if (!material) return sendError(res, 400, 'material_id tidak ditemukan');
      if (!TIPE_PENILAIAN.includes(material.type)) {
        return sendError(res, 400, `Assessment hanya untuk material bertipe ${TIPE_PENILAIAN.join(', ')}`);
      }
      const lain = await assessmentService.getAssessmentByMaterial(material_id);
      if (lain && String(lain.id) !== String(req.params.id)) {
        return sendError(res, 409, 'Material tersebut sudah dipakai assessment lain');
      }
    }

    const affected = await assessmentService.updateAssessment(req.params.id, { material_id, passing_score });
    if (!affected) return sendError(res, 404, 'Assessment tidak ditemukan');

    return res.status(200).json(await assessmentService.getAssessmentById(req.params.id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'Material tersebut sudah dipakai assessment lain');
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'material_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function deleteAssessment(req, res) {
  try {
    const id = req.params.id;
    if (!(await assessmentService.getAssessmentById(id))) {
      return sendError(res, 404, 'Assessment tidak ditemukan');
    }

    const d = await assessmentService.countDependencies(id);
    if (d.questions > 0 || d.attempts > 0) {
      return sendError(
        res, 409,
        `Assessment tidak bisa dihapus karena punya ${d.questions} soal dan ${d.attempts} percobaan`
      );
    }

    await assessmentService.deleteAssessment(id);
    return res.status(200).json({ message: 'Assessment berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllAssessments, getAssessmentById, addAssessment, updateAssessment, deleteAssessment };
