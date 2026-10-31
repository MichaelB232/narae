// ====== PENJELASAN: kartu di kolom kiri/kanan + garis penunjuk ke objek 3D ======
const ANN=[   // s: kolom kiri "L"/kanan "R"; fy: posisi vertikal (fraksi tinggi stage)
 {k:"speaker",p:[-1.15,1.2,-3],s:"L",fy:.24,t:"Speaker",d:"Suara jawaban dan pengingat."},
 {k:"bantuan",p:[-1.2,1.4,1.6],s:"L",fy:.50,t:"Tombol Bantuan",d:"Tekan lalu bicara. NARAE menjawab; jika darurat, perawat dipanggil."},
 {k:"led",p:[1,1.25,-3],s:"R",fy:.16,t:"Lampu status",d:'<i class="dot" style="background:#2f6df0"></i>Mendengarkan<br><i class="dot" style="background:#ffb020"></i>Memproses / mengirim<br><i class="dot" style="background:#23e08a"></i>Bantuan diterima<br><i class="dot" style="background:#ff3b2f"></i>Gagal / tak terdengar'},
 {k:"jadwal",p:[1,1.4,-1.35],s:"R",fy:.42,t:"Tombol Jadwal",d:"Tekan untuk mendengar jadwal hari ini."},
 {k:"mic",p:[2.2,1.2,-1.9],s:"R",fy:.64,t:"Mikrofon",d:"Cincin merah berkedip saat merekam."}
];
const annBox=document.getElementById("anns"),annSvg=document.getElementById("annsvg"),tmpV=new THREE.Vector3();let annOn=true;
ANN.forEach(a=>{a.v=v3(...a.p);a.el=document.createElement("div");a.el.className="ann";a.el.innerHTML="<b>"+a.t+"</b><span>"+a.d+"</span>";annBox.appendChild(a.el);
 a.ln=document.createElementNS("http://www.w3.org/2000/svg","line");annSvg.appendChild(a.ln)});
document.getElementById("ann").onclick=e=>{annOn=!annOn;e.currentTarget.classList.toggle("on",annOn);e.currentTarget.setAttribute("aria-pressed",annOn)};
const CW=EMBED?170:200;
function updateAnn(){
 const w=stage.clientWidth,h=stage.clientHeight;
 const show=annOn&&w>=(EMBED?800:900)&&help.s==="idle"&&C.position.y>3&&ex<.05;   // semua titik ada di sisi atas bodi → sembunyikan saat dilihat dari bawah/belakang, saat dipecah, atau stage sempit
 annBox.style.opacity=annSvg.style.opacity=show?1:0;if(!show)return;
 C.updateMatrixWorld();
 ANN.forEach(a=>{const vis=P[a.k].g.visible;a.el.style.display=a.ln.style.display=vis?"":"none";if(!vis)return;
  tmpV.copy(a.v).project(C);const x=(tmpV.x+1)/2*w,y=(1-tmpV.y)/2*h,
   px=a.s==="L"?16:w-CW-16,py=Math.max(84,a.fy*h),lx=a.s==="L"?px+CW:px,ly=py+a.el.offsetHeight/2;   // kartu di kolom tepi, tidak menutupi model
  a.el.style.transform="translate("+px+"px,"+py+"px)";
  a.ln.setAttribute("x1",x);a.ln.setAttribute("y1",y);a.ln.setAttribute("x2",lx);a.ln.setAttribute("y2",ly)})}
