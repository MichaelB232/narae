// ====== WIRING: komponen -> event "press" -> action. Subscriber lain (database, analytics, MQTT) cukup Bus.on(...) ======
const ctx={Bus,Store,CONFIG,UI:{show,hide},Hw:{beep,say,led:setLed,mic:b=>{micOn=b}}};
const H={};for(const k in CONFIG.bindings)H[k]=()=>Bus.emit("press",k);
Bus.on("press",k=>{const a=Actions[CONFIG.bindings[k]];if(a)a(ctx)});
// help_requests ditulis langsung oleh backend lewat /api/ai/converse dan /api/help-requests di js/features/help-mode.js.
// ====== LOG AKTIVITAS (lokal di browser; tidak memanggil backend) ======
const logEl=document.getElementById("log"),evLog=[];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const HL={listening:"Mendengarkan",thinking:"Memproses",answered:"NARAE menjawab",sending:"Mengirim permintaan bantuan",sent:"Menunggu pendamping",ok:"Bantuan diterima",fail:"Gagal terkirim","no-speech":"Tidak terdengar",cancelled:"Dibatalkan",closed:"Sesi ditutup"};
function renderLog(){logEl.innerHTML=evLog.slice(-8).reverse().map(r=>"<div>"+r.at+" · "+esc(r.text)+"</div>").join("")||'<span class="mut">Belum ada aktivitas.</span>'}
function logAdd(text){evLog.push({at:new Date().toLocaleTimeString("id-ID",{hour12:false}),text});renderLog()}
Bus.on("press",k=>logAdd("Tombol "+(P[k]?P[k].name.replace(/^Tombol /,""):k)+" ditekan"));
Bus.on("help",s=>logAdd("Help Mode: "+(HL[s]||s)));
document.getElementById("clr").onclick=()=>{evLog.length=0;renderLog()};
renderLog();
