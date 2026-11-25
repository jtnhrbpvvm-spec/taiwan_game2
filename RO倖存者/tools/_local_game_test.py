import importlib.util,http.server
p="C:/Users/a2095/Desktop/爬蟲/ro-survivors-tool/rs-crawl/20261125_7c004f793/_offline_server.py"
s=importlib.util.spec_from_file_location('rs',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class H(m.Handler):
 def _send(self,body,ctype,code=200):
  if 'text/html' in ctype:
   body=body.replace(b'<head>',b'<head><script>for(const k of ["AudioContext","webkitAudioContext"]){const C=window[k];if(C)window[k]=class extends C{constructor(...a){super(...a);this.suspend()}resume(){return Promise.resolve()}}}document.addEventListener("play",e=>{e.target.muted=true},true)</script>')
  return super()._send(body,ctype,code)
http.server.ThreadingHTTPServer(('127.0.0.1',8381),H).serve_forever()
