// ====== ACTIONS: satu fungsi = satu aksi. Tambah aksi baru di sini, lalu ikat ke komponen di CONFIG.bindings ======

// ---- State tombol Jadwal (toggle: klik 1 = mulai, klik lagi = berhenti) ----
// active = true selama jadwal sedang diambil dari server ATAU suaranya sedang dibacakan.
// id     = nomor "sesi"; dinaikkan setiap mulai/berhenti supaya callback sesi lama (fetch / suara) diabaikan.
const sched = { active: false, id: 0, ctrl: null, ledT: null };

function stopSchedule() {
  const was = sched.active;
  sched.id++; // batalkan semua callback sesi sebelumnya
  sched.active = false;
  if (sched.ctrl) {
    sched.ctrl.abort();
    sched.ctrl = null;
  } // batalkan fetch yang masih jalan
  clearTimeout(sched.ledT);
  if (was) {
    try {
      speechSynthesis.cancel();
    } catch (e) {} // hentikan suara
    if (help.s === "idle") setLed("off");
  }
  hide();
}

const Actions = {
  async showSchedule(ctx) {
    if (help.s !== "idle") return;

    // Klik kedua (saat masih loading / masih membacakan) = matikan
    if (sched.active) {
      stopSchedule();
      beep(880, 0.1);
      beep(520, 0.14, "sine", 0.15, 0.1); // bunyi turun = "mati"
      return;
    }

    // Klik pertama = mulai
    const id = ++sched.id;
    sched.active = true;
    sched.ctrl = new AbortController();
    Bus.emit("schedule", {});
    beep(660, 0.12);
    beep(880, 0.15, "sine", 0.15, 0.13);
    setLed("blue", true);
    sched.ledT = setTimeout(() => {
      if (help.s === "idle") setLed("off");
    }, 1800);

    try {
      const res = await fetch(
        CONFIG.storage.url + "/patients/" + CONFIG.patientId,
        { signal: sched.ctrl.signal },
      );
      const data = await res.json();
      if (id !== sched.id) return; // dimatikan selagi menunggu server
      const items = data.todayTasks || [];
      const statusLabel = {
        SCHEDULED: "Belum dilakukan",
        REMINDER_PLAYED: "Sudah diingatkan",
        REPORTED_COMPLETE_BY_PATIENT: "Dilaporkan selesai",
        CONFIRMED_BY_NURSE: "Selesai",
        REJECTED_BY_NURSE: "Ditandai belum selesai",
        MISSED: "Terlewat",
      };
      const html = items.length
        ? '<ul class="sch">' +
          items
            .map(
              (i) =>
                "<li><b>" +
                i.scheduled_time.slice(0, 5) +
                "</b>" +
                i.task_name +
                ' — <span class="mut">' +
                (statusLabel[i.status] || i.status) +
                "</span></li>",
            )
            .join("") +
          "</ul>"
        : '<p class="mut">Tidak ada jadwal untuk hari ini.</p>';
      show("blue", "<h3>Jadwal hari ini</h3>" + html, [
        ["Tutup", stopSchedule],
      ]); // Tutup = hentikan suara juga
      const teks = items.length
        ? "Jadwal hari ini. " +
          items
            .map(
              (i) =>
                "Pukul " +
                i.scheduled_time.slice(0, 5).replace(":", ".") +
                ", " +
                i.task_name,
            )
            .join(". ")
        : "Tidak ada jadwal untuk hari ini.";
      say(teks, () => {
        if (id === sched.id) {
          sched.active = false;
          sched.ctrl = null;
        }
      }); // suara selesai sendiri -> siap diputar ulang
    } catch (err) {
      if (err.name === "AbortError" || id !== sched.id) return; // dibatalkan oleh user, bukan error
      console.error(err);
      sched.active = false;
      sched.ctrl = null;
      show(
        "red",
        '<h3>Jadwal hari ini</h3><p class="mut">Gagal mengambil data dari server.</p>',
        [["Tutup", stopSchedule]],
      );
    }
  },
  startHelp() {
    if (help.s !== "idle") return;
    stopSchedule();
    helpStart();
  }, // matikan suara jadwal dulu supaya tidak tertangkap mic
  testSpeaker() {
    beep(880, 0.15);
    beep(1175, 0.2, "sine", 0.15, 0.16);
  },
  cycleLed() {
    const m = ["blue", "amber", "green", "red"];
    setLed(m[(m.indexOf(ledMode) + 1) % 4], false);
  },
};
