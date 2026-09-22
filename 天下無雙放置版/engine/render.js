/* DOM cache + dirty field rendering + small virtual list helper. */
(function(global){
  'use strict';
  const cache=new Map();
  const dirty=new Map();

  function el(id){
    if(cache.has(id)) return cache.get(id);
    const node=document.getElementById(id)||null;
    cache.set(id,node);
    return node;
  }
  function invalidate(id){ cache.delete(id); }
  function clear(){ cache.clear(); dirty.clear(); }
  function mark(id,key,value){
    let m=dirty.get(id); if(!m){m=new Map();dirty.set(id,m);} m.set(key,value);
  }
  function applyText(id,key,value){
    const n=el(id); if(!n) return;
    const v=String(value);
    if(n.textContent!==v) n.textContent=v;
  }
  function applyAttr(id,key,value){
    const n=el(id); if(!n) return;
    const v=String(value);
    if(n.getAttribute(key)!==v) n.setAttribute(key,v);
  }
  function applyStyle(id,key,value){
    const n=el(id); if(!n || n.style[key]===String(value)) return;
    n.style[key]=value;
  }
  function applyClassToggle(id,key,on){
    const n=el(id); if(n) n.classList.toggle(key,!!on);
  }
  function patchKeyed(container,items,keyOf,createNode,updateNode){
    if(!container) return;
    const list=Array.isArray(items)?items:[];
    const existing=new Map();
    Array.from(container.children).forEach(node=>{
      const k=node.dataset?.engineKey;
      if(k!=null) existing.set(k,node);
    });
    const used=new Set();
    const frag=document.createDocumentFragment();
    for(const item of list){
      const key=String(keyOf(item));
      let node=existing.get(key);
      if(!node) node=createNode(item);
      node.dataset.engineKey=key;
      updateNode(node,item);
      used.add(key);
      frag.appendChild(node);
    }
    existing.forEach((node,key)=>{if(!used.has(key)) node.remove();});
    container.appendChild(frag);
  }

  function flush(){
    if(!dirty.size) return;
    const batch=[...dirty.entries()]; dirty.clear();
    for(const [id,fields] of batch){
      for(const [kind,payload] of fields){
        if(kind==='text') applyText(id,kind,payload);
        else if(kind==='attr'){const [key,value]=payload;applyAttr(id,key,value);}
        else if(kind==='style'){const [key,value]=payload;applyStyle(id,key,value);}
        else if(kind==='class'){const [key,value]=payload;applyClassToggle(id,key,value);}
      }
    }
  }
  function text(id,value){mark(id,'text',value);}
  function width(id,value){mark(id,'style',['width',value]);}
  function classToggle(id,cls,on){mark(id,'class',[cls,!!on]);}

  class VirtualList {
    constructor(container,renderRow,{rowHeight=44,buffer=5}={}){
      this.container=typeof container==='string'?el(container):container;
      this.renderRow=renderRow;
      this.rowHeight=Math.max(1,rowHeight);
      this.buffer=Math.max(0,buffer);
      this.items=[];
      this.pool=[];
      this._bound=this.refresh.bind(this);
      this.container?.addEventListener('scroll',this._bound,{passive:true});
    }
    setItems(items){this.items=Array.isArray(items)?items:[];this.refresh();}
    refresh(){
      if(!this.container) return;
      const height=this.container.clientHeight||240;
      const start=Math.max(0,Math.floor(this.container.scrollTop/this.rowHeight)-this.buffer);
      const count=Math.ceil(height/this.rowHeight)+this.buffer*2;
      const end=Math.min(this.items.length,start+count);
      this.container.style.position=this.container.style.position||'relative';
      this.container.style.setProperty('--virtual-total',String(this.items.length));
      for(const node of this.pool) node.hidden=true;
      const fragment=document.createDocumentFragment();
      for(let i=start;i<end;i++){
        const node=this.pool[i-start]||this._create();
        this.pool[i-start]=node;
        node.hidden=false;
        node.style.position='absolute';
        node.style.top=(i*this.rowHeight)+'px';
        node.style.height=this.rowHeight+'px';
        this.renderRow(node,this.items[i],i);
        fragment.appendChild(node);
      }
      const first=this.container.firstElementChild;
      if(first?.classList.contains('engine-virtual-spacer')) this.container.removeChild(first);
      const spacer=document.createElement('div');
      spacer.className='engine-virtual-spacer';
      spacer.style.height=(this.items.length*this.rowHeight)+'px';
      spacer.style.pointerEvents='none';
      this.container.prepend(spacer);
      for(const node of fragment.childNodes) this.container.appendChild(node);
    }
    _create(){
      const node=document.createElement('div');
      node.setAttribute('data-engine-virtual-row','1');
      this.container.appendChild(node);
      return node;
    }
    destroy(){ this.container?.removeEventListener('scroll',this._bound);this.pool.length=0; }
  }

  global.EngineRender={el,invalidate,clear,mark,text,width,classToggle,flush,patchKeyed,VirtualList};
})(window);
