// ====== INTERAKSI ======
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();let down=null,dx=0,dy=0,hoverKey=null,camTo=null;
function pick(e){const r=cv.getBoundingClientRect();mv.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(mv,C);
 const h=ray.intersectObjects(dev.children,true).find(i=>{const k=i.object.userData.key;return k&&P[k].g.visible});return h?h.object.userData.key:null}
cv.addEventListener("pointerdown",e=>{camTo=null;dx=e.clientX;dy=e.clientY;down=pick(e);if(down&&P[down].btn)P[down].tp=1});
window.addEventListener("pointerup",e=>{for(const k in P)P[k].tp=0;const k=pick(e);if(down&&k===down&&Math.hypot(e.clientX-dx,e.clientY-dy)<6&&H[k])H[k]();down=null});
cv.addEventListener("pointermove",e=>{if(e.buttons){tip.style.opacity=0;return}hoverKey=pick(e);cv.style.cursor=hoverKey&&H[hoverKey]?"pointer":"grab";
 if(hoverKey){const r=stage.getBoundingClientRect();tip.textContent=P[hoverKey].name+(H[hoverKey]?" · klik":"");tip.style.left=e.clientX-r.left+14+"px";tip.style.top=e.clientY-r.top+14+"px";tip.style.opacity=1}else tip.style.opacity=0});
cv.addEventListener("pointerleave",()=>{hoverKey=null;tip.style.opacity=0});
