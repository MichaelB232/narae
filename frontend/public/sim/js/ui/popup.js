// ====== POPUP ======
function show(cls,html,acts){pop.className="on "+cls;pop.innerHTML=html+'<div class="acts">'+acts.map((a,i)=>'<button class="btn '+(a[2]||"")+'" data-i="'+i+'">'+a[0]+"</button>").join("")+"</div>";pop.querySelectorAll("button").forEach(b=>b.onclick=()=>acts[b.dataset.i][1]())}
function hide(){pop.className=""}
