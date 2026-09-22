/* Signals + queued event dispatch. */
(function(global){
  'use strict';
  class Signal {
    constructor(){ this._listeners=new Map(); }
    connect(fn,owner=null){
      if(typeof fn!=='function') return ()=>{};
      const token={fn,owner};
      let bucket=this._listeners.get(owner);
      if(!bucket){bucket=[];this._listeners.set(owner,bucket);}
      bucket.push(token);
      return ()=>this.disconnect(fn,owner);
    }
    disconnect(fn,owner=null){
      const bucket=this._listeners.get(owner);
      if(!bucket) return;
      for(let i=bucket.length-1;i>=0;i--) if(bucket[i].fn===fn) bucket.splice(i,1);
      if(!bucket.length) this._listeners.delete(owner);
    }
    emit(...args){
      for(const bucket of this._listeners.values()){
        for(const token of bucket.slice()){
          try{ token.fn(...args); }catch(err){ queueMicrotask(()=>{throw err;}); }
        }
      }
    }
    clear(owner=null){
      if(owner===null) this._listeners.clear();
      else this._listeners.delete(owner);
    }
  }

  class EventBusClass {
    constructor(){ this._signals=new Map(); }
    _signal(name){
      let sig=this._signals.get(name);
      if(!sig){sig=new Signal();this._signals.set(name,sig);}
      return sig;
    }
    on(name,fn,owner=null){ return this._signal(String(name)).connect(fn,owner); }
    off(name,fn,owner=null){ this._signals.get(String(name))?.disconnect(fn,owner); }
    emit(name,...args){ this._signals.get(String(name))?.emit(...args); }
    clear(name){ if(name==null)this._signals.clear();else this._signals.delete(String(name)); }
  }
  const EventBus=new EventBusClass();

  const queue=[];
  const Dispatcher={
    queue(fn,...args){ if(typeof fn==='function') queue.push({fn,args}); },
    emit(signal,...args){ if(signal?.emit) queue.push({fn:signal.emit.bind(signal),args}); },
    flush(){
      if(!queue.length) return;
      const batch=queue.splice(0,queue.length);
      for(const item of batch){ try{item.fn(...item.args);}catch(err){queueMicrotask(()=>{throw err;});} }
    }
  };

  global.EngineSignal=Signal;
  global.EngineEventBus=EventBus;
  global.EngineDispatcher=Dispatcher;
})(window);
