// ============================================================
// Controller - tabel `questions`
// ============================================================

const questionService = require('../service/questionService');
const assessmentService = require('../service/assessmentService');

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

async function getAllQuestions(req, res) {
  try {
    return res.status(200).json(await questionService.getAllQuestions());
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getQuestionById(req, res) {
  try {
    const question = await questionService.getQuestionById(req.params.id);
    if (!question) return sendError(res, 404, 'Soal tidak ditemukan');
    return res.status(200).json(question);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function addQuestion(req, res) {
  try {
    const { assessment_id, question_text, position } = req.body;
    if (!assessment_id || !question_text || position === undefined) {
      return sendError(res, 400, 'assessment_id, question_text, dan position wajib diisi');
    }
    if (position < 1) return sendError(res, 400, 'position minimal 1');
    if (!(await assessmentService.getAssessmentById(assessment_id))) {
      return sendError(res, 400, 'assessment_id tidak ditemukan');
    }

    const id = await questionService.addQuestion({ assessment_id, question_text, position });
    return res.status(201).json(await questionService.getQuestionById(id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Position soal sudah dipakai pada assessment ini');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'assessment_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function updateQuestion(req, res) {
  try {
    const { assessment_id, question_text, position } = req.body;
    if (![assessment_id, question_text, position].some((v) => v !== undefined)) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }
    if (position !== undefined && position < 1) return sendError(res, 400, 'position minimal 1');
    if (assessment_id !== undefined && !(await assessmentService.getAssessmentById(assessment_id))) {
      return sendError(res, 400, 'assessment_id tidak ditemukan');
    }

    const affected = await questionService.updateQuestion(req.params.id, {
      assessment_id, question_text, position,
    });
    if (!affected) return sendError(res, 404, 'Soal tidak ditemukan');

    return res.status(200).json(await questionService.getQuestionById(req.params.id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Position soal sudah dipakai pada assessment ini');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'assessment_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function deleteQuestion(req, res) {
  try {
    const id = req.params.id;
    if (!(await questionService.getQuestionById(id))) {
      return sendError(res, 404, 'Soal tidak ditemukan');
    }

    const jumlahOpsi = await questionService.countOptions(id);
    if (jumlahOpsi > 0) {
      return sendError(res, 409, `Soal masih punya ${jumlahOpsi} opsi jawaban, tidak bisa dihapus`);
    }

    await questionService.deleteQuestion(id);
    return res.status(200).json({ message: 'Soal berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllQuestions, getQuestionById, addQuestion, updateQuestion, deleteQuestion };
