// ====== KONFIGURASI (edit di sini) ======
// patientId & apiDeviceId diisi RUNTIME oleh js/app/patientSelector.js begitu halaman
// dimuat (ambil daftar dari GET /api/devices) dan setiap kali dropdown "Jadi pasien siapa?"
// diganti — supaya satu simulator ini bisa dipakai gantian untuk semua pasien seed.
const CONFIG={
 help:{sendMs:1200,ackMs:1800},
 speak:true,
 bindings:{jadwal:"showSchedule",bantuan:"startHelp",speaker:"testSpeaker",led:"cycleLed"},
 storage:{adapter:"http",url:"http://localhost:4000/api"},
 deviceId:"WB-001",
 patientId:null,
 apiDeviceId:null
};
