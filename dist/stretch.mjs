// Waveform-similarity overlap-add. Channels share frame alignment so stereo
// relationships survive time scaling. Reference: Verhelst & Roelands, 1993.
export function stretchAudio(channels,sampleRate,rate){
 if(!channels.length||!channels[0].length)return channels.map(()=>new Float32Array(0));
 if(![.5,1,1.5,2,3].includes(rate))throw Error('Vitesse non prise en charge');
 if(rate===1)return channels.map(c=>c.slice());
 const n=channels[0].length,length=Math.ceil(n/rate),hop=Math.max(128,Math.round(sampleRate*.02)),win=hop*2,search=Math.round(sampleRate*.012),out=channels.map(()=>new Float32Array(length+win));
 let guide=0,energy=-1;for(let c=0;c<channels.length;c++){let e=0;for(let i=0;i<n;i+=97)e+=channels[c][i]**2;if(e>energy){energy=e;guide=c;}}
 const mono=channels[guide],value=i=>i>=0&&i<n?mono[i]:0,weights=Float32Array.from({length:hop},(_,i)=>(1-Math.cos(Math.PI*i/hop))/2);
 for(let c=0;c<channels.length;c++)out[c].set(channels[c].subarray(0,Math.min(win,n)));
 let previous=0;
 for(let pos=hop;pos<length;pos+=hop){const ideal=Math.round(pos*rate),lo=Math.max(0,ideal-search),hi=Math.min(n-1,ideal+search),reference=previous+hop;let best=Math.min(n-1,ideal),score=-Infinity;
 const similarity=candidate=>{let dot=0,a=0,b=0;for(let j=0;j<hop;j+=8){const x=value(reference+j),y=value(candidate+j);dot+=x*y;a+=x*x;b+=y*y;}return a*b>1e-14?dot/Math.sqrt(a*b)-Math.abs(candidate-ideal)*1e-7:-Math.abs(candidate-ideal);};
 for(let i=lo;i<=hi;i+=16){const s=similarity(i);if(s>score){score=s;best=i;}}
 const coarse=best;for(let i=Math.max(lo,coarse-15);i<=Math.min(hi,coarse+15);i++){const s=similarity(i);if(s>score){score=s;best=i;}}
 for(let c=0;c<channels.length;c++){const input=channels[c],target=out[c];for(let j=0;j<hop;j++)target[pos+j]=target[pos+j]*(1-weights[j])+(input[best+j]||0)*weights[j];for(let j=hop;j<win;j++)target[pos+j]=input[best+j]||0;}
 previous=best;
 }
 return out.map(c=>c.slice(0,length));
}
