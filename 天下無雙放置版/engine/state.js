/* Generic state store. Game-specific schema remains outside this file. */
(function(global){
  'use strict';
  const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const isObj=v=>v!==null&&typeof v==='object';
  function clone(v){
    if(Array.isArray(v)) return v.map(clone);
    if(isObj(v)){const o={};for(const k of Object.keys(v))o[k]=clone(v[k]);return o;}
    return v;
  }
  function equal(a,b){
    if(a===b || (Number.isNaN(a)&&Number.isNaN(b))) return true;
    if(typeof a!==typeof b) return false;
    if(!isObj(a)||!isObj(b)) return false;
    const ak=Object.keys(a),bk=Object.keys(b); if(ak.length!==bk.length)return false;
    for(const k of ak) if(!hasOwn(b,k)||!equal(a[k],b[k]))return false;
    return true;
  }
  function parts(path){return Array.isArray(path)?path:String(path).split('.').filter(Boolean);}
  function read(root,path){let n=root;for(const k of parts(path)){if(n==null)return undefined;n=n[k];}return n;}
  function write(root,path,value){const p=parts(path);if(!p.length)return;let n=root;for(let i=0;i<p.length-1;i++){if(!isObj(n[p[i]]))n[p[i]]=Object.create(null);n=n[p[i]];}n[p[p.length-1]]=value;}

  class StateStore {
    constructor(initial){this.state=initial||{};this.listeners=[];this.batchDepth=0;this.pending=[];this.version=0;}
    get(path){return path==null?this.state:read(this.state,path);}
    set(path,value){
      const old=read(this.state,path); if(equal(old,value)) return false;
      write(this.state,path,clone(value));
      this.version++;
      if(this.batchDepth) this.pending.push({path:String(path),old,newValue:value});
      else this._notify(String(path),old,value);
      return true;
    }
    update(path,fn){return this.set(path,fn(this.get(path)));}
    subscribe(path,fn){
      const item={path:String(path||''),fn};this.listeners.push(item);
      return ()=>{const i=this.listeners.indexOf(item);if(i>=0)this.listeners.splice(i,1);};
    }
    batch(fn){
      this.batchDepth++;
      try{return fn();}
      finally{
        if(--this.batchDepth===0){const p=this.pending.splice(0);for(const x of p)this._notify(x.path,x.old,x.newValue);}
      }
    }
    _notify(path,old,value){
      for(const l of this.listeners.slice()){
        if(!l.path || path===l.path || path.startsWith(l.path+'.') || l.path.startsWith(path+'.')){
          try{l.fn({path,old,value,version:this.version,state:this.state});}catch(err){queueMicrotask(()=>{throw err;});}
        }
      }
    }
    snapshot(){return clone(this.state);}
    hydrate(next){this.state=next||{};this.version++;this._notify('',null,this.state);}
    serialize(){return JSON.stringify(this.state);}
  }

  global.EngineStateStore=StateStore;
  global.EngineStateEqual=equal;
})(window);
