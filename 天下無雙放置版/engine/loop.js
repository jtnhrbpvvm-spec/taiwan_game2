/* Engine Loop — no game-business terms. */
(function(global){
  'use strict';
  const FIXED_DT = 1 / 60;
  const MAX_FRAME_DELTA = 0.2;
  let rafId = 0;
  let running = false;
  let paused = false;
  let speed = 1;
  let lastTime = 0;
  let accumulator = 0;
  let physicsHandler = null;
  let processHandler = null;
  let frameEndHandler = null;

  function frame(now){
    if(!running) return;
    rafId = requestAnimationFrame(frame);
    if(paused){ lastTime = now; return; }
    if(!lastTime) lastTime = now;
    let frameDelta = (now - lastTime) / 1000;
    lastTime = now;
    if(!Number.isFinite(frameDelta) || frameDelta < 0) frameDelta = FIXED_DT;
    frameDelta = Math.min(frameDelta, MAX_FRAME_DELTA);
    accumulator += frameDelta * speed;

    let steps = 0;
    while(accumulator >= FIXED_DT && steps < 12){
      if(physicsHandler) physicsHandler(FIXED_DT);
      accumulator -= FIXED_DT;
      steps++;
    }
    if(processHandler) processHandler(Math.min(frameDelta * speed, MAX_FRAME_DELTA));
    if(frameEndHandler) frameEndHandler();
  }

  const Loop = {
    FIXED_DT,
    MAX_FRAME_DELTA,
    start(){
      if(running) return;
      running = true;
      paused = false;
      lastTime = 0;
      accumulator = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop(){
      running = false;
      if(rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
    pause(){ paused = true; accumulator = 0; },
    resume(){ paused = false; lastTime = 0; },
    setSpeed(x){
      const n = Number(x);
      speed = Number.isFinite(n) ? Math.max(0.05, Math.min(8, n)) : 1;
      return speed;
    },
    getSpeed(){ return speed; },
    isPaused(){ return paused; },
    onPhysics(fn){ physicsHandler = typeof fn === 'function' ? fn : null; },
    onProcess(fn){ processHandler = typeof fn === 'function' ? fn : null; },
    onFrameEnd(fn){ frameEndHandler = typeof fn === 'function' ? fn : null; }
  };

  document.addEventListener('visibilitychange', function(){
    if(document.hidden) Loop.pause();
    else Loop.resume();
  }, {passive:true});

  global.EngineLoop = Loop;
})(window);
