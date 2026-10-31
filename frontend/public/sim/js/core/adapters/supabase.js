// Adapter Supabase via REST (tanpa library). Aktifkan di js/config.js:
// storage:{adapter:"supabase", url:"https://XXXX.supabase.co", key:"ANON_KEY"}
Adapters.supabase={
 h(){return{apikey:CONFIG.storage.key,Authorization:"Bearer "+CONFIG.storage.key,"Content-Type":"application/json"}},
 async save(c,r){const x=await fetch(CONFIG.storage.url+"/rest/v1/"+c,{method:"POST",headers:{...this.h(),Prefer:"return=representation"},body:JSON.stringify(r)});if(!x.ok)throw new Error(await x.text());return(await x.json())[0]},
 async list(c){const x=await fetch(CONFIG.storage.url+"/rest/v1/"+c+"?select=*&order=at.desc&limit=200",{headers:this.h()});if(!x.ok)throw new Error(await x.text());return(await x.json()).reverse()}
};
