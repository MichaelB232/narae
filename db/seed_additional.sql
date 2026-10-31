-- 1. Tambah Inventory Tambahan (Aman jika dijalankan berulang)
INSERT INTO
    patient_belongings (
        patient_id,
        item_name,
        last_location,
        default_location
    )
SELECT
    1,
    'Jaket wol cokelat',
    'Gantungan dekat pintu keluar',
    'Lemari pakaian'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_belongings
        WHERE
            patient_id = 1
            AND item_name = 'Jaket wol cokelat'
    );

INSERT INTO
    patient_belongings (
        patient_id,
        item_name,
        last_location,
        default_location
    )
SELECT
    1,
    'Obat tetes mata',
    'Meja makan',
    'Kotak P3K di kamar mandi'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_belongings
        WHERE
            patient_id = 1
            AND item_name = 'Obat tetes mata'
    );

INSERT INTO
    patient_belongings (
        patient_id,
        item_name,
        last_location,
        default_location
    )
SELECT
    1,
    'Kunci kamar',
    'Saku celana abu-abu',
    'Meja nakas'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_belongings
        WHERE
            patient_id = 1
            AND item_name = 'Kunci kamar'
    );

INSERT INTO
    patient_belongings (
        patient_id,
        item_name,
        last_location,
        default_location
    )
SELECT
    2,
    'Tas rajut hijau',
    'Kursi teras depan',
    'Laci meja rias'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_belongings
        WHERE
            patient_id = 2
            AND item_name = 'Tas rajut hijau'
    );

INSERT INTO
    patient_belongings (
        patient_id,
        item_name,
        last_location,
        default_location
    )
SELECT
    2,
    'Cincin giok',
    'Kotak perhiasan di meja rias',
    'Kotak perhiasan di meja rias'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_belongings
        WHERE
            patient_id = 2
            AND item_name = 'Cincin giok'
    );

INSERT INTO
    patient_belongings (
        patient_id,
        item_name,
        last_location,
        default_location
    )
SELECT
    2,
    'Buku doa',
    'Meja santai ruang tamu',
    'Rak buku samping kasur'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_belongings
        WHERE
            patient_id = 2
            AND item_name = 'Buku doa'
    );

-- 2. Tambah Task untuk Hari Ini, Besok, Dua Hari Lagi, dan Tiga Hari Lagi
-- HARI INI
INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    1,
    1,
    'Minum Teh Sore Bersama',
    'Pak Arthur, waktunya minum teh sore hangat di teras.',
    1,
    'ONE_TIME',
    CURRENT_DATE,
    '16:30',
    20,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 1
            AND task_name = 'Minum Teh Sore Bersama'
    );

INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    2,
    2,
    'Pemeriksaan Tensi Darah',
    'Ibu Odette, suster akan memeriksa tensi darah sebentar ya.',
    2,
    'ONE_TIME',
    CURRENT_DATE,
    '14:30',
    15,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 2
            AND task_name = 'Pemeriksaan Tensi Darah'
    );

INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    2,
    2,
    'Menyiram Tanaman Bunga',
    'Ibu Odette, waktunya menyiram tanaman bunga di beranda.',
    2,
    'ONE_TIME',
    CURRENT_DATE,
    '16:00',
    20,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 2
            AND task_name = 'Menyiram Tanaman Bunga'
    );

-- BESOK (CURRENT_DATE + 1 day)
INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    1,
    1,
    'Fisioterapi Bahu Mandiri',
    'Pak Arthur, besok ada jadwal latihan fisioterapi bahu ya.',
    1,
    'ONE_TIME',
    CURRENT_DATE + interval '1 day',
    '09:30',
    45,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 1
            AND task_name = 'Fisioterapi Bahu Mandiri'
    );

INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    1,
    1,
    'Telepon Anak Bungsu',
    'Pak Arthur, besok malam ada jadwal telepon dari anak bungsu.',
    1,
    'ONE_TIME',
    CURRENT_DATE + interval '1 day',
    '19:00',
    30,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 1
            AND task_name = 'Telepon Anak Bungsu'
    );

INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    2,
    2,
    'Kontrol Dokter Spesialis Saraf',
    'Ibu Odette, besok ada jadwal kontrol ke dokter spesialis saraf.',
    2,
    'ONE_TIME',
    CURRENT_DATE + interval '1 day',
    '10:00',
    60,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 2
            AND task_name = 'Kontrol Dokter Spesialis Saraf'
    );

INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    2,
    2,
    'Merajut Bersama Suster',
    'Ibu Odette, besok sore kita merajut taplak bersama ya.',
    2,
    'ONE_TIME',
    CURRENT_DATE + interval '1 day',
    '15:00',
    40,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 2
            AND task_name = 'Merajut Bersama Suster'
    );

-- DUA HARI LAGI (CURRENT_DATE + 2 days)
INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    1,
    1,
    'Jalan Santai di Taman Lansia',
    'Pak Arthur, lusa ada jadwal jalan santai di taman lansia.',
    1,
    'ONE_TIME',
    CURRENT_DATE + interval '2 day',
    '16:00',
    45,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 1
            AND task_name = 'Jalan Santai di Taman Lansia'
    );

INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    2,
    2,
    'Senam Kebugaran Lansia',
    'Ibu Odette, lusa ada senam kebugaran di aula serbaguna.',
    2,
    'ONE_TIME',
    CURRENT_DATE + interval '2 day',
    '08:00',
    30,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 2
            AND task_name = 'Senam Kebugaran Lansia'
    );

-- TIGA HARI LAGI (CURRENT_DATE + 3 days) -> Uji penyebutan tanggal spesifik (> 2 hari)
INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    1,
    1,
    'Tes Darah Laboratorium',
    'Pak Arthur, tiga hari lagi ada jadwal tes darah laboratorium pagi.',
    1,
    'ONE_TIME',
    CURRENT_DATE + interval '3 day',
    '07:30',
    20,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 1
            AND task_name = 'Tes Darah Laboratorium'
    );

INSERT INTO
    patient_tasks (
        patient_id,
        created_by,
        task_name,
        spoken_instruction,
        voice_profile_id,
        type,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status
    )
SELECT
    2,
    2,
    'Kunjungan Cucu Tersayang',
    'Ibu Odette, tiga hari lagi cucu tersayang akan datang berkunjung.',
    2,
    'ONE_TIME',
    CURRENT_DATE + interval '3 day',
    '13:30',
    90,
    'SCHEDULED'
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            patient_tasks
        WHERE
            patient_id = 2
            AND task_name = 'Kunjungan Cucu Tersayang'
    );