// ====== AUDIO, SUARA, LED ======
let AC;function beep(f,dur=.15,tp="sine",vol=.15,at=0){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),gn=AC.createGain(),t=AC.currentTime+at;o.type=tp;o.frequency.value=f;gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(gn);gn.connect(AC.destination);o.start(t);o.stop(t+dur)}catch(e){}}

function pickNaturalVoice(){
  if(!window.speechSynthesis)return null;
  const vs=speechSynthesis.getVoices()||[];
  const nat=vs.find(v=>(v.lang.toLowerCase().startsWith("id")||v.name.toLowerCase().includes("indonesia"))&&(v.name.includes("Natural")||v.name.includes("Online")||v.name.includes("Gadis")||v.name.includes("Ardi")));
  if(nat)return nat;
  const g=vs.find(v=>v.name.includes("Google")&&(v.lang.toLowerCase().startsWith("id")||v.name.toLowerCase().includes("indonesi")));
  if(g)return g;
  return vs.find(v=>v.lang.toLowerCase().startsWith("id"))||null;
}

function say(t,onEnd){
  try{
    if(!CONFIG.speak||!window.speechSynthesis){if(onEnd)onEnd();return;}
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang="id-ID";
    u.rate=0.95;
    u.pitch=1.0;
    const v=pickNaturalVoice();
    if(v)u.voice=v;
    if(onEnd){
      u.onend=()=>onEnd();
      u.onerror=()=>onEnd();
    }
    speechSynthesis.speak(u);
  }catch(e){
    if(onEnd)onEnd();
  }
}
const LC={off:0x000000,blue:0x2f6df0,amber:0xffb020,green:0x23e08a,red:0xff3b2f};let ledMode="off",ledBlink=false,micOn=false;
function setLed(mo,bl){ledMode=mo;ledBlink=!!bl}
