# educourse-api

Backend Educourse / VideoBelajar - Mission FSD-20 (Backend).

## Requirements

- Node.js (teruji v24.16.0)
- MySQL/MariaDB dari XAMPP yang sudah running (teruji MariaDB 10.4.32)

## Setup

**1. Install dependency**

```bash
npm install
```

**2. Siapkan file `.env`**

Salin `.env.example` menjadi `.env`, lalu sesuaikan jika credential berbeda.

```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_PORT=3306
DB_NAME=educourse
APP_PORT=3000
```

**3. Jalankan skema database**

Buat database dan **17 tabel** sekaligus lewat `schema.sql`. Bisa lewat phpMyAdmin
(import `schema.sql`), atau lewat terminal:

```bash
mysql -u root < schema.sql
```

Isi database:

| Kelompok | Tabel |
| --- | --- |
| Identitas | `users`, `categories`, `tutors`, `payment_methods` |
| Konten kelas | `courses`, `modules`, `materials`, `assessments`, `questions`, `question_options` |
| Transaksi | `orders`, `payments`, `enrollments` |
| Belajar | `material_progress`, `assessment_attempts`, `attempt_answers`, `reviews` |

Total: **17 tabel, 22 foreign key, 20 CHECK constraint, 14 UNIQUE**.

> Script ini memakai `DROP TABLE IF EXISTS`, jadi **menghapus semua data lama**.
> Jangan dijalankan ulang pada database yang datanya masih dibutuhkan.

**4. Jalankan server**

```bash
npm start        # production
npm run dev      # dengan nodemon
```

Server berjalan di `http://localhost:3000`.

## Testing dengan Postman

Sudah tersedia collection siap import di `postman/educourse-api.postman_collection.json`.

**Cara import**

1. Buka Postman -> **Import** (atau `Ctrl+O`)
2. Pilih file `postman/educourse-api.postman_collection.json`
3. Klik **Import**
4. Pastikan server jalan dulu (`npm start`)

**Cara menjalankan**

Klik kanan collection -> **Run collection** -> **Run**.

Jalankan dari atas ke bawah. Jangan menjalankan request satu per satu
secara acak, karena folder 9-12 saling bergantung lewat collection variable.

**Cara membaca hasil**

Buka tab **Test Results**:

| Warna | Arti |
| --- | --- |
| Hijau | Semua test lolos |
| Merah | Ada test gagal |

**Kode 400, 404, dan 409 bukan kegagalan.** Request seperti
`7c. POST email duplikat` memang dirancang menjawab 409 — itu bukti
validasi backend bekerja. Folder yang sengaja menguji error: **7, 8a,
10e, 11c, dan 12**.

**Kalau collection stuck (muncul 409 di slug/position)**

Folder 12 sengaja menyisakan kategori dan tutor yang masih dipakai kelas,
jadi keduanya tidak bisa dihapus lewat API. Bersihkan dulu:

```bash
mysql -u root < reset.sql
```

lalu jalankan ulang collection dari awal.

**Cara pakai**

Klik kanan collection -> **Run** untuk menjalankan semua request berurutan.
Atau klik **Run** pada level collection dan pilih **Run collection**.

Setiap request sudah punya test script. Hasilnya muncul di tab
**Test Results** sebagai daftar hijau (lolos) atau merah (gagal).

**Tidak perlu persiapan apa pun**

Request 1 punya pre-request script yang otomatis menghapus sisa data dari
run sebelumnya, jadi collection ini bisa dijalankan berulang tanpa gagal.
Tidak perlu `TRUNCATE` manual di phpMyAdmin.

**Isi collection**

| # | Request | DML |
| --- | --- | --- |
| 0 | Setup - Cek Kondisi Awal | Persiapan |
| 1 | Create User | INSERT |
| 2 | Create User Kedua | INSERT |
| 3 | Get All Users | SELECT |
| 4 | Get User by ID | SELECT by id |
| 5 | Update User | UPDATE |
| 6 | Delete User | DELETE |
| 7a-7e | Error Cases | validasi (404/400/409) |
| 8a-8c | Idempotency Check | uji jalan ulang |

**Variable collection**

| Nama | Nilai | Keterangan |
| --- | --- | --- |
| `baseUrl` | `http://localhost:3000` | alamat server |
| `userId` | `uid001` | id user untuk request by id |

Kalau server jalan di port lain, ubah `baseUrl` di tab **Variables**
tanpa perlu edit tiap request.

**Catatan urutan**

Jalankan dari atas ke bawah. Request 7a-7e bergantung pada data yang
dibuat request 1-6, jadi tidak bisa dijalankan acak.

## Struktur

```
src/
├── config/
│   └── database.js          # koneksi pool mysql2 (Langkah 1)
├── service/
│   └── userService.js       # query SELECT/INSERT/UPDATE/DELETE (Langkah 2)
├── controller/
│   └── userController.js    # validasi payload & status code
├── route/
│   └── userRoute.js         # definisi endpoint REST (Langkah 3)
└── app.js                   # entry point Express
```

Pemisahan ini mengikuti aturan: **route tidak boleh menulis query SQL**,
semua akses database lewat service.

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
| GET/POST | `/categories` | Kategori kelas |
| GET | `/categories/:id` | Kategori by id |
| PATCH/DELETE | `/categories/:id` | Ubah/hapus kategori |
| GET/POST | `/tutors` | Profil pengajar |
| GET | `/tutors/:id` | Tutor by id |
| PATCH/DELETE | `/tutors/:id` | Ubah/hapus tutor |

### Struktur kelas

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET/POST | `/courses` | Produk kelas (JOIN kategori + tutor) |
| GET | `/courses/:id` | Kelas by id |
| PATCH/DELETE | `/courses/:id` | Ubah/hapus kelas |
| GET/POST | `/modules` | Modul dalam kelas |
| GET | `/modules/:id` | Modul by id |
| PATCH/DELETE | `/modules/:id` | Ubah/hapus modul |
| GET/POST | `/materials` | Video, rangkuman, pretest, quiz, exam |
| GET | `/materials/:id` | Materi by id |
| PATCH/DELETE | `/materials/:id` | Ubah/hapus materi |

### Penilaian

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET/POST | `/assessments` | Konfigurasi penilaian |
| GET | `/assessments/:id` | Assessment by id |
| PATCH/DELETE | `/assessments/:id` | Ubah/hapus assessment |
| GET/POST | `/questions` | Soal pilihan ganda |
| GET | `/questions/:id` | Soal by id |
| PATCH/DELETE | `/questions/:id` | Ubah/hapus soal |
| GET/POST | `/question-options` | Opsi jawaban + kunci |
| GET | `/question-options/:id` | Opsi by id |
| PATCH/DELETE | `/question-options/:id` | Ubah/hapus opsi |

### Ulasan

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET/POST | `/reviews` | Rating dan ulasan |
| GET | `/reviews/:id` | Ulasan by id |
| PATCH/DELETE | `/reviews/:id` | Ubah/hapus ulasan |
| GET | `/reviews/summary?course_id=1` | Rata-rata rating per kelas |

### Validasi per tabel

| Tabel | Aturan yang ditegakkan |
| --- | --- |
| `categories` | slug huruf kecil/angka/strip, unik |
| `courses` | status harus draft/published/archived, harga >= 0, FK harus ada |
| `modules` | position >= 1, unik per kelas |
| `materials` | video wajib `content_url`, summary wajib isi, type terbatas |
| `assessments` | hanya untuk pretest/quiz/exam, nilai 0-100, unik per material |
| `question_options` | tepat satu kunci per soal, minimal 2 opsi |
| `reviews` | rating 1-5, hanya pemilik kelas yang sudah selesai |

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

`id` adalah UID Firebase berupa string. `phone`, `photo_url` opsional.
`role` hanya boleh `student` atau `admin`, default `student`.

**PATCH /users/:id** — hanya kirim field yang diubah.

```json
{ "name": "Budi_updated", "phone": "08999999999" }
```

### Status code

| Code | Arti |
| --- | --- |
| 200 | Berhasil |
| 201 | Data berhasil dibuat (POST) |
| 400 | Payload tidak valid |
| 404 | User tidak ditemukan |
| 409 | Email sudah terdaftar |
| 500 | Error di server |

## Struktur database

`schema.sql` berisi 17 tabel sesuai `ERD.md`, dengan urutan pembuatan
mengikuti dokumen skema (induk selalu lebih dulu dari anak).

Aturan yang diterapkan:

- Semua tabel punya `created_at` dan `updated_at` (kecuali yang PK-nya gabungan)
- Semua FK memakai `ON DELETE RESTRICT` agar riwayat pembayaran dan belajar
  tidak terhapus otomatis
- Constraint nilai memakai `CHECK`, bukan ENUM, supaya mudah diubah
- Tabel dengan relasi opsional 1:1 memakai FK `UNIQUE`
  (`assessments.material_id`, `enrollments.order_id`, `reviews.enrollment_id`)
- `material_progress` dan `attempt_answers` memakai PK gabungan
- `users.id` tetap VARCHAR(128) karena UID Firebase, tidak diubah jadi angka

Aturan lintas-baris **tidak** dijamin database, harus divalidasi backend
dalam transaksi: minimal dua opsi per soal, tepat satu jawaban benar,
hanya satu pembayaran pending per order, dan kecocokan
soal/opsi/attempt.

Tabel `users` mengikuti `Dokumentasi_Skema_Database_FSD20.docx.md`:

- `id` VARCHAR(128) PK — UID Firebase, bukan auto-increment
- `email` UNIQUE
- `role` dibatasi `CHECK (role IN ('student','admin'))`
- `created_at` / `updated_at` diisi otomatis, `updated_at` diperbarui saat UPDATE
- Password tidak disimpan; autentikasi tetap memakai Firebase

Perbedaan dari dokumen: kolom `TEXT` ditulis `NULL` tanpa `DEFAULT NULL`
karena MariaDB 10.4 menolak nilai default pada tipe TEXT.