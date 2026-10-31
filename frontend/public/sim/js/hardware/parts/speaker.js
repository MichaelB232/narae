{
let g,l,ic,d,m;
// Speaker
g=new THREE.Group();[-1.5,-1.15,-.8].forEach(x=>{const d=new THREE.CircleGeometry(.08,16);d.rotateX(-PI/2);const m=new THREE.Mesh(d,M(0x15171c,.9));m.position.set(x,TOP+.012,-3);g.add(m)});
ic=flat(cnv(128,128,x=>{x.beginPath();x.moveTo(28,52);x.lineTo(46,52);x.lineTo(70,34);x.lineTo(70,94);x.lineTo(46,76);x.lineTo(28,76);x.closePath();x.stroke();
x.beginPath();x.arc(70,64,18,-.9,.9);x.stroke();x.beginPath();x.arc(70,64,32,-.9,.9);x.stroke()}),.5,.5);ic.position.set(-1.15,TOP+.012,-2.45);g.add(ic);
part("speaker","Speaker",g,v3(-.6,1.8,-1.4));
}
