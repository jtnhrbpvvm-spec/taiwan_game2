/* Unified simulation-time scheduler. */
(function(global){
  'use strict';
  let nextId=1;
  const jobs=new Map();
  function schedule(delay,fn,{repeat=false,tag=''}={}){
    const id=nextId++;
    jobs.set(id,{id,left:Math.max(0,Number(delay)||0),interval:Math.max(.001,Number(delay)||.001),fn,repeat,tag,cancelled:false});
    return id;
  }
  const TimerSystem={
    after(delay,fn,tag=''){return schedule(delay,fn,{repeat:false,tag});},
    every(interval,fn,tag=''){return schedule(interval,fn,{repeat:true,tag});},
    cooldown(key,duration,fn,tag='cooldown'){
      const k='cooldown:'+key;
      for(const j of jobs.values()) if(j.key===k) return false;
      const id=schedule(duration,fn,{repeat:false,tag}); jobs.get(id).key=k; return id;
    },
    cancel(id){jobs.delete(id);},
    cancelByTag(tag){for(const [id,j] of jobs)if(j.tag===tag)jobs.delete(id);},
    update(dt){
      const due=[];
      for(const j of jobs.values()){
        j.left-=dt;
        if(j.left<=0) due.push(j);
      }
      for(const j of due){
        if(!jobs.has(j.id))continue;
        try{j.fn();}catch(err){queueMicrotask(()=>{throw err;});}
        if(j.repeat){while(j.left<=0)j.left+=j.interval;}
        else jobs.delete(j.id);
      }
    },
    size(){return jobs.size;}
  };
  global.EngineTimers=TimerSystem;
})(window);
