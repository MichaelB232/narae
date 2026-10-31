{
let g,l,ic,d,m;
// LED status
g=new THREE.Group();var ledMat=M(0x1d2a25,.4);g.add(new THREE.Mesh(slab(1.2,.18,.09,.04,.04),ledMat));
var ledLight=new THREE.PointLight(0xffffff,0,4);ledLight.position.set(0,.6,0);g.add(ledLight);
part("led","LED status",g,v3(.8,3.2,-1.2),v3(1,TOP-.02,-3));P.led.mats=[];
}
