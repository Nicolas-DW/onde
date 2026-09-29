import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';import {parseHTML} from 'linkedom';
import * as speedLib from '../dist/speed.mjs';import * as transportLib from '../dist/transport.mjs';import * as movement from '../dist/movement.mjs';
import * as waveform from '../dist/waveform.mjs';import * as settings from '../dist/settings.mjs';import * as icons from '../dist/icons.mjs';
import * as core from '../dist/core.mjs';import * as projects from '../dist/projects.mjs';import * as dsp from '../dist/dsp.mjs';import * as effects from '../dist/effects.mjs';
const {document,window:domWindow}=parseHTML(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'));
const elements=id=>document.getElementById(id),listeners=new Map(),storage=new Map();
const window={Event:domWindow.Event,innerWidth:1280,innerHeight:800};
for(const d of document.querySelectorAll('dialog')){Object.defineProperty(d,'open',{get:()=>d.hasAttribute('open')});d.showModal=()=>d.setAttribute('open','');d.close=()=>{d.removeAttribute('open');d.dispatchEvent(new window.Event('close'));};}
const selectProto=Object.getPrototypeOf(document.createElement('select'));Object.defineProperty(selectProto,'value',{get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(value){for(const o of this.querySelectorAll('option')){if(o.value===String(value))o.setAttribute('selected','');else o.removeAttribute('selected');}},configurable:true});
for(const el of document.querySelectorAll('input')){if(el.hasAttribute('checked'))el.checked=true;el.select=()=>{};}
Object.defineProperty(elements('timelineScroll'),'clientWidth',{value:1000});elements('timelineScroll').scrollLeft=0;elements('timelineScroll').scrollTop=0;elements('timelineScroll').getBoundingClientRect=()=>({left:0,right:390,top:55,bottom:490,width:390,height:435});
window.addEventListener=(k,f)=>{if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(f);};window.removeEventListener=(k,f)=>listeners.get(k)?.delete(f);
document.elementFromPoint=()=>document.querySelector('.track');
const samples=new Float32Array(441000);const buffer={duration:10,numberOfChannels:1,sampleRate:44100,length:samples.length,getChannelData:()=>samples};
class AudioContext{async decodeAudioData(){return buffer;}}
const context=vm.createContext({...speedLib,...transportLib,...movement,...waveform,...settings,...icons,...core,...projects,...dsp,...effects,console,document,window,crypto:globalThis.crypto,structuredClone,Float32Array,Blob,File,Map,Set,JSON,Math,URL,AudioContext,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},getComputedStyle:()=>({getPropertyValue:()=>96}),setTimeout:(f,ms=0)=>{if(ms<1000)f();return 0;},clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},confirm:()=>true,Date});
const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,'').replaceAll('import.meta.url',JSON.stringify(new URL('../dist/app.js',import.meta.url).href));
vm.runInContext(source,context);const run=s=>vm.runInContext(s,context);
const emit=(type,e)=>{for(const f of [...listeners.get(type)||[]])f(e);};
const touch=(x,extra={})=>({button:0,clientX:x,clientY:200,pointerType:'touch',pointerId:7,preventDefault(){},stopPropagation(){},...extra});
// Small touch screens get the phone layout; the block settings live in a sheet.
Object.defineProperty(document,'activeElement',{get:()=>document.body,configurable:true});
const key=(k,extra={})=>{let prevented=false;emit('keydown',{key:k,metaKey:true,ctrlKey:false,shiftKey:false,altKey:false,code:'Key'+k.toUpperCase(),preventDefault(){prevented=true;},...extra});return prevented;};
const starts=track=>JSON.parse(run(`JSON.stringify(state.clips.filter(c=>c.track===state.tracks[${track}].id).map(c=>c.start).sort((a,b)=>a-b))`));
assert(!run('mobile'));
context.fixture=new File(['voice'],'Voix.wav',{type:'audio/wav'});await run('importFiles([fixture])');context.assetId=run('[...assets.keys()][0]');
run("addAsset(assetId,state.tracks[0].id,0);state.clips[0].duration=4;state.clips[0].fadeOut=1;state.clips[0].gain=.5;addAsset(assetId,state.tracks[1].id,3);state.clips[1].duration=2;render()");
// ⌘D duplicates the selected block right after itself, with all its settings, and selects the copy.
run('selectOnly(state.clips[0].id);render()');assert(elements('duplicate').disabled===false);assert(key('d'));
assert.deepEqual(starts(0),[0,4]);const copy=run('state.clips.find(c=>c.id===selected)');assert.equal(copy.start,4);assert.equal(copy.gain,.5);assert.equal(copy.fadeOut,1);assert.notEqual(copy.id,run('state.clips[0].id'));
run('undo()');assert.deepEqual(starts(0),[0]);
// A group keeps its spacing and its tracks.
run('selectOnly(state.clips[0].id);toggleSelection(state.clips[1].id);render()');assert(key('d'));assert.deepEqual(starts(0),[0,5]);assert.deepEqual(starts(1),[3,8]);assert.equal(run('selectedClips().length'),2);run('undo()');
// ⌘C / ⌘V: at the playhead, on the selected block's track, else on the original track.
run('selectOnly(state.clips[0].id);render()');assert(key('c'));run('cursor=20;selectOnly(state.clips[1].id);render()');assert(key('v'));assert.deepEqual(starts(1),[3,20]);
run('cursor=30;selectOnly(null);render()');assert(key('v'));assert.deepEqual(starts(0),[0,30]);
run('selectOnly(state.clips[0].id);toggleSelection(state.clips[1].id);render()');key('c');run('cursor=40;selectOnly(null);render()');key('v');assert.deepEqual(starts(0),[0,30,40]);assert.deepEqual(starts(1),[3,20,43]);
// ⌘X cuts; nothing selected and nothing copied leaves the browser shortcut alone.
run('selectOnly(state.clips.find(c=>c.start===43).id);render()');assert(key('x'));assert.deepEqual(starts(1),[3,20]);run('cursor=50;selectOnly(null);render()');key('v');assert.deepEqual(starts(1),[3,20,50]);
run('editClipboard=null;selectOnly(null);render()');assert(!key('c'));assert(!key('v'));assert(!key('d'));
// A click on a track header selects the whole track: ⌘D inserts a copy below it with its blocks.
const count=run('state.clips.length'),first=run('state.tracks[0].id'),before=run('state.tracks.length');
document.querySelector('.track-header').dispatchEvent(Object.assign(new window.Event('pointerdown',{bubbles:true}),{button:0}));assert.equal(run('selectedTrack()'),first);assert(document.querySelector('.track').classList.contains('selected-track'));
assert(key('d'));assert.equal(run('state.tracks.length'),before+1);assert.equal(run('state.tracks[1].name'),run('state.tracks[0].name')+' (copie)');assert.deepEqual(starts(1),starts(0));
assert.equal(run('state.clips.length'),count+starts(0).length);assert.equal(run('new Set(state.clips.map(c=>c.id)).size'),run('state.clips.length'));assert.equal(run('selectedTrack()'),run('state.tracks[1].id'));
run('undo()');assert.equal(run('state.tracks.length'),before);
// Copied track pasted below the selected one; the track menu offers the same actions.
run(`selectTrack('${first}')`);key('c');run(`selectTrack(state.tracks[2].id)`);key('v');assert.equal(run('state.tracks.length'),before+1);assert.equal(run('state.tracks[3].name'),run('state.tracks[0].name')+' (copie)');assert.deepEqual(starts(3),starts(0));
run(`openTrackMenu('${first}',10,10)`);document.querySelector('[data-track-action="duplicate"]').onclick();assert.equal(run('state.tracks.length'),before+2);assert.equal(run('state.tracks[1].name'),run('state.tracks[0].name')+' (copie)');
// The block menu duplicates and copies; a copy carries its source into another project.
run('selectOnly(state.clips[0].id);openClipMenu(state.clips[0].id,10,10)');document.querySelector('[data-menu-action="copy-clip"]').onclick();
run("assets=new Map();state.clips=[];state.removedAssets=[assetId];cursor=2;selectOnly(null);render()");key('v');assert(run('assets.has(assetId)'));assert(!run('state.removedAssets.includes(assetId)'));assert.equal(run('state.clips[0].start'),2);assert.equal(run('projectAssets().length'),1);
run('selectOnly(state.clips[0].id);openClipMenu(state.clips[0].id,10,10)');document.querySelector('[data-menu-action="duplicate"]').onclick();assert.equal(run('state.clips.length'),2);
console.log('Duplication : ⌘D, ⌘C, ⌘X, ⌘V, groupes, piste entière, menus, collage vers un autre projet et annulation : OK.');
