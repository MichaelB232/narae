# NARAE — Smart Caregiver & Wearable Companion Rebuild (Full-Stack)

Aplikasi pendamping lansia dan keluarga berbasis AI Agent (Google Gemini Function Calling), backend berlapis (Node.js/Express + TypeScript + PostgreSQL), dan dashboard caregiver (React 18 + Vite + Tailwind CSS v4) dengan simulator gelang 3D interaktif bersuara asli.

---

## Struktur Folder

```
narae/
├─ docker-compose.yml       db (Postgres 16) + backend + frontend
├─ .env.example             template konfigurasi environment
├─ db/
│  ├─ init.sql              schema final + seed skenario akun & jadwal multi-hari
│  └─ seed_additional.sql   skrip seed tambahan untuk inventori & tugas masa depan
├─ backend/                 TypeScript berlapis: routes → controllers → services → repositories → db
│  ├─ src/utils/date.ts     utilitas format tanggal ISO YYYY-MM-DD yang aman
│  └─ src/config/env.ts     konfigurasi environment otomatis
├─ agent/                   paket AI terpisah (@narae/agent): tools modular + prompt + Gemini client
│  ├─ src/tools/            getPatientTasks, getBelongings, getBelongingsSummary, getCurrentDateTime, requestNurseCall, reportTaskComplete
│  └─ src/prompt/           systemPrompt.ts (guardrails & aturan respons) + jitContext.ts
└─ frontend/                React + Vite + TypeScript (Full Tailwind CSS v4)
   ├─ src/components/       BottomSheet, TaskFormSheet, TaskConflictSheet, TaskStatusSheet, dll
   ├─ src/pages/            BerandaPage, DetailKeluargaPage, KeluargaPage, LoginPage, PengaturanPage
   └─ public/sim/           Simulator gelang 3D (Three.js) — input mic asli (Web Speech API)
```

---

## 1. Cara Menjalankan

### Opsi A: Menggunakan Docker Compose (Instan)
```bash
cp .env.example .env
# Isi GEMINI_API_KEY di file .env (ambil dari https://aistudio.google.com/apikey)

docker compose up --build
```
- **Backend API**: `http://localhost:4000` (uji status via `curl http://localhost:4000/api/health`)
- **Frontend Dashboard & Simulator**: `http://localhost:5173` (buka di Google Chrome atau Microsoft Edge untuk dukungan Web Speech API)

### Opsi B: Menjalankan Manual di Terminal Terpisah (Hot Reload Aktif)
Cocok untuk pengembangan cepat frontend dan backend secara independen:

1. **Jalankan Database PostgreSQL**:
   ```bash
   docker compose up db -d
   ```
2. **Terminal 1 — Backend (Port 4000)**:
   ```bash
   cd backend
   npm run build
   npm run dev
   ```
3. **Terminal 2 — Frontend (Port 5173)**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Setiap perubahan kode di `frontend/src/` akan langsung diperbarui di browser seketika (Hot Module Replacement).*

---

## 2. Akun Demo untuk Pengujian (`localhost:5173`)

| Username | Password | Skenario Pengujian |
|---|---|---|
| `suster.satu` | `narae123` | **1 Perawat : 1 Pasien** (Pak Arthur) — dashboard langsung fokus ke satu pasien |
| `suster.banyak` | `narae123` | **1 Perawat : 3 Pasien** (Ibu Odette, Ibu Siti, Pak Herman) — dashboard switcher pasien & antrean panggilan |

---

## 3. Backend — Lapisan & Endpoint Utama

Arsitektur backend memisahkan tanggung jawab secara ketat:
```
routes/ ──> controllers/ ──> services/ ──> repositories/ ──> PostgreSQL
                                  │
                                  └──> @narae/agent (Gemini Function Calling)
```

- **`repositories/`**: Query SQL mentah dengan parameter `$1, $2` yang aman, evaluasi waktu berbasis zona WIB (`Asia/Jakarta`), dan update otomatis status `MISSED`.
- **`services/`**: Logika bisnis, penanganan siklus tugas harian, dan penyuntikan interface `AgentDataProvider` ke modul AI Agent.
- **`controllers/`**: Validasi payload request dan response status HTTP.
- **`routes/`**: Pemetaan rute RESTful.

| Method & Endpoint | Fungsi |
|---|---|
| `POST /api/auth/login` | Autentikasi perawat, mengembalikan data user & token sesi |
| `GET /api/patients?nurseId=` | Mengambil daftar pasien di bawah pendampingan perawat |
| `GET /api/patients/:id` | Detail profil pasien, aktivitas hari ini, inventori, dan catatan klinis |
| `POST /api/tasks` | Membuat jadwal baru (mendukung jadwal berulang atau sekali jalan dengan tanggal fleksibel) |
| `PATCH /api/tasks/:id` | Mengubah jadwal (nama, jam, durasi, status aktif `is_active`, tipe, tanggal `scheduled_date`) |
| `PATCH /api/tasks/:id/confirm` | Konfirmasi perawat (Selesai / Tolak) beserta catatan alasan |
| `POST /api/tasks/:id/report` | Pasien melapor aktivitas selesai via suara (klaim menunggu konfirmasi perawat) |
| `GET /api/help-requests?nurseId=&status=` | Mengambil daftar panggilan bantuan pasien yang menunggu respons |
| `PATCH /api/help-requests/:id` | Mengubah status tiket panggilan (`ACKNOWLEDGED` / `RESOLVED`) |
| `GET /api/belongings?patientId=` | Mengambil daftar barang bawaan pasien |
| `POST /api/belongings` | Menambahkan barang bawaan baru beserta lokasi terakhir dan default |
| `POST /api/ai/converse` | Gerbang percakapan audio/teks dari gelang ke model Gemini AI |

---

## 4. Modul AI Agent (`agent/`)

Modul asisten AI bekerja secara terisolasi dan mandiri (*closed-world*), tidak bergantung langsung pada driver PostgreSQL, melainkan melalui kontrak `AgentDataProvider`.

### Fitur Function Calling Gemini:
1. **`get_patient_tasks`**: Mengambil seluruh daftar kegiatan aktif pasien (hari ini dan hari-hari mendatang) beserta jam mulai, durasi menit, dan tanggalnya.
2. **`get_belongings_summary`**: Mencari letak terakhir barang pasien beserta tempat biasanya ditaruh saat pasien bertanya *"di mana barang saya?"*.
3. **`get_belongings`**: Menyebutkan daftar barang-barang yang dimiliki pasien di database saat bertanya *"barang saya apa saja?"*.
4. **`get_current_datetime`**: Mengetahui jam, hari, dan tanggal saat ini berbasis WIB (`Asia/Jakarta`).
5. **`report_task_complete`**: Mencatat klaim suara pasien bahwa suatu aktivitas telah dilakukan (*"sudah minum obat"*, dsb).
6. **`request_nurse_call`**: Meminta bantuan panggilan darurat perawat hanya jika pasien secara eksplisit meminta tolong.

### Aturan Guardrails AI (`systemPrompt.ts`):
- **Pertanyaan Spesifik Jadwal**: AI menyebutkan nama tugas, jam mulai, durasi aktivitas, dan penanda waktu relatif (*"hari ini"*, *"besok"*, atau format tanggal jika > 2 hari).
- **Pertanyaan Tugas Terdekat / Setelah Ini**: AI mencocokkan waktu sekarang dengan jadwal berikutnya yang belum selesai dan memberitahu pasien kegiatan apa yang paling dekat.
- **Pertanyaan Kemampuan AI**: Saat pasien bertanya *"kamu bisa apa?"* atau *"apa fungsi kamu?"*, AI langsung menjawab ramah dan ringkas dalam 1–2 kalimat tanpa memanggil tool.
- **Larangan Medis**: Tidak memberikan dosis obat, diagnosis, atau anjuran medis independen (selalu diarahkan ke perawat).
- **Format Output**: Selalu teks santai polos yang nyaman dibacakan oleh Text-to-Speech (TTS), tanpa format markdown/JSON.

---

## 5. Frontend — React + Tailwind CSS v4

Frontend dibangun mengikuti desain asli antarmuka mobile shell:
- **100% Tailwind CSS v4 Utility Classes**: Semua styling menggunakan utility class dan token tema `@theme inline` di `src/index.css`.
- **Form Aktivitas Fleksibel (`TaskFormSheet.tsx`)**: Pemilihan waktu untuk aktivitas sekali saja (*appointment*) menggunakan input date native `<input type="date" min={todayStr} />` dengan batas minimal hari ini dan tanggal-tanggal setelahnya.
- **Verifikasi Suara AI**: Setiap pembuatan/perubahan jadwal menyertakan preview audio kartu AI voice dan ringkasan jadwal.
- **Deteksi Jadwal Tabrakan (`TaskConflictSheet.tsx`)**: Otomatis mendeteksi waktu yang bertabrakan antar tugas aktif dan menyediakan solusi geser jam atau nonaktifkan.
- **Tampilan Timeline**: Daftar kegiatan harian divisualisasikan dengan garis vertikal dan dot status indikator real-time.

---

## 6. Simulator Gelang Pendamping 3D (`frontend/public/sim/`)

- Menampilkan gelang fisik 3D menggunakan Three.js.
- **Input Suara Nyata**: Menggunakan Web Speech API (`SpeechRecognition` bahasa Indonesia).
- **Multi-Turn Conversation**: AI otomatis mendengarkan kembali setelah berbicara hingga pasien mengucapkan kata selesai atau hening.
- **Dropdown Pasien Dinamis**: Gelang dapat dialihkan antar profil pasien untuk menguji skenario yang berbeda secara langsung.
