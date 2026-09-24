import assert from 'node:assert/strict';
import {stretchAudio} from '../dist/stretch.mjs';
const sr=24000,n=sr*2,f=220,a=Float32Array.from({length:n},(_,i)=>.5*Math.sin(2*Math.PI*f*i/sr)),b=Float32Array.from(a,x=>-x);
for(const rate of [.5,1,1.5,2,3]){const [out,right]=stretchAudio([a,b],sr,rate);assert.equal(out.length,Math.ceil(n/rate));let crossings=0;const start=Math.floor(sr*.1),stop=out.length-start;for(let i=start+1;i<stop;i++){if(out[i-1]<=0&&out[i]>0)crossings++;assert(Number.isFinite(out[i]));assert(Math.abs(out[i]+right[i])<1e-7);}const measured=crossings*sr/(stop-start);assert(Math.abs(measured-f)<4,`${rate}: ${measured}Hz`);}
for(const rate of [.5,2,3]){const silent=stretchAudio([new Float32Array(1000)],sr,rate)[0];assert(silent.every(x=>x===0));}
console.log('Vitesses ×0,5 / ×1 / ×1,5 / ×2 / ×3 : durée exacte, hauteur 220 Hz conservée, stéréo cohérente et silence : OK.');
