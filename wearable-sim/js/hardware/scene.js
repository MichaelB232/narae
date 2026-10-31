// ====== SCENE ======
const cv=document.getElementById("cv"),stage=document.getElementById("stage"),tip=document.getElementById("tip"),pop=document.getElementById("pop");
const R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});R.setPixelRatio(Math.min(devicePixelRatio,2));
const S=new THREE.Scene(),C=new THREE.PerspectiveCamera(32,1,.1,100);
S.add(new THREE.HemisphereLight(0xffffff,0x8890a8,1));
const dl=new THREE.DirectionalLight(0xffffff,.95);dl.position.set(5,10,7);S.add(dl);
const dl2=new THREE.DirectionalLight(0xaabbff,.4);dl2.position.set(-6,3,-5);S.add(dl2);
const O=new THREE.OrbitControls(C,cv);O.enableDamping=true;O.target.set(0,-1.2,0);O.minDistance=8;O.maxDistance=40;
const dev=new THREE.Group();S.add(dev);
const M=(c,r=.5,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),PI=Math.PI,TOP=1.15;
function rr(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
function slab(w,l,r,d,b){const g=new THREE.ExtrudeGeometry(rr(w,l,r),{depth:d,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3,curveSegments:10});g.rotateX(-PI/2);return g}
function flat(tex,w,h){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(tex),transparent:true}));m.rotation.x=-PI/2;return m}
function cnv(w,h,f){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.strokeStyle=x.fillStyle="#fff";x.lineWidth=8;x.lineCap=x.lineJoin="round";f(x);return c}
const label=(t,w)=>flat(cnv(256,64,x=>{x.fillStyle="#c9ceda";x.font="700 40px system-ui,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(t,128,34)}),w,w/4);
const P={};
function part(key,name,g,ex,pos){g.name=name;if(pos)g.position.copy(pos);const mats=[];g.traverse(o=>{if(o.isMesh){o.userData.key=key;if(o.material.emissive)mats.push(o.material)}});dev.add(g);P[key]={g,name,home:g.position.clone(),ex,mats,pr:0,tp:0,hov:0}}
// Bayangan
const sc=cnv(128,128,x=>{const q=x.createRadialGradient(64,64,0,64,64,64);q.addColorStop(0,"rgba(0,0,0,.35)");q.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=q;x.fillRect(0,0,128,128)});
const sh=new THREE.Mesh(new THREE.PlaneGeometry(13,13),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false}));sh.rotation.x=-PI/2;sh.position.y=-5.4;S.add(sh);
