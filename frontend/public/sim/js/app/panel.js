// ====== PANEL, TOOLBAR, KAMERA ======
const EMBED=new URLSearchParams(location.search).has("embed");
if(EMBED){document.body.classList.add("embed");const b=document.getElementById("brand");b.replaceChildren(document.getElementById("patientSelect"))}
const list=document.getElementById("list");
for(const k in P){const lb=document.createElement("label");lb.innerHTML='<input type="checkbox" id="v_'+k+'" checked> '+P[k].name;list.appendChild(lb);lb.firstChild.onchange=e=>{P[k].g.visible=e.target.checked}}
function setVis(k,v){P[k].g.visible=v;document.getElementById("v_"+k).checked=v}
const fz=()=>{const a=stage.clientWidth/stage.clientHeight;return a<1?Math.min(2.6,1.1/a):1},   // jarak kamera menyesuaikan aspek layar
 V={front:[8.7,8.1,15.1],top:[0,17,.1],back:[0,-15,6],help:[1,6.2,8.2]},       // posisi kamera
 T={front:[0,-1.2,0],top:[0,-1.2,0],back:[0,-1.2,0],help:[-1.2,1.1,1.6]};   // titik yang dilihat (help = close-up tombol Bantuan)
let curView="front";
function cam(n){if(n!=="help")curView=n;camTo=v3(...V[n]).multiplyScalar(fz());tgtTo=v3(...T[n]);setVis("strap",n!=="back");pauseRot()}
document.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>cam(b.dataset.v));

let ex=0,exT=0;const exb=document.getElementById("exb");
exb.onclick=()=>{exT=exT?0:1;exb.textContent=exT?"Satukan komponen":"Pecah komponen";exb.classList.toggle("on",!!exT)};

// putar otomatis: berhenti saat disentuh/Help Mode aktif, lanjut 4 dtk setelah diam
let rotOn=true,rotTimer=0;
function pauseRot(){O.autoRotate=false;clearTimeout(rotTimer);if(rotOn&&help.s==="idle")rotTimer=setTimeout(()=>{if(rotOn&&help.s==="idle")O.autoRotate=true},4000)}
O.autoRotateSpeed=1.2;O.autoRotate=true;O.addEventListener("start",pauseRot);O.addEventListener("end",pauseRot);
document.getElementById("rot").onclick=e=>{rotOn=!rotOn;e.currentTarget.classList.toggle("on",rotOn);e.currentTarget.setAttribute("aria-pressed",rotOn);if(rotOn)pauseRot();else{O.autoRotate=false;clearTimeout(rotTimer)}};

// panel tampil/sembunyi (ingat pilihan; di mobile default tersembunyi)
const pt=document.getElementById("ptoggle");
function setPanel(open){document.body.classList.toggle("nopanel",!open);pt.setAttribute("aria-expanded",open);pt.textContent=open?"Sembunyikan panel":"Panel";try{localStorage.setItem("sim:panel",open?"1":"0")}catch(e){}}
let savedPanel=null;try{savedPanel=localStorage.getItem("sim:panel")}catch(e){}
setPanel(savedPanel!==null?savedPanel==="1":!(EMBED||matchMedia("(max-width:760px)").matches));
pt.onclick=()=>setPanel(document.body.classList.contains("nopanel"));
document.getElementById("pclose").onclick=()=>setPanel(false);

// mode presentasi
const presBtn=document.getElementById("pres");
function setPresent(on){document.body.classList.toggle("present",on);presBtn.classList.toggle("on",on);presBtn.textContent=on?"Keluar presentasi (Esc)":"Mode presentasi"}
presBtn.onclick=()=>setPresent(!document.body.classList.contains("present"));
addEventListener("keydown",e=>{if(/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;if(e.key==="Escape")setPresent(false);if(e.key==="p"||e.key==="P")pt.click()});
