# Panduan Arsitektur Teknis Sistem NARAE

Dokumen ini menjelaskan struktur arsitektur sistem **NARAE** secara menyeluruh (End-to-End), meliputi:
1. **Modul Asisten AI (`agent/`)**
2. **Backend API & Lapisan Bisnis (`backend/`)**
3. **Frontend Dashboard Caregiver (`frontend/`)**
4. **Simulator Gelang Pendamping 3D (`frontend/public/sim/`)**
5. **Skema Database & Relasi (`db/init.sql`)**
6. **Panduan Prompting untuk AI Coding Assistant**

---

## 1. Arsitektur Modul Asisten AI (`agent/`)

Modul `agent/` dirancang sebagai paket TypeScript terisolasi (*standalone package*). Modul ini **tidak memiliki dependensi langsung ke database Postgres**, melainkan bergantung pada abstraksi interface data provider (`AgentDataProvider`).

### Alur Kerja Agent:
1. **Gemini Function Calling (Tools Modular)**:
   - AI tidak diberikan seluruh data secara mentah (*dumping context*), melainkan memanggil tools yang sesuai saat diperlukan:
     - `get_today_tasks`: Mengambil jadwal tugas pasien hari ini (nama tugas, jam, durasi, status).
     - `get_belongings`: Mengambil lokasi terakhir barang pasien dan lokasi tempat biasanya disimpan (`default_location`).
     - `get_current_datetime`: Mengambil jam dan hari terkini dengan konversi waktu **WIB (`Asia/Jakarta`)**.
     - `request_nurse_call`: Meminta bantuan panggilan perawat jika pasien meminta tolong/terdesak secara eksplisit.
     - `report_task_complete`: Mencatat klaim pasien melalui suara bahwa suatu aktivitas telah selesai dilakukan.
2. **System Prompt & Guardrails**:
   - `agent/src/prompt/systemPrompt.ts` bertindak sebagai batasan statis (*guardrails*):
     - Prinsip *Closed-World Assumption* (tidak mengarang fakta di luar tools).
     - Larangan memberikan instruksi / diagnosa medis secara mandiri.
     - Respons padat, ramah lansia, dan menggunakan Bahasa Indonesia santai (1–2 kalimat).
3. **Just-In-Time (JIT) Context**:
   - `agent/src/prompt/jitContext.ts` menyuntikkan catatan perawatan spesifik (*clinical notes*) per pasien pada setiap interaksi.

---

## 2. Arsitektur Backend (`backend/`)

Backend menggunakan **TypeScript**, **Node.js**, **Express**, dan **PostgreSQL** (`pg` pool) dengan pola arsitektur berlapis:

```
routes/ ──> controllers/ ──> services/ ──> repositories/ ──> PostgreSQL
                                  │
                                  └──> @narae/agent (Gemini Function Calling)
```

### Tanggung Jawab Tiap Lapisan:
- **`repositories/`**: Berisi query SQL mentah menggunakan parameterisasi aman.
  - Menghandle evaluasi waktu berbasis **WIB (`Asia/Jakarta`)**.
  - Mengotomatiskan perubahan status menjadi `MISSED` jika tugas melewati durasi waktu (`scheduled_time + duration_minutes`).
  - Menulis riwayat perubahan status ke tabel audit trail `task_status_history`.
- **`services/`**: Menangani logika bisnis (misal: konfirmasi perawat `confirmByNurse`, koordinasi panggilan `helpRequestService`, dan injeksi data provider `dataProvider` ke agent AI).
- **`controllers/`**: Menangani input HTTP request, validasi payload / ID, dan HTTP status response.
- **`routes/`**: Pemetaan endpoint API terpusat.

### Endpoint Utama:
- `POST /api/auth/login`: Autentikasi perawat.
- `GET /api/patients?nurseId=`: Daftar pasien di bawah tanggung jawab perawat.
- `GET /api/patients/:id`: Detail pasien, jadwal hari ini, dan barang.
- `POST /api/tasks`: Membuat aktivitas baru (mendukung jadwal berulang atau tugas khusus H+1 / Besok).
- `PATCH /api/tasks/:id`: Mengubah detail tugas (nama, jam, durasi, status aktif `is_active`, dan hari).
- `PATCH /api/tasks/:id/confirm`: Perawat mengonfirmasi status (Selesai / Tolak) beserta alasan perubahan.
- `GET /api/help-requests?nurseId=&status=`: Polling antrean panggilan bantuan darurat.
- `PATCH /api/help-requests/:id`: Mengubah status panggilan bantuan (`ACKNOWLEDGED` / `RESOLVED`).
- `POST /api/ai/converse`: Pintu masuk percakapan suara dari gelang ke model Gemini AI.

---

## 3. Arsitektur Frontend Dashboard Caregiver (`frontend/`)

Frontend dibangun menggunakan **React 18**, **Vite**, dan **TypeScript**, dioptimalkan dalam mockup shell mobile (`PhoneLayout`):

### Fitur Kunci:
1. **Dark Frame / Workbench**:
   - Background luar frame HP berwarna gelap (`#141820`) dengan aksen bayangan halus agar nyaman di mata saat pengujian.
2. **Alur Cek AI Voice (Preview Suara)**:
   - Sesuai Figma, setiap kali perawat membuat atau mengedit tugas, terdapat langkah verifikasi audio dengan audio card player dan ringkasan jadwal.
   - Tombol *Simpan Aktivitas* dapat ditekan sewaktu-waktu tanpa harus menunggu audio selesai diputar.
3. **Pemisahan Edit Tugas & Update Status**:
   - Tombol **Edit**: Membuka `TaskFormSheet` untuk mengubah nama tugas, jam WIB, durasi, tipe jadwal, dan switch aktif/nonaktif.
   - Tombol **Update Status**: Membuka `TaskStatusSheet` langsung untuk memperbarui status (Selesai / Belum Selesai) beserta field *Alasan Pengubahan (Opsional)* tanpa harus melalui preview suara.
4. **Deteksi Jadwal Bertabrakan (`TaskConflictSheet`)**:
   - Jika jam yang dipilih bertabrakan dengan jadwal aktif lain milik pasien, muncul popup bottom-sheet menampilkan perbandingan 2 kartu:
     - Kartu 1: Aktivitas baru yang sedang dibuat.
     - Kartu 2: Aktivitas eksisting yang bertabrakan.
   - Perawat dapat menggeser jam secara inline, menonaktifkan tugas berulang (*switch recurring*), atau menghapus appointment (*one-time*).
5. **Persetujuan Laporan Suara AI Pasien**:
   - Jika pasien melapor telah menyelesaikan tugas via suara gelang, kartu tugas muncul dengan label **Menunggu Persetujuan Caregiver** beserta tombol aksi cepat `✓ Setujui Selesai` dan `✕ Tolak`.

---

## 4. Simulator Gelang Pendamping 3D (`frontend/public/sim/`)

Simulator berbasis **Three.js** dan Web Speech API yang mensimulasikan gelang fisik wearable. Ia dilayani sebagai berkas statis dan ditampilkan di kolom kiri halaman lewat `<iframe src="/sim/index.html?embed=1&api=...">` (`SimPane.tsx`, dibungkus `SplitLayout.tsx`); dashboard di kolom kanan. Keduanya tidak saling memanggil: simulator menulis lewat backend, dashboard membaca lewat polling `GET /api/help-requests`.
- **Speech-to-Text (STT)**: Menangkap suara asli pengguna melalui mikrofon laptop/HP (`SpeechRecognition`).
- **Text-to-Speech (TTS)**: Memprioritaskan *Neural/Natural Voice* Bahasa Indonesia (misal: *Microsoft Gadis Natural* pada Microsoft Edge atau Google Indonesian Voice pada Chrome).
- **Multi-Turn Conversation**: Setelah menjawab, simulator otomatis mendengarkan kembali secara berlanjut sampai pasien mengucapkan kata selesai (*"terima kasih"*, *"cukup"*, dsb.) atau hening selama beberapa detik.
- **Dropdown Pasien Dinamis**: Satu gelang dapat digunakan bergantian untuk menguji profil pasien mana pun.

---

## 5. Skema Relasi Database (`PostgreSQL`)

- `users`: Data perawat / caregiver.
- `patients`: Data pasien, ruang rawat, perawat penanggung jawab, preferensi suara, dan catatan klinis.
- `patient_belongings`: Barang bawaan pasien beserta `last_location` dan `default_location`.
- `patient_tasks`: Definisi jadwal tugas (`task_name`, `scheduled_time`, `duration_minutes`, `type`, `days_of_week`, `scheduled_date`, `is_active`, `status`).
- `task_status_history`: Audit trail historis perubahan status tugas beserta catatan alasan perawat.
- `ai_interaction_logs`: Log lengkap percakapan antara pasien dan asisten AI.
- `help_requests`: Antrean tiket panggilan darurat ke perawat (`PENDING`, `ACKNOWLEDGED`, `RESOLVED`, `EXPIRED`).
- `devices`: Metadata gelang wearable, persentase baterai, dan status online/offline.

---

## 6. Contoh Panduan Prompting untuk AI Assistant / Rekan Tim

Gunakan format prompt berikut saat meminta AI coding assistant untuk mengembangkan fitur baru:

```markdown
Konteks Project:
Aplikasi NARAE terdiri dari Backend Express + PostgreSQL (WIB Asia/Jakarta), Modul Agent Gemini terpisah (@narae/agent), dan Frontend React (Vite + TypeScript) dengan mockup mobile shell.

Kebutuhan Fitur:
[Jelaskan kebutuhan baru, misalnya: "Tambahkan fitur X pada endpoint Y dan tampilan di sheet Z"]

Aturan Teknis:
1. Pastikan waktu selalu berbasis zona waktu WIB (Asia/Jakarta).
2. Di modul agent/, gunakan pola tools modular di folder agent/src/tools/ dan daftarkan di index.ts.
3. Di backend, pertahankan pola arsitektur berlapis: repository (SQL mentah) -> service -> controller -> route.
4. Di frontend, gunakan token warna yang ada di global.css (--navy, --sage, --rose, dll.) dan gunakan komponen BottomSheet untuk pop-up.
5. Pastikan semua file TypeScript lolos typechecking tanpa error sintaksis.
```
