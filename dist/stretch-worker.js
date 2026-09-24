import {stretchAudio} from './stretch.mjs';
self.onmessage=({data})=>{try{const channels=stretchAudio(data.channels,data.sampleRate,data.rate);self.postMessage({channels},channels.map(c=>c.buffer));}catch(e){self.postMessage({error:e.message});}};
