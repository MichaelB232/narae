// ====== PANEL ======
const list=document.getElementById("list");
for(const k in P){const lb=document.createElement("label");lb.innerHTML='<input type="checkbox" id="v_'+k+'" checked> '+P[k].name;list.appendChild(lb);lb.firstChild.onchange=e=>{P[k].g.visible=e.target.checked}}
function setVis(k,v){P[k].g.visible=v;document.getElementById("v_"+k).checked=v}
const fz=()=>stage.clientWidth<stage.clientHeight?1.55:1,V={front:[7.5,7,13],top:[0,17,.1],back:[0,-15,6]};
function cam(n){camTo=v3(...V[n]).multiplyScalar(fz());setVis("strap",n!=="back")}
document.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>cam(b.dataset.v));
let ex=0,exT=0;const exb=document.getElementById("exb");exb.onclick=()=>{exT=exT?0:1;exb.textContent=exT?"Satukan komponen":"Pecah komponen"};
document.getElementById("net").onchange=e=>{CONFIG.help.result=e.target.value};
