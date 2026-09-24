import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';import {parseHTML} from 'linkedom';
import * as speedLib from '../dist/speed.mjs';import * as transportLib from '../dist/transport.mjs';import * as movement from '../dist/movement.mjs';
import * as waveform from '../dist/waveform.mjs';import * as settings from '../dist/settings.mjs';import * as icons from '../dist/icons.mjs';
import * as core from '../dist/core.mjs';import * as projects from '../dist/projects.mjs';import * as dsp from '../dist/dsp.mjs';import * as effects from '../dist/effects.mjs';
const {document,window:domWindow}=parseHTML(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'));
const elements=id=>document.getElementById(id),listeners=new Map(),storage=new Map();
const window={Event:domWindow.Event,innerWidth:390,innerHeight:664,matchMedia:()=>({matches:true,addEventListener(){}})};
for(const d of document.querySelectorAll('dialog')){Object.defineProperty(d,'open',{get:()=>d.hasAttribute('open')});d.showModal=()=>d.setAttribute('open','');d.close=()=>{d.removeAttribute('open');d.dispatchEvent(new window.Event('close'));};}
const selectProto=Object.getPrototypeOf(document.createElement('select'));Object.defineProperty(selectProto,'value',{get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(value){for(const o of this.querySelectorAll('option')){if(o.value===String(value))o.setAttribute('selected','');else o.removeAttribute('selected');}},configurable:true});
for(const el of document.querySelectorAll('input')){if(el.hasAttribute('checked'))el.checked=true;el.select=()=>{};}
Object.defineProperty(elements('timelineScroll'),'clientWidth',{value:294});elements('timelineScroll').scrollLeft=0;elements('timelineScroll').scrollTop=0;elements('timelineScroll').getBoundingClientRect=()=>({left:0,right:390,top:55,bottom:490,width:390,height:435});
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
assert(run('mobile'));assert(document.documentElement.classList.contains('mobile'));assert.equal(elements('inspectorContents').parentNode.id,'blockContents');
context.fixture=new File(['voice'],'Voix.wav',{type:'audio/wav'});await run('importFiles([fixture])');context.assetId=run('[...assets.keys()][0]');
assert(!elements('libraryPanel').hidden);assert(!elements('sheetBackdrop').hidden||typeof MutationObserver==='undefined');
// Files sheet: choose a track, add at the playhead, the sheet closes.
run('cursor=2;fillLibraryTracks()');const second=run('state.tracks[1].id');elements('libraryTrack').value=second;run('addFromLibrary(assetId)');
assert.equal(run('state.clips[0].track'),second);assert.equal(run('state.clips[0].start'),2);assert(elements('libraryPanel').hidden);
assert(!elements('mobileSelection').hidden);assert(elements('mobileSelectionName').textContent.includes('Voix.wav'));
// Taps: empty lane deselects and places the playhead; a tap selects; a second tap on the selection places the playhead.
const lane=document.querySelector('.lane'),clip=()=>document.querySelector('.clip');
run('pps=40');context.tapInfo={target:lane,x:96+160,playing:false};run('handleTap(tapInfo)');assert.equal(run('selected'),null);assert.equal(run('cursor'),4);assert(elements('mobileSelection').hidden);
context.tapInfo={target:clip(),x:96+120,playing:false,selected:false};run('handleTap(tapInfo)');assert.equal(run('selected'),run('state.clips[0].id'));assert.equal(run('cursor'),4);
context.tapInfo={target:clip(),x:96+200,playing:false,selected:true};run('handleTap(tapInfo)');assert.equal(run('cursor'),5);
// Tap recognition from pointer events, cancelled by a scroll.
emit('pointerup',touch(0));const down=new window.Event('pointerdown',{bubbles:true});Object.assign(down,touch(96+40,{pointerId:3}));lane.dispatchEvent(down);emit('pointerup',touch(96+40,{pointerId:3}));assert.equal(run('cursor'),1);
lane.dispatchEvent(Object.assign(new window.Event('pointerdown',{bubbles:true}),touch(96+280,{pointerId:4})));emit('pointercancel',{pointerId:4});emit('pointerup',touch(96+280,{pointerId:4}));assert.equal(run('cursor'),1);
// A finger on an unselected block scrolls instead of dragging; a selected block drags past a finger-sized threshold.
run('selectOnly(null);render()');const start=run('state.clips[0].start');context.ev={...touch(200),currentTarget:clip(),target:clip()};run('startDrag(ev)');emit('pointermove',touch(280));emit('pointerup',touch(280));assert.equal(run('state.clips[0].start'),start);
run('selectOnly(state.clips[0].id);render()');context.ev={...touch(200),currentTarget:clip(),target:clip()};run('startDrag(ev)');emit('pointermove',touch(205));assert.equal(run('state.clips[0].start'),start);emit('pointermove',touch(240));emit('pointerup',touch(240));assert.equal(run('state.clips[0].start'),start+1);
// Multi-selection by taps.
run("addAsset(assetId,state.tracks[0].id,20)");const ids=run('state.clips.map(c=>c.id)');run('selectOnly(null)');elements('multiSelect').onclick();assert(run('multiSelect'));
for(const id of ids){context.tapInfo={target:document.querySelector(`.clip[data-clip="${id}"]`),x:0,selected:false};run('handleTap(tapInfo)');}
assert.equal(run('selectedClips().length'),2);assert(elements('mobileSelectionName').textContent.includes('2 blocs'));elements('multiSelect').onclick();
// Block sheet: nudge and fade sliders apply to the selection.
run(`selectOnly('${ids[0]}');openInspector()`);assert(elements('blockDialog').open);const before=run('state.clips[0].start');elements('selection').querySelector('[data-nudge="1"]').onclick();assert.equal(run('state.clips[0].start'),before+1);
elements('clipFadeIn').value='1.5';elements('clipFadeIn').onchange();assert.equal(run('state.clips[0].fadeIn'),1.5);run('undo()');assert.equal(run('state.clips[0].fadeIn'),0);elements('blockDialog').close();
// Track sheet: rename, mute, magnet, order, delete.
const trackId=run('state.tracks[0].id');context.tapInfo={target:document.querySelector('.track-header .track-name'),x:20};run('handleTap(tapInfo)');assert(elements('trackDialog').open);
elements('trackName').value='Invité';elements('trackName').onchange({target:elements('trackName')});assert.equal(run('state.tracks[0].name'),'Invité');
elements('trackContents').querySelector('[data-track-toggle="mute"]').onclick();assert(run('state.tracks[0].mute'));
elements('trackContents').querySelector('[data-track-snap="2"]').onclick();assert.equal(run('state.tracks[0].snap'),2);
elements('trackDown').onclick();assert.equal(run('state.tracks[1].id'),trackId);elements('trackDelete').onclick();assert(!run(`state.tracks.some(t=>t.id==='${trackId}')`));assert(!elements('trackDialog').open);
// Bars drive the desktop controls and mirror their state.
const zone=document.querySelector('#mobileTools [data-proxy="zoneButton"]');zone.onclick();assert(run('state.zoneMode'));assert.equal(zone.getAttribute('aria-pressed'),'true');assert(elements('status').textContent.includes('glissez'));
document.querySelector('#mobileTools [data-proxy="rippleMode"]').onclick();assert.equal(document.querySelector('#mobileTools [data-proxy="rippleMode"]').dataset.mode,'1');
elements('mobileUndo').onclick();assert.equal(run("state.rippleMode||'off'"),'off');
// Tapping outside a sheet closes it on the click, never on the lifted finger, so nothing underneath is pressed.
run("openExport()");const sheet=elements('exportDialog');sheet.getBoundingClientRect=()=>({left:0,right:390,top:300,bottom:664});
const at=(type,y)=>{const e=new window.Event(type,{bubbles:true});Object.assign(e,{clientX:100,clientY:y,pointerType:'touch'});sheet.dispatchEvent(e);};
context.setTimeout=()=>1;at('pointerdown',100);at('pointerup',100);assert(sheet.open);at('click',100);assert(!sheet.open);context.setTimeout=(f,ms=0)=>{if(ms<1000)f();return 0;};
// Layout choice: desktop on a phone is remembered, choosing the automatic layout again clears it.
run("setLayout('desktop')");assert(!run('mobile'));assert(!document.documentElement.classList.contains('mobile'));assert.equal(storage.get('onde-layout'),'desktop');
run("setLayout('mobile')");assert(run('mobile'));assert.equal(storage.get('onde-layout'),'auto');
console.log('Téléphone : feuilles, pistes, fichiers, touchers, glisser au seuil, sélection multiple, barres miroir, fermeture sans clic traversant, choix d’interface : OK.');
