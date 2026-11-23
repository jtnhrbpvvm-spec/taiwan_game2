/* Data-only runner for wiki_dump.js. Does not launch gameplay or access saves. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const crawl = path.join(process.env.USERPROFILE, 'Desktop', '爬蟲', 'ro-survivors-tool', 'rs-crawl');
const version = process.argv[2];
if (!version || !/^\d{8}_\w+$/.test(version)) throw Error('Usage: node tools/extract_wiki_node.cjs VERSION');
const root = path.join(crawl, version), build = path.join(root, 'build');
const coreName = fs.readdirSync(build).find(f => /^soul_linker-.*\.js$/.test(f));
const mainName = fs.readdirSync(build).find(f => /^main-.*\.js$/.test(f));
const coreUrl = '/build/' + coreName, mainUrl = '/build/' + mainName;
const storage = {getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
const element = () => ({relList:{supports:()=>true},style:{},getContext:()=>null,addEventListener(){}});
const context = vm.createContext({console, URL, URLSearchParams, TextEncoder, TextDecoder,
  setTimeout, clearTimeout, setInterval, clearInterval, performance,
  navigator:{language:'zh-TW',languages:['zh-TW'],userAgent:'wiki data extractor',hardwareConcurrency:4},
  location:{href:'http://localhost/',search:'?notools',hostname:'localhost',protocol:'http:'},
  localStorage:storage,sessionStorage:storage,
  document:{createElement:element,querySelectorAll:s=>s.includes('script')?[{src:mainUrl},{href:coreUrl}]:[],querySelector:()=>null,addEventListener(){},documentElement:{style:{}}},
  addEventListener(){},removeEventListener(){},devicePixelRatio:1,
  matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),
  requestAnimationFrame:()=>0,cancelAnimationFrame(){},
});
context.window = context; context.self = context;
let source = fs.readFileSync(path.join(build,coreName),'utf8');
source = source.replace(/import\.meta\.url/g, JSON.stringify('http://localhost'+coreUrl));
source = source.replace(/export\{([^}]+)\};?\s*$/, (_,list) => 'globalThis.__exports={' + list.split(',').map(e=>{const [a,b]=e.trim().split(/\s+as\s+/);return JSON.stringify(b||a)+':'+a;}).join(',')+'};');
try { vm.runInContext(source,context,{filename:coreName}); }
catch(e){ console.error(e.stack.split('\n').filter(l=>l.length<1000).join('\n')); process.exit(1); }
const M = context.__exports;
const settings = Object.values(M).find(v=>v&&typeof v==='object'&&'lang' in v&&'master' in v);
Object.assign(settings,{lang:'zh-TW',master:0,music:0,sfx:0,muted:true});
context.__core=M;
if (process.argv.includes('--inspect')) {
 const skills=Object.values(M).find(v=>v&&v.bash&&v.bash.maxLevel);
 const cards=Object.values(M).find(v=>v&&v[4001]&&v[4001].monster);
 for(const id of ['bash','fire_bolt','arrow_shower','arrow_repel']) {
   const s=skills[id]; if(s) console.log(id,JSON.stringify(s),s.create?JSON.stringify(s.create()):'');
 }
 console.log('CARD',JSON.stringify(cards[4001]));
 const src=fs.readFileSync(path.join(build,mainName),'utf8');
 for(const key of ['name:"Neutral"','incenseChance','cardChance','cosmeticChance']) {const i=src.indexOf(key);console.log(key,src.slice(i-110,i+350));}
}
context.fetch=async(url,opts)=>{
 if(url==='/__dump'){
   const data=JSON.parse(opts.body);
   const out=path.join(crawl,'_wiki_dump_'+version+'.json');
   fs.writeFileSync(out,JSON.stringify(data)); console.log('Saved',out); return {ok:true};
 }
 const data=fs.readFileSync(path.join(root,String(url).replace(/^https?:\/\/[^/]+/,'').replace(/^\//,'')));
 return {ok:true,text:async()=>data.toString(),json:async()=>JSON.parse(data)};
};
let dump = fs.readFileSync(path.join(__dirname,'wiki_dump.js'),'utf8')
 .replace('await import(core)','__core').replace(/export default /,'return ');
vm.runInContext('(async()=>{'+dump+'})()',context,{filename:'wiki_dump.js'})
 .then(result=>{console.log(JSON.stringify(result,null,2));process.exit(result.ok?0:1);})
 .catch(e=>{console.error(e.stack);process.exit(1);});
