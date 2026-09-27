-- ============================================================
-- Reset data uji: kosongkan tabel yang punya endpoint CRUD.
--
-- Jalankan file ini sebelum Run Collection kalau collection stuck
-- dan muncul error 409 pada slug atau position unik.
--
-- Kenapa perlu file ini: tabel enrollments dan orders tidak punya
-- endpoint CRUD, jadi kalau isinya tertinggal, kelas terkunci FK dan
-- kategori ikut gagal dihapus lewat API. Satu-satunya cara melepas
-- kunci itu adalah lewat SQL.
--
-- Pakai: mysql -u root < reset.sql
-- atau salin perintahnya ke tab SQL phpMyAdmin.
-- ============================================================

USE `educourse`;

-- Urutan WAJIB anak lebih dulu dari induk (ON DELETE RESTRICT).
-- reviews menempel ke enrollments, dan enrollments menempel ke courses
-- serta users, jadi keduanya harus dihapus sebelum tabel induknya.
DELETE FROM `reviews`;
DELETE FROM `attempt_answers`;
DELETE FROM `assessment_attempts`;
DELETE FROM `material_progress`;
DELETE FROM `enrollments`;
DELETE FROM `payments`;
DELETE FROM `orders`;

DELETE FROM `question_options`;
DELETE FROM `questions`;
DELETE FROM `assessments`;
DELETE FROM `materials`;
DELETE FROM `modules`;
DELETE FROM `courses`;
DELETE FROM `tutors`;
DELETE FROM `categories`;
DELETE FROM `users`;

-- Pengecekan: semua tabel di atas harus bernilai 0.
SELECT 'reviews' AS tabel, COUNT(*) AS sisa FROM reviews
UNION ALL SELECT 'question_options', COUNT(*) FROM question_options
UNION ALL SELECT 'questions', COUNT(*) FROM questions
UNION ALL SELECT 'assessments', COUNT(*) FROM assessments
UNION ALL SELECT 'materials', COUNT(*) FROM materials
UNION ALL SELECT 'modules', COUNT(*) FROM modules
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'tutors', COUNT(*) FROM tutors
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'orders', COUNT(*) FROM orders;
