# NARAE — rebuild end-to-end (TypeScript backend berlapis, agent modular, FE React, mic asli)

## Struktur folder

```
narae/
├─ docker-compose.yml       db + backend + frontend
├─ .env.example             isi GEMINI_API_KEY di sini
├─ db/init.sql              schema final + seed 2 skenario akun
├─ backend/                 TypeScript, berlapis: repositories → services → controllers → routes
├─ agent/                   paket TERPISAH dari backend: tools modular + prompt + Gemini client
├─ frontend/                React + Vite + TypeScript, struktur ikut Figma
└─ wearable-sim/             simulator gelang 3D — mic ASLI (Web Speech API), bisa ganti-ganti pasien
```

## 1. Jalankan

```bash
cp .env.example .env
# isi GEMINI_API_KEY di .env (ambil dari https://aistudio.google.com/apikey)

docker compose up --build
```

- Backend: `http://localhost:4000` (cek `curl localhost:4000/api/health`)
- Frontend (dashboard perawat): `http://localhost:5173`
- Simulator gelang: **tidak** didockerkan (perlu akses mikrofon browser di mesin kamu) —
  jalankan manual:
  ```bash
  cd wearable-sim
  npx serve .
  ```
  lalu buka di **Chrome** (Web Speech API paling stabil di Chrome; Safari/Firefox terbatas).

## 2. Akun demo (login di `localhost:5173`)

| Username | Password | Skenario |
|---|---|---|
| `suster.satu` | `narae123` | 1 perawat : **1 pasien** (Pak Arthur) — dashboard fokus ke satu pasien |
| `suster.banyak` | `narae123` | 1 perawat : **3 pasien** (Ibu Odette, Ibu Siti, Pak Herman) — dashboard daftar pasien + antrean panggilan |

Dashboard otomatis pakai layout yang sesuai berdasarkan jumlah pasien milik akun yang login —
bukan dua halaman terpisah yang harus kamu pilih manual.

## 3. Backend — lapisan & endpoint

Tiap fungsi di `services/` dan `controllers/` punya komentar `// -> METHOD /api/...` di baris
pemanggilannya di `routes/*.ts` supaya gampang dilacak nembak ke endpoint apa:

```
repositories/   query SQL mentah, tidak ada logika bisnis
services/       logika bisnis (mis. taskService.confirmByNurse menulis status + audit trail)
controllers/    HTTP in/out, parsing request/response
routes/         pemetaan endpoint, 1 baris = 1 endpoint
```

| Endpoint | Fungsi |
|---|---|
| `POST /api/auth/login` | login, balas `{user, token}` (token demo, lihat batasan di bawah) |
| `GET /api/patients?nurseId=` | daftar pasien milik perawat |
| `GET /api/patients/:id` | profil + jadwal hari ini + barang (konteks closed-world yang sama dipakai AI) |
| `POST /api/tasks` | perawat bikin task baru |
| `POST /api/tasks/:id/report` | pasien lapor task selesai (klaim) |
| `PATCH /api/tasks/:id/confirm` | perawat konfirmasi/tolak (final) |
| `GET /api/tasks/:id/history` | audit trail task |
| `GET /api/help-requests?nurseId=&status=` | antrean panggilan bantuan |
| `POST /api/help-requests` | dipicu **tombol fisik** |
| `PATCH /api/help-requests/:id` | acknowledge / resolve |
| `POST /api/ai/converse` | satu-satunya pintu ke modul `agent/` |
| `GET /api/devices`, `POST /api/devices/:uid/heartbeat` | dipakai simulator |

## 4. Modul `agent/` — terpisah dari backend

```
agent/src/
├─ tools/                 4 tool, masing-masing 1 file + 1 kalimat deskripsi
│  ├─ getTodayTasks.tool.ts       "Mengambil daftar jadwal tugas pasien untuk hari ini..."
│  ├─ getBelongings.tool.ts       "Mencari lokasi terakhir barang milik pasien..."
│  ├─ getCurrentDateTime.tool.ts  "Memberi tahu tanggal dan jam saat ini..."
│  └─ requestNurseCall.tool.ts    "Menandai bahwa pasien secara eksplisit minta..."
├─ prompt/
│  ├─ systemPrompt.ts     ATURAN STATIS (guardrail) — tidak pernah berubah per pasien
│  └─ jitContext.ts       INI bagian JIT / prompt injection — dibangun ulang tiap request,
│                           berisi identitas pasien + catatan perawatan saat itu juga
├─ geminiClient.ts         wrapper tipis ke @google/generative-ai
└─ agent.ts                orchestrator: jalanin tool-calling loop Gemini
```

Ini pakai **real Gemini function-calling** — model memanggil tool kapan dia butuh data (misal
cuma panggil `get_today_tasks` kalau pasien nanya jadwal), bukan semua data di-dump ke prompt
di awal. `agent/` sama sekali tidak tahu soal Postgres — backend (`backend/src/services/ai.service.ts`)
yang menyuntikkan implementasi `AgentDataProvider` (lihat komentar di file itu kenapa didesain begitu).

Escalasi ke `help_requests` HANYA terjadi kalau model memanggil tool `request_nurse_call` —
tidak otomatis terjadi hanya karena AI tidak tahu jawaban (lihat aturan di `systemPrompt.ts`).

## 5. Frontend — dibangun ulang mengikuti screenshot Figma asli (bukan tebakan nama layer)

Revisi ini membangun ulang seluruh UI dari screenshot asli yang kamu kirim (bukan cuma metadata
teks Figma seperti sebelumnya). Palet warna diambil lewat sampling pixel langsung dari
screenshot kamu — lihat `frontend/src/styles/global.css`.

**Halaman & komponen, dipetakan ke setiap screenshot:**
- `pages/BerandaPage.tsx` — dua tampilan (1 pasien / >1 pasien), persis dua varian "Dashboard"
  yang kamu kirim terakhir. Untuk >1 pasien: section "Daftar Pasien" di-skip (sudah ada di tab
  Keluarga), "Jadwal Hari Ini" pakai `PatientSwitcher` (dropdown **dan** panah ‹›, sesuai
  permintaan "both of them"). Teks insight ("Ibu Odette bangun lebih pagi...") sengaja dihapus.
- `pages/KeluargaPage.tsx` — "Daftar Pasien" (untuk akun >1 pasien); akun 1 pasien otomatis
  diarahkan langsung ke `DetailKeluargaPage`, skip daftar.
- `pages/DetailKeluargaPage.tsx` — tab **Aktivitas / Inventori / Riwayat** (Statistik di-skip
  sesuai arahan). Tab Riwayat (log chat AI) **desain baru saya buat sendiri** karena belum ada
  referensinya — tetap pakai tema warna yang sama (card + gelembung chat navy/abu).
- `components/HelpRequestSheet.tsx` — popup panggilan bantuan sebagai **bottom sheet** (slide
  dari bawah), bukan alert dialog, sesuai TBC kamu. **Muncul otomatis** begitu ada panggilan baru
  (tidak perlu diklik dulu), untuk kedua skenario 1 pasien maupun >1 pasien.
- `components/TaskFormSheet.tsx` — gabung 2 alur Figma: Buat Aktivitas (2 langkah: form → "Cek
  AI Voice") dan Edit Aktivitas (field "Alasan Pengubahan" HANYA muncul kalau status benar-benar
  diubah dari nilai semula). Preview suara di langkah "Cek AI Voice" pakai `speechSynthesis`
  browser sebagai mock (belum ada provider TTS asli tersambung).
- `components/BelongingFormSheet.tsx`, `components/ConfirmSheet.tsx` — Tambah/Edit/Hapus Barang
  & Aktivitas, sama persis field-nya dengan screenshot.
- `components/Toast.tsx` — "Aktivitas Berhasil Ditambahkan" dsb.

**Penyesuaian skema kecil yang menyertai ini** (lihat `db/init.sql`):
- `patient_tasks.duration_minutes` ditambahkan (field "Durasi" di form Buat Aktivitas).
- `task_status_history.note` ditambahkan (field "Alasan Pengubahan (Opsional)") — ditaruh di
  tabel riwayat, bukan di `patient_tasks`, karena melekat ke satu perubahan status, bukan ke
  task-nya sendiri.
- Endpoint baru: CRUD penuh `/api/belongings`, `PATCH`/`DELETE /api/tasks/:id`,
  `GET /api/tasks?patientId=` (semua task, bukan cuma hari ini — dipakai "Edit Jadwal Keluarga"),
  `GET /api/ai/history/:patientId` (tab Riwayat).

**Catatan jujur — saya tidak bisa melihat Figma secara visual**, cuma baca screenshot yang kamu
kirim manual. Build React-nya sudah saya `tsc`-compile dan lolos, tapi saya **tidak bisa
screenshot hasilnya sendiri** di sandbox ini (tidak ada browser headless yang bisa diinstal —
diblokir kebijakan jaringan). Jadi tolong jalankan dan bandingkan langsung ke screenshot aslinya —
kalau ada yang meleset (spacing, warna, ukuran), kirim screenshot hasilnya biar saya perbaiki
lagi dengan presisi, sama seperti sesi ini.

Statistik (hitungan tombol 1/2/panggilan) tetap **belum ada** — perlu backend logging tambahan
yang belum kita bangun (lihat diskusi sebelumnya soal tombol 1 tidak menulis ke manapun); ini
konsisten dengan keputusan kamu menyembunyikan tab Statistik di Detail Keluarga untuk sekarang.

## 6. Simulator gelang — mic asli + ganti pasien

- **Mic asli**: `js/hardware/speechInput.js` pakai `SpeechRecognition` browser (`lang: "id-ID"`).
  Browser akan minta izin mikrofon saat pertama kali tombol Bantuan ditekan — izinkan.
  Berjalan di `localhost` tanpa perlu HTTPS (browser menganggap localhost "secure context").
- **Pilih pasien**: dropdown "Jadi pasien siapa?" di panel kanan, di-populate dari
  `GET /api/devices`-nya lewat `GET /api/patients`. Ganti dropdown sebelum tekan Jadwal/Bantuan
  untuk mensimulasikan gelang pasien lain (satu gelang fisik dipakai bergantian).
- Tombol **Jadwal** fetch jadwal asli dari `GET /api/patients/:id` (sumber sama dengan AI & dashboard).
- Tombol **Bantuan** → dengarkan mic → kirim ke `POST /api/ai/converse` → kalau `escalate:true`,
  backend otomatis bikin `help_requests`, langsung muncul di dashboard (polling 4 detik).

## Keterbatasan yang sengaja dibiarkan (demo-grade, bukan production)

- **Auth** cuma `base64(userId)` sebagai "token", backend tidak memvalidasi token di middleware
  manapun (semua route masih terbuka). Untuk production: ganti ke JWT asli + middleware per-route.
- **Text-to-speech** masih `speechSynthesis` browser (suara generik), belum pakai
  `voice_profiles.provider_voice_id` ke provider TTS asli (ElevenLabs/Azure/dsb) — titik integrasi
  jelas ada di `patient_tasks.generated_audio_url` dan respons `/api/ai/converse`, tinggal disambung.
- Statistik, cron `MISSED` otomatis untuk task yang lewat jadwal tanpa laporan, dan halaman
  Keluarga/akun `family` belum diimplementasikan — belum ada endpoint/komponennya.
- Panel "Riwayat aktivitas" bawaan simulator (`wiring.js`) masih mencoba `POST /api/events` yang
  tidak kita buat — gagal diam-diam, tidak mempengaruhi alur utama.
