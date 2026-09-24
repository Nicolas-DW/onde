import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import {VoiceDSP,cleanFx} from '../dist/dsp.mjs';
import {pcmWav} from '../dist/formats.mjs';
import {voiceFeatures,hesitationCandidates} from '../dist/analysis.mjs';
const rate=44100,sine=(freq,amp=.5,length=rate)=>Float32Array.from({length},(_,i)=>amp*Math.sin(2*Math.PI*freq*i/rate));
const rms=a=>Math.sqrt(a.slice(rate/2).reduce((n,v)=>n+v*v,0)/(a.length-rate/2));
function process(src,fx){const out=new Float32Array(src.length);new VoiceDSP(rate,fx).process([src],[out]);return out;}
const original=sine(220);assert(rms(process(original,{}))>.34);
assert(rms(process(original,{compress:true,threshold:-28,ratio:4,attack:5}))<rms(original)*.5);
const low=sine(220,.001);assert(rms(process(low,{noise:80,noiseThreshold:-35}))<rms(low)*.3);
const high=sine(9000);assert(rms(process(high,{deess:100}))<rms(high)*.7);
const limited=process(sine(1000,2),{limiter:true});assert(Math.max(...limited.slice(0,10000).map(Math.abs))<=.891251);
assert.equal(cleanFx({ratio:Infinity,noise:-99}).ratio,3);assert.equal(cleanFx({noise:-99}).noise,0);
for(const bits of [16,24,32]){const wav=pcmWav([new Float32Array([1,-1,0,.5])],48000,bits);const v=new DataView(wav);assert.equal(v.getUint16(34,true),bits);assert.equal(v.getUint16(20,true),bits===32?3:1);assert.equal(v.byteLength,44+4*bits/8);if(bits===24)assert.equal(v.getUint8(49),128);}
const lame=vm.createContext({console,Int8Array,Int16Array,Int32Array,Float32Array,Float64Array,Math,Array});vm.runInContext(fs.readFileSync(new URL('../dist/vendor/lame.min.js',import.meta.url),'utf8'),lame);for(const channels of [1,2])for(const sampleRate of [44100,48000]){const encoder=new lame.lamejs.Mp3Encoder(channels,sampleRate,128),data=Int16Array.from({length:sampleRate},(_,i)=>12000*Math.sin(2*Math.PI*330*i/sampleRate)),parts=[];for(let i=0;i<data.length;i+=1152){const block=data.subarray(i,i+1152);const packet=channels===1?encoder.encodeBuffer(block):encoder.encodeBuffer(block,block);if(packet.length)parts.push(Buffer.from(packet));}parts.push(Buffer.from(encoder.flush()));const output=Buffer.concat(parts);assert(output.length>10000);assert.equal(output[0],255);assert.equal(output[1]&224,224);}
const frames=voiceFeatures(sine(160,.3,rate*2),rate);assert(hesitationCandidates(frames,55,.5).length>=1);assert.equal(hesitationCandidates(voiceFeatures(new Float32Array(rate),rate),55,.5).length,0);assert.equal(hesitationCandidates(frames,55,3).length,0);
console.log('Compression, bruit, sifflantes, limiteur, WAV 16/24/32, MP3 mono/stéréo 44.1/48 et repérage indicatif : OK.');
