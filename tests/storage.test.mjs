import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {buildWaveform,waveCache,validWaveCache,sampleRange} from '../dist/waveform.mjs';
import {mapLimit} from '../dist/core.mjs';

const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const raw=async(store,key)=>{const db=await req(indexedDB.open('onde-projects'));try{const s=db.transaction(store).objectStore(store);return await req(key===undefined?s.getAll():s.get(key));}finally{db.close();}};

// A version 1 database, as written by previous releases: blobs inside each project record.
await new Promise((resolve,reject)=>{const r=indexedDB.open('onde-projects',1);r.onupgradeneeded=()=>{const db=r.result;db.createObjectStore('projects',{keyPath:'id'});db.createObjectStore('contents',{keyPath:'id'});};r.onsuccess=()=>{const db=r.result,tx=db.transaction(['projects','contents'],'readwrite');tx.objectStore('projects').put({id:'old',name:'Ancien',revision:3,savedAt:1,bytes:5,tracks:1,duration:4});tx.objectStore('contents').put({id:'old',version:3,revision:3,savedAt:1,state:{name:'Ancien',tracks:[{id:'t'}],clips:[{id:'c',track:'t',asset:'a',start:0,duration:4}]},assets:[{id:'a',name:'Voix.wav',blob:new Blob(['audio'],{type:'audio/wav'})}]});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};r.onerror=()=>reject(r.error);});

const {listProjects,readProject,writeProject,deleteProject}=await import('../dist/projects.mjs');
const migrated=await readProject('old');
assert.equal(migrated.revision,3);assert.equal(await migrated.assets[0].blob.text(),'audio');assert.equal(migrated.assets[0].name,'Voix.wav');
assert.equal((await raw('contents','old')).assets[0].blob,undefined);assert.equal((await raw('contents','old')).assets[0].size,5);assert.equal(await (await raw('media','a')).blob.text(),'audio');
assert.equal((await listProjects())[0].name,'Ancien');
console.log('Migration v1 → v2 : sources sorties des projets, révision et contenu conservés : OK.');

// Saving again never rewrites a stored source: a different Blob of the same size is ignored.
const wave={length:10,rate:44100,lo:new Int16Array(1),hi:new Int16Array(1)};
migrated.assets[0]={...migrated.assets[0],blob:new Blob(['AUDIO'],{type:'audio/wav'}),wave};
assert.equal(await writeProject(migrated,3),4);
assert.equal(await (await raw('media','a')).blob.text(),'audio');
assert.deepEqual((await raw('media','a')).wave,wave);assert.deepEqual((await readProject('old')).assets[0].wave,wave);
console.log('Sauvegarde : source déjà stockée non réécrite, cache d’onde ajouté : OK.');

// Copies share their sources; a source disappears with the last project using it.
const copy={...await readProject('old'),id:'copy'};copy.state={...copy.state,name:'Copie'};
assert.equal(await writeProject(copy),1);assert.equal((await raw('media')).length,1);
await deleteProject('old');assert.equal(await (await raw('media','a')).blob.text(),'audio');
const extra={...await readProject('copy')};extra.assets=[...extra.assets,{id:'b',name:'Musique.wav',blob:new Blob(['music'])}];
assert.equal(await writeProject(extra,1),2);assert.equal((await raw('media')).length,2);
extra.assets=extra.assets.filter(a=>a.id!=='b');assert.equal(await writeProject(extra,2),3);
assert.deepEqual((await raw('media')).map(m=>m.id),['a']);
await deleteProject('copy');assert.equal((await raw('media')).length,0);assert.equal((await listProjects()).length,0);
console.log('Sources partagées entre copies, retirées avec le dernier projet ou quand elles ne sont plus utilisées : OK.');

// Missing source is reported instead of opening a broken project.
await writeProject({id:'broken',version:3,state:{name:'X',tracks:[],clips:[]},assets:[{id:'z',name:'Perdu.wav',blob:new Blob(['z'])}]});
{const db=await req(indexedDB.open('onde-projects'));await req(db.transaction('media','readwrite').objectStore('media').delete('z'));db.close();}
await assert.rejects(readProject('broken'),/Perdu\.wav/);await deleteProject('broken');

// Waveform cache: same display as a full scan, rejected for another decode.
const samples=Float32Array.from({length:44100*3+77},(_,i)=>.8*Math.sin(i/9)*(i%5000<40?1:.3)),second=samples.map(v=>-v/2);
const buffer={numberOfChannels:2,length:samples.length,sampleRate:44100,getChannelData:i=>i?second:samples};
const full=buildWaveform(buffer),cache=waveCache(full),fast=buildWaveform(buffer,cache);
assert(validWaveCache(cache,buffer.length,44100));assert(!validWaveCache(cache,buffer.length,48000));assert(!validWaveCache(cache,buffer.length+500,44100));assert(!validWaveCache(null,1,1));
assert.equal(fast.levels.length,full.levels.length);
for(const [from,to] of [[0,300],[1000,90000],[5000,5040],[0,buffer.length]]){const a=sampleRange(full,from,to),b=sampleRange(fast,from,to);assert(b[0]<=a[0]+1e-9&&b[0]>a[0]-1e-4&&b[1]>=a[1]-1e-9&&b[1]<a[1]+1e-4,`${from}-${to}`);}
const stale=buildWaveform(buffer,{...cache,rate:48000});assert.deepEqual([...stale.levels[0].lo.slice(0,20)],[...full.levels[0].lo.slice(0,20)]);
console.log('Cache d’onde : affichage identique au calcul complet, ignoré pour un autre décodage : OK.');

// Parallel map: bounded concurrency and input order kept.
let active=0,peak=0;const order=await mapLimit([30,5,20,1,10],2,async(ms,i)=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,ms));active--;return i;});
assert.deepEqual(order,[0,1,2,3,4]);assert.equal(peak,2);assert.deepEqual(await mapLimit([],3,async x=>x),[]);
console.log('Décodage parallèle : deux à la fois, ordre des fichiers conservé : OK.');
