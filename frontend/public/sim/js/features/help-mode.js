// ====== HELP MODE (mic asli via Web Speech API + backend asli: Gemini AI + help_requests) ======
const help={s:"idle",t:[]};
const later=(f,ms)=>help.t.push(setTimeout(f,ms)),clr=()=>{help.t.forEach(clearTimeout);help.t=[]};

function helpView(extraText){
  const s=help.s;Bus.emit("help",s);
  const T={
    listening:["blue","Mendengarkan…","Silakan bicara sekarang."],
    thinking:["amber","Memproses…","NARAE sedang memikirkan jawabannya."],
    answered:["blue","NARAE menjawab",extraText||""],
    sending:["amber","Mengirim permintaan bantuan…",extraText||"Menghubungi perawat..."],
    sent:["amber","Menghubungi Perawat",extraText||"Menunggu respons perawat…"],
    ok:["green","Bantuan diterima",extraText||"Perawat sedang dalam perjalanan."],
    fail:["red","Panggilan belum terjawab",extraText||"Perawat belum dapat dihubungi."],
    "no-speech":["red","Tidak terdengar","Coba tekan Bantuan lagi dan bicara lebih jelas."]
  }[s];
  const ch=(n,c)=>'<span class="chip '+(c||"")+'">'+n+"</span>",
    chips=ch("Mikrofon",micOn?"blu":"")+ch("Dikirim",s==="sending"||s==="sent"?"amb":s==="ok"?"grn":"")+ch("Diterima",s==="ok"?"grn":"")+ch("Gagal",s==="fail"?"red":""),
    A={
      listening:[["Batalkan",helpEnd,"ghost"]],
      thinking:[["Batalkan",helpEnd,"ghost"]],
      answered:[["Tutup",helpEnd]],
      sending:[["Batalkan",helpEnd,"ghost"]],
      sent:[["Batalkan",helpEnd,"ghost"]],
      ok:[["Selesai",helpEnd]],
      fail:[["Coba lagi",helpStart],["Tutup",helpEnd,"ghost"]],
      "no-speech":[["Coba lagi",helpStart],["Tutup",helpEnd,"ghost"]]
    }[s];
  show(T[0],'<h3>Help Mode</h3><p class="big">'+T[1]+'</p><p class="mut">'+T[2]+'</p><div class="chips">'+chips+"</div>",A);
}

function isExitPhrase(txt){
  if(!txt)return false;
  const t=txt.toLowerCase().trim();
  const keywords=["makasi","makasih","terima kasih","cukup","udah itu aja","tutup","bye","that's all","tyty","tidak ada lagi","nggak ada lagi","gak ada lagi","sampai jumpa","keluar"];
  return keywords.some(k=>t.includes(k));
}

let converseTurnCount = 0;

function waitForNurseResponse(requestId){
  let timeLeft = 10;
  help.s = "sent";
  setLed("amber", true);

  function updateStatus(sec){
    helpView("Menghubungi perawat... Menunggu konfirmasi (" + sec + " detik)");
  }
  updateStatus(timeLeft);

  const pollInterval = setInterval(async () => {
    timeLeft--;
    if (help.s === "idle") {
      clearInterval(pollInterval);
      return;
    }

    if (requestId) {
      try {
        const res = await fetch(CONFIG.storage.url + "/help-requests/" + requestId);
        if (res.ok) {
          const reqData = await res.json();
          if (reqData.status === "ACKNOWLEDGED") {
            clearInterval(pollInterval);
            help.s = "ok";
            micOn = false;
            setLed("green", false);
            [660, 880, 1100].forEach((f, i) => beep(f, .14, "sine", .12, i * .13));
            const msg = "Perawat sudah menerima panggilan dan sedang dalam perjalanan. Mohon tunggu sebentar ya.";
            helpView(msg);
            say(msg, () => {
              later(() => helpEnd(), 3500);
            });
            return;
          } else if (reqData.status === "EXPIRED" || reqData.status === "RESOLVED") {
            clearInterval(pollInterval);
            help.s = "fail";
            micOn = false;
            setLed("red", true);
            beep(180, .5, "sawtooth", .1);
            const msg = "Maaf, perawat sedang tidak dapat dihubungi. Panggilan telah dicatat di sistem sebagai pesan penting.";
            helpView(msg);
            say(msg, () => later(() => helpEnd(), 3500));
            return;
          }
        }
      } catch (err) {
        console.warn("Poll help request failed:", err);
      }
    }

    if (timeLeft <= 0) {
      clearInterval(pollInterval);
      if (requestId) {
        fetch(CONFIG.storage.url + "/help-requests/" + requestId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "EXPIRED" })
        }).catch(() => {});
      }
      help.s = "fail";
      micOn = false;
      setLed("red", true);
      beep(180, .5, "sawtooth", .1);
      const msg = "Maaf, perawat sedang tidak dapat dihubungi. Panggilan telah dicatat di sistem sebagai pesan penting.";
      helpView(msg);
      say(msg, () => later(() => helpEnd(), 3500));
    } else {
      updateStatus(timeLeft);
    }
  }, 1000);

  help.t.push(pollInterval);
}

async function runConverseTurn(){
  help.s="listening";micOn=true;setLed("blue",true);helpView();

  const transcript=await captureSpeech();
  if(help.s==="idle")return;

  if(!transcript){
    micOn=false;
    if(converseTurnCount === 0){
      help.s="no-speech";setLed("red",true);helpView();
      return;
    }
    say("Sesi selesai. Panggil saya lagi jika butuh bantuan ya.",()=>{
      helpEnd();
    });
    return;
  }

  converseTurnCount++;

  if(isExitPhrase(transcript)){
    micOn=false;setLed("off");
    say("Sama-sama. NARAE siap membantu lagi nanti.",()=>{
      helpEnd();
    });
    return;
  }

  help.s="thinking";setLed("amber",true);[0,.22].forEach(a=>beep(880,.14,"square",.08,a));helpView();

  try{
    const res=await fetch(CONFIG.storage.url+"/ai/converse",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({patientId:CONFIG.patientId,deviceId:CONFIG.apiDeviceId,transcript})
    });
    if(!res.ok) throw new Error("AI request failed: "+res.status);
    const data=await res.json();

    if(!data.escalate){
      micOn=false;setLed("blue",false);
      beep(700,.12);
      help.s="answered";
      helpView(data.responseText);
      say(data.responseText,()=>{
        if(help.s!=="idle"){
          later(()=>{
            if(help.s!=="idle")runConverseTurn();
          },700);
        }
      });
      return;
    }

    // Kasus Pasien Meminta Panggil Perawat
    micOn=false;
    help.s="sending";
    setLed("amber",true);
    helpView(data.responseText);
    say(data.responseText, ()=>{
      if(help.s!=="idle"){
        waitForNurseResponse(data.helpRequest ? data.helpRequest.id : null);
      }
    });

  }catch(err){
    console.error(err);
    micOn=false;help.s="fail";setLed("red",true);beep(180,.5,"sawtooth",.1);
    say("Gagal terhubung ke asisten.",()=>later(()=>helpEnd(),2500));
    helpView();
  }
}

async function helpStart(){
  clr();
  converseTurnCount = 0;
  help.s = "listening";
  beep(880,.12,"sine",.1);
  runConverseTurn();
}

function helpEnd(){
  clr();
  converseTurnCount = 0;
  const was=help.s;help.s="idle";
  Bus.emit("help",["sending","sent"].includes(was)?"cancelled":"closed");
  micOn=false;setLed("off");hide();try{speechSynthesis.cancel()}catch(e){}
}
