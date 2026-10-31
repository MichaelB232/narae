{
let g,l,ic,d,m;
// Port mikrofon + indikator aktif
g=new THREE.Group();d=new THREE.CircleGeometry(.08,16);d.rotateX(-PI/2);m=new THREE.Mesh(d,M(0x15171c,.9));m.position.set(2.2,TOP+.012,-1.9);g.add(m);
d=new THREE.RingGeometry(.13,.19,24);d.rotateX(-PI/2);var micMat=new THREE.MeshBasicMaterial({color:0xff3b2f,transparent:true,opacity:0,depthWrite:false});m=new THREE.Mesh(d,micMat);m.position.set(2.2,TOP+.014,-1.9);g.add(m);
part("mic","Port mikrofon",g,v3(1.4,1.8,-.4));
}
