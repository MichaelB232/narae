// ====== ACTIONS: satu fungsi = satu aksi. Tambah aksi baru di sini, lalu ikat ke komponen di CONFIG.bindings ======
const Actions={
  async showSchedule(ctx){
    if(help.s!=="idle")return;
    Bus.emit("schedule",{});beep(660,.12);beep(880,.15,"sine",.15,.13);setLed("blue",true);
    setTimeout(()=>{if(help.s==="idle")setLed("off")},1800);

    try{
      const res=await fetch(CONFIG.storage.url+"/patients/"+CONFIG.patientId);
      const data=await res.json();
      const items=data.todayTasks||[];
      const statusLabel={
        SCHEDULED:"Belum dilakukan",
        REMINDER_PLAYED:"Sudah diingatkan",
        REPORTED_COMPLETE_BY_PATIENT:"Dilaporkan selesai",
        CONFIRMED_BY_NURSE:"Selesai",
        REJECTED_BY_NURSE:"Ditandai belum selesai",
        MISSED:"Terlewat"
      };
      const html=items.length
        ? "<ul class=\"sch\">"+items.map(i=>"<li><b>"+i.scheduled_time.slice(0,5)+"</b>"+i.task_name+" — <span class=\"mut\">"+(statusLabel[i.status]||i.status)+"</span></li>").join("")+"</ul>"
        : "<p class=\"mut\">Tidak ada jadwal untuk hari ini.</p>";
      show("blue","<h3>Jadwal hari ini</h3>"+html,[["Tutup",hide]]);
      say(items.length
        ? "Jadwal hari ini. "+items.map(i=>"Pukul "+i.scheduled_time.slice(0,5).replace(":",".")+", "+i.task_name).join(". ")
        : "Tidak ada jadwal untuk hari ini.");
    }catch(err){
      console.error(err);
      show("red","<h3>Jadwal hari ini</h3><p class=\"mut\">Gagal mengambil data dari server.</p>",[["Tutup",hide]]);
    }
  },
  startHelp(){ if(help.s!=="idle")return; helpStart() },
  testSpeaker(){ beep(880,.15); beep(1175,.2,"sine",.15,.16) },
  cycleLed(){ const m=["blue","amber","green","red"]; setLed(m[(m.indexOf(ledMode)+1)%4],false) }
};
