// ====== PEMILIH PASIEN (simulasi: 1 gelang fisik, dipakai bergantian jadi pasien siapa) ======
async function initPatientSelector(){
  const sel=document.getElementById("patientSelect");
  if(!sel) return;
  try{
    const urlParams = new URLSearchParams(window.location.search);
    const nurseId = urlParams.get("nurseId");
    const fetchUrl = CONFIG.storage.url + "/patients" + (nurseId ? "?nurseId=" + nurseId : "");
    const res=await fetch(fetchUrl);
    const patients=await res.json();
    sel.innerHTML=patients.map(p=>
      '<option value="'+p.id+'" data-device="'+(p.device_id??"")+'">'+p.name+(p.room_number?" — "+p.room_number:"")+"</option>"
    ).join("");

    function applySelection(){
      const opt=sel.options[sel.selectedIndex];
      if(!opt) return;
      CONFIG.patientId=Number(opt.value);
      CONFIG.apiDeviceId=opt.dataset.device?Number(opt.dataset.device):null;
      if(typeof logAdd==="function")logAdd("Gelang mensimulasikan: "+opt.textContent);
    }

    sel.addEventListener("change",applySelection);
    if(patients.length>0){ sel.selectedIndex=0; applySelection(); }
  }catch(err){
    console.error(err);
    sel.innerHTML='<option value="">Gagal memuat daftar pasien dari server</option>';
  }
}

document.addEventListener("DOMContentLoaded",initPatientSelector);
