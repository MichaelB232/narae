{
let g,l,ic,d,m;
// Speaker
g=new THREE.Group();[-1.5,-1.15,-.8].forEach(x=>{const d=new THREE.CircleGeometry(.08,16);d.rotateX(-PI/2);const m=new THREE.Mesh(d,M(0x15171c,.9));m.position.set(x,TOP+.012,-3);g.add(m)});
part("speaker","Speaker",g,v3(-.6,1.8,-1.4));
}
