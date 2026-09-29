export function outputScale(data,normalize=false,targetDb=-1){let peak=0;for(const ch of data)for(let i=0,n=ch.length;i<n;i++){const v=ch[i]<0?-ch[i]:ch[i];if(v>peak)peak=v;}return{peak,scale:normalize&&peak>0?10**(targetDb/20)/peak:peak>1?1/peak:1};}
// WAV is little-endian like every platform browsers run on: samples are written
// through typed arrays (one channel at a time) instead of a DataView call each.
// (x+32768.5|0)-32768 equals Math.round(x) over the 16-bit range, without the call.
const LITTLE=new Uint8Array(new Uint16Array([1]).buffer)[0]===1;
export function pcmWav(data,rate,bits=16,scale=1){const channels=data.length,n=data[0].length,float=bits===32,bytes=bits/8,ab=new ArrayBuffer(44+n*channels*bytes),view=new DataView(ab),str=(p,s)=>{for(let i=0;i<s.length;i++)view.setUint8(p+i,s.charCodeAt(i));};str(0,'RIFF');view.setUint32(4,ab.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,float?3:1,true);view.setUint16(22,channels,true);view.setUint32(24,rate,true);view.setUint32(28,rate*channels*bytes,true);view.setUint16(32,channels*bytes,true);view.setUint16(34,bits,true);str(36,'data');view.setUint32(40,n*channels*bytes,true);
 if(bits===24){const out=new Uint8Array(ab,44);for(let c=0;c<channels;c++){const ch=data[c];for(let i=0,p=c*3;i<n;i++,p+=channels*3){let v=ch[i]*scale;v=v>1?1:v<-1?-1:v;const v24=Math.round(v*(v<0?8388608:8388607));out[p]=v24&255;out[p+1]=(v24>>8)&255;out[p+2]=(v24>>16)&255;}}}
 else if(!LITTLE){for(let i=0,p=44;i<n;i++)for(let c=0;c<channels;c++,p+=bytes){const v=Math.max(-1,Math.min(1,data[c][i]*scale));if(float)view.setFloat32(p,v,true);else view.setInt16(p,Math.round(v*(v<0?32768:32767)),true);}}
 else{const out=float?new Float32Array(ab,44):new Int16Array(ab,44);for(let c=0;c<channels;c++){const ch=data[c];for(let i=0,p=c;i<n;i++,p+=channels){let v=ch[i]*scale;v=v>1?1:v<-1?-1:v;out[p]=float?v:v!==v?0:(v*(v<0?32768:32767)+32768.5|0)-32768;}}}
 return ab;}
// Float samples to 16-bit PCM for the MP3 encoder, reusing the caller's buffer.
export function toPcm16(ch,from,scale,out){for(let j=0;j<out.length;j++){let v=ch[from+j]*scale;v=v>1?1:v<-1?-1:v;out[j]=v*(v<0?32768:32767);}return out;}
