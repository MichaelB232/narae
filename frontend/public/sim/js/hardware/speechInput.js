// ====== INPUT MIKROFON ASLI (Web Speech API — SpeechRecognition browser) ======
// Dipakai menggantikan window.prompt(): hasil ucapan pasien ditangkap langsung dari
// mikrofon perangkat (laptop/HP) yang menjalankan simulator ini di browser.
// Catatan: speech-to-text browser ini TERPISAH dari speechSynthesis (text-to-speech) yang
// sudah dipakai simulator untuk membacakan jawaban — satu untuk dengar, satu untuk bicara.

const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

function speechInputSupported() {
  return Boolean(SpeechRecognitionImpl);
}

/**
 * Minta izin mikrofon browser & dengarkan satu ucapan pasien.
 * @returns {Promise<string>} transkrip hasil ucapan, atau string kosong kalau dibatalkan/gagal.
 */
function captureSpeech() {
  return new Promise((resolve) => {
    if (!speechInputSupported()) {
      alert("Browser ini tidak mendukung input mikrofon (Web Speech API). Coba pakai Chrome.");
      resolve("");
      return;
    }
    const rec = new SpeechRecognitionImpl();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let settled = false;
    const finish = (text) => {
      if (settled) return;
      settled = true;
      resolve(text);
    };

    rec.onresult = (e) => finish(e.results[0][0].transcript);
    rec.onerror = (e) => {
      console.warn("SpeechRecognition error:", e.error);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        alert("Izin mikrofon belum diberikan. Silakan izinkan akses mikrofon di pengaturan browser Anda.");
      }
      finish("");
    };
    rec.onend = () => finish("");

    try {
      rec.start();
    } catch {
      finish("");
    }
  });
}
