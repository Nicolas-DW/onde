import assert from 'node:assert/strict';import {effectChain,prepareEffects} from '../dist/effects.mjs';
const links=[],loaded=[],nodes=[];const node=type=>{const n={type,frequency:{value:0},Q:{value:0},gain:{value:1},connect(other){links.push([n,other]);},disconnect(){}};nodes.push(n);return n;};
const context={createGain:()=>node('gain'),createBiquadFilter:()=>node('biquad'),audioWorklet:{async addModule(url){loaded.push(url.href);}}};
globalThis.AudioWorkletNode=class{constructor(c,name,options){Object.assign(this,node(name));this.options=options;}};
const state={fx:{enabled:true,compress:true},tracks:[],clips:[]};await prepareEffects(context,state);await prepareEffects(context,state);assert.equal(loaded.length,1);assert(loaded[0].endsWith('/dist/voice-worklet.js'));
const chain=effectChain(context,{enabled:true,highpass:80,bass:-2,presence:3,deess:30,compress:true,limiter:true});assert.equal(nodes[1].type,'highpass');assert.equal(nodes[1].frequency.value,80);assert.equal(chain.output.options.processorOptions.deess,30);assert.equal(links.length,4);assert.equal(links[0][0],chain.input);assert.equal(links.at(-1)[1],chain.output);chain.disconnect();
const old=nodes.length;effectChain(context,{enabled:false,compress:true,highpass:80});assert.equal(nodes.length,old+1);console.log('Chaîne de traitement : module chargé une fois, EQ avant dynamique, paramètres transmis, bypass : OK.');
// A disconnected chain releases its processor: one that keeps returning true runs forever.
const sent=[];globalThis.AudioWorkletNode=class{constructor(c,name,options){Object.assign(this,node(name));this.options=options;this.port={postMessage:m=>sent.push(m)};}};
effectChain(context,{enabled:true,compress:true}).disconnect();assert.deepEqual(sent,['stop']);
let Processor;Object.assign(globalThis,{sampleRate:48000,AudioWorkletProcessor:class{constructor(){this.port={};}},registerProcessor:(n,c)=>Processor=c});
await import('../dist/voice-worklet.js');const proc=new Processor({processorOptions:{enabled:true,compress:true}}),out=[new Float32Array(128),new Float32Array(128)];
assert.equal(proc.process([[new Float32Array(128).fill(.1)]],[out]),true);proc.port.onmessage({data:'stop'});assert.equal(proc.process([[new Float32Array(128)]],[out]),false);
console.log('Processeur de voix arrêté à la déconnexion : OK.');
