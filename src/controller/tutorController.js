// ============================================================
// Controller - tabel `tutors`
// ============================================================

const tutorService = require('../service/tutorService');

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

async function getAllTutors(req, res) {
  try {
    return res.status(200).json(await tutorService.getAllTutors());
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getTutorById(req, res) {
  try {
    const tutor = await tutorService.getTutorById(req.params.id);
    if (!tutor) return sendError(res, 404, 'Tutor tidak ditemukan');
    return res.status(200).json(tutor);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function addTutor(req, res) {
  try {
    const { name, job_title, bio, photo_url } = req.body;

    if (!name || !job_title || !bio) {
      return sendError(res, 400, 'name, job_title, dan bio wajib diisi');
    }

    const id = await tutorService.addTutor({ name, job_title, bio, photo_url });
    return res.status(201).json(await tutorService.getTutorById(id));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function updateTutor(req, res) {
  try {
    const { name, job_title, bio, photo_url } = req.body;

    if (![name, job_title, bio, photo_url].some((v) => v !== undefined)) {
      return sendError(res, 400, 'Tidak ada data yang dikirim untuk diubah');
    }

    const affected = await tutorService.updateTutor(req.params.id, {
      name, job_title, bio, photo_url,
    });
    if (!affected) return sendError(res, 404, 'Tutor tidak ditemukan');

    return res.status(200).json(await tutorService.getTutorById(req.params.id));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function deleteTutor(req, res) {
  try {
    const id = req.params.id;
    if (!(await tutorService.getTutorById(id))) {
      return sendError(res, 404, 'Tutor tidak ditemukan');
    }

    const jumlahKelas = await tutorService.countCoursesInTutor(id);
    if (jumlahKelas > 0) {
      return sendError(res, 409, `Tutor masih mengajar ${jumlahKelas} kelas, tidak bisa dihapus`);
    }

    await tutorService.deleteTutor(id);
    return res.status(200).json({ message: 'Tutor berhasil dihapus' });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = { getAllTutors, getTutorById, addTutor, updateTutor, deleteTutor };
