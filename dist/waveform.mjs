// Min/max pyramid across every channel. Retains transients and avoids scanning
// an entire recording each time the visible timeline is redrawn.
export function buildWaveform(buffer){
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),size=128,n=Math.ceil(buffer.length/size),lo=new Float32Array(n),hi=new Float32Array(n);
 for(let b=0;b<n;b++){let min=Infinity,max=-Infinity;for(const ch of channels)for(let i=b*size;i<Math.min(buffer.length,(b+1)*size);i++){min=Math.min(min,ch[i]);max=Math.max(max,ch[i]);}lo[b]=min;hi[b]=max;}
 const levels=[{size,lo,hi}];while(levels.at(-1).lo.length>1){const prev=levels.at(-1),n=Math.ceil(prev.lo.length/2),lo=new Float32Array(n),hi=new Float32Array(n);for(let i=0;i<n;i++){lo[i]=Math.min(prev.lo[i*2],prev.lo[i*2+1]??Infinity);hi[i]=Math.max(prev.hi[i*2],prev.hi[i*2+1]??-Infinity);}levels.push({size:prev.size*2,lo,hi});}
 return {channels,levels,length:buffer.length,rate:buffer.sampleRate};
}
export function sampleRange(w,from,to){
 let i=Math.max(0,Math.floor(from)),end=Math.min(w.length,Math.max(i+1,Math.ceil(to))),lo=Infinity,hi=-Infinity;
 while(i<end){let level=null;if(i%128===0)for(const l of w.levels){if(i%l.size===0&&i+l.size<=end)level=l;else break;}
 if(level){const b=i/level.size;lo=Math.min(lo,level.lo[b]);hi=Math.max(hi,level.hi[b]);i+=level.size;}else{for(const ch of w.channels){lo=Math.min(lo,ch[i]);hi=Math.max(hi,ch[i]);}i++;}}
 return lo===Infinity?[0,0]:[lo,hi];
}
export function wavePath(w,offset,duration,pps,left,right,density=1){
 const width=duration*pps,start=Math.max(0,Math.floor(left*density)/density),stop=Math.min(width,right),step=1/density;let path='';
 for(let x=start;x<stop;x+=step){const [lo,hi]=sampleRange(w,(offset+x/pps)*w.rate,(offset+Math.min(width,x+step)/pps)*w.rate);const top=32-Math.min(1,hi)*29,bottom=32-Math.max(-1,lo)*29;path+=`M${x.toFixed(2)},${top.toFixed(2)}v${Math.max(.45,bottom-top).toFixed(2)}`;}
 return path;
}
