// ====== LOOP ======
function rs(){const w=stage.clientWidth,h=stage.clientHeight;R.setSize(w,h,false);C.aspect=w/h;C.updateProjectionMatrix()}
new ResizeObserver(rs).observe(stage);rs();C.position.set(...V.front).multiplyScalar(fz());
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.05),t=now/1000;last=now;
 ex+=(exT-ex)*Math.min(1,dt*6);sh.position.y=-5.4-ex*1.8;ped.position.y=sh.position.y-.02;
 for(const k in P){const p=P[k];p.pr+=(p.tp-p.pr)*Math.min(1,dt*25);p.hov+=((hoverKey===k?1:0)-p.hov)*Math.min(1,dt*12);
  p.g.position.copy(p.home).addScaledVector(p.ex,ex);p.g.position.y-=p.pr*.14;const e=p.hov*.2;p.mats.forEach(q=>q.emissive.setRGB(e,e,e))}
 const on=!ledBlink||Math.sin(t*10)>0;ledMat.emissive.setHex(LC[ledMode]);ledMat.emissiveIntensity=ledMode==="off"?0:on?1.3:.1;
 ledLight.color.setHex(LC[ledMode]);ledLight.intensity=ledMode==="off"||!on?0:1.2;
 micMat.opacity=micOn?.55+.45*Math.sin(t*6):0;
 if(camTo){C.position.lerp(camTo,Math.min(1,dt*5));if(C.position.distanceTo(camTo)<.05)camTo=null}
 if(tgtTo){O.target.lerp(tgtTo,Math.min(1,dt*5));if(O.target.distanceTo(tgtTo)<.02)tgtTo=null}
 O.update();updateAnn();fxUpdate(t);R.render(S,C)}
requestAnimationFrame(loop);
