// ====== EFEK 3D: riak gelombang di tombol Bantuan + kamera close-up, mengikuti state Help Mode ======
const FX={on:false,rings:[]};
(()=>{const g=new THREE.RingGeometry(.95,1,64);g.rotateX(-PI/2);
 for(let i=0;i<3;i++){const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:LC.blue,transparent:true,opacity:0,depthWrite:false}));m.position.set(-1.2,TOP+.02,1.6);m.visible=false;S.add(m);FX.rings.push(m)}})();
const FXCOL={listening:"blue",answered:"blue",thinking:"amber",sending:"amber",sent:"amber",ok:"green",fail:"red","no-speech":"red"};
let fxActive=false;
Bus.on("help",s=>{
 const c=FXCOL[s],active=!!c;FX.on=active;
 if(active)FX.rings.forEach(m=>m.material.color.setHex(LC[c]));
 if(active&&!fxActive){cam("help");O.autoRotate=false;clearTimeout(rotTimer)}   // mulai sesi: close-up
 if(!active&&fxActive)cam(curView);                                              // selesai: kembali ke view sebelumnya (+ lanjut putar otomatis)
 fxActive=active;
});
function fxUpdate(t){FX.rings.forEach((m,i)=>{const on=FX.on&&ex<.05;m.visible=on;if(!on)return;const ph=(t*.7+i/3)%1,sc=1.1+ph*1.6;m.scale.set(sc,1,sc);m.material.opacity=(1-ph)*.6})}
