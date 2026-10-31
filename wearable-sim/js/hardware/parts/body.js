{
let g,l,ic,d,m;
// Bodi
g=new THREE.Group();g.add(new THREE.Mesh(slab(5.1,7.1,1,1,.15),M(0x4b4e56,.55)));
l=label("Jadwal",1.6);l.position.set(1,TOP+.01,-.2);g.add(l);l=label("Bantuan",1.6);l.position.set(-1,TOP+.01,3.1);g.add(l);
part("body","Bodi 54 × 74 mm",g,v3(0,0,0));
}
