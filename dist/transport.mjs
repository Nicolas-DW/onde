export const SPEEDS=[.5,1,1.5,2,3];
export function validLoop(loop){return loop&&Number.isFinite(loop.start)&&Number.isFinite(loop.end)&&loop.start>=0&&loop.end-loop.start>=.1-1e-9?loop:null;}
export function transportPosition(from,elapsed,rate,loop){const position=from+Math.max(0,elapsed)*rate,l=validLoop(loop);return l?.enabled&&from<l.end&&position>=l.end?l.start+(position-l.end)%(l.end-l.start):position;}
// Queue the next pass before the current one ends. Audio boundaries are set
// on the audio clock; visual animation does not drive loop restarts.
export function createTransport(context,{from,end,rate=1,loop,destination,schedule}){
 const l=validLoop(loop),cycling=!!(l?.enabled&&from<l.end),base=context.currentTime+.03,active=new Set();let stopped=false,nextAt=base;
 function queue(start,stop){const at=nextAt;nextAt+=(stop-start)/rate;const graph=schedule(context,start,destination,{to:stop,rate,base:at}),sentinel=context.createBufferSource();sentinel.buffer=context.createBuffer(1,1,context.sampleRate);sentinel.loop=true;sentinel.connect(destination);const chunk={graph,sentinel};active.add(chunk);sentinel.onended=()=>{active.delete(chunk);graph.cleanup();sentinel.disconnect();if(cycling&&!stopped){if(nextAt<context.currentTime)nextAt=context.currentTime+.01;queue(l.start,l.end);}};sentinel.start(at);sentinel.stop(nextAt);}
 queue(from,cycling?l.end:end);if(cycling)queue(l.start,l.end);
 return {startedAt:base,position:()=>transportPosition(from,context.currentTime-base,rate,cycling?l:null),stop(){stopped=true;for(const {graph,sentinel}of active){sentinel.onended=null;try{sentinel.stop();}catch{}sentinel.disconnect();for(const source of graph){try{source.stop();}catch{}}graph.cleanup();}active.clear();}};
}
