// ====== WIRING: komponen -> event "press" -> action. Subscriber lain (database, analytics, MQTT) cukup Bus.on(...) ======
const ctx={Bus,Store,CONFIG,UI:{show,hide},Hw:{beep,say,led:setLed,mic:b=>{micOn=b}}};
const H={};for(const k in CONFIG.bindings)H[k]=()=>Bus.emit("press",k);
Bus.on("press",k=>{const a=Actions[CONFIG.bindings[k]];if(a)a(ctx)});
// Catatan: help_requests sekarang ditulis langsung oleh backend lewat /api/ai/converse
// dan /api/help-requests di js/features/help-mode.js — tidak perlu mirror Store.save di sini.
// Panel log di bawah (Store.save("events", ...)) tetap jalan tapi akan gagal diam-diam karena
// endpoint /api/events generik ini sengaja tidak dibuat di backend — lihat README.
const logEl=document.getElementById("log");
async function renderLog(){const a=await Store.list("events").catch(()=>[]);logEl.innerHTML=a.slice(-8).reverse().map(r=>"<div>"+new Date(r.at).toLocaleTimeString("id-ID",{hour12:false})+" · "+r.type+(r.detail?" "+r.detail:"")+"</div>").join("")||'<span class="mut">Belum ada aktivitas.</span>'}
Bus.on("*",(d,e)=>{Store.save("events",{type:e,detail:typeof d==="string"?d:d?JSON.stringify(d):""}).then(renderLog).catch(()=>{})});
document.getElementById("clr").onclick=()=>{try{localStorage.removeItem("sim:events")}catch(e){}mem.events=[];renderLog()};
renderLog();
