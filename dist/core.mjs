export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const LINEAR=[1/3,1/3,2/3,2/3];
export const PRESETS={linear:LINEAR,smooth:[.42,0,.58,1],fast:[0,0,.58,1],slow:[.42,0,1,1]};
export function curvePoints(p){return Array.isArray(p)&&p.length===4&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1)&&p[0]<=p[2]?p:LINEAR;}
const cubic=(a,b,t)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t*t*t;
export function curveParameter(points,x){const p=curvePoints(points);let lo=0,hi=1;for(let i=0;i<36;i++){const t=(lo+hi)/2;if(cubic(p[0],p[2],t)<x)lo=t;else hi=t;}return(lo+hi)/2;}
export function bezier(points,x){if(x<=0)return 0;if(x>=1)return 1;const p=curvePoints(points);return cubic(p[1],p[3],curveParameter(p,x));}
export function splitBezier(points,x){const p=curvePoints(points),t=curveParameter(p,x),mix=(a,b)=>a.map((v,i)=>v+(b[i]-v)*t),a=[0,0],b=p.slice(0,2),c=p.slice(2),d=[1,1],ab=mix(a,b),bc=mix(b,c),cd=mix(c,d),abc=mix(ab,bc),bcd=mix(bc,cd),mid=mix(abc,bcd);
const normalized=(v,origin,range)=>v.map((n,i)=>clamp((n-origin[i])/Math.max(1e-12,range[i]),0,1));
return [normalized(ab,a,mid).concat(normalized(abc,a,mid)),normalized(bcd,mid,[1-mid[0],1-mid[1]]).concat(normalized(cd,mid,[1-mid[0],1-mid[1]]))];}
export function tidy(c){c.start=Math.max(0,c.start);c.duration=Math.max(.01,c.duration);c.fadeIn=clamp(c.fadeIn||0,0,c.duration);c.fadeOut=clamp(c.fadeOut||0,0,c.duration);const sum=c.fadeIn+c.fadeOut;if(sum>c.duration){c.fadeIn*=c.duration/sum;c.fadeOut*=c.duration/sum;}return c;}
export function envelope(c,t){if(t<0||t>c.duration)return 0;const a=c.inLevel||0,b=c.outLevel||0;return Math.min(c.fadeIn?a+(1-a)*bezier(c.inCurve,t/c.fadeIn):1,c.fadeOut?b+(1-b)*(1-bezier(c.outCurve,(t-c.duration+c.fadeOut)/c.fadeOut)):1);}
export function splitClip(c,time,id){const p=time-c.start;if(p<=.01||p>=c.duration-.01)return null;
const at=envelope(c,p),left={...c,duration:p,fadeIn:Math.min(c.fadeIn,p),fadeOut:Math.max(0,p-(c.duration-c.fadeOut))},right={...c,id,start:time,offset:c.offset+p,duration:c.duration-p,fadeIn:Math.max(0,c.fadeIn-p),fadeOut:Math.min(c.fadeOut,c.duration-p)};
for(const part of [left,right]){delete part.autoFadeIn;delete part.autoFadeOut;}
if(p<c.fadeIn){const curves=splitBezier(c.inCurve,p/c.fadeIn);left.gain*=at;left.inLevel=(c.inLevel||0)/at;left.outLevel=0;left.inCurve=curves[0];right.inLevel=at;right.inCurve=curves[1];}
else if(p>c.duration-c.fadeOut){const curves=splitBezier(c.outCurve,(p-c.duration+c.fadeOut)/c.fadeOut);left.outLevel=at;left.outCurve=curves[0];right.gain*=at;right.outLevel=(c.outLevel||0)/at;right.inLevel=0;right.outCurve=curves[1];}
return [left,right];}
// Rebuild only when clip geometry changes. Manual curves and levels survive a move.
export function syncCrossfades(clips){for(const c of clips){for(const edge of ['In','Out']){const key='autoFade'+edge,level=edge.toLowerCase()+'Level';if(c[key]){c['fade'+edge]=c[key].duration;c[level]=c[key].level;delete c[key];}}tidy(c);}
const pairs=[];for(let i=0;i<clips.length;i++)for(let j=i+1;j<clips.length;j++){let a=clips[i],b=clips[j];if(a.track!==b.track)continue;if(a.start>b.start)[a,b]=[b,a];const ae=a.start+a.duration,be=b.start+b.duration;if(b.start<=a.start+1e-7||b.start>=ae-1e-7||ae>be+1e-7)continue;const duration=ae-b.start;pairs.push({a:a.id,b:b.id,track:a.track,start:b.start,duration});for(const [c,edge] of [[a,'Out'],[b,'In']]){const key='autoFade'+edge,level=edge.toLowerCase()+'Level';if(!c[key]){c[key]={duration:c['fade'+edge],level:c[level]||0};c['fade'+edge]=duration;}else c['fade'+edge]=Math.max(c['fade'+edge],duration);c[level]=0;}}
for(const c of clips)tidy(c);return pairs;}
export const gainY=gain=>gain<=0?94:clamp(30-20*Math.log10(gain)/.75,14,94);
export const gainAtY=y=>y>=94?0:10**((30-clamp(y,14,94))*.75/20);
// Sample curved fades only; long steady sections do not create extra automation.
export function envelopeEvents(c,from=0){const times=new Set([from,c.duration]);for(const [a,b] of [[0,c.fadeIn],[c.duration-c.fadeOut,c.duration]])if(b>a){const steps=256;for(let i=0;i<=steps;i++){const t=a+(b-a)*i/steps;if(t>from)times.add(t);}}return [...times].filter(t=>t>=from&&t<=c.duration).sort((a,b)=>a-b).map(t=>[t,envelope(c,t)]);}
export function encodeWav(buffer){const channels=buffer.numberOfChannels,n=buffer.length,ab=new ArrayBuffer(44+n*channels*2),v=new DataView(ab);let peak=0;const data=Array.from({length:channels},(_,i)=>buffer.getChannelData(i));for(const ch of data)for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(ch[i]));const scale=peak>1?1/peak:1;const str=(p,s)=>{for(let i=0;i<s.length;i++)v.setUint8(p+i,s.charCodeAt(i))};str(0,'RIFF');v.setUint32(4,36+n*channels*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,buffer.sampleRate,true);v.setUint32(28,buffer.sampleRate*channels*2,true);v.setUint16(32,channels*2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*channels*2,true);for(let i=0,p=44;i<n;i++)for(let c=0;c<channels;c++,p+=2){let x=clamp(data[c][i]*scale,-1,1);v.setInt16(p,x<0?x*32768:x*32767,true)}return{blob:new Blob([ab],{type:'audio/wav'}),attenuated:peak>1};}
