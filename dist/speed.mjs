const cache=new WeakMap();
export async function prepareSpeed(context,assets,rate,progress=()=>{},cancelled=()=>false){
 const result=new Map();if(rate===1)return result;
 for(const asset of assets){if(cancelled())return result;const hit=cache.get(asset.buffer);if(hit?.rate===rate){result.set(asset.id,hit.buffer);continue;}
 progress(asset.name);const channels=Array.from({length:asset.buffer.numberOfChannels},(_,i)=>asset.buffer.getChannelData(i).slice());
 const data=await new Promise((resolve,reject)=>{const worker=new Worker(new URL('./stretch-worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{worker.terminate();if(data.error)reject(Error(data.error));else resolve(data.channels);};worker.onerror=e=>{worker.terminate();reject(Error(e.message||'Traitement de vitesse impossible'));};worker.postMessage({channels,sampleRate:asset.buffer.sampleRate,rate},channels.map(c=>c.buffer));});
 if(cancelled())return result;const buffer=context.createBuffer(data.length,data[0].length,asset.buffer.sampleRate);for(let c=0;c<data.length;c++)buffer.copyToChannel(data[c],c);cache.set(asset.buffer,{rate,buffer});result.set(asset.id,buffer);
 }
 return result;
}
