# educourse-api

Backend REST API untuk platform pembelajaran **Educourse / VideoBelajar**.
Project ini memenuhi tiga langkah mission backend (Mission FSD-20):
menghubungkan Node.js ke database, mengimplementasikan DML, lalu
membuatkan REST API.

| | |
| --- | --- |
| **Tabel database** | 17 (sesuai `ERD.md`) |
| **Tabel dengan CRUD** | 10 |
| **Endpoint** | 51 |
| **Foreign key** | 22 |
| **Constraint** | 20 `CHECK`, 14 `UNIQUE` |
| **Request Postman** | 35 dalam 6 folder |
| **Pengujian otomatis** | 53, semua lolos |

---

## Tech stack

| Komponen | Teknologi |
| --- | --- |
| Runtime | Node.js (teruji v24.16.0) |
| Framework | Express 4.21 |
| Database | MySQL / MariaDB 10.4 (XAMPP) |
| Driver | mysql2 (connection pool) |
| Konfigurasi | dotenv |
| Pengujian | Postman |

---

## Requirements

- Node.js 18 atau lebih baru
- MySQL atau MariaDB yang sedang berjalan (XAMPP sudah cukup)
  - Teruji di MariaDB 10.4.32

---

## Quick start

**1. Install dependency**

```bash
npm install
```

**2. Siapkan file `.env`**

Salin `.env.example` menjadi `.env`. Nilai di bawah sudah sesuai default
XAMPP, jadi biasanya tidak perlu diubah.

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_PORT=3306
DB_NAME=educourse
APP_PORT=3000
```

**3. Buat database dan tabel**

```bash
mysql -u root < schema.sql
```

Alternatif: buka `http://localhost/phpmyadmin`, lalu **Import** ->
pilih `schema.sql`.

> **Penting:** `schema.sql` memakai `DROP TABLE IF EXISTS`, jadi **semua
> data lama akan hilang**. Untuk sekadar mengosongkan data tanpa
> menghapus tabel, pakai `reset.sql`.

**4. Jalankan server**

```bash
npm start        # production
npm run dev      # dengan nodemon, auto-reload
```

Server berjalan di `http://localhost:3000`. Kalau terminal menampilkan
ini, berarti semuanya siap:

```
[database] terkoneksi ke MySQL "educourse" di 127.0.0.1:3306
[server] berjalan di http://localhost:3000
```

---

## Struktur project

```
src/
â”œâ”€â”€ app.js                       # entry point Express + registrasi route
â”œâ”€â”€ config/
â”‚   â””â”€â”€ database.js              # connection pool mysql2
â”œâ”€â”€ service/                     # lapisan query SQL
â”‚   â”œâ”€â”€ userService.js
â”‚   â”œâ”€â”€ categoryService.js
â”‚   â”œâ”€â”€ tutorService.js
â”‚   â”œâ”€â”€ courseService.js
â”‚   â”œâ”€â”€ moduleService.js
â”‚   â”œâ”€â”€ materialService.js
â”‚   â”œâ”€â”€ assessmentService.js
â”‚   â”œâ”€â”€ questionService.js
â”‚   â”œâ”€â”€ questionOptionService.js
â”‚   â””â”€â”€ reviewService.js
â”œâ”€â”€ controller/                  # validasi payload + status code
â”‚   â””â”€â”€ ... (satu file per tabel)
â””â”€â”€ route/                       # definisi endpoint
    â””â”€â”€ ... (satu file per tabel)

schema.sql                       # 17 tabel
reset.sql                        # kosongkan tabel untuk ulang pengujian
postman/
â””â”€â”€ educourse-api.postman_collection.json
```

### Aturan lapisan

Alur satu request selalu melewati tiga lapis:

```
route  ->  controller  ->  service  ->  database
```

- **Route** hanya mendefinisikan URL dan method. Tidak menulis query SQL.
- **Controller** memeriksa payload dan mengembalikan status code yang tepat.
- **Service** satu-satunya tempat yang menulis query SQL.

Pemisahan ini membuat validasi dan query bisa diuji terpisah.

---

## Struktur database

`schema.sql` membuat 17 tabel sesuai `ERD.md`, dengan urutan pembuatan
mengikuti dokumen skema supaya tabel induk selalu lebih dulu dari anak.

| Kelompok | Tabel |
| --- | --- |
| Identitas | `users`, `categories`, `tutors`, `payment_methods` |
| Konten kelas | `courses`, `modules`, `materials`, `assessments`, `questions`, `question_options` |
| Transaksi | `orders`, `payments`, `enrollments` |
| Belajar | `material_progress`, `assessment_attempts`, `attempt_answers`, `reviews` |

Aturan yang diterapkan:
---

## Validasi per tabel

| Tabel | Aturan yang ditegakkan |
| --- | --- |
| `users` | `id` dan `email` unik, `role` hanya student/admin |
| `categories` | slug hanya huruf kecil, angka, dan strip; slug unik |
| `courses` | status harus draft/published/archived, harga >= 0, FK harus ada |
| `modules` | `position` >= 1 dan unik di dalam satu kelas |
| `materials` | video wajib `content_url`, summary wajib isi, tipe terbatas |
| `assessments` | hanya untuk pretest/quiz/exam, nilai 0-100, unik per materi |
| `questions` | `position` >= 1 dan unik di dalam satu assessment |
| `question_options` | tepat satu kunci per soal, minimal 2 opsi |
| `reviews` | rating 1-5, satu ulasan per enrollment, kelas harus selesai |

Validasi dijalankan berlapis:

1. **Controller** menolak lebih dulu supaya pesan error jelas (400/409).
2. **Constraint database** (`CHECK` dan `UNIQUE`) menjadi pengaman terakhir.

---


- Semua FK memakai `ON DELETE RESTRICT` supaya riwayat pembayaran dan
  belajar tidak terhapus otomatis. Penghapusan berantai dicegah di backend
  dengan pesan yang jelas.
- Constraint nilai memakai `CHECK`, bukan `ENUM`, supaya mudah diubah.
- Tabel dengan relasi opsional 1:1 memakai FK `UNIQUE`
  (`assessments.material_id`, `enrollments.order_id`, `reviews.enrollment_id`).
- `material_progress` dan `attempt_answers` memakai primary key gabungan.
- `users.id` tetap `VARCHAR(128)` karena berisi UID Firebase, tidak diubah
  menjadi angka.
- `users` tidak menyimpan password. Autentikasi tetap memakai Firebase.

**Aturan lintas-baris tidak dijamin database.** Hal seperti minimal dua opsi
per soal, tepat satu jawaban benar, dan kesesuaian materi dengan assessment
harus divalidasi backend di dalam transaksi. Contohnya sudah dikerjakan di
`questionOptionController` untuk menjaga satu kunci jawaban per soal.

---

## Endpoint

Base URL: `http://localhost:3000`

### users

| Method | Endpoint | Keterangan | DML |
| --- | --- | --- | --- |
| GET | `/users` | Ambil semua data | SELECT |
| GET | `/users/:id` | Ambil data by id | SELECT |
| POST | `/users` | Tambah data baru | INSERT |
| PATCH | `/users/:id` | Ubah data by id | UPDATE |
| DELETE | `/users/:id` | Hapus data by id | DELETE |

### Master data

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET / POST | `/categories` | Kategori kelas |
| GET | `/categories/:id` | Kategori by id |
| PATCH / DELETE | `/categories/:id` | Ubah / hapus kategori |
| GET / POST | `/tutors` | Profil pengajar |
| GET | `/tutors/:id` | Tutor by id |
| PATCH / DELETE | `/tutors/:id` | Ubah / hapus tutor |

### Struktur kelas

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET / POST | `/courses` | Produk kelas (JOIN kategori + tutor) |
| GET | `/courses/:id` | Kelas by id |
| PATCH / DELETE | `/courses/:id` | Ubah / hapus kelas |
| GET / POST | `/modules` | Modul dalam kelas |
| GET | `/modules/:id` | Modul by id |
| PATCH / DELETE | `/modules/:id` | Ubah / hapus modul |
| GET / POST | `/materials` | Video, rangkuman, pretest, quiz, exam |
| GET | `/materials/:id` | Materi by id |
| PATCH / DELETE | `/materials/:id` | Ubah / hapus materi |

### Penilaian

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET / POST | `/assessments` | Konfigurasi penilaian |
| GET | `/assessments/:id` | Assessment by id |
| PATCH / DELETE | `/assessments/:id` | Ubah / hapus assessment |
| GET / POST | `/questions` | Soal pilihan ganda |
| GET | `/questions/:id` | Soal by id |
| PATCH / DELETE | `/questions/:id` | Ubah / hapus soal |
| GET / POST | `/question-options` | Opsi jawaban dan kunci |
| GET | `/question-options/:id` | Opsi by id |
| PATCH / DELETE | `/question-options/:id` | Ubah / hapus opsi |

### Ulasan

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET / POST | `/reviews` | Rating dan ulasan |
| GET | `/reviews/:id` | Ulasan by id |
| PATCH / DELETE | `/reviews/:id` | Ubah / hapus ulasan |
| GET | `/reviews/summary?course_id=1` | Rata-rata rating satu kelas |

Rata-rata rating dihitung saat dibaca, bukan disimpan, supaya tidak
lSongsing dengan data ulasan.

### Contoh request

**POST /users**

```json
{
  "id": "uid001",
  "name": "Budi Santoso",
  "email": "budi@mail.com",
  "phone": "08123456789",
  "role": "student"
}
```

`id` adalah UID Firebase berupa string, jadi wajib diisi manual. `phone`
dan `photo_url` opsional. `role` hanya boleh `student` atau `admin`, dengan
default `student`.

**PATCH /users/:id** â€” hanya kirim field yang diubah.

```json
{ "name": "Budi_updated", "phone": "08999999999" }
```

Kolom yang tidak disebut tidak akan berubah. Inilah yang membedakan
`PATCH` dari `PUT`.

**POST /materials**

```json
{
  "module_id": 1,
  "title": "Intro JavaScript",
  "type": "video",
  "content_url": "https://example.com/video.mp4",
  "duration_seconds": 600,
  "position": 1,
  "is_preview": true
}
```

Materi `video` wajib mengisi `content_url`. Materi `summary` wajib mengisi
`content_text` atau `content_url`.

### Status code

| Code | Arti | Contoh |
| --- | --- | --- |
| 200 | Berhasil | SELECT, UPDATE, DELETE sukses |
| 201 | Data dibuat | POST sukses |
| 400 | Payload tidak valid | field wajib kosong, FK tidak ada, nilai di luar batas |
| 404 | Data tidak ditemukan | id tidak ada di database |
| 409 | Bentrok | duplikat, atau data masih dipakai tabel lain |
| 500 | Error di server | kesalahan tak terduga |

---

## Testing dengan Postman

Collection siap import ada di
`postman/educourse-api.postman_collection.json`.

**Import**

1. Buka Postman -> **Import** (atau `Ctrl+O`)
2. Pilih file `educourse-api.postman_collection.json`
3. Klik **Import**
4. Pastikan server sudah jalan (`npm start`)

**Jalankan**

Klik kanan nama collection -> **Run collection** -> **Run**.

Jalankan dari atas ke bawah. Folder 9 sampai 12 saling bergantung lewat
collection variable, jadi jangan menjalankan request satu per satu secara
acak.

**Isi collection**

| Folder | Isi | DML |
| --- | --- | --- |
| 0 | Cek kondisi data awal | Persiapan |
| 1-2 | Create user dan user kedua | INSERT |
| 3-4 | Ambil semua dan ambil by id | SELECT |
| 5-6 | Update dan delete by id | UPDATE, DELETE |
| 7 | Kasus error (404, 400, 409) | Validasi |
| 8 | Bukti collection aman diulang | Uji idempoten |
| 9 | Kategori dan tutor | CRUD master data |
| 10 | Kelas, modul, materi | CRUD struktur kelas |
| 11 | Assessment, soal, opsi | CRUD penilaian |
| 12 | Delete bertingkat | Uji FK RESTRICT |

**Cara membaca hasil**

Buka tab **Test Results**. Warna hijau berarti semua test lolos, merah
berarti ada yang gagal.

> **Kode 400, 404, dan 409 bukan kegagalan.** Folder 7, 8a, 10e, 11c, dan
> 12 sengaja menguji error handling. Contohnya `7c. POST email duplikat`
> menjawab 409 karena emailnya memang sudah ada - itu bukti validasi
> backend bekerja, bukan kegagalan.

**Variable collection**

| Nama | Nilai | Cara diisi |
| --- | --- | --- |
| `baseUrl` | `http://localhost:3000` | manual |
| `userId` | `uid001` | manual |
| `categoryId` | - | otomatis dari request 9a |
| `tutorId` | - | otomatis dari request 9c |
| `courseId` | - | otomatis dari request 10a |
| `moduleId` | - | otomatis dari request 10c |
| `videoMaterialId` | - | otomatis dari request 10d |
| `quizMaterialId` | - | otomatis dari request 11a |
| `assessmentId` | - | otomatis dari request 11b |
| `questionId` | - | otomatis dari request 11d |

Kalau server jalan di port lain, ubah `baseUrl` di tab **Variables** tanpa
perlu edit tiap request.

**Kalau collection stuck (muncul 409 di slug atau position)**

Folder 12 sengaja menyisakan kategori dan tutor yang masih dipakai kelas,
sehingga keduanya tidak bisa dihapus lewat API. Bersihkan dulu:

```bash
mysql -u root < reset.sql
```

Lalu jalankan ulang collection dari awal. Alternatifnya, salin perintah
di `reset.sql` ke tab SQL phpMyAdmin.

---

## Catatan dan batasan

**Autentikasi belum diimplementasikan.** Sesuai dokumen skema,
autentikasi tetap memakai Firebase Authentication. Kolom `role` sudah ada
di tabel `users`, tetapi belum ada middleware yang membatasi akses
berdasarkan nilai tersebut.

**Lima tabel sengaja tidak diberi CRUD:**

| Tabel | Alasan |
| --- | --- |
| `orders` | Status punya alur `pending` -> `paid` / `cancelled` / `expired` |
| `payments` | Riwayat transaksi bersifat append-only |
| `enrollments` | Dibuat sistem otomatis saat pembayaran berhasil |
| `material_progress` | PK gabungan, delete berarti reset progres |
| `assessment_attempts` | Menyimpan riwayat percobaan belajar |

Kelimanya bukan data yang dikelola langsung dari input pengguna, jadi CRUD
biasa akan merusak alur bisnisnya.

**`schema.sql` bersifat destruktif.** Untuk mengosongkan data tanpa
menghapus tabel, pakai `reset.sql`.

**Perbedaan dari dokumen skema.** Kolom bertipe `TEXT` ditulis `NULL`
tanpa `DEFAULT NULL` karena MariaDB 10.4 menolak nilai default pada tipe
TEXT. Selebihnya mengikuti `Dokumentasi_Skema_Database_FSD20.docx.md`.

