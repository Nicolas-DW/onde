import {VoiceDSP} from './dsp.mjs';
// A processor that keeps returning true is never released: once its chain is
// disconnected it is told to stop, otherwise every playback would leave one running.
class OndeVoice extends AudioWorkletProcessor{constructor(options){super();this.running=true;this.dsp=new VoiceDSP(sampleRate,options.processorOptions);this.port.onmessage=e=>{if(e.data==='stop')this.running=false;else this.dsp.configure(e.data);};}process(inputs,outputs){return this.running&&this.dsp.process(inputs[0]||[],outputs[0]);}}
registerProcessor('onde-voice',OndeVoice);
