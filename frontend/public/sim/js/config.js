// ====== KONFIGURASI (edit di sini) ======
// patientId & apiDeviceId diisi RUNTIME oleh js/app/patientSelector.js begitu halaman
// dimuat (ambil daftar dari GET /api/devices) dan setiap kali dropdown "Jadi pasien siapa?"
// diganti — supaya satu simulator ini bisa dipakai gantian untuk semua pasien seed.
const CONFIG={
 help:{sendMs:1200,ackMs:1800},
 speak:true,
 hints:{bantuan:"tekan lalu bicara ke NARAE",jadwal:"tekan untuk mendengar jadwal hari ini",speaker:"klik untuk tes suara",led:"klik untuk uji warna lampu"},
 bindings:{jadwal:"showSchedule",bantuan:"startHelp",speaker:"testSpeaker",led:"cycleLed"},
 storage:{adapter:"http",url:new URLSearchParams(location.search).get("api")||"http://localhost:4000/api"},
 deviceId:"WB-001",
 patientId:null,
 apiDeviceId:null
};
