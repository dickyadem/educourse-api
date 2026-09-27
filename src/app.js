// ============================================================
// Entry point - Express server + registrasi route
// ============================================================

require('dotenv').config();

const express = require('express');
const { testConnection } = require('./config/database');
const userRoute = require('./route/userRoute');
const categoryRoute = require('./route/categoryRoute');
const tutorRoute = require('./route/tutorRoute');
const courseRoute = require('./route/courseRoute');
const moduleRoute = require('./route/moduleRoute');
const materialRoute = require('./route/materialRoute');
const assessmentRoute = require('./route/assessmentRoute');
const questionRoute = require('./route/questionRoute');
const questionOptionRoute = require('./route/questionOptionRoute');
const reviewRoute = require('./route/reviewRoute');

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware untuk membaca body JSON pada POST/PATCH.
app.use(express.json());

// Route utama
app.get('/', (req, res) => {
  res.json({ message: 'educourse-api is running' });
});

// Endpoint CRUD user
app.use('/users', userRoute);

// Master data
app.use('/categories', categoryRoute);
app.use('/tutors', tutorRoute);

// Produk kelas
app.use('/courses', courseRoute);
app.use('/modules', moduleRoute);
app.use('/materials', materialRoute);

// Penilaian
app.use('/assessments', assessmentRoute);
app.use('/questions', questionRoute);
app.use('/question-options', questionOptionRoute);

// Ulasan
app.use('/reviews', reviewRoute);

// Menjalankan server setelah koneksi database dipastikan berhasil.
testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[database] gagal terkoneksi:', error.message);
    process.exit(1);
  });

module.exports = app;
