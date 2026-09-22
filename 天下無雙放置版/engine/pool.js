/* Generic object and DOM pools. */
(function(global){
  'use strict';
  class Pool {
    constructor(factory,reset=()=>{}){this.factory=factory;this.reset=reset;this.free=[];this.total=0;}
    acquire(...args){return this.free.pop()||this._new(...args);}
    _new(...args){this.total++;return this.factory(...args);}
    release(obj){if(!obj)return;try{this.reset(obj);}finally{this.free.push(obj);}}
    prewarm(n){for(let i=0;i<n;i++)this.release(this._new());}
    clear(){this.free.length=0;}
  }
  const pools=Object.create(null);
  function register(name,factory,reset){pools[name]=new Pool(factory,reset);return pools[name];}
  function get(name){return pools[name];}
  function registerDOM(name,tag='div',className=''){
    return register(name,
      ()=>{const el=document.createElement(tag);if(className)el.className=className;return el;},
      el=>{el.removeAttribute('style');el.className=className;el.textContent='';el.hidden=true;}
    );
  }
  global.EnginePool={Pool,register,get,registerDOM};
})(window);
