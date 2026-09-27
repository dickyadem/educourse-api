// ============================================================
// Konfigurasi koneksi database (Langkah 1 - Connecting to Database)
// Database: MySQL XAMPP -> 127.0.0.1:3306
// ============================================================

require('dotenv').config();

const mysql = require('mysql2/promise');

// Nilai diambil dari .env supaya host, username, password, port,
// dan nama database bisa diubah tanpa menyentuh kode ini.
const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Pool dipakai supaya koneksi dipakai ulang, bukan dibuka per request.
const pool = mysql.createPool(config);

// Dipanggil sekali saat server start untuk memastikan konfigurasi benar.
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    console.log(
      `[database] terkoneksi ke MySQL "${config.database}" di ${config.host}:${config.port}`
    );
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection, config };
