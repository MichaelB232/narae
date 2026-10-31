{
let g,l,ic,d,m;
// Tombol Bantuan (cekung)
g=new THREE.Group();
const pts=[[0,.12],[.25,.13],[.5,.17],[.7,.22],[.8,.21],[.8,0],[0,0]].map(p=>new THREE.Vector2(p[0],p[1]));
g.add(new THREE.Mesh(new THREE.LatheGeometry(pts,48),new THREE.MeshStandardMaterial({color:0xf2553a,roughness:.35,side:THREE.DoubleSide})));
ic=flat(cnv(128,128,x=>{x.beginPath();x.moveTo(34,88);x.quadraticCurveTo(44,80,44,62);x.bezierCurveTo(44,26,84,26,84,62);x.quadraticCurveTo(84,80,94,88);x.closePath();x.fill();x.beginPath();x.arc(64,98,8,0,7);x.fill()}),.9,.9);ic.position.y=.175;g.add(ic);
part("bantuan","Tombol Bantuan",g,v3(-.6,2.6,.6),v3(-1.2,TOP-.05,1.6));
}
