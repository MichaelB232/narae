import { pool } from "../db/pool.js";

// Hash bcrypt untuk password "narae123"
const DEMO_PASSWORD_HASH = "$2b$10$3xH801a.AE8//PlHhgUaQ.DFt9r7ggpSaCatBfrm/8LI04uwNZ3jG";

async function syncSequences(client: any) {
  try {
    await client.query(`
      SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
      SELECT setval(pg_get_serial_sequence('patients', 'id'), COALESCE((SELECT MAX(id) FROM patients), 1));
      SELECT setval(pg_get_serial_sequence('devices', 'id'), COALESCE((SELECT MAX(id) FROM devices), 1));
      SELECT setval(pg_get_serial_sequence('patient_tasks', 'id'), COALESCE((SELECT MAX(id) FROM patient_tasks), 1));
      SELECT setval(pg_get_serial_sequence('patient_belongings', 'id'), COALESCE((SELECT MAX(id) FROM patient_belongings), 1));
      SELECT setval(pg_get_serial_sequence('ai_interaction_logs', 'id'), COALESCE((SELECT MAX(id) FROM ai_interaction_logs), 1));
      SELECT setval(pg_get_serial_sequence('help_requests', 'id'), COALESCE((SELECT MAX(id) FROM help_requests), 1));
    `);
  } catch (err) {
    console.warn("Gagal sinkronisasi sequence database:", err);
  }
}

export const demoService = {
  async generateSession(mode: "single" | "multiple" = "single") {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await syncSequences(client);

        // 1. Generate kode acak 4 digit unik, misal: demo.satu.4821 atau demo.banyak.4821
        const randCode = Math.floor(1000 + Math.random() * 9000);
        const prefix = mode === "multiple" ? "demo.banyak" : "demo.satu";
        const username = `${prefix}.${randCode}`;
        const nurseName = mode === "multiple"
          ? `Suster Maya (Demo #${randCode})`
          : `Suster Ayu (Demo #${randCode})`;

        // 2. Buat akun perawat
        const userRes = await client.query(
          `INSERT INTO users (username, hash_password, full_name, role)
           VALUES ($1, $2, $3, 'nurse')
           RETURNING id, username, full_name, role`,
          [username, DEMO_PASSWORD_HASH, nurseName]
        );
        const user = userRes.rows[0];

        if (mode === "single") {
          // ================= SKENARIO 1: 1 Perawat : 1 Pasien (Pak Arthur) =================
          const patientRes = await client.query(
            `INSERT INTO patients (name, date_of_birth, room_number, assigned_nurse_id, preferred_voice_id, clinical_notes)
             VALUES ($1, '1950-11-02', 'Kamar 1108', $2, 1, 'Riwayat tekanan darah tinggi. Jangan beri saran obat apapun — selalu oper ke perawat.')
             RETURNING id`,
            ["Pak Arthur", user.id]
          );
          const patientId = patientRes.rows[0].id;

          const deviceRes = await client.query(
            `INSERT INTO devices (device_uid, patient_id, battery_percentage, is_online, last_synced_at)
             VALUES ($1, $2, 54, true, now())
             RETURNING id`,
            [`NARAE-DEMO-${randCode}`, patientId]
          );
          const deviceId = deviceRes.rows[0].id;

          // Barang
          await client.query(
            `INSERT INTO patient_belongings (patient_id, item_name, last_location, default_location) VALUES
             ($1, 'Dompet',          'Laci meja kerja',          'Laci meja kerja'),
             ($1, 'Jaket wol cokelat', 'Gantungan dekat pintu keluar', 'Lemari pakaian'),
             ($1, 'Obat tetes mata', 'Meja makan',               'Kotak P3K di kamar mandi'),
             ($1, 'Kunci kamar',     'Saku celana abu-abu',      'Meja nakas')`,
            [patientId]
          );

          // Jadwal dinamis
          await client.query(
            `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_time, duration_minutes, status) VALUES
             ($1, $2, 'Obat Tekanan Darah', 'Pak Arthur, waktunya minum obat tekanan darah ya.', 1, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '45 minutes')::time, 15, 'SCHEDULED')`,
            [patientId, user.id]
          );

          await client.query(
            `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, days_of_week, scheduled_time, duration_minutes, status) VALUES
             ($1, $2, 'Fisioterapi Ringan', 'Pak Arthur, waktunya latihan fisioterapi ringan ya.', 1, 'RECURRING', ARRAY[EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Asia/Jakarta'))::smallint, 1, 3, 5], date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '3 hours')::time, 30, 'SCHEDULED')`,
            [patientId, user.id]
          );

          await client.query(
            `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_date, scheduled_time, duration_minutes, status) VALUES
             ($1, $2, 'Kunjungan Dokter',           'Pak Arthur, hari ini ada jadwal bertemu dokter sebentar lagi.', 1, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '1 hour 30 minutes')::time, 60, 'SCHEDULED'),
             ($1, $2, 'Minum Teh Sore Bersama',     'Pak Arthur, waktunya minum teh hangat di teras.', 1, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '4 hours')::time, 20, 'SCHEDULED'),
             ($1, $2, 'Fisioterapi Bahu Mandiri',   'Pak Arthur, besok ada jadwal latihan fisioterapi bahu ya.', 1, 'ONE_TIME', (CURRENT_DATE + interval '1 day')::date, '09:30', 45, 'SCHEDULED'),
             ($1, $2, 'Telepon Anak Bungsu',        'Pak Arthur, besok malam ada jadwal telepon dari anak bungsu.', 1, 'ONE_TIME', (CURRENT_DATE + interval '1 day')::date, '19:00', 30, 'SCHEDULED'),
             ($1, $2, 'Jalan Santai di Taman Lansia', 'Pak Arthur, lusa ada jadwal jalan santai di taman lansia.', 1, 'ONE_TIME', (CURRENT_DATE + interval '2 day')::date, '16:00', 45, 'SCHEDULED')`,
            [patientId, user.id]
          );

          // Riwayat interaksi & panggilan contoh
          const logRes = await client.query(
            `INSERT INTO ai_interaction_logs (patient_id, device_id, patient_speech_transcript, ai_response_text, action_triggered, latency_ms, created_at)
             VALUES ($1, $2, 'Tolong panggilkan suster, saya pusing', 'Baik Pak Arthur, saya sampaikan ke perawat sekarang.', 'escalate_to_nurse', 880, now() - interval '5 minutes')
             RETURNING id`,
            [patientId, deviceId]
          );
          const logId = logRes.rows[0].id;

          await client.query(
            `INSERT INTO help_requests (patient_id, device_id, triggered_by_interaction_id, status, expires_at, created_at)
             VALUES ($1, $2, $3, 'EXPIRED', now() - interval '4 minutes', now() - interval '5 minutes')`,
            [patientId, deviceId, logId]
          );

        } else {
          // ================= SKENARIO 2: 1 Perawat : 3 Pasien (Ibu Odette, Ibu Siti, Pak Herman) =================
          // Pasien 1: Ibu Odette
          const p1Res = await client.query(
            `INSERT INTO patients (name, date_of_birth, room_number, assigned_nurse_id, preferred_voice_id, clinical_notes)
             VALUES ($1, '1958-03-14', 'Kamar 1213', $2, 2, 'Suka dipanggil "Ibu Odette". Riwayat demensia ringan, lebih tenang jika diajak bicara perlahan.')
             RETURNING id`,
            ["Ibu Odette", user.id]
          );
          const p1Id = p1Res.rows[0].id;

          const d1Res = await client.query(
            `INSERT INTO devices (device_uid, patient_id, battery_percentage, is_online, last_synced_at)
             VALUES ($1, $2, 67, true, now())
             RETURNING id`,
            [`NARAE-DEMO-${randCode}-1`, p1Id]
          );
          const d1Id = d1Res.rows[0].id;

          // Pasien 2: Ibu Siti
          const p2Res = await client.query(
            `INSERT INTO patients (name, date_of_birth, room_number, assigned_nurse_id, preferred_voice_id, clinical_notes)
             VALUES ($1, '1949-07-20', 'Kamar 1214', $2, 1, 'Pendengaran agak berkurang, bicara dengan jelas dan tidak terlalu cepat.')
             RETURNING id`,
            ["Ibu Siti", user.id]
          );
          const p2Id = p2Res.rows[0].id;

          await client.query(
            `INSERT INTO devices (device_uid, patient_id, battery_percentage, is_online, last_synced_at)
             VALUES ($1, $2, 81, true, now())`,
            [`NARAE-DEMO-${randCode}-2`, p2Id]
          );

          // Pasien 3: Pak Herman
          const p3Res = await client.query(
            `INSERT INTO patients (name, date_of_birth, room_number, assigned_nurse_id, preferred_voice_id, clinical_notes)
             VALUES ($1, '1952-01-09', 'Kamar 1215', $2, 1, 'Senang bercerita soal cucu-cucunya.')
             RETURNING id`,
            ["Pak Herman", user.id]
          );
          const p3Id = p3Res.rows[0].id;

          await client.query(
            `INSERT INTO devices (device_uid, patient_id, battery_percentage, is_online, last_synced_at)
             VALUES ($1, $2, 23, true, now())`,
            [`NARAE-DEMO-${randCode}-3`, p3Id]
          );

          // Barang Pasien 1 (Ibu Odette)
          await client.query(
            `INSERT INTO patient_belongings (patient_id, item_name, last_location, default_location) VALUES
             ($1, 'Kacamata baca',   'Meja nakas kamar 1213',    'Laci meja nakas'),
             ($1, 'Tongkat jalan',   'Dekat pintu kamar mandi',  'Samping lemari baju'),
             ($1, 'Tas rajut hijau', 'Kursi teras depan',        'Laci meja rias'),
             ($1, 'Cincin giok',     'Kotak perhiasan di meja rias', 'Kotak perhiasan di meja rias'),
             ($1, 'Buku doa',        'Meja santai ruang tamu',   'Rak buku samping kasur')`,
            [p1Id]
          );

          // Barang Pasien 2 & 3
          await client.query(
            `INSERT INTO patient_belongings (patient_id, item_name, last_location, default_location) VALUES
             ($1, 'Alat bantu dengar', 'Meja rias', 'Kotak di laci atas'),
             ($2, 'Foto keluarga', 'Meja nakas kamar 1215', 'Meja nakas kamar 1215')`,
            [p2Id, p3Id]
          );

          // Jadwal Ibu Odette
          await client.query(
            `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_time, duration_minutes, status) VALUES
             ($1, $2, 'Sarapan', 'Ibu Odette, yuk sarapan dulu ya.', 2, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') - interval '3 hours')::time, 30, 'CONFIRMED_BY_NURSE'),
             ($1, $2, 'Latihan Mengingat (Remember Day)', 'Ibu Odette, yuk kita latihan mengingat sebentar.', 2, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') - interval '90 minutes')::time, 30, 'MISSED'),
             ($1, $2, 'Jalan Pagi', 'Ibu Odette, ayo jalan-jalan pagi sebentar di taman.', 2, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') - interval '10 minutes')::time, 30, 'REMINDER_PLAYED'),
             ($1, $2, 'Membaca Buku', 'Ibu Odette, waktunya membaca buku favorit.', 2, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '2 hours')::time, 30, 'SCHEDULED')`,
            [p1Id, user.id]
          );

          await client.query(
            `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_date, scheduled_time, duration_minutes, status) VALUES
             ($1, $2, 'Pemeriksaan Tensi Darah', 'Ibu Odette, suster akan memeriksa tensi darah sebentar ya.', 2, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '30 minutes')::time, 15, 'SCHEDULED'),
             ($1, $2, 'Menyiram Tanaman Bunga', 'Ibu Odette, waktunya menyiram tanaman bunga di beranda.', 2, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '3 hours')::time, 20, 'SCHEDULED'),
             ($1, $2, 'Kontrol Dokter Spesialis Saraf', 'Ibu Odette, besok ada jadwal kontrol ke dokter spesialis saraf.', 2, 'ONE_TIME', (CURRENT_DATE + interval '1 day')::date, '10:00', 60, 'SCHEDULED'),
             ($1, $2, 'Merajut Bersama Suster', 'Ibu Odette, besok sore kita merajut taplak bersama ya.', 2, 'ONE_TIME', (CURRENT_DATE + interval '1 day')::date, '15:00', 40, 'SCHEDULED'),
             ($1, $2, 'Senam Kebugaran Lansia', 'Ibu Odette, lusa ada senam kebugaran di aula serbaguna.', 2, 'ONE_TIME', (CURRENT_DATE + interval '2 day')::date, '08:00', 30, 'SCHEDULED')`,
            [p1Id, user.id]
          );

          // Jadwal Ibu Siti & Pak Herman
          await client.query(
            `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, days_of_week, scheduled_time, duration_minutes, status) VALUES
             ($1, $2, 'Senam Lansia', 'Ibu Siti, yuk ikut senam lansia di aula.', 1, 'RECURRING', ARRAY[EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Asia/Jakarta'))::smallint, 1, 3, 5], date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '1 hour')::time, 30, 'SCHEDULED')`,
            [p2Id, user.id]
          );

          await client.query(
            `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_date, scheduled_time, duration_minutes, status) VALUES
             ($1, $2, 'Panggilan Video Keluarga', 'Pak Herman, sebentar lagi ada panggilan video dari cucu.', 1, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '2 hours')::time, 15, 'SCHEDULED')`,
            [p3Id, user.id]
          );

          // Riwayat & Panggilan contoh Ibu Odette
          const logRes = await client.query(
            `INSERT INTO ai_interaction_logs (patient_id, device_id, patient_speech_transcript, ai_response_text, action_triggered, latency_ms, created_at)
             VALUES ($1, $2, 'Tolong panggilkan suster, saya butuh bantuan', 'Baik, saya sampaikan ke perawat sekarang.', 'escalate_to_nurse', 920, now() - interval '6 minutes')
             RETURNING id`,
            [p1Id, d1Id]
          );
          const logId = logRes.rows[0].id;

          await client.query(
            `INSERT INTO help_requests (patient_id, device_id, triggered_by_interaction_id, status, expires_at, created_at)
             VALUES ($1, $2, $3, 'EXPIRED', now() - interval '5 minutes', now() - interval '6 minutes')`,
            [p1Id, d1Id, logId]
          );
        }

        await client.query("COMMIT");

        const token = Buffer.from(String(user.id)).toString("base64");
        return {
          user,
          token,
          password: "narae123",
          mode,
        };
      } catch (err) {
        await client.query("ROLLBACK");
        if (attempts >= maxAttempts) {
          throw err;
        }
        // Jika gagal karena bentrok race condition, coba lagi di iterasi berikutnya
      } finally {
        client.release();
      }
    }
  },

  async resetSession(userId: number) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await syncSequences(client);

      // Cari semua pasien milik user ini
      const pRes = await client.query(`SELECT id, name FROM patients WHERE assigned_nurse_id = $1 ORDER BY id`, [userId]);
      if (pRes.rows.length === 0) {
        throw new Error("Pasien tidak ditemukan untuk user ini");
      }
      const patientIds = pRes.rows.map((r: any) => r.id);

      // Hapus data transaksional lama milik pasien ini
      await client.query(`DELETE FROM help_requests WHERE patient_id = ANY($1)`, [patientIds]);
      await client.query(`DELETE FROM ai_interaction_logs WHERE patient_id = ANY($1)`, [patientIds]);
      await client.query(`DELETE FROM task_status_history WHERE task_id IN (SELECT id FROM patient_tasks WHERE patient_id = ANY($1))`, [patientIds]);
      await client.query(`DELETE FROM patient_tasks WHERE patient_id = ANY($1)`, [patientIds]);
      await client.query(`DELETE FROM patient_belongings WHERE patient_id = ANY($1)`, [patientIds]);

      const isSingle = patientIds.length === 1;

      if (isSingle) {
        const patientId = patientIds[0];
        // Masukkan ulang barang Pak Arthur
        await client.query(
          `INSERT INTO patient_belongings (patient_id, item_name, last_location, default_location) VALUES
           ($1, 'Dompet',          'Laci meja kerja',          'Laci meja kerja'),
           ($1, 'Jaket wol cokelat', 'Gantungan dekat pintu keluar', 'Lemari pakaian'),
           ($1, 'Obat tetes mata', 'Meja makan',               'Kotak P3K di kamar mandi'),
           ($1, 'Kunci kamar',     'Saku celana abu-abu',      'Meja nakas')`,
          [patientId]
        );

        // Jadwal dinamis
        await client.query(
          `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_time, duration_minutes, status) VALUES
           ($1, $2, 'Obat Tekanan Darah', 'Pak Arthur, waktunya minum obat tekanan darah ya.', 1, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '45 minutes')::time, 15, 'SCHEDULED')`,
          [patientId, userId]
        );

        await client.query(
          `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, days_of_week, scheduled_time, duration_minutes, status) VALUES
           ($1, $2, 'Fisioterapi Ringan', 'Pak Arthur, waktunya latihan fisioterapi ringan ya.', 1, 'RECURRING', ARRAY[EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Asia/Jakarta'))::smallint, 1, 3, 5], date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '3 hours')::time, 30, 'SCHEDULED')`,
          [patientId, userId]
        );

        await client.query(
          `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_date, scheduled_time, duration_minutes, status) VALUES
           ($1, $2, 'Kunjungan Dokter',           'Pak Arthur, hari ini ada jadwal bertemu dokter sebentar lagi.', 1, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '1 hour 30 minutes')::time, 60, 'SCHEDULED'),
           ($1, $2, 'Minum Teh Sore Bersama',     'Pak Arthur, waktunya minum teh hangat di teras.', 1, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '4 hours')::time, 20, 'SCHEDULED'),
           ($1, $2, 'Fisioterapi Bahu Mandiri',   'Pak Arthur, besok ada jadwal latihan fisioterapi bahu ya.', 1, 'ONE_TIME', (CURRENT_DATE + interval '1 day')::date, '09:30', 45, 'SCHEDULED'),
           ($1, $2, 'Telepon Anak Bungsu',        'Pak Arthur, besok malam ada jadwal telepon dari anak bungsu.', 1, 'ONE_TIME', (CURRENT_DATE + interval '1 day')::date, '19:00', 30, 'SCHEDULED'),
           ($1, $2, 'Jalan Santai di Taman Lansia', 'Pak Arthur, lusa ada jadwal jalan santai di taman lansia.', 1, 'ONE_TIME', (CURRENT_DATE + interval '2 day')::date, '16:00', 45, 'SCHEDULED')`,
          [patientId, userId]
        );

        const dRes = await client.query(`SELECT id FROM devices WHERE patient_id = $1`, [patientId]);
        const deviceId = dRes.rows[0]?.id || 1;

        const logRes = await client.query(
          `INSERT INTO ai_interaction_logs (patient_id, device_id, patient_speech_transcript, ai_response_text, action_triggered, latency_ms, created_at)
           VALUES ($1, $2, 'Tolong panggilkan suster, saya pusing', 'Baik Pak Arthur, saya sampaikan ke perawat sekarang.', 'escalate_to_nurse', 880, now() - interval '5 minutes')
           RETURNING id`,
          [patientId, deviceId]
        );
        const logId = logRes.rows[0].id;

        await client.query(
          `INSERT INTO help_requests (patient_id, device_id, triggered_by_interaction_id, status, expires_at, created_at)
           VALUES ($1, $2, $3, 'EXPIRED', now() - interval '4 minutes', now() - interval '5 minutes')`,
          [patientId, deviceId, logId]
        );
      } else {
        // Multi-patient reset
        const p1Id = patientIds[0];
        const p2Id = patientIds[1] || patientIds[0];
        const p3Id = patientIds[2] || patientIds[0];

        // Barang
        await client.query(
          `INSERT INTO patient_belongings (patient_id, item_name, last_location, default_location) VALUES
           ($1, 'Kacamata baca',   'Meja nakas kamar 1213',    'Laci meja nakas'),
           ($1, 'Tongkat jalan',   'Dekat pintu kamar mandi',  'Samping lemari baju'),
           ($1, 'Tas rajut hijau', 'Kursi teras depan',        'Laci meja rias'),
           ($1, 'Cincin giok',     'Kotak perhiasan di meja rias', 'Kotak perhiasan di meja rias'),
           ($1, 'Buku doa',        'Meja santai ruang tamu',   'Rak buku samping kasur')`,
          [p1Id]
        );

        if (patientIds.length > 1) {
          await client.query(
            `INSERT INTO patient_belongings (patient_id, item_name, last_location, default_location) VALUES
             ($1, 'Alat bantu dengar', 'Meja rias', 'Kotak di laci atas'),
             ($2, 'Foto keluarga', 'Meja nakas kamar 1215', 'Meja nakas kamar 1215')`,
            [p2Id, p3Id]
          );
        }

        // Jadwal Ibu Odette
        await client.query(
          `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_time, duration_minutes, status) VALUES
           ($1, $2, 'Sarapan', 'Ibu Odette, yuk sarapan dulu ya.', 2, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') - interval '3 hours')::time, 30, 'CONFIRMED_BY_NURSE'),
           ($1, $2, 'Latihan Mengingat (Remember Day)', 'Ibu Odette, yuk kita latihan mengingat sebentar.', 2, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') - interval '90 minutes')::time, 30, 'MISSED'),
           ($1, $2, 'Jalan Pagi', 'Ibu Odette, ayo jalan-jalan pagi sebentar di taman.', 2, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') - interval '10 minutes')::time, 30, 'REMINDER_PLAYED'),
           ($1, $2, 'Membaca Buku', 'Ibu Odette, waktunya membaca buku favorit.', 2, 'RECURRING', date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '2 hours')::time, 30, 'SCHEDULED')`,
          [p1Id, userId]
        );

        await client.query(
          `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_date, scheduled_time, duration_minutes, status) VALUES
           ($1, $2, 'Pemeriksaan Tensi Darah', 'Ibu Odette, suster akan memeriksa tensi darah sebentar ya.', 2, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '30 minutes')::time, 15, 'SCHEDULED'),
           ($1, $2, 'Menyiram Tanaman Bunga', 'Ibu Odette, waktunya menyiram tanaman bunga di beranda.', 2, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '3 hours')::time, 20, 'SCHEDULED'),
           ($1, $2, 'Kontrol Dokter Spesialis Saraf', 'Ibu Odette, besok ada jadwal kontrol ke dokter spesialis saraf.', 2, 'ONE_TIME', (CURRENT_DATE + interval '1 day')::date, '10:00', 60, 'SCHEDULED'),
           ($1, $2, 'Merajut Bersama Suster', 'Ibu Odette, besok sore kita merajut taplak bersama ya.', 2, 'ONE_TIME', (CURRENT_DATE + interval '1 day')::date, '15:00', 40, 'SCHEDULED'),
           ($1, $2, 'Senam Kebugaran Lansia', 'Ibu Odette, lusa ada senam kebugaran di aula serbaguna.', 2, 'ONE_TIME', (CURRENT_DATE + interval '2 day')::date, '08:00', 30, 'SCHEDULED')`,
          [p1Id, userId]
        );

        if (patientIds.length > 1) {
          await client.query(
            `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, days_of_week, scheduled_time, duration_minutes, status) VALUES
             ($1, $2, 'Senam Lansia', 'Ibu Siti, yuk ikut senam lansia di aula.', 1, 'RECURRING', ARRAY[EXTRACT(ISODOW FROM (now() AT TIME ZONE 'Asia/Jakarta'))::smallint, 1, 3, 5], date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '1 hour')::time, 30, 'SCHEDULED')`,
            [p2Id, userId]
          );

          await client.query(
            `INSERT INTO patient_tasks (patient_id, created_by, task_name, spoken_instruction, voice_profile_id, type, scheduled_date, scheduled_time, duration_minutes, status) VALUES
             ($1, $2, 'Panggilan Video Keluarga', 'Pak Herman, sebentar lagi ada panggilan video dari cucu.', 1, 'ONE_TIME', CURRENT_DATE, date_trunc('minute', (now() AT TIME ZONE 'Asia/Jakarta') + interval '2 hours')::time, 15, 'SCHEDULED')`,
            [p3Id, userId]
          );
        }

        const dRes = await client.query(`SELECT id FROM devices WHERE patient_id = $1`, [p1Id]);
        const deviceId = dRes.rows[0]?.id || 1;

        const logRes = await client.query(
          `INSERT INTO ai_interaction_logs (patient_id, device_id, patient_speech_transcript, ai_response_text, action_triggered, latency_ms, created_at)
           VALUES ($1, $2, 'Tolong panggilkan suster, saya butuh bantuan', 'Baik, saya sampaikan ke perawat sekarang.', 'escalate_to_nurse', 920, now() - interval '6 minutes')
           RETURNING id`,
          [p1Id, deviceId]
        );
        const logId = logRes.rows[0].id;

        await client.query(
          `INSERT INTO help_requests (patient_id, device_id, triggered_by_interaction_id, status, expires_at, created_at)
           VALUES ($1, $2, $3, 'EXPIRED', now() - interval '5 minutes', now() - interval '6 minutes')`,
          [p1Id, deviceId, logId]
        );
      }

      await client.query("COMMIT");
      return { success: true, message: "Data sesi demo berhasil di-reset ke kondisi awal." };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};
