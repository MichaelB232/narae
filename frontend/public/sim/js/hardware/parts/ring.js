{
let g,l,ic,d,m;
// Cincin pelindung
g=new THREE.Group();const tg=new THREE.TorusGeometry(.93,.12,16,48);tg.rotateX(PI/2);g.add(new THREE.Mesh(tg,M(0xcfd3dc,.25,.9)));
const dg=new THREE.CircleGeometry(.95,40);dg.rotateX(-PI/2);const dm=new THREE.Mesh(dg,M(0x2b2d33,.8));dm.position.y=-.07;g.add(dm);
part("ring","Cincin pelindung",g,v3(-.6,1.2,.6),v3(-1.2,TOP+.08,1.6));
}
