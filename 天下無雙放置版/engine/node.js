/* Lightweight scene graph primitives — generic only. */
(function(global){
  'use strict';

  class Node {
    constructor(name='Node'){
      this.name = name;
      this.parent = null;
      this.children = [];
      this._insideTree = false;
      this._queuedFree = false;
    }
    addChild(node){
      if(!(node instanceof Node) || node === this) return node;
      if(node.parent) node.parent.removeChild(node);
      node.parent = this;
      this.children.push(node);
      if(this._insideTree) node._enterTree();
      return node;
    }
    removeChild(node){
      const i=this.children.indexOf(node);
      if(i<0) return node;
      this.children.splice(i,1);
      node.parent=null;
      if(node._insideTree) node._exitTree();
      return node;
    }
    queueFree(){
      if(this._queuedFree) return;
      this._queuedFree=true;
      if(this.parent) this.parent.removeChild(this);
      else this._exitTree();
    }
    _enterTree(){
      if(this._insideTree) return;
      this._insideTree=true;
      this._ready();
      for(const child of this.children) child._enterTree();
    }
    _exitTree(){
      if(!this._insideTree) return;
      for(const child of this.children) child._exitTree();
      this._insideTree=false;
      this._exit_tree();
    }
    _ready(){}
    _process(_dt){}
    _physics_process(_dt){}
    _exit_tree(){}
    process(dt){
      if(!this._insideTree) return;
      this._process(dt);
      for(const child of this.children.slice()) child.process(dt);
    }
    physicsProcess(dt){
      if(!this._insideTree) return;
      this._physics_process(dt);
      for(const child of this.children.slice()) child.physicsProcess(dt);
    }
  }

  class Node2D extends Node {
    constructor(name='Node2D'){
      super(name);
      this.position={x:0,y:0};
      this.rotation=0;
      this.scale={x:1,y:1};
    }
  }

  class Control extends Node {
    constructor(name='Control'){
      super(name);
      this.element=null;
      this.visible=true;
    }
    setElement(el){ this.element=el; return this; }
    setVisible(v){
      this.visible=!!v;
      if(this.element) this.element.hidden=!this.visible;
    }
  }

  class Timer extends Node {
    constructor(name='Timer'){
      super(name);
      this.waitTime=1;
      this.oneShot=false;
      this.autostart=false;
      this.timeLeft=0;
      this.running=false;
    }
    start(sec=this.waitTime){ this.timeLeft=Math.max(0,Number(sec)||0); this.running=true; }
    stop(){ this.running=false; this.timeLeft=0; }
    _physics_process(dt){
      if(!this.running) return;
      this.timeLeft-=dt;
      if(this.timeLeft>0) return;
      this.timeout?.();
      if(this.oneShot) this.stop();
      else this.timeLeft += Math.max(0.001,this.waitTime);
    }
    _ready(){ if(this.autostart) this.start(); }
  }

  class Tween extends Node {
    constructor(name='Tween'){
      super(name);
      this.jobs=[];
    }
    to(target,key,to,duration,ease=(x)=>x){
      const from=Number(target[key])||0;
      this.jobs.push({target,key,from,to:Number(to)||0,duration:Math.max(0.001,Number(duration)||0.001),elapsed:0,ease});
      return this;
    }
    _process(dt){
      for(let i=this.jobs.length-1;i>=0;i--){
        const j=this.jobs[i];
        j.elapsed+=dt;
        const t=Math.max(0,Math.min(1,j.elapsed/j.duration));
        j.target[j.key]=j.from+(j.to-j.from)*j.ease(t);
        if(t>=1) this.jobs.splice(i,1);
      }
    }
  }

  const SceneLoader = {
    load(def, factories={}){
      const build = (spec)=>{
        if(!spec || typeof spec!=='object') return null;
        const Ctor=factories[spec.type]||global[spec.type]||Node;
        const node=new Ctor(spec.name||spec.type||'Node');
        if(spec.props && typeof spec.props==='object') Object.assign(node,spec.props);
        for(const child of (spec.children||[])){
          const c=build(child); if(c) node.addChild(c);
        }
        return node;
      };
      return build(def);
    },
    async loadJSON(url,factories={}){
      const res=await fetch(url,{cache:'no-store'});
      if(!res.ok) throw new Error('Scene load failed: '+res.status);
      return this.load(await res.json(),factories);
    }
  };

  global.EngineNode=Node;
  global.EngineNode2D=Node2D;
  global.EngineControl=Control;
  global.EngineTimerNode=Timer;
  global.EngineTween=Tween;
  global.EngineSceneLoader=SceneLoader;
})(window);
