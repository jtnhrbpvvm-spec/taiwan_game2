const fs=require('fs');
const fd=fs.openSync('C:/Program Files/D2 Survivors/resources/app.asar','r'),b=Buffer.alloc(16);
fs.readSync(fd,b,0,16,0);const h=Buffer.alloc(b.readUInt32LE(12));fs.readSync(fd,h,0,h.length,16);const j=JSON.parse(h);
const name=process.argv[2]||'Game-BgNyDvIc.js';
const v=j.files.desktop.files.dist.files.web.files.assets.files[name],x=Buffer.alloc(+v.size);
fs.readSync(fd,x,0,x.length,8+b.readUInt32LE(4)+Number(v.offset));const s=x.toString();
for(let word of process.argv.slice(3)){if(word.startsWith('@')){const alias=word.slice(1),tail=s.slice(s.lastIndexOf('export{'));const m=tail.match(new RegExp('([\\w$]+) as '+alias+'[,}]'));if(m)word='function '+m[1]+'(';}
const at=s.indexOf(word);console.log(word,at,s.slice(Math.max(0,at-150),at+2400));}
