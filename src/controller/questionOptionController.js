// ============================================================
// Controller - tabel `question_options`
// ============================================================

const optionService = require('../service/questionOptionService');
const questionService = require('../service/questionService');

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

async function getAllOptions(req, res) {
  try {
    return res.status(200).json(await optionService.getAllOptions());
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getOptionById(req, res) {
  try {
    const option = await optionService.getOptionById(req.params.id);
    if (!option) return sendError(res, 404, 'Opsi jawaban tidak ditemukan');
    return res.status(200).json(option);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function addOption(req, res) {
  try {
    const { question_id, option_text, is_correct = false, position } = req.body;
    if (!question_id || !option_text || position === undefined) {
      return sendError(res, 400, 'question_id, option_text, dan position wajib diisi');
    }
    if (position < 1) return sendError(res, 400, 'position minimal 1');
    if (!(await questionService.getQuestionById(question_id))) {
      return sendError(res, 400, 'question_id tidak ditemukan');
    }

    // Aturan dari dokumen skema: tepat satu opsi benar per soal.
    // Menambah opsi kedua yang benar otomatis memindahkan kunci ke opsi baru.
    if (is_correct && (await optionService.countCorrectInQuestion(question_id)) > 0) {
      await optionService.clearCorrectFlag(question_id);
    }

    const id = await optionService.addOption({ question_id, option_text, is_correct, position });
    return res.status(201).json(await optionService.getOptionById(id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Position opsi sudah dipakai pada soal ini');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'question_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function updateOption(req, res) {
  try {
    const { option_text, position, question_id } = req.body;
    let { is_correct } = req.body;

    if (![option_text, is_correct, position, question_id].some((v) => v !== undefined)) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }
    if (position !== undefined && position < 1) return sendError(res, 400, 'position minimal 1');

    const opsi = await optionService.getOptionById(req.params.id);
    if (!opsi) return sendError(res, 404, 'Opsi jawaban tidak ditemukan');

    if (question_id !== undefined) {
      if (!(await questionService.getQuestionById(question_id))) {
        return sendError(res, 400, 'question_id tidak ditemukan');
      }
      // Kalau opsi pindah soal, status kunci ikut dilepas supaya soal
      // tujuan tidak tiba-tiba punya dua jawaban benar.
      if (String(question_id) !== String(opsi.question_id) && is_correct === undefined) {
        is_correct = false;
      }
    }

    // Menjadikan opsi ini sebagai kunci melepas flag di opsi lain pada soal yang sama.
    const soalId = question_id ?? opsi.question_id;
    if (is_correct === true) {
      await optionService.clearCorrectFlag(soalId, req.params.id);
    }

    const affected = await optionService.updateOption(req.params.id, {
      option_text, is_correct, position, question_id,
    });
    if (!affected) return sendError(res, 404, 'Opsi jawaban tidak ditemukan');

    return res.status(200).json(await optionService.getOptionById(req.params.id));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Position opsi sudah dipakai pada soal ini');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return sendError(res, 400, 'question_id tidak valid');
    return sendError(res, 500, error.message);
  }
}

async function deleteOption(req, res) {
  try {
    const id = req.params.id;
    const opsi = await optionService.getOptionById(id);
    if (!opsi) return sendError(res, 404, 'Opsi jawaban tidak ditemukan');

    const dipakai = await optionService.countAnswersUsingOption(id);
    if (dipakai > 0) {
      return sendError(res, 409, 'Opsi sudah dipakai sebagai jawaban peserta, tidak bisa dihapus');
    }

    // Opsi terakhir tidak boleh dihapus karena soal harus punya minimal 2 opsi.
    const totalOpsi = await optionService.countOptionsInQuestion(opsi.question_id);
    if (totalOpsi <= 2) {
      return sendError(res, 409, 'Soal harus punya minimal 2 opsi jawaban');
    }

    await optionService.deleteOption(id);
    return res.status(200).json({ message: 'Opsi jawaban berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllOptions, getOptionById, addOption, updateOption, deleteOption };
