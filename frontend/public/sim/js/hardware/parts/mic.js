{
let g,l,ic,d,m;
// Port mikrofon + indikator aktif
g=new THREE.Group();d=new THREE.CircleGeometry(.08,16);d.rotateX(-PI/2);m=new THREE.Mesh(d,M(0x15171c,.9));m.position.set(2.2,TOP+.012,-1.9);g.add(m);
d=new THREE.RingGeometry(.13,.19,24);d.rotateX(-PI/2);var micMat=new THREE.MeshBasicMaterial({color:0xff3b2f,transparent:true,opacity:0,depthWrite:false});m=new THREE.Mesh(d,micMat);m.position.set(2.2,TOP+.014,-1.9);g.add(m);
ic=flat(cnv(128,128,x=>{x.beginPath();x.arc(64,44,16,Math.PI,0);x.lineTo(80,60);x.arc(64,60,16,0,Math.PI);x.closePath();x.stroke();
x.beginPath();x.arc(64,60,30,0,Math.PI);x.stroke();x.beginPath();x.moveTo(64,90);x.lineTo(64,104);x.stroke()}),.45,.45);ic.position.set(2.2,TOP+.012,-1.3);g.add(ic);
part("mic","Port mikrofon",g,v3(1.4,1.8,-.4));
}
