import assert from 'node:assert/strict';
import {transportPosition,createTransport,validLoop} from '../dist/transport.mjs';
const loop={start:3,end:5,enabled:true};
assert.equal(transportPosition(0,4,1,loop),4);assert.equal(transportPosition(0,5,1,loop),3);assert.equal(transportPosition(0,12,1,loop),4);assert.equal(transportPosition(6,3,1,loop),9);assert.equal(transportPosition(0,3,2,loop),4);assert.equal(transportPosition(0,2,.5,null),1);assert(validLoop({start:4,end:4.1}));
const sources=[],calls=[],context={currentTime:10,sampleRate:48000,createBuffer:()=>({}),createBufferSource(){const s={connect(){},disconnect(){},start(at){this.at=at;},stop(at){this.until=at;}};sources.push(s);return s;}};
let cleanups=0;const t=createTransport(context,{from:4,end:12,rate:2,loop,destination:{},schedule:(ctx,from,dest,opts)=>{calls.push({from,...opts});const graph=[];graph.cleanup=()=>cleanups++;return graph;}});
assert.deepEqual(calls.map(c=>[c.from,c.to,c.rate]),[[4,5,2],[3,5,2]]);assert.equal(calls[1].base,calls[0].base+.5);context.currentTime=10.53;sources[0].onended();assert.equal(calls[2].base,calls[1].base+1);assert.equal(t.position(),3);t.stop();assert.equal(cleanups,3);
console.log('Transport : vitesses, retour de boucle, lecture hors zone et boucles planifiées sans dépendre des images : OK.');
