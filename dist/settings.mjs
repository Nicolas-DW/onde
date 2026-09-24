import {cleanFx} from './dsp.mjs';
import {clamp,curvePoints,tidy} from './core.mjs';
export function captureSettings(owner,type,fxOnly=false){
 const payload={kind:fxOnly?'fx':type,fx:cleanFx(owner.fx)};
 if(!fxOnly&&type!=='master')payload.gain=owner.gain??1;
 if(!fxOnly&&type==='clip')for(const edge of ['in','out']){const suffix=edge==='in'?'In':'Out';payload['fade'+suffix]=owner['fade'+suffix]||0;payload[edge+'Curve']=[...curvePoints(owner[edge+'Curve'])];payload[edge+'Level']=owner[edge+'Level']||0;}
 return structuredClone(payload);
}
export function applySettings(owner,type,payload){
 if(!payload||!['fx',type].includes(payload.kind))return false;
 owner.fx=cleanFx(payload.fx);
 if(payload.kind!=='fx'&&type!=='master')owner.gain=clamp(Number(payload.gain)||0,0,type==='track'?1.5:10**(.6));
 if(payload.kind==='clip'){for(const edge of ['in','out']){const suffix=edge==='in'?'In':'Out';owner['fade'+suffix]=Math.max(0,Number(payload['fade'+suffix])||0);owner[edge+'Curve']=[...curvePoints(payload[edge+'Curve'])];owner[edge+'Level']=clamp(Number(payload[edge+'Level'])||0,0,1);delete owner['autoFade'+suffix];}tidy(owner);}
 return true;
}
function presetDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open('onde-settings',1);r.onupgradeneeded=()=>r.result.createObjectStore('presets',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function accessPresets(mode,action){const db=await presetDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('presets',mode),r=action(tx.objectStore('presets'));tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Enregistrement interrompu'));});}finally{db.close();}}
export const listSettings=()=>accessPresets('readonly',s=>s.getAll());
export const saveSettings=record=>accessPresets('readwrite',s=>s.put(record));
export const deleteSettings=id=>accessPresets('readwrite',s=>s.delete(id));
