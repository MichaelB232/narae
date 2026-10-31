-- =====================================================================
-- NARAE — schema final (hasil seluruh diskusi desain) + seed 2 skenario akun
-- =====================================================================

CREATE TYPE user_role       AS ENUM ('nurse', 'family');
CREATE TYPE task_type       AS ENUM ('RECURRING', 'ONE_TIME');
CREATE TYPE task_status     AS ENUM (
  'SCHEDULED',
  'REMINDER_PLAYED',
  'REPORTED_COMPLETE_BY_PATIENT',
  'CONFIRMED_BY_NURSE',
  'REJECTED_BY_NURSE',
  'MISSED'
);
CREATE TYPE request_status  AS ENUM ('PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED');

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  username      VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE,
  hash_password VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'nurse',
  phone_number  VARCHAR(30),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE voice_profiles (
  id                 BIGSERIAL PRIMARY KEY,
  name               VARCHAR(255) NOT NULL,
  provider_voice_id  VARCHAR(255) NOT NULL,
  sample_audio_url   VARCHAR(500),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patients (
  id                  BIGSERIAL PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  date_of_birth       DATE,
  room_number         VARCHAR(50),
  assigned_nurse_id   BIGINT REFERENCES users(id),
  preferred_voice_id  BIGINT REFERENCES voice_profiles(id),
  clinical_notes      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devices (
  id                  BIGSERIAL PRIMARY KEY,
  device_uid          VARCHAR(100) UNIQUE NOT NULL,
  patient_id          BIGINT UNIQUE REFERENCES patients(id),
  battery_percentage  INT NOT NULL DEFAULT 100,
  is_online           BOOLEAN NOT NULL DEFAULT false,
  last_synced_at      TIMESTAMPTZ
);

CREATE TABLE patient_belongings (
  id                BIGSERIAL PRIMARY KEY,
  patient_id        BIGINT NOT NULL REFERENCES patients(id),
  item_name         VARCHAR(255) NOT NULL,
  last_location     VARCHAR(255) NOT NULL,
  default_location  VARCHAR(255),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patient_tasks (
  id                   BIGSERIAL PRIMARY KEY,
  patient_id           BIGINT NOT NULL REFERENCES patients(id),
  created_by           BIGINT NOT NULL REFERENCES users(id),

  task_name            VARCHAR(255) NOT NULL,
  spoken_instruction   TEXT NOT NULL,
  voice_profile_id     BIGINT REFERENCES voice_profiles(id),
  generated_audio_url  VARCHAR(500),

  type                 task_type NOT NULL DEFAULT 'RECURRING',
  days_of_week         SMALLINT[],
  scheduled_time       TIME NOT NULL,
  duration_minutes     INT NOT NULL DEFAULT 15,
  scheduled_date       DATE,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  status               task_status NOT NULL DEFAULT 'SCHEDULED',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_one_time_has_date
    CHECK (type = 'RECURRING' OR scheduled_date IS NOT NULL)
);

CREATE TABLE task_status_history (
  id                  BIGSERIAL PRIMARY KEY,
  task_id             BIGINT NOT NULL REFERENCES patient_tasks(id),
  old_status          task_status,
  new_status          task_status NOT NULL,
  changed_by          BIGINT REFERENCES users(id),
  changed_by_patient  BOOLEAN NOT NULL DEFAULT false,
  -- "Alasan Pengubahan (Opsional)" di form edit perawat — ditaruh di sini (bukan kolom
  -- terpisah di patient_tasks) karena ini melekat ke SATU perubahan status, bukan ke task
  -- itu sendiri; cocok dengan fungsi tabel ini sebagai audit trail.
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_interaction_logs (
  id                        BIGSERIAL PRIMARY KEY,
  patient_id                BIGINT NOT NULL REFERENCES patients(id),
  device_id                 BIGINT NOT NULL REFERENCES devices(id),
  patient_speech_transcript TEXT NOT NULL,
  ai_response_text          TEXT NOT NULL,
  action_triggered          VARCHAR(50),
  latency_ms                INT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE help_requests (
  id                           BIGSERIAL PRIMARY KEY,
  patient_id                   BIGINT NOT NULL REFERENCES patients(id),
  device_id                    BIGINT NOT NULL REFERENCES devices(id),
  triggered_by_interaction_id  BIGINT REFERENCES ai_interaction_logs(id),
  status                       request_status NOT NULL DEFAULT 'PENDING',
  expires_at                   TIMESTAMPTZ NOT NULL,
  resolved_at                  TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_patient      ON patient_tasks(patient_id);
CREATE INDEX idx_belongings_patient ON patient_belongings(patient_id);
CREATE INDEX idx_help_patient       ON help_requests(patient_id);
CREATE INDEX idx_help_status        ON help_requests(status);
CREATE INDEX idx_ai_logs_patient    ON ai_interaction_logs(patient_id);

-- =====================================================================
-- SEED — 2 skenario akun perawat yang kamu minta
--   user id 1 "suster.satu"  -> 1 perawat : 1 pasien
--   user id 2 "suster.banyak" -> 1 perawat : 3 pasien
-- password seed semua "narae123" (bcrypt hash di bawah), ganti setelah demo.
-- =====================================================================

-- password untuk kedua akun seed ini: "narae123" (ganti setelah demo)
INSERT INTO users (id, username, email, hash_password, full_name, role, phone_number) VALUES
  (1, 'suster.satu',   'satu@narae.id',   '$2b$10$3xH801a.AE8//PlHhgUaQ.DFt9r7ggpSaCatBfrm/8LI04uwNZ3jG', 'Suster Ayu (1 pasien)', 'nurse', '081200000001'),
  (2, 'suster.banyak', 'banyak@narae.id', '$2b$10$3xH801a.AE8//PlHhgUaQ.DFt9r7ggpSaCatBfrm/8LI04uwNZ3jG', 'Suster Maya (banyak pasien)', 'nurse', '081200000002');

INSERT INTO voice_profiles (id, name, provider_voice_id, sample_audio_url) VALUES
  (1, 'Default — AI Lembut', 'gemini-tts-default-id', NULL),
  (2, 'Kloning Suara Suster Maya', 'gemini-tts-maya-clone-id', NULL);

-- Pasien milik suster.satu (skenario 1:1)
INSERT INTO patients (id, name, date_of_birth, room_number, assigned_nurse_id, preferred_voice_id, clinical_notes) VALUES
  (1, 'Pak Arthur', '1950-11-02', 'Kamar 1108', 1, 1, 'Riwayat tekanan darah tinggi. Jangan beri saran obat apapun — selalu oper ke perawat.');

-- Pasien milik suster.banyak (skenario 1:banyak)
INSERT INTO patients (id, name, date_of_birth, room_number, assigned_nurse_id, preferred_voice_id, clinical_notes) VALUES
  (2, 'Ibu Odette', '1958-03-14', 'Kamar 1213', 2, 2, 'Suka dipanggil "Ibu Odette". Riwayat demensia ringan, lebih tenang kalau diajak bicara pelan-pelan.'),
  (3, 'Ibu Siti',   '1949-07-20', 'Kamar 1214', 2, 1, 'Pendengaran agak berkurang, bicara dengan jelas dan tidak terlalu cepat.'),
  (4, 'Pak Herman', '1952-01-09', 'Kamar 1215', 2, 1, 'Senang bercerita soal cucu-cucunya.');

INSERT INTO devices (id, device_uid, patient_id, battery_percentage, is_online, last_synced_at) VALUES
  (1, 'NARAE-BR-001', 1, 54, true, now()),
  (2, 'NARAE-BR-002', 2, 67, true, now()),
  (3, 'NARAE-BR-003', 3, 81, true, now()),
  (4, 'NARAE-BR-004', 4, 23, true, now());

INSERT INTO patient_belongings (patient_id, item_name, last_location, default_location) VALUES
  (1, 'Dompet',          'Laci meja kerja',          'Laci meja kerja'),
  (1, 'Jaket wol cokelat', 'Gantungan dekat pintu keluar', 'Lemari pakaian'),
  (1, 'Obat tetes mata', 'Meja makan',               'Kotak P3K di kamar mandi'),
  (1, 'Kunci kamar',     'Saku celana abu-abu',      'Meja nakas'),
  (2, 'Kacamata baca',   'Meja nakas kamar 1213',    'Laci meja nakas'),
  (2, 'Tongkat jalan',   'Dekat pintu kamar mandi',  'Samping lemari baju'),
  (2, 'Tas rajut hijau', 'Kursi teras depan',        'Laci meja rias'),
  (2, 'Cincin giok',     'Kotak perhiasan di meja rias', 'Kotak perhiasan di meja rias'),
  (2, 'Buku doa',        'Meja santai ruang tamu',   'Rak buku samping kasur'),
  (3, 'Alat bantu dengar','Meja rias',               'Kotak di laci atas'),
  (4, 'Foto keluarga',   'Meja nakas kamar 1215',    'Meja nakas kamar 1215');

-- Task harian (RECURRING setiap hari, tanpa days_of_week)
INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_time, duration_minutes, status) VALUES
  (1, 1, 'Obat Tekanan Darah', 'Pak Arthur, waktunya minum obat tekanan darah ya.', 1, 'RECURRING', '08:00', 10, 'SCHEDULED'),
  (2, 2, 'Sarapan',            'Ibu Odette, yuk sarapan dulu ya.', 2, 'RECURRING', '08:00', 30, 'CONFIRMED_BY_NURSE'),
  (2, 2, 'Latihan Mengingat (Remember Day)', 'Ibu Odette, yuk kita latihan mengingat sebentar.', 2, 'RECURRING', '08:30', 30, 'MISSED'),
  (2, 2, 'Jalan Pagi',         'Ibu Odette, ayo jalan-jalan pagi sebentar di taman.', 2, 'RECURRING', '10:00', 30, 'REMINDER_PLAYED'),
  (2, 2, 'Membaca Buku',       'Ibu Odette, waktunya membaca buku favorit.', 2, 'RECURRING', '11:30', 30, 'SCHEDULED');

-- Task berulang Senin/Rabu/Jumat saja
INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, days_of_week, scheduled_time, duration_minutes, status) VALUES
  (1, 1, 'Fisioterapi Ringan', 'Pak Arthur, waktunya latihan fisioterapi ringan ya.', 1, 'RECURRING', '{1,3,5}', '10:00', 30, 'SCHEDULED'),
  (3, 2, 'Senam Lansia',       'Ibu Siti, yuk ikut senam lansia di aula.', 1, 'RECURRING', '{1,3,5}', '07:30', 30, 'SCHEDULED');

-- Contoh riwayat interaksi AI (untuk tab "Riwayat" di Detail Keluarga)
INSERT INTO ai_interaction_logs (patient_id, device_id, patient_speech_transcript, ai_response_text, action_triggered, latency_ms, created_at) VALUES
  (2, 2, 'Jam berapa sekarang?', 'Sekarang pukul 09 lewat 12 menit, hari Senin.', 'none', 820, now() - interval '3 hours'),
  (2, 2, 'Kacamata saya dimana?', 'Kacamata baca Ibu Odette terakhir terlihat di meja nakas kamar 1213.', 'none', 760, now() - interval '5 hours');

-- Task ONE_TIME hari ini, besok, dua hari lagi, dan tiga hari lagi (untuk uji AI Agent)
INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_date, scheduled_time, duration_minutes, status) VALUES
  -- Hari Ini (CURRENT_DATE)
  (1, 1, 'Kunjungan Dokter',           'Pak Arthur, hari ini ada jadwal bertemu dokter jam 2 siang.', 1, 'ONE_TIME', CURRENT_DATE, '14:00', 60, 'SCHEDULED'),
  (1, 1, 'Minum Teh Sore Bersama',     'Pak Arthur, waktunya minum teh sore hangat di teras.', 1, 'ONE_TIME', CURRENT_DATE, '16:30', 20, 'SCHEDULED'),
  (2, 2, 'Pemeriksaan Tensi Darah',    'Ibu Odette, suster akan memeriksa tensi darah sebentar ya.', 2, 'ONE_TIME', CURRENT_DATE, '14:30', 15, 'SCHEDULED'),
  (2, 2, 'Menyiram Tanaman Bunga',     'Ibu Odette, waktunya menyiram tanaman bunga di beranda.', 2, 'ONE_TIME', CURRENT_DATE, '16:00', 20, 'SCHEDULED'),
  (4, 2, 'Panggilan Video Keluarga',   'Pak Herman, sebentar lagi ada panggilan video dari cucu.', 1, 'ONE_TIME', CURRENT_DATE, '16:00', 15, 'SCHEDULED'),

  -- Besok (CURRENT_DATE + 1)
  (1, 1, 'Fisioterapi Bahu Mandiri',   'Pak Arthur, besok ada jadwal latihan fisioterapi bahu ya.', 1, 'ONE_TIME', CURRENT_DATE + interval '1 day', '09:30', 45, 'SCHEDULED'),
  (1, 1, 'Telepon Anak Bungsu',        'Pak Arthur, besok malam ada jadwal telepon dari anak bungsu.', 1, 'ONE_TIME', CURRENT_DATE + interval '1 day', '19:00', 30, 'SCHEDULED'),
  (2, 2, 'Kontrol Dokter Spesialis Saraf', 'Ibu Odette, besok ada jadwal kontrol ke dokter spesialis saraf.', 2, 'ONE_TIME', CURRENT_DATE + interval '1 day', '10:00', 60, 'SCHEDULED'),
  (2, 2, 'Merajut Bersama Suster',     'Ibu Odette, besok sore kita merajut taplak bersama ya.', 2, 'ONE_TIME', CURRENT_DATE + interval '1 day', '15:00', 40, 'SCHEDULED'),

  -- Dua Hari Lagi (CURRENT_DATE + 2)
  (1, 1, 'Jalan Santai di Taman Lansia', 'Pak Arthur, lusa ada jadwal jalan santai di taman lansia.', 1, 'ONE_TIME', CURRENT_DATE + interval '2 day', '16:00', 45, 'SCHEDULED'),
  (2, 2, 'Senam Kebugaran Lansia',     'Ibu Odette, lusa ada senam kebugaran di aula serbaguna.', 2, 'ONE_TIME', CURRENT_DATE + interval '2 day', '08:00', 30, 'SCHEDULED'),

  -- Tiga Hari Lagi (CURRENT_DATE + 3) (lebih dari 2 hari -> AI sebut tanggal)
  (1, 1, 'Tes Darah Laboratorium',     'Pak Arthur, tiga hari lagi ada jadwal tes darah laboratorium pagi.', 1, 'ONE_TIME', CURRENT_DATE + interval '3 day', '07:30', 20, 'SCHEDULED'),
  (2, 2, 'Kunjungan Cucu Tersayang',   'Ibu Odette, tiga hari lagi cucu tersayang akan datang berkunjung.', 2, 'ONE_TIME', CURRENT_DATE + interval '3 day', '13:30', 90, 'SCHEDULED');

-- Contoh panggilan bantuan aktif (untuk demo bottom sheet "Panggilan Menunggu Respons")
INSERT INTO ai_interaction_logs (patient_id, device_id, patient_speech_transcript, ai_response_text, action_triggered, latency_ms, created_at) VALUES
  (2, 2, 'Tolong panggilkan suster, saya butuh bantuan', 'Baik, saya sampaikan ke perawat sekarang.', 'escalate_to_nurse', 900, now() - interval '4 minutes');

INSERT INTO help_requests (patient_id, device_id, triggered_by_interaction_id, status, expires_at, created_at)
SELECT 2, 2, id, 'PENDING', now() + interval '11 minutes', now() - interval '4 minutes'
FROM ai_interaction_logs
WHERE patient_id = 2 AND patient_speech_transcript LIKE 'Tolong panggilkan suster%'
ORDER BY id DESC LIMIT 1;
