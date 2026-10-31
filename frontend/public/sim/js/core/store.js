// ====== CORE: STORAGE ADAPTER (ganti adapter di CONFIG.storage tanpa mengubah action) ======
const mem={};
const Adapters={
 memory:{async save(c,r){(mem[c]=mem[c]||[]).push(r);return r},async list(c){return(mem[c]||[]).slice()}},
 local:{async save(c,r){try{const a=JSON.parse(localStorage.getItem("sim:"+c)||"[]");a.push(r);localStorage.setItem("sim:"+c,JSON.stringify(a.slice(-200)))}catch(e){(mem[c]=mem[c]||[]).push(r)}return r},async list(c){try{return JSON.parse(localStorage.getItem("sim:"+c)||"[]")}catch(e){return mem[c]||[]}}},
 http:{async save(c,r){return(await fetch(CONFIG.storage.url+"/"+c,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)})).json()},async list(c){return(await fetch(CONFIG.storage.url+"/"+c)).json()}}
};
const Store={save:(c,r)=>Adapters[CONFIG.storage.adapter].save(c,{id:Date.now().toString(36),at:new Date().toISOString(),...r}),list:c=>Adapters[CONFIG.storage.adapter].list(c)};
