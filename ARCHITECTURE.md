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

```
┌────────────────────────────────────────────────────────┐
│                   Gemini Model                         │
│               (Function Calling Loop)                  │
└──────────────────────────┬─────────────────────────────┘
                           │ Tool calls & execution
┌──────────────────────────▼─────────────────────────────┐
│                   agent/src/tools/                     │
│  - getPatientTasks        - getCurrentDateTime         │
│  - getBelongings          - requestNurseCall           │
│  - getBelongingsSummary   - reportTaskComplete         │
└──────────────────────────┬─────────────────────────────┘
                           │ AgentDataProvider interface
┌──────────────────────────▼─────────────────────────────┐
│           backend/src/services/ai.service.ts           │
└────────────────────────────────────────────────────────┘
```

### Alur Kerja Agent:
1. **Gemini Function Calling (Tools Modular)**:
   - AI tidak diberikan seluruh data secara mentah (*dumping context*), melainkan memanggil tools yang sesuai saat diperlukan:
     - `get_patient_tasks`: Mengambil seluruh jadwal kegiatan pasien (hari ini dan mendatang) beserta nama tugas, jam mulai, durasi menit, tipe, dan tanggal.
     - `get_belongings_summary`: Mengambil lokasi terakhir barang pasien dan lokasi tempat biasanya disimpan (`default_location`) saat pasien bertanya *"di mana barang saya?"*.
     - `get_belongings`: Mengambil daftar inventori barang-barang yang dimiliki pasien saat bertanya *"barang saya apa saja?"*.
     - `get_current_datetime`: Mengambil jam dan hari terkini dengan konversi waktu **WIB (`Asia/Jakarta`)**.
     - `request_nurse_call`: Meminta bantuan panggilan perawat jika pasien meminta tolong/terdesak secara eksplisit.
     - `report_task_complete`: Mencatat klaim pasien melalui suara bahwa suatu aktivitas telah selesai dilakukan.
2. **System Prompt & Guardrails (`systemPrompt.ts`)**:  
   - Prinsip *Closed-World Assumption* (tidak mengarang fakta di luar data tools).
   - Larangan memberikan instruksi / diagnosa medis secara mandiri (selalu arahkan ke perawat).
   - **Aturan Tugas Spesifik**: Menyebutkan nama tugas, jam mulai, durasi aktivitas, serta penanda waktu relatif (*"hari ini"*, *"besok"*, atau format tanggal jika > 2 hari).
   - **Aturan Tugas Terdekat / Selanjutnya**: Membandingkan jam saat ini via `get_current_datetime` dengan jadwal terdekat yang belum selesai.
   - **Aturan Penjelasan Kemampuan AI**: Menjawab secara ramah dan ringkas (1–2 kalimat) saat pasien bertanya apa yang bisa dibantu tanpa perlu memanggil tool.
   - Output selalu kalimat ramah teks biasa yang siap dibacakan oleh mesin Text-to-Speech (TTS).
3. **Just-In-Time (JIT) Context (`jitContext.ts`)**:
   - Menyuntikkan identitas pasien, nama perawat pendamping, dan catatan perawatan klinis (*clinical notes*) pada setiap sesi percakapan.

---

## 2. Arsitektur Backend (`backend/`)

Backend menggunakan **TypeScript**, **Node.js**, **Express**, dan **PostgreSQL** (`pg` pool) dengan pola arsitektur berlapis:

```
routes/ ──> controllers/ ──> services/ ──> repositories/ ──> PostgreSQL
                                  │
                                  └──> @narae/agent (Gemini Function Calling)
```

### Tanggung Jawab Tiap Lapisan:
- **`repositories/`**: Berisi query SQL mentah menggunakan parameterisasi aman (`$1, $2`).
  - Menghandle evaluasi waktu berbasis **WIB (`Asia/Jakarta`)**.
  - Mengotomatiskan perubahan status menjadi `MISSED` jika tugas melewati durasi waktu (`scheduled_time + duration_minutes`).
  - `findActiveTasks(patientId)`: Memilih seluruh jadwal berulang dan jadwal sekali saja dari hari ini ke depan.
  - Menulis riwayat perubahan status ke tabel audit trail `task_status_history`.
- **`services/`**: Menangani logika bisnis (misal: konfirmasi perawat `confirmByNurse`, koordinasi panggilan `helpRequestService`, dan injeksi data provider `dataProvider` ke agent AI).
- **`controllers/`**: Menangani input HTTP request, validasi payload / ID, dan HTTP status response.
- **`routes/`**: Pemetaan endpoint API terpusat.
- **`utils/date.ts`**: Utilitas modular `formatDate()` yang mengonversi tanggal ke format ISO numerik `YYYY-MM-DD` secara konsisten tanpa terpengaruh pergeseran zona waktu objek JavaScript `Date`.
- **`db/pool.ts`**: Konfigurasi koneksi PostgreSQL dengan type parser kustom (OID 1082) agar tipe SQL `DATE` selalu dibaca sebagai string `"YYYY-MM-DD"`.

---

## 3. Arsitektur Frontend Dashboard Caregiver (`frontend/`)

Frontend dibangun menggunakan **React 18**, **Vite**, **TypeScript**, dan **100% Tailwind CSS v4**:

### Fitur Kunci:
1. **Mockup Mobile Shell & Dark Workbench**:
   - Mockup berbingkai ponsel (`PhoneLayout`) dengan lebar maksimal `430px` di atas latar gelap workbench (`#141820`).
2. **Pilihan Tanggal Fleksibel (`TaskFormSheet`)**:
   - Aktivitas sekali jalan (*appointment*) menggunakan input date `<input type="date" min={todayStr} />` dengan default hari ini dan validasi batas minimal masa depan.
   - Pilihan tipe aktivitas dan waktu pelaksanaan dapat diakses baik pada saat **membuat** maupun **mengedit** aktivitas.
3. **Verifikasi AI Voice**:
   - Menampilkan kartu pemutar audio mock dengan waveform/durasi dan ringkasan jadwal sebelum aktivitas disimpan ke database.
4. **Deteksi Jadwal Bertabrakan (`TaskConflictSheet`)**:
   - Mendeteksi bentrok jadwal antar tugas aktif pasien, menampilkan grid perbandingan 2 kartu, dan opsi geser jam atau nonaktifkan tugas.
5. **Timeline Aktivitas Real-Time**:
   - Visualisasi jadwal harian dengan dot warna status, garis vertikal penghubung, dan tombol aksi cepat konfirmasi laporan perawat.

---

## 4. Simulator Gelang Pendamping 3D (`frontend/public/sim/`)

Simulator berbasis **Three.js** dan Web Speech API yang mensimulasikan gelang fisik wearable:
- Dilayani sebagai berkas statis di `frontend/public/sim/` dan ditampilkan berdampingan dengan dashboard caregiver lewat layout split screen (`SplitLayout.tsx`).
- **Speech-to-Text (STT)**: Menangkap suara asli pengguna melalui mikrofon laptop/HP (`SpeechRecognition`).
- **Text-to-Speech (TTS)**: Memprioritaskan Natural/Neural Voice Bahasa Indonesia.
- **Multi-Turn Conversation**: AI otomatis mendengarkan kembali secara berlanjut sampai pasien mengucapkan kata selesai (*"terima kasih"*, *"cukup"*) atau jeda hening.
- **Dropdown Pasien Dinamis**: Gelang dapat dialihkan antar pasien (Pak Arthur, Ibu Odette, Ibu Siti, Pak Herman) secara langsung.

---

## 5. Skema Relasi Database (`PostgreSQL`)

- `users`: Data perawat / caregiver (akun demo: `suster.satu` & `suster.banyak`).
- `patients`: Data pasien, ruang rawat, perawat penanggung jawab, preferensi suara, dan catatan klinis.
- `patient_belongings`: Barang bawaan pasien beserta `last_location` dan `default_location`.
- `patient_tasks`: Definisi jadwal tugas (`task_name`, `scheduled_time`, `duration_minutes`, `type`, `days_of_week`, `scheduled_date`, `is_active`, `status`).
- `task_status_history`: Audit trail historis perubahan status tugas beserta catatan alasan perawat.
- `ai_interaction_logs`: Log lengkap percakapan antara pasien dan asisten AI.
- `help_requests`: Antrean tiket panggilan darurat ke perawat (`PENDING`, `ACKNOWLEDGED`, `RESOLVED`, `EXPIRED`).
- `devices`: Metadata gelang wearable, persentase baterai, dan status online/offline.

---

## 6. Panduan Prompting untuk AI Coding Assistant

Gunakan format prompt berikut saat meminta AI coding assistant untuk mengembangkan fitur baru:

```markdown
Konteks Project:
Aplikasi NARAE terdiri dari Backend Express + PostgreSQL (zona waktu WIB Asia/Jakarta), Modul Agent Gemini terpisah (@narae/agent), dan Frontend React (Vite + TypeScript + Tailwind CSS v4) dalam mobile shell.

Kebutuhan Fitur:
[Jelaskan kebutuhan baru, misalnya: "Tambahkan filter status X pada tab Y dan endpoint Z"]

Aturan Teknis:
1. Pastikan evaluasi waktu selalu berbasis zona waktu WIB (Asia/Jakarta).
2. Di modul agent/, gunakan tools modular di folder agent/src/tools/ dan perbarui systemPrompt.ts jika ada aturan respon baru.
3. Di backend, pertahankan pola arsitektur berlapis: repository (SQL mentah) -> service -> controller -> route.
4. Di frontend, gunakan utility classes Tailwind CSS v4 yang konsisten dengan tema di index.css.
5. Pastikan semua file TypeScript lolos kompilasi npm run build tanpa error.
```
