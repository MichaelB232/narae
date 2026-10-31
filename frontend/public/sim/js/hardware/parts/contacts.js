{
let g,l,ic,d,m;
// Kontak pengisian (sisi bawah)
g=new THREE.Group();[-.3,.3].forEach(x=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.08,20),M(0xd9a820,.3,.9));c.position.set(x,-.19,.5);g.add(c)});
part("contacts","Kontak pengisian",g,v3(0,-1.4,0));
}
