{
let g,l,ic,d,m;
// Strap silikon
const so=rr(5.9,5.2,2);so.holes.push(rr(5.4,4.7,1.75));
const sg=new THREE.ExtrudeGeometry(so,{depth:2.4,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,curveSegments:12});sg.translate(0,0,-1.2);
g=new THREE.Group();g.add(new THREE.Mesh(sg,M(0x202020,.55)));
[.45,.15,-.15,-.45].forEach(y=>{const h=new THREE.Mesh(new THREE.CircleGeometry(.1,16),M(0x16171a,.9));h.position.set(3.0,y,0);h.rotation.y=PI/2;g.add(h)});
part("strap","Strap silikon lembut",g,v3(0,-2.2,0),v3(0,-2.3,0));
}
