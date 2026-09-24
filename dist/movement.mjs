// The snap tolerance is expressed in screen pixels at every zoom level.
export function snapTime(time,edges,pps,offsets=[0],min=0){
 let result=Math.max(min,time),distance=8/pps,guide=null;
 for(const edge of edges)for(const offset of offsets){const value=edge-offset,d=Math.abs(value-time);if(value>=min&&d<=distance){distance=d;result=value;guide=edge;}}
 return {time:result,guide};
}
// Preserve the old on/off values when reopening existing projects.
export function snapMode(track){return track?.snap===false||track?.snap===0?0:track?.snap===2?2:1;}
export function snapEdges(clips,tracks,trackId=null,exclude=new Set()){
 const source=trackId?tracks.find(t=>t.id===trackId):null;
 if(trackId&&(!source||snapMode(source)===0))return [];
 const all=source?snapMode(source)===2:tracks.some(t=>snapMode(t)===2);
 const enabled=new Set(tracks.filter(t=>all||(source?t.id===trackId:snapMode(t)>0)).map(t=>t.id));
 return clips.filter(c=>enabled.has(c.track)&&!exclude.has(c.id)).flatMap(c=>[c.start,c.start+c.duration]);
}
export function rippleFollowers(clips,original,mode){return clips.filter(c=>c.id!==original.id&&c.start>original.start+1e-7&&(mode==='all'||mode==='track'&&c.track===original.track)).map(c=>({id:c.id,start:c.start}));}
