-- ============================================================
-- educourse-api - Mission FSD-20 (Backend)
-- Skema database LENGKAP: 17 tabel sesuai ERD VideoBelajar
-- Sumber: ERD.md & Dokumentasi_Skema_Database_FSD20.docx.md
--
-- Urutan pembuatan mengikuti dokumen skema:
--   1. users, categories, tutors, payment_methods
--   2. courses -> modules -> materials -> assessments -> questions -> question_options
--   3. orders -> payments -> enrollments
--   4. material_progress, assessment_attempts -> attempt_answers, reviews
--
-- CATATAN: script ini membuat ulang database dari nol (DROP + CREATE).
-- Jangan jalankan pada database yang datanya masih dibutuhkan.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `educourse`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE `educourse`;

-- FK dinonaktifkan sebentar supaya tabel bisa di-drop tanpaurutan.
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `attempt_answers`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `assessment_attempts`;
DROP TABLE IF EXISTS `material_progress`;
DROP TABLE IF EXISTS `enrollments`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `question_options`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `assessments`;
DROP TABLE IF EXISTS `materials`;
DROP TABLE IF EXISTS `modules`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `payment_methods`;
DROP TABLE IF EXISTS `tutors`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- ============================================================
-- TABEL 1/17: users
-- Identitas dan profil peserta. Auth tetap Firebase,
-- password TIDAK disimpan di sini.
-- PK = UID Firebase (string), bukan auto-increment.
-- ============================================================
CREATE TABLE `users` (
  `id`         VARCHAR(128) NOT NULL COMMENT 'UID Firebase, dipertahankan sebagai identitas',
  `name`       VARCHAR(150) NOT NULL,
  `email`      VARCHAR(254) NOT NULL,
  `phone`      VARCHAR(30)  NULL,
  `photo_url`  TEXT         NULL,
  `role`       VARCHAR(20)  NOT NULL DEFAULT 'student',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `uq_users_email` UNIQUE (`email`),
  CONSTRAINT `chk_users_role` CHECK (`role` IN ('student', 'admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 2/17: categories
-- Kategori untuk mengelompokkan katalog kelas.
-- ============================================================
CREATE TABLE `categories` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `slug`       VARCHAR(150) NOT NULL COMMENT 'Identitas URL yang mudah dibaca',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `uq_categories_slug` UNIQUE (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 3/17: tutors
-- Profil pengajar. Bukan akun login, jadi tidak ada kolom email.
-- ============================================================
CREATE TABLE `tutors` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(150) NOT NULL,
  `job_title`  VARCHAR(150) NOT NULL COMMENT 'Jabatan/profesi untuk tampilan kelas',
  `bio`        TEXT         NOT NULL,
  `photo_url`  TEXT         NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 4/17: payment_methods
-- Metode pembayaran yang bisa dipilih.
-- PK berupa kode teks (bca, dana, card) agar cocok dengan frontend.
-- ============================================================
CREATE TABLE `payment_methods` (
  `id`         VARCHAR(30)  NOT NULL COMMENT 'Kode metode: bca, bni, dana, card, dll',
  `name`       VARCHAR(100) NOT NULL,
  `type`       VARCHAR(20)  NOT NULL COMMENT 'bank, ewallet, card',
  `is_active`  BOOLEAN      NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `chk_payment_methods_type` CHECK (`type` IN ('bank', 'ewallet', 'card'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 5/17: courses
-- Produk kelas: katalog, harga, dan status publikasi.
-- Satu kelas punya tepat satu kategori dan satu tutor.
-- ============================================================
CREATE TABLE `courses` (
  `id`          BIGINT        NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT        NOT NULL,
  `tutor_id`    BIGINT        NOT NULL,
  `slug`        VARCHAR(200)  NOT NULL COMMENT 'Identitas URL yang mudah dibaca',
  `title`       VARCHAR(200)  NOT NULL,
  `description` TEXT          NOT NULL,
  `image_url`   TEXT          NOT NULL,
  `image_alt`   VARCHAR(255)  NOT NULL COMMENT 'Teks alternatif untuk aksesibilitas',
  `price_amount` BIGINT       NOT NULL COMMENT 'Nominal bulat rupiah, bukan float',
  `status`      VARCHAR(20)   NOT NULL DEFAULT 'draft',
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `uq_courses_slug` UNIQUE (`slug`),
  CONSTRAINT `fk_courses_category_id` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_courses_tutor_id` FOREIGN KEY (`tutor_id`)
    REFERENCES `tutors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_courses_status` CHECK (`status` IN ('draft', 'published', 'archived')),
  CONSTRAINT `chk_courses_price_amount` CHECK (`price_amount` >= 0),

  INDEX `idx_courses_category_id` (`category_id`),
  INDEX `idx_courses_tutor_id` (`tutor_id`),
  INDEX `idx_courses_status_category_id` (`status`, `category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 6/17: modules
-- Kelompok material dengan urutan tertentu dalam kelas.
-- ============================================================
CREATE TABLE `modules` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `course_id`  BIGINT       NOT NULL,
  `title`      VARCHAR(200) NOT NULL,
  `position`   INT          NOT NULL COMMENT 'Urutan >= 1, unik per kelas',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_modules_course_id` FOREIGN KEY (`course_id`)
    REFERENCES `courses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_modules_position` CHECK (`position` >= 1),

  -- Unik gabungan sekaligus|access daftar modul
  CONSTRAINT `uq_modules_course_id_position` UNIQUE (`course_id`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 7/17: materials
-- Video, rangkuman, pretest, quiz, dan ujian akhir.
-- Aturan isi: video wajib content_url; summary wajib punya
-- content_text atau content_url.
-- ============================================================
CREATE TABLE `materials` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT,
  `module_id`        BIGINT       NOT NULL,
  `title`            VARCHAR(200) NOT NULL,
  `type`             VARCHAR(20)  NOT NULL COMMENT 'video, summary, pretest, quiz, exam',
  `content_url`      TEXT         NULL COMMENT 'Alamat video/dokumen',
  `content_text`     TEXT         NULL COMMENT 'Isi rangkuman atau soal',
  `duration_seconds` INT          NOT NULL DEFAULT 0,
  `position`         INT          NOT NULL,
  `is_preview`       BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Boleh dilihat tanpa pembelian',
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_materials_module_id` FOREIGN KEY (`module_id`)
    REFERENCES `modules` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_materials_type` CHECK (`type` IN ('video', 'summary', 'pretest', 'quiz', 'exam')),
  CONSTRAINT `chk_materials_duration_seconds` CHECK (`duration_seconds` >= 0),
  CONSTRAINT `chk_materials_position` CHECK (`position` >= 1),

  CONSTRAINT `uq_materials_module_id_position` UNIQUE (`module_id`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 8/17: assessments
-- Konfigurasi penilaian untuk material pretest/quiz/exam.
-- material_id UNIQUE -> relasi 1:1, video/rangkuman tidak punya ini.
-- ============================================================
CREATE TABLE `assessments` (
  `id`            BIGINT    NOT NULL AUTO_INCREMENT,
  `material_id`   BIGINT    NOT NULL,
  `passing_score` INT       NOT NULL DEFAULT 60 COMMENT 'Ambang kelulusan 0-100',
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `uq_assessments_material_id` UNIQUE (`material_id`),
  CONSTRAINT `fk_assessments_material_id` FOREIGN KEY (`material_id`)
    REFERENCES `materials` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_assessments_passing_score` CHECK (`passing_score` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 9/17: questions
-- Soal pilihan ganda untuk penilaian.
-- ============================================================
CREATE TABLE `questions` (
  `id`            BIGINT      NOT NULL AUTO_INCREMENT,
  `assessment_id` BIGINT      NOT NULL,
  `question_text` TEXT        NOT NULL,
  `position`      INT         NOT NULL,
  `created_at`    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_questions_assessment_id` FOREIGN KEY (`assessment_id`)
    REFERENCES `assessments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_questions_position` CHECK (`position` >= 1),

  CONSTRAINT `uq_questions_assessment_id_position` UNIQUE (`assessment_id`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 10/17: question_options
-- Opsi jawaban dan kunci jawaban setiap soal.
-- Aturan lintas-baris (minimal 2 opsi, tepat 1 benar) divalidasi backend.
-- ============================================================
CREATE TABLE `question_options` (
  `id`          BIGINT    NOT NULL AUTO_INCREMENT,
  `question_id` BIGINT    NOT NULL,
  `option_text` TEXT      NOT NULL,
  `is_correct`  BOOLEAN   NOT NULL DEFAULT FALSE,
  `position`    INT       NOT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_question_options_question_id` FOREIGN KEY (`question_id`)
    REFERENCES `questions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_question_options_position` CHECK (`position` >= 1),

  CONSTRAINT `uq_question_options_question_id_position` UNIQUE (`question_id`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 11/17: orders
-- Tagihan pembelian SATU kelas beserta snapshot harga/judul.
-- Snapshot disimpan agar riwayat tidak berubah saat katalog berubah.
-- ============================================================
CREATE TABLE `orders` (
  `id`                   BIGINT       NOT NULL AUTO_INCREMENT,
  `invoice_number`       VARCHAR(50)  NOT NULL COMMENT 'Nomor tagihan yang bisa dibaca user',
  `user_id`              VARCHAR(128) NOT NULL,
  `course_id`            BIGINT       NOT NULL,
  `course_title_snapshot` VARCHAR(200) NOT NULL,
  `price_amount`         BIGINT       NOT NULL,
  `admin_fee`            BIGINT       NOT NULL,
  `total_amount`         BIGINT       NOT NULL,
  `status`               VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `expires_at`           TIMESTAMP    NOT NULL,
  `paid_at`              TIMESTAMP    NULL,
  `created_at`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `uq_orders_invoice_number` UNIQUE (`invoice_number`),
  CONSTRAINT `fk_orders_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_course_id` FOREIGN KEY (`course_id`)
    REFERENCES `courses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_orders_status` CHECK (`status` IN ('pending', 'paid', 'cancelled', 'expired')),
  CONSTRAINT `chk_orders_price_amount` CHECK (`price_amount` >= 0),
  CONSTRAINT `chk_orders_admin_fee` CHECK (`admin_fee` >= 0),
  -- Total harus sama dengan harga + biaya admin
  CONSTRAINT `chk_orders_total_amount` CHECK (`total_amount` = `price_amount` + `admin_fee`),

  INDEX `idx_orders_course_id` (`course_id`),
  INDEX `idx_orders_user_id_status_created_at` (`user_id`, `status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 12/17: payments
-- Riwayat percobaan pembayaran untuk satu order.
-- Satu order boleh punya beberapa percobaan (gagal lalu ganti metode).
-- ============================================================
CREATE TABLE `payments` (
  `id`                BIGINT       NOT NULL AUTO_INCREMENT,
  `order_id`          BIGINT       NOT NULL,
  `payment_method_id` VARCHAR(30)  NOT NULL,
  `provider_reference` VARCHAR(150) NULL COMMENT 'Referensi unik transaksi provider',
  `amount`            BIGINT       NOT NULL,
  `status`            VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `payment_url`       TEXT         NULL,
  `virtual_account`   VARCHAR(100) NULL COMMENT 'Disimpan sebagai teks agar nol di depan tidak hilang',
  `expires_at`        TIMESTAMP    NOT NULL,
  `paid_at`           TIMESTAMP    NULL,
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  -- UNIQUE mengizinkan banyak NULL: beberapa baris boleh belum punya referensi
  CONSTRAINT `uq_payments_provider_reference` UNIQUE (`provider_reference`),
  CONSTRAINT `fk_payments_order_id` FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_payment_method_id` FOREIGN KEY (`payment_method_id`)
    REFERENCES `payment_methods` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_payments_status` CHECK (`status` IN ('pending', 'succeeded', 'failed', 'expired')),
  CONSTRAINT `chk_payments_amount` CHECK (`amount` >= 0),

  INDEX `idx_payments_payment_method_id` (`payment_method_id`),
  -- Mencakup pencarian order_id, jadi tidak perlu indeks order_id terpisah
  INDEX `idx_payments_order_id_status` (`order_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 13/17: enrollments
-- Hak akses kelas setelah pembayaran BERHASIL ("Kelas Saya").
-- UNIQUE(user_id, course_id) mencegah kepemilikan ganda.
-- order_id UNIQUE -> satu order hanya mengaktifkan satu enrollment.
-- ============================================================
CREATE TABLE `enrollments` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`      VARCHAR(128) NOT NULL,
  `course_id`    BIGINT       NOT NULL,
  `order_id`     BIGINT       NOT NULL,
  `enrolled_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP    NULL COMMENT 'NULL selama kelas belum selesai',
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `uq_enrollments_user_id_course_id` UNIQUE (`user_id`, `course_id`),
  CONSTRAINT `uq_enrollments_order_id` UNIQUE (`order_id`),
  CONSTRAINT `fk_enrollments_user_id` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_enrollments_course_id` FOREIGN KEY (`course_id`)
    REFERENCES `courses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_enrollments_order_id` FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`id`) ON DELETE RESTRICT,

  INDEX `idx_enrollments_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 14/17: material_progress
-- Material yang SUDAH diselesaikan pada suatu enrollment.
-- Baris hanya dibuat saat material selesai.
-- PK gabungan mencegah progres ganda.
-- ============================================================
CREATE TABLE `material_progress` (
  `enrollment_id` BIGINT    NOT NULL,
  `material_id`   BIGINT    NOT NULL,
  `completed_at`  TIMESTAMP NOT NULL,
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`enrollment_id`, `material_id`),
  CONSTRAINT `fk_material_progress_enrollment_id` FOREIGN KEY (`enrollment_id`)
    REFERENCES `enrollments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_material_progress_material_id` FOREIGN KEY (`material_id`)
    REFERENCES `materials` (`id`) ON DELETE RESTRICT,

  INDEX `idx_material_progress_material_id` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 15/17: assessment_attempts
-- Riwayat pengerjaan penilaian, termasuk percobaan ulang.
-- score/passed/submitted_at NULL selama belum submit.
-- ============================================================
CREATE TABLE `assessment_attempts` (
  `id`             BIGINT      NOT NULL AUTO_INCREMENT,
  `enrollment_id`  BIGINT      NOT NULL,
  `assessment_id`  BIGINT      NOT NULL,
  `attempt_number` INT         NOT NULL COMMENT '>= 1, unik per enrollment+assessment',
  `started_at`     TIMESTAMP   NOT NULL,
  `submitted_at`   TIMESTAMP   NULL COMMENT 'NULL selama pengerjaan berlangsung',
  `score`          DECIMAL(5,2) NULL COMMENT 'Nilai 0-100, NULL sebelum submit',
  `passed`         BOOLEAN     NULL COMMENT 'NULL sebelum submit',
  `created_at`     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_assessment_attempts_enrollment_id` FOREIGN KEY (`enrollment_id`)
    REFERENCES `enrollments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_assessment_attempts_assessment_id` FOREIGN KEY (`assessment_id`)
    REFERENCES `assessments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_assessment_attempts_attempt_number` CHECK (`attempt_number` >= 1),
  CONSTRAINT `chk_assessment_attempts_score` CHECK (`score` IS NULL OR `score` BETWEEN 0 AND 100),

  INDEX `idx_assessment_attempts_assessment_id` (`assessment_id`),
  CONSTRAINT `uq_attempts_enrollment_assessment_number`
    UNIQUE (`enrollment_id`, `assessment_id`, `attempt_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 16/17: attempt_answers
-- Jawaban terpilih untuk setiap soal pada suatu percobaan.
-- PK gabungan: satu soal hanya punya satu jawaban per percobaan.
-- ============================================================
CREATE TABLE `attempt_answers` (
  `attempt_id`        BIGINT    NOT NULL,
  `question_id`       BIGINT    NOT NULL,
  `selected_option_id` BIGINT   NOT NULL,
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`attempt_id`, `question_id`),
  CONSTRAINT `fk_attempt_answers_attempt_id` FOREIGN KEY (`attempt_id`)
    REFERENCES `assessment_attempts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_attempt_answers_question_id` FOREIGN KEY (`question_id`)
    REFERENCES `questions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_attempt_answers_selected_option_id` FOREIGN KEY (`selected_option_id`)
    REFERENCES `question_options` (`id`) ON DELETE RESTRICT,

  INDEX `idx_attempt_answers_question_id` (`question_id`),
  INDEX `idx_attempt_answers_selected_option_id` (`selected_option_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 17/17: reviews
-- Rating dan ulasan peserta yang memiliki kelas.
-- enrollment_id UNIQUE -> maksimal satu review per enrollment.
-- ============================================================
CREATE TABLE `reviews` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT,
  `enrollment_id` BIGINT       NOT NULL,
  `rating`        INT          NOT NULL COMMENT '1 sampai 5',
  `review_text`   TEXT         NOT NULL,
  `batch_label`   VARCHAR(100) NULL COMMENT 'Label angkatan/alumni jika ada',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `uq_reviews_enrollment_id` UNIQUE (`enrollment_id`),
  CONSTRAINT `fk_reviews_enrollment_id` FOREIGN KEY (`enrollment_id`)
    REFERENCES `enrollments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_reviews_rating` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FK check dinyalakan kembali setelah semua tabel dibuat.
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Selesai: 17 tabel, 22 relasi fisik, sesuai ERD.md
-- ============================================================





