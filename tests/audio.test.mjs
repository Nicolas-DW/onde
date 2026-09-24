import assert from 'node:assert/strict';
import {envelope,splitClip,PRESETS,syncCrossfades,gainY,gainAtY,envelopeEvents} from '../dist/core.mjs';
const make=(x={})=>({id:'a',track:'one',start:0,offset:0,duration:10,gain:.8,fadeIn:4,fadeOut:4,...x});
for(const shape of Object.values(PRESETS))for(const p of [.15,2,5,8,9.85]){
 const c=make({inCurve:shape,outCurve:shape,inLevel:.15,outLevel:.1}),parts=splitClip(c,p,'b');
 for(let t=.001;t<10;t+=.033){const part=t<p?parts[0]:parts[1];assert(Math.abs(envelope(c,t)*c.gain-envelope(part,t<p?t:t-p)*part.gain)<1e-7,'Split must preserve audible gain');}
}
const a=make({fadeIn:0,fadeOut:.25}),b=make({id:'b',start:8,fadeIn:.4,fadeOut:0,gain:1});
syncCrossfades([a,b]);assert.equal(a.fadeOut,2);assert.equal(b.fadeIn,2);
for(let t=0;t<2;t+=.01)assert(Math.abs(envelope(a,8+t)+envelope(b,t)-1)<1e-8);
b.start=6;syncCrossfades([a,b]);assert.equal(a.fadeOut,4);assert.equal(b.fadeIn,4);
b.track='two';syncCrossfades([a,b]);assert.equal(a.fadeOut,.25);assert.equal(b.fadeIn,.4);
b.track='one';b.start=8;syncCrossfades([a,b]);const restored=JSON.parse(JSON.stringify([a,b]));restored[1].start=12;syncCrossfades(restored);assert.equal(restored[0].fadeOut,.25);
for(const gain of [.01,.1,.5,1,2,3.98])assert(Math.abs(gainAtY(gainY(gain))-gain)<1e-10);assert.equal(gainAtY(94),0);
const curve=make({inCurve:PRESETS.smooth,outCurve:PRESETS.fast});
for(const from of [0,1.87,7.2]){const ev=envelopeEvents(curve,from);assert.equal(ev[0][0],from);assert.equal(ev.at(-1)[0],10);for(let t=from;t<10;t+=.009){const j=ev.findIndex(e=>e[0]>t);if(j<1)continue;const [x,y]=ev[j-1],[xx,yy]=ev[j];assert(Math.abs(y+(yy-y)*(t-x)/(xx-x)-envelope(curve,t))<.0002);}}
console.log('Curved split continuity, auto crossfade restoration, gain mapping and playback automation: OK.');
