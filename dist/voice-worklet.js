import {VoiceDSP} from './dsp.mjs';
class OndeVoice extends AudioWorkletProcessor{constructor(options){super();this.dsp=new VoiceDSP(sampleRate,options.processorOptions);this.port.onmessage=e=>this.dsp.configure(e.data);}process(inputs,outputs){return this.dsp.process(inputs[0]||[],outputs[0]);}}
registerProcessor('onde-voice',OndeVoice);
