{
let g,l,ic,d,m;
// Tombol Jadwal
g=new THREE.Group();g.add(new THREE.Mesh(slab(1.7,1.7,.55,.15,.08),M(0x2f6df0,.35)));
ic=flat(cnv(128,128,x=>{x.beginPath();x.arc(64,64,44,0,7);x.stroke();x.beginPath();x.moveTo(64,36);x.lineTo(64,64);x.lineTo(84,76);x.stroke()}),1,1);ic.position.y=.234;g.add(ic);
part("jadwal","Tombol Jadwal",g,v3(1.2,2.4,-.8),v3(1,TOP-.05,-1.35));
}
