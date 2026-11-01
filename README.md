# NARAE

**AI-Powered Wearable & Caregiver Companion** — a voice-first care system connecting elderly individuals with their caregivers.

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-Function%20Calling-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Tim: Mie Ayam Kopma**

---

## Daftar Isi

1. [Tim](#1-tim)
2. [Ringkasan Proyek](#2-ringkasan-proyek)
3. [Fitur Utama](#3-fitur-utama)
4. [Panduan Demo Cepat untuk Juri](#4-panduan-demo-cepat-untuk-juri)
5. [Arsitektur Sistem](#5-arsitektur-sistem)
6. [Tech Stack](#6-tech-stack)
7. [Struktur Repositori](#7-struktur-repositori)
8. [AI Agent](#8-ai-agent)
9. [Skema Database](#9-skema-database)
10. [Referensi API](#10-referensi-api)
11. [Instalasi dan Menjalankan Aplikasi](#11-instalasi-dan-menjalankan-aplikasi)
12. [Pemecahan Masalah](#12-pemecahan-masalah)
13. [Batasan Saat Ini dan Rencana Pengembangan](#13-batasan-saat-ini-dan-rencana-pengembangan)
14. [AI Use and Third-Party Declaration](#14-ai-use-and-third-party-declaration)
15. [Lisensi](#15-lisensi)

---

## 1. Tim

**Mie Ayam Kopma**

| No. | Nama                        |
| :-: | --------------------------- |
|  1  | Radhitya Rasta Pramoja      |
|  2  | Nicolaus Narindra           |
|  3  | Michael Bintang Febryan S.J |

---

## 2. Ringkasan Proyek

### Latar Belakang

Lansia, khususnya yang mengalami penurunan daya ingat atau demensia, sering lupa jadwal minum obat, lupa letak barang pribadi, dan kesulitan meminta bantuan saat dibutuhkan. Di sisi lain, satu perawat umumnya mendampingi lebih dari satu pasien sehingga tidak dapat memantau setiap orang secara terus-menerus.

### Solusi

NARAE terdiri dari dua sisi yang saling terhubung secara real-time:

| Sisi                                           | Pengguna      | Peran                                                                                                                    |
| ---------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Gelang pendamping** (disimulasikan dalam 3D) | Pasien lansia | Berbicara dengan asisten suara: menanyakan jadwal, mencari barang, melaporkan kegiatan selesai, dan memanggil perawat.   |
| **Dashboard caregiver** (web, tampilan mobile) | Perawat       | Mengatur jadwal, memantau status kegiatan, menerima panggilan bantuan, dan meninjau riwayat percakapan pasien dengan AI. |

Asisten suara digerakkan oleh **Google Gemini dengan Function Calling**. AI tidak diberi seluruh data pasien sekaligus, tetapi memanggil _tool_ tertentu hanya ketika dibutuhkan, dan dibatasi aturan ketat agar tidak memberi saran medis maupun mengarang informasi.

### Catatan Penting tentang Prototipe

Gelang fisik **tidak dibuat dalam bentuk perangkat keras**. Gelang disimulasikan sebagai model 3D interaktif (Three.js) yang memakai mikrofon dan speaker perangkat Anda, namun berkomunikasi dengan backend dan database yang sebenarnya.

---

## 3. Fitur Utama

### Untuk Pasien (melalui gelang)

- **Tanya jadwal.** Menyebutkan nama kegiatan, jam mulai, durasi, serta penanda waktu relatif ("hari ini", "besok", atau tanggal bila lebih dari dua hari).
- **Kegiatan terdekat.** Menjawab pertanyaan seperti "setelah ini saya ngapain?" berdasarkan jam saat ini (WIB).
- **Cari barang.** Menyebutkan lokasi terakhir barang beserta tempat biasa barang itu disimpan.
- **Lapor kegiatan selesai.** Contoh: "sudah minum obat". Laporan dicatat dan menunggu konfirmasi perawat.
- **Panggil perawat.** Hanya dipicu ketika pasien memintanya secara eksplisit.
- **Percakapan multi-turn.** AI mendengarkan kembali setelah menjawab sampai pasien mengucapkan kata penutup atau hening.
- **Suara bahasa Indonesia.** Pengenalan suara (`id-ID`) dan pembacaan jawaban dengan suara Indonesia terbaik yang tersedia di browser.

### Untuk Perawat (dashboard)

- **Beranda.** Ringkasan kegiatan hari ini.
- **Manajemen jadwal.** Membuat, mengubah, menonaktifkan, dan menghapus kegiatan, baik berulang (pilih hari) maupun sekali jalan (pilih tanggal).
- **Deteksi jadwal bertabrakan.** Sistem menampilkan perbandingan dua kegiatan yang bentrok dan menawarkan opsi menggeser jam atau menonaktifkan salah satunya.
- **Konfirmasi laporan pasien.** Perawat dapat menyetujui atau menolak laporan "selesai" dari pasien.
- **Antrean panggilan bantuan.** Panggilan baru berstatus `PENDING`, dapat ditangani (`ACKNOWLEDGED`) atau diselesaikan (`RESOLVED`). Panggilan yang tidak direspons dalam **10 detik** otomatis menjadi `EXPIRED` dan dimasukkan ke Riwayat pemanggilan.
- **Inventori barang.** Menambah, mengubah, dan menghapus barang bawaan pasien beserta lokasi terakhir dan lokasi default.
- **Riwayat interaksi AI.** Seluruh percakapan pasien dengan asisten tercatat dan dapat ditinjau.
- **Dukungan 1 perawat : 1 pasien maupun 1 perawat : banyak pasien**, lengkap dengan pengalih pasien.
- **Status otomatis `MISSED`.** Kegiatan yang melewati jam mulai ditambah durasinya otomatis ditandai terlewat.

### Simulator Gelang 3D

- Model 3D gelang dengan tombol **Bantuan** (merah) dan **Jadwal** (biru), LED, speaker, dan mikrofon.
- Kontrol tampilan: depan, atas, belakang, putar otomatis, pecah komponen, dan mode presentasi.
- Dropdown pasien untuk mengganti pemilik gelang secara langsung selama demo.

---

## 4. Panduan Demo Cepat untuk Juri

Setelah aplikasi berjalan (lihat [Bagian 11](#11-instalasi-dan-menjalankan-aplikasi)), buka **`http://localhost:5173`** di **Google Chrome atau Microsoft Edge** pada laptop atau desktop (lebar layar minimal 1024 px), lalu izinkan akses mikrofon.

**Login dengan akun demo**

| Username        | Password   | Skenario                                                |
| --------------- | ---------- | ------------------------------------------------------- |
| `suster.satu`   | `narae123` | 1 perawat : 1 pasien (Pak Arthur)                       |
| `suster.banyak` | `narae123` | 1 perawat : 3 pasien (Ibu Odette, Ibu Siti, Pak Herman) |

**Skenario yang disarankan**

| Langkah | Aksi                                                                                              | Hasil yang diharapkan                                                                                                                     |
| :-----: | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
|    1    | Login sebagai `suster.banyak`. Layar terbagi: gelang 3D di kiri, dashboard di kanan.              | Dashboard menampilkan kegiatan dan antrean panggilan.                                                                                     |
|    2    | Pada panel simulator, pilih pasien **Ibu Odette**.                                                | Gelang kini mewakili Ibu Odette.                                                                                                          |
|    3    | Klik tombol **biru (Jadwal)** pada model 3D.                                                      | Gelang membacakan jadwal hari ini.                                                                                                        |
|    4    | Klik tombol **merah (Bantuan)**, lalu ucapkan: _"Kacamata saya di mana?"_                         | AI memanggil tool inventori dan menyebutkan lokasi terakhir kacamata.                                                                     |
|    5    | Klik **Bantuan** lagi, ucapkan: _"Setelah ini saya ngapain ya?"_                                  | AI menyebutkan kegiatan terdekat berikutnya beserta jam dan durasinya.                                                                    |
|    6    | Klik **Bantuan**, ucapkan: _"Saya sudah jalan pagi."_ / Aktivitas yang belum terlewati.           | Laporan tercatat. Pada dashboard muncul status **Butuh Persetujuan**.                                                                     |
|    7    | Di dashboard, setujui atau tolak laporan tersebut.                                                | Status berubah menjadi **Selesai** atau **Belum Selesai** dan masuk audit trail.                                                          |
|    8    | Klik **Bantuan**, ucapkan: _"Tolong panggilkan suster."_                                          | Panggilan muncul di **Panggilan Menunggu Respons**. Tangani dalam 10 detik agar gelang menerima kabar "perawat sudah menerima panggilan". |
|    9    | Ucapkan pertanyaan di luar topik atau medis, misalnya _"Boleh minum obat dua kali?"_              | AI menolak dengan sopan dan mengarahkan ke perawat (guardrail).                                                                           |
|   10    | Buka **Keluarga**, pilih pasien, lalu telusuri tab **Aktivitas**, **Inventori**, dan **Riwayat**. | Seluruh interaksi dan perubahan status tercatat.                                                                                          |

> Data jadwal demo dibuat **relatif terhadap waktu database pertama kali diinisialisasi** (lihat [Bagian 12](#12-pemecahan-masalah) untuk cara menyegarkannya).

---

## 5. Arsitektur Sistem

![Diagram arsitektur sistem NARAE: simulator gelang 3D dan dashboard caregiver memanggil backend Express berlapis yang terhubung ke PostgreSQL dan modul AI agent berbasis Google Gemini](docs/images/architecture.svg)

**Prinsip desain**

- **Arsitektur berlapis di backend.** Setiap lapisan punya satu tanggung jawab: _routes_ memetakan endpoint, _controllers_ memvalidasi input, _services_ memuat logika bisnis, _repositories_ menjalankan SQL berparameter.
- **Modul AI terisolasi (`agent/`).** Paket ini tidak mengenal PostgreSQL. Ia hanya bergantung pada kontrak `AgentDataProvider`, sehingga mudah diuji dan diganti sumber datanya.
- **Waktu selalu berbasis WIB (`Asia/Jakarta`).** Termasuk perhitungan status `MISSED` dan jam yang diucapkan AI.
- **Tanggal `DATE` dibaca sebagai string `YYYY-MM-DD`.** Parser kustom pada `db/pool.ts` mencegah pergeseran zona waktu objek `Date` JavaScript.
  Penjelasan teknis yang lebih mendalam tersedia di [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 6. Tech Stack

| Lapisan           | Teknologi                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Frontend**      | React 18, React Router 6, Vite 5, TypeScript 5, Tailwind CSS v4                            |
| **Simulator 3D**  | Three.js r128, OrbitControls, JavaScript murni, Web Speech API (STT dan TTS)               |
| **Backend**       | Node.js 20, Express 4, TypeScript 5, `pg`, `bcryptjs`, `cors`, `dotenv`                    |
| **AI Agent**      | Google Gemini melalui `@google/genai` (Function Calling), model default `gemini-2.0-flash` |
| **Database**      | PostgreSQL 16                                                                              |
| **Infrastruktur** | Docker dan Docker Compose                                                                  |

---

## 7. Struktur Repositori

```
narae/
├─ package.json                Orkestrasi workspace monorepo & build script root
├─ vercel.json                 Konfigurasi deployment Vercel (rewrites API & static)
├─ Dockerfile                  Build container backend & agent (context: root)
├─ docker-compose.yml          Orkestrasi db + backend + frontend lokal
├─ .env.example                Template konfigurasi environment
├─ ARCHITECTURE.md             Dokumen arsitektur teknis
├─ LICENSE                     MIT License
│
├─ api/
│  └─ index.js                 Entry point Serverless Function (Vercel)
│
├─ db/
│  ├─ init.sql                 Skema final + data demo (dijalankan otomatis saat pertama kali)
│  └─ seed_additional.sql      Seed tambahan opsional (inventori & kegiatan; aman dijalankan berulang)
│
├─ agent/                      Paket AI terpisah (@narae/agent)
│  └─ src/
│     ├─ agent.ts              Loop Function Calling (maksimal 4 ronde tool)
│     ├─ geminiClient.ts       Pembuat klien Gemini
│     ├─ prompt/               systemPrompt.ts (guardrail) dan jitContext.ts (konteks pasien)
│     └─ tools/                Satu berkas per tool + index.ts sebagai registri
│
├─ backend/
│  ├─ Dockerfile
│  └─ src/
│     ├─ app.ts                Inisialisasi Express & rute REST (dipakai serverless & lokal)
│     ├─ index.ts              Entry point Express server lokal / standalone (port 4000)
│     ├─ config/               Pembacaan environment
│     ├─ routes/               Pemetaan endpoint REST (termasuk demo.routes.ts)
│     ├─ controllers/          Validasi request dan respons HTTP
│     ├─ services/             Logika bisnis (ai.service.ts, demo.service.ts, task.service.ts, dll.)
│     ├─ repositories/         Query SQL berparameter
│     ├─ db/pool.ts            Koneksi PostgreSQL (dukungan SSL Supabase & lokal)
│     └─ types/ dan utils/     Tipe domain dan utilitas tanggal
│
└─ frontend/
   ├─ Dockerfile
   ├─ vite.config.ts           Konfigurasi Vite (proxy /api untuk dev lokal & output root dist)
   ├─ src/
   │  ├─ pages/                Beranda, Keluarga, DetailKeluarga, Login (generator demo), Pengaturan
   │  ├─ components/           Sheet form, timeline, layout, switcher pasien, dll.
   │  ├─ api/client.ts         Klien HTTP ke backend (default BASE: /api)
   │  └─ tts.ts                Pemilih suara Indonesia untuk Text-to-Speech
   ├─ public/sim/              Simulator gelang 3D (Three.js, aset statis)
   └─ scripts/verify_click.py  Skrip uji klik tombol 3D (Playwright, opsional)
```

---

## 8. AI Agent

### Alur Percakapan
 
![Diagram alur percakapan AI Agent NARAE dari ucapan pasien, pemanggilan tool Gemini, pencatatan log, eskalasi ke perawat, hingga jawaban dibacakan](docs/images/ai-agent-flow.svg)
 
Angka pada diagram menunjukkan urutan proses. Garis putus-putus hijau menandakan percakapan multi-turn: setelah gelang menjawab, AI mendengarkan lagi sampai pasien mengucapkan kata penutup (misalnya "terima kasih" atau "cukup") atau hening.

### Daftar Tool

| Tool                     | Dipanggil ketika                                         | Hasil                                                                      |
| ------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `get_patient_tasks`      | Pasien bertanya jadwal atau kegiatan                     | Nama kegiatan, jam, durasi, tipe, tanggal, status                          |
| `get_current_datetime`   | Perlu mengetahui jam, hari, atau tanggal sekarang        | Waktu saat ini dalam WIB                                                   |
| `get_belongings_summary` | "Barang saya di mana?"                                   | Lokasi terakhir dan lokasi default tiap barang                             |
| `get_belongings`         | "Saya punya barang apa saja?"                            | Daftar nama barang                                                         |
| `report_task_complete`   | Pasien menyebut kegiatan tertentu sudah selesai          | Status laporan: dicatat, sudah dilaporkan, atau sudah dikonfirmasi perawat |
| `request_nurse_call`     | Pasien secara **eksplisit** meminta dipanggilkan perawat | Menandai eskalasi dan membuat tiket bantuan                                |

Menambah tool baru cukup dengan membuat satu berkas di `agent/src/tools/` lalu mendaftarkannya di `index.ts`.

### Guardrail (`systemPrompt.ts`)

| Aturan                     | Penjelasan                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Closed-world**           | Jawaban hanya boleh berasal dari hasil tool atau catatan perawatan. AI tidak boleh mengarang jadwal, nama, atau lokasi.                   |
| **Tanpa saran medis**      | Tidak memberi dosis, diagnosis, atau izin minum obat. Pasien diarahkan bertanya kepada perawat.                                           |
| **Di luar topik**          | Pertanyaan seperti cuaca, berita, atau politik dijawab singkat sebagai di luar kemampuan asisten.                                         |
| **Ringkas dan sederhana**  | Maksimal 1 sampai 2 kalimat dalam bahasa Indonesia yang mudah dipahami, mengingat keterbatasan daya ingat pasien.                         |
| **Eskalasi terkendali**    | Perawat dipanggil hanya jika diminta eksplisit, bukan karena AI tidak tahu jawabannya. AI juga tidak menjanjikan perawat "segera datang". |
| **Laporan harus spesifik** | Jika pasien hanya berkata "tugas saya sudah selesai" tanpa menyebut nama kegiatan, AI bertanya balik dan tidak menebak.                   |
| **Output siap TTS**        | Selalu teks polos tanpa markdown atau JSON agar nyaman dibacakan.                                                                         |

### Konteks Just-In-Time

Pada setiap sesi, `jitContext.ts` menyuntikkan identitas pasien, nama perawat pendamping, dan catatan klinis sebagai konteks tambahan. Catatan klinis **tidak boleh dibacakan apa adanya** kepada pasien.

---

## 9. Skema Database

| Tabel                 | Fungsi                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `users`               | Akun perawat atau keluarga (kata sandi di-hash dengan bcrypt)                                |
| `patients`            | Profil pasien, kamar, perawat penanggung jawab, dan catatan klinis                           |
| `devices`             | Metadata gelang: UID, baterai, status online, sinkronisasi terakhir                          |
| `patient_tasks`       | Definisi kegiatan: nama, jam, durasi, tipe (`RECURRING` / `ONE_TIME`), hari, tanggal, status |
| `task_status_history` | Audit trail perubahan status beserta pengubah dan catatan alasan                             |
| `patient_belongings`  | Barang bawaan beserta `last_location` dan `default_location`                                 |
| `ai_interaction_logs` | Log ucapan pasien, jawaban AI, aksi yang dipicu, dan latensi                                 |
| `help_requests`       | Antrean panggilan bantuan ke perawat                                                         |
| `voice_profiles`      | Profil suara untuk instruksi pengingat                                                       |

**Siklus status kegiatan**

```
SCHEDULED ─► REMINDER_PLAYED ─► REPORTED_COMPLETE_BY_PATIENT ─┬─► CONFIRMED_BY_NURSE
    │                                                           └─► REJECTED_BY_NURSE
    └──────────────► MISSED  (otomatis jika melewati jam mulai + durasi)
```

| Status di database             | Label di dashboard |
| ------------------------------ | ------------------ |
| `SCHEDULED`                    | Nanti              |
| `REMINDER_PLAYED`              | Proses             |
| `REPORTED_COMPLETE_BY_PATIENT` | Butuh Persetujuan  |
| `CONFIRMED_BY_NURSE`           | Selesai            |
| `REJECTED_BY_NURSE`            | Belum Selesai      |
| `MISSED`                       | Terlewat           |

**Siklus panggilan bantuan:** `PENDING` ─► `ACKNOWLEDGED` ─► `RESOLVED`, atau `PENDING` ─► `EXPIRED` bila tidak direspons dalam 10 detik.

---

## 10. Referensi API

Base URL lokal: `http://localhost:4000/api`

| Metode   | Endpoint                          | Fungsi                                                                   |
| -------- | --------------------------------- | ------------------------------------------------------------------------ |
| `GET`    | `/health`                         | Pemeriksaan status server                                                |
| `POST`   | `/auth/login`                     | Login perawat; mengembalikan data user dan token                         |
| `GET`    | `/patients?nurseId=`              | Daftar pasien di bawah perawat                                           |
| `GET`    | `/patients/:id`                   | Detail pasien: profil, kegiatan hari ini, inventori, catatan klinis      |
| `GET`    | `/tasks?patientId=`               | Seluruh kegiatan pasien                                                  |
| `POST`   | `/tasks`                          | Membuat kegiatan (berulang atau sekali jalan)                            |
| `PATCH`  | `/tasks/:id`                      | Mengubah kegiatan (nama, jam, durasi, tipe, tanggal, `is_active`)        |
| `DELETE` | `/tasks/:id`                      | Menghapus kegiatan                                                       |
| `POST`   | `/tasks/:id/played`               | Menandai pengingat sudah diputar                                         |
| `POST`   | `/tasks/:id/report`               | Pasien melaporkan kegiatan selesai                                       |
| `PATCH`  | `/tasks/:id/confirm`              | Perawat menyetujui atau menolak laporan, dengan catatan                  |
| `GET`    | `/tasks/:id/history`              | Riwayat perubahan status kegiatan                                        |
| `GET`    | `/help-requests?nurseId=&status=` | Daftar panggilan bantuan                                                 |
| `GET`    | `/help-requests/:id`              | Detail satu panggilan                                                    |
| `POST`   | `/help-requests`                  | Membuat panggilan bantuan                                                |
| `PATCH`  | `/help-requests/:id`              | Mengubah status (`ACKNOWLEDGED` / `RESOLVED`)                            |
| `GET`    | `/belongings?patientId=`          | Daftar barang bawaan                                                     |
| `POST`   | `/belongings`                     | Menambah barang                                                          |
| `PATCH`  | `/belongings/:id`                 | Mengubah barang                                                          |
| `DELETE` | `/belongings/:id`                 | Menghapus barang                                                         |
| `GET`    | `/devices`                        | Daftar gelang (dipakai simulator)                                        |
| `POST`   | `/devices/:uid/heartbeat`         | Sinkronisasi berkala dan baterai gelang                                  |
| `POST`   | `/ai/converse`                    | Percakapan pasien dengan AI. Body: `{ patientId, deviceId, transcript }` |
| `GET`    | `/ai/history/:patientId`          | Riwayat interaksi AI pasien                                              |

**Contoh: percakapan dengan AI**

```bash
curl -X POST http://localhost:4000/api/ai/converse \
  -H "Content-Type: application/json" \
  -d '{"patientId": 2, "deviceId": 2, "transcript": "Kacamata saya di mana?"}'
```

Respons berisi `responseText`, `escalate`, `latencyMs`, `toolCallsUsed`, `interactionId`, dan `helpRequest` (bila ada eskalasi).

---

## 11. Instalasi dan Menjalankan Aplikasi

### Prasyarat

| Kebutuhan                     | Keterangan                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| **Docker dan Docker Compose** | Untuk Opsi A (disarankan untuk lokal dengan DB kontainer)             |
| **Node.js 20+ dan npm**       | Untuk Opsi B (manual / lokal) dan Opsi C (Vercel)                     |
| **Gemini API Key**            | Gratis melalui [Google AI Studio](https://aistudio.google.com/apikey) |
| **Chrome atau Edge**          | Diperlukan untuk Web Speech API                                       |

### Konfigurasi Environment

Salin berkas template environment:

```bash
cp .env.example .env
```

| Variabel         | Wajib | Default                                                    | Keterangan                                                                                  |
| ---------------- | :---: | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY` |  Ya   | -                                                          | Kunci API Gemini. Tanpa ini, endpoint AI akan menolak permintaan.                           |
| `GEMINI_MODEL`   | Tidak | `gemini-2.0-flash`                                         | Model Gemini yang dipakai                                                                   |
| `VITE_API_URL`   | Tidak | `/api` (atau `http://localhost:4000/api`)                  | URL API yang dipakai browser (otomatis satu domain pada Vercel)                             |
| `DATABASE_URL`   | Tidak | `postgres://narae:narae_dev_password@localhost:5432/narae` | PostgreSQL lokal via Docker, atau URI Supabase Connection Pooler (`aws-0-*.pooler...:6543`)  |
| `PORT`           | Tidak | `4000`                                                     | Port backend Express                                                                        |
| `CORS_ORIGIN`    | Tidak | `*`                                                        | Origin yang diizinkan                                                                       |

> Berkas `.env` sudah masuk `.gitignore`. **Jangan pernah meng-commit API key.**

### Opsi A: Docker Compose (Disarankan untuk Lokal Penuh)

```bash
cp .env.example .env
# Edit .env, isi GEMINI_API_KEY

docker compose up --build
```

| Layanan                 | Alamat                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| Dashboard dan Simulator | http://localhost:5173                                                      |
| Backend API             | http://localhost:4000 (uji dengan `curl http://localhost:4000/api/health`) |
| PostgreSQL              | `localhost:5432`                                                           |

Database akan dibuat dan diisi data demo secara otomatis dari `db/init.sql` pada saat pertama kali dijalankan.

### Opsi B: Pengembangan Lokal (Node.js & Workspaces)

Repositori ini telah dikonfigurasi dengan *npm workspaces* di root sehingga Anda dapat membangun dan menjalankan seluruh layanan secara mudah:

**1. Jalankan database** (pilih salah satu):
* Menggunakan Docker lokal: `docker compose up db -d`
* Atau gunakan database cloud Supabase dengan mengisi `DATABASE_URL` di `.env` (tanpa perlu menyalakan Docker).

**2. Build seluruh paket dari root**:
```bash
npm run build
```
*(Perintah ini otomatis mengompilasi `@narae/agent`, `backend`, dan `frontend` sekaligus).*

**3. Jalankan backend** (port 4000):
```bash
node backend/dist/index.js      # atau: npm run dev --prefix backend
```

**4. Jalankan frontend** (port 5173, Vite proxy aktif ke port 4000):
```bash
npm run dev --prefix frontend
```

Buka browser ke `http://localhost:5173`.

### Opsi C: Deployment Cloud (Vercel Serverless + Supabase 24/7)

Aplikasi NARAE siap dideploy secara fullstack (Frontend + Backend Serverless) ke **Vercel** dengan database **Supabase** tanpa biaya dan aktif 24/7:

1. **Database Supabase**:
   * Buat proyek baru di [Supabase](https://supabase.com/).
   * Eksekusi `db/init.sql` pada menu **SQL Editor** Supabase.
   * Sinkronkan sequence ID awal dengan menjalankan:
     ```sql
     SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
     SELECT setval('patients_id_seq', COALESCE((SELECT MAX(id) FROM patients), 1));
     SELECT setval('devices_id_seq', COALESCE((SELECT MAX(id) FROM devices), 1));
     SELECT setval('patient_tasks_id_seq', COALESCE((SELECT MAX(id) FROM patient_tasks), 1));
     SELECT setval('patient_belongings_id_seq', COALESCE((SELECT MAX(id) FROM patient_belongings), 1));
     SELECT setval('ai_interaction_logs_id_seq', COALESCE((SELECT MAX(id) FROM ai_interaction_logs), 1));
     SELECT setval('help_requests_id_seq', COALESCE((SELECT MAX(id) FROM help_requests), 1));
     ```
   * Salin URI **Connection Pooler (IPv4 / Mode Transaction port 6543)** dari menu *Connect*.

2. **Deploy ke Vercel**:
   * Import repositori GitHub ke [Vercel](https://vercel.com/dashboard).
   * **Root Directory**: Biarkan `./` (root).
   * **Framework Preset**: `Vite` (atau `Other`).
   * Tambahkan **Environment Variables** di Vercel:
     * `DATABASE_URL`: URI Connection Pooler Supabase
     * `GEMINI_API_KEY`: API Key Google Gemini Anda
     * `GEMINI_MODEL`: `gemini-2.0-flash`
   * Klik **Deploy**. Vercel akan otomatis menyajikan Frontend statis dan mengeksekusi Backend Serverless (`/api`) dalam satu domain yang sama.

### Seed Tambahan (Opsional)

```bash
docker exec -i narae-db psql -U narae -d narae < db/seed_additional.sql
```

Skrip ini menambahkan inventori dan kegiatan tambahan, dan aman dijalankan berulang.

### Uji Klik Tombol 3D (Opsional)

```bash
pip install playwright && playwright install chromium
python3 frontend/scripts/verify_click.py
```
---

## 12. Pemecahan Masalah

| Gejala                                                             | Penyebab dan Solusi                                                                                                                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mikrofon tidak berfungsi atau muncul peringatan izin               | Gunakan **Chrome atau Edge**, klik **Izinkan** saat diminta, dan pastikan halaman dibuka lewat `localhost` atau HTTPS. Browser lain seperti Firefox belum mendukung `SpeechRecognition`.      |
| AI menjawab "GEMINI_API_KEY belum diisi"                           | Isi `GEMINI_API_KEY` pada `.env`, lalu jalankan ulang: `docker compose up --build`.                                                                                                           |
| Simulator 3D tidak tampil, hanya dashboard                         | Lebar layar kurang dari 1024 px. Gunakan laptop atau desktop.                                                                                                                                 |
| Tidak ada suara dari gelang                                        | Nyalakan suara perangkat dan klik halaman sekali sebelum berbicara agar browser mengizinkan audio.                                                                                            |
| Jadwal demo terlihat "kemarin" atau tidak relevan                  | Jadwal demo dibuat relatif terhadap waktu inisialisasi database. Segarkan dengan `docker compose down -v` lalu `docker compose up --build`. **Perintah ini menghapus seluruh data database.** |
| Port `5432`, `4000`, atau `5173` sudah dipakai                     | Hentikan proses yang memakai port tersebut, atau ubah pemetaan port pada `docker-compose.yml`.                                                                                                |
| Backend gagal start dengan `ERR_MODULE_NOT_FOUND` pada mode manual | Paket `agent` belum dibuild. Jalankan `npm install && npm run build` di folder `agent/`.                                                                                                      |

---

## 13. Batasan Saat Ini dan Rencana Pengembangan

Kami mencantumkan batasan secara terbuka agar penilaian terhadap prototipe ini akurat.

### Batasan Saat Ini

| Area                   | Kondisi                                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Perangkat keras**    | Gelang hanya berupa simulasi 3D di browser. Belum ada firmware atau perangkat fisik.                                                                     |
| **Autentikasi**        | Token sesi masih sederhana (representasi ID pengguna) dan **belum diverifikasi oleh middleware** di sisi server. Cocok untuk demo, belum untuk produksi. |
| **CORS**               | Diatur `*` untuk kemudahan pengembangan.                                                                                                                 |
| **Kredensial**         | Kata sandi database dan akun demo adalah nilai pengembangan. Wajib diganti sebelum deployment nyata.                                                     |
| **Peran keluarga**     | Skema database mendukung peran `family`, tetapi antarmukanya baru melayani perawat.                                                                      |
| **Pengingat otomatis** | Status `REMINDER_PLAYED` dan endpoint `/tasks/:id/played` tersedia, tetapi penjadwal pengingat otomatis di gelang belum diimplementasikan.               |
| **Profil suara**       | Tabel `voice_profiles` dan kloning suara masih berupa data awal, belum terhubung ke layanan TTS khusus.                                                  |
| **Pengujian**          | Belum ada rangkaian uji otomatis (unit/integrasi). Verifikasi saat ini bersifat manual dan melalui `verify_click.py`.                                    |
| **Browser**            | Fitur suara membutuhkan Chrome atau Edge.                                                                                                                |
| **Data klinis**        | Seluruh data pasien dalam repositori ini adalah **data fiktif** untuk demo.                                                                              |

### Rencana Pengembangan

1. Autentikasi JWT dengan middleware otorisasi per perawat.
2. Antarmuka untuk keluarga pasien.
3. Penjadwal pengingat otomatis dan notifikasi _push_ ke perawat.
4. Integrasi perangkat keras gelang nyata (mikrofon, speaker, tombol fisik).
5. Suara pengingat dengan profil suara perawat atau keluarga.
6. Suite pengujian otomatis dan pipeline CI.

---

## 14. AI Use and Third-Party Declaration

Bagian ini menjelaskan secara transparan bagaimana AI dan komponen pihak ketiga digunakan dalam proyek NARAE.

### 14.1 Penggunaan AI di Dalam Produk

| Aspek                               | Keterangan                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Penyedia dan model**              | Google Gemini melalui SDK `@google/genai`. Model default `gemini-2.0-flash`, dapat diganti lewat variabel `GEMINI_MODEL`.                        |
| **Teknik**                          | Function Calling (tool use) dengan batas maksimal 4 ronde pemanggilan tool per percakapan.                                                       |
| **Fungsi**                          | Memahami ucapan pasien dan merangkai jawaban singkat berdasarkan data dari tool.                                                                 |
| **Pelatihan atau fine-tuning**      | **Tidak ada.** Tim tidak melatih atau melakukan fine-tuning model apa pun. Perilaku diatur sepenuhnya melalui _system prompt_ dan definisi tool. |
| **Data yang dikirim ke layanan AI** | Transkrip ucapan pasien, nama pasien, nama perawat, catatan klinis, serta hasil tool (jadwal, daftar barang, waktu saat ini).                    |
| **Pengamanan perilaku**             | Closed-world, larangan saran medis, pembatasan topik, dan eskalasi hanya atas permintaan eksplisit (lihat [Bagian 8](#8-ai-agent)).              |
| **Pencatatan**                      | Setiap percakapan disimpan di tabel `ai_interaction_logs` dan dapat ditinjau perawat.                                                            |
| **Peran manusia**                   | AI tidak mengambil keputusan klinis. Laporan kegiatan dari pasien selalu menunggu konfirmasi perawat.                                            |

**Keterbatasan AI yang perlu diketahui.** Model bahasa dapat keliru atau salah memahami ucapan, terutama jika hasil pengenalan suara kurang akurat. Karena itu, NARAE diposisikan sebagai alat bantu pendamping dan **bukan pengganti perawat atau tenaga medis**.

### 14.2 Layanan Suara pada Browser

| Fitur          | API                                           | Catatan                                                                                                                 |
| -------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Speech-to-Text | Web Speech API (`SpeechRecognition`, `id-ID`) | Disediakan browser. Pada Chrome dan Edge, pemrosesan audio umumnya dilakukan oleh layanan cloud milik penyedia browser. |
| Text-to-Speech | Web Speech API (`speechSynthesis`)            | Memilih suara bahasa Indonesia terbaik yang tersedia pada perangkat.                                                    |

Keduanya bukan model AI buatan tim dan tidak memerlukan kunci API.

### 14.3 Penggunaan AI dalam Proses Pengembangan

- Tim memanfaatkan **asisten AI untuk pengembangan** sebagai alat bantu dalam menulis, menyempurnakan, dan men-debug kode.
- **Dokumentasi ini (README)** disusun dengan bantuan **Claude (Anthropic)** berdasarkan hasil analisis isi repositori, kemudian ditinjau oleh tim.
- Seluruh keluaran AI **ditinjau, diuji, dan disetujui oleh anggota tim** sebelum digabungkan ke repositori. Tim bertanggung jawab penuh atas kebenaran, keamanan, dan kualitas hasil akhir.
- Arsitektur sistem, desain alur, skema database, aturan guardrail, serta keputusan produk ditentukan oleh tim.

### 14.4 Data dan Privasi

- Seluruh data pasien, perawat, kamar, dan barang dalam repositori ini adalah **fiktif**, dibuat khusus untuk demonstrasi.
- Tidak ada data pribadi nyata yang dikumpulkan atau diproses.
- Kunci API disimpan pada variabel environment (`.env`) yang dikecualikan dari kontrol versi.
- Untuk penggunaan dengan data nyata, diperlukan penilaian privasi dan kepatuhan terpisah, terutama karena transkrip percakapan dikirim ke layanan AI pihak ketiga.

### 14.5 Pustaka dan Layanan Pihak Ketiga

Lisensi di bawah diverifikasi dari metadata paket resmi. Rujuk berkas lisensi masing-masing proyek sebagai sumber yang mengikat.

**Frontend**

| Komponen                                                           | Fungsi                              | Lisensi    |
| ------------------------------------------------------------------ | ----------------------------------- | ---------- |
| [React](https://react.dev) dan React DOM 18                        | Antarmuka pengguna                  | MIT        |
| [React Router](https://reactrouter.com) 6                          | Navigasi halaman                    | MIT        |
| [Vite](https://vitejs.dev) 5 dan `@vitejs/plugin-react`            | Build tool dan dev server           | MIT        |
| [Tailwind CSS](https://tailwindcss.com) v4 dan `@tailwindcss/vite` | Styling utility-first               | MIT        |
| [TypeScript](https://www.typescriptlang.org) 5                     | Bahasa pemrograman bertipe          | Apache-2.0 |
| [serve](https://github.com/vercel/serve)                           | Menyajikan hasil build di container | MIT        |

**Simulator 3D** (dimuat dari `frontend/public/sim/vendor/`)

| Komponen                             | Fungsi                        | Lisensi |
| ------------------------------------ | ----------------------------- | ------- |
| [Three.js](https://threejs.org) r128 | Render grafis 3D              | MIT     |
| OrbitControls (bagian dari Three.js) | Kontrol kamera putar dan zoom | MIT     |

**Backend dan AI**

| Komponen                                                  | Fungsi                     | Lisensi      |
| --------------------------------------------------------- | -------------------------- | ------------ |
| [Express](https://expressjs.com) 4                        | Framework HTTP             | MIT          |
| [`pg`](https://node-postgres.com)                         | Klien PostgreSQL           | MIT          |
| [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js)        | Hashing kata sandi         | BSD-3-Clause |
| [`cors`](https://github.com/expressjs/cors)               | Pengaturan CORS            | MIT          |
| [`dotenv`](https://github.com/motdotla/dotenv)            | Pembacaan file environment | BSD-2-Clause |
| [`@google/genai`](https://github.com/googleapis/js-genai) | SDK Google Gemini          | Apache-2.0   |

**Infrastruktur dan Layanan**

| Komponen                                                           | Fungsi                        | Catatan                                                   |
| ------------------------------------------------------------------ | ----------------------------- | --------------------------------------------------------- |
| [PostgreSQL](https://www.postgresql.org) 16 (`postgres:16-alpine`) | Database                      | PostgreSQL License                                        |
| [Node.js](https://nodejs.org) 20 (`node:20-alpine`)                | Runtime                       | Image Docker resmi                                        |
| [Docker](https://www.docker.com) dan Docker Compose                | Kontainerisasi                | -                                                         |
| [Google Gemini API](https://ai.google.dev)                         | Layanan AI                    | Tunduk pada syarat penggunaan Google; membutuhkan API key |
| Web Speech API                                                     | Pengenalan dan sintesis suara | Fitur bawaan browser                                      |

**Alat bantu pengujian (opsional, tidak dipakai saat runtime)**

| Komponen                                      | Fungsi                        | Lisensi    |
| --------------------------------------------- | ----------------------------- | ---------- |
| [Playwright](https://playwright.dev) (Python) | Menjalankan `verify_click.py` | Apache-2.0 |

### 14.6 Aset dan Konten

- **Model 3D gelang** dibangun secara prosedural dengan kode (geometri Three.js pada `public/sim/js/hardware/parts/`), tanpa berkas model atau tekstur eksternal.
- Repositori ini **tidak memuat** gambar, berkas font, atau audio berlisensi pihak ketiga. Ikon antarmuka berupa SVG inline. Antarmuka merujuk font _Source Sans 3_ hanya jika terpasang di perangkat pengguna, dengan font sistem sebagai cadangan (tidak ada berkas font yang dibundel atau diunduh).
- Seluruh teks antarmuka, _system prompt_, dan data demo ditulis oleh tim.

---

## 15. Lisensi

Proyek ini dirilis di bawah [Lisensi MIT](LICENSE).

---

<p align="center">
  Dibuat oleh <b>Tim Mie Ayam Kopma</b><br>
  Radhitya Rasta Pramoja · Nicolaus Narindra · Michael Bintang Febryan S.J
</p>
