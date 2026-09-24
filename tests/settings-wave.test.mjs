import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {buildWaveform,sampleRange,wavePath} from '../dist/waveform.mjs';
import {captureSettings,applySettings,saveSettings,listSettings,deleteSettings} from '../dist/settings.mjs';
const left=new Float32Array(30000),right=new Float32Array(30000);left[5000]=.8;right[5011]=-1;
const w=buildWaveform({length:left.length,numberOfChannels:2,sampleRate:1000,getChannelData:i=>i?right:left});
assert.deepEqual(sampleRange(w,4999,5012),[-1,left[5000]]);assert.deepEqual(sampleRange(w,5012,5500),[0,0]);
for(let i=0;i<150;i++){const a=i*197,b=a+170;const all=[...left.slice(a,b),...right.slice(a,b)];assert.deepEqual(sampleRange(w,a,b),[Math.min(...all),Math.max(...all)]);}
assert.equal((wavePath(w,0,30,10,0,300).match(/M/g)||[]).length,300);
assert.equal((wavePath(w,0,30,500,1000,1900).match(/M/g)||[]).length,900); // bounded by viewport, never 15000
assert(wavePath(w,4.99,.03,500,0,15).includes('v29.00')); // stereo negative transient retained
const source={gain:.5,fadeIn:4,fadeOut:2,inCurve:[.2,0,.8,1],fx:{enabled:true,deess:35}},target={id:'other',name:'Other',start:12,offset:3,duration:2,asset:'audio2',gain:1};
const full=captureSettings(source,'clip');applySettings(target,'clip',full);assert.equal(target.start,12);assert.equal(target.asset,'audio2');assert.equal(target.name,'Other');assert.equal(target.gain,.5);assert.equal(target.fadeIn+target.fadeOut,2);assert.equal(target.fx.deess,35);target.inCurve[0]=.1;assert.equal(full.inCurve[0],.2);
const fx=captureSettings(source,'clip',true),track={gain:.8,mute:true};applySettings(track,'track',fx);assert.equal(track.gain,.8);assert.equal(track.mute,true);assert.equal(track.fx.deess,35);assert.equal(applySettings(track,'track',full),false);
const master={};applySettings(master,'master',fx);assert.equal(master.fx.deess,35);
await saveSettings({id:'one',name:'Podcast',payload:full});const read=await listSettings();assert.equal(read[0].payload.fx.deess,35);await deleteSettings('one');assert.equal((await listSettings()).length,0);
console.log('Réglages : copie isolée, compatibilité, géométrie préservée, persistance. Onde : stéréo, transitoires, zoom borné à la vue : OK.');
