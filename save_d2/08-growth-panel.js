// ════════════════════════════════════════════════
//  🏷️ 裝備詞綴（僅可修改身上穿著的裝備）— 資料複製自遊戲 01-drops-config.js，
//  確保能力說明、品質上限與詞綴命名規則跟正式遊戲一致。
// ════════════════════════════════════════════════
const D2R_AFFIX_LABEL = {md:"近距離傷害",rd:"遠距離傷害",mg:"魔法傷害",mh:"近距離命中",rh:"遠距離命中",gh:"魔法命中",str:"力量",dex:"敏捷",con:"體質",int:"智力",wis:"精神",cha:"魅力",hp:"HP 上限",mp:"MP 上限",rf:"火屬性抗性",rw:"水屬性抗性",re:"地屬性抗性",ra:"風屬性抗性",rn:"無屬性抗性",hpr:"HP 自然恢復量",mpr:"MP 自然恢復量",wt:"負重上限",mf:"物品發現率",as:"攻擊速度",ff:"火焰附傷",fw:"寒冰附傷",fa:"大地附傷",fe:"風雷附傷",ph:"命中回復 HP",pm:"命中回復 MP",ac:"AC",mr:"MR",er:"ER",dr:"傷害減免",mc:"近距離爆擊率",rc:"遠距離爆擊率",gc:"魔法爆擊率",mcd:"近距離爆擊傷害",rcd:"遠距離爆擊傷害",gcd:"魔法爆擊傷害",hpp:"HP 上限%",mpp:"MP 上限%",pot:"藥水恢復量",abr:"異常狀態抵抗",gf:"金幣取得量",xf:"經驗值取得量",nd:"對一般怪物傷害",bd:"對頭目傷害",kh:"擊殺恢復 HP",km:"擊殺恢復 MP",kx:"擊殺爆炸",ts:"受擊護盾",pi:"完美一擊",ks:"擊殺加速",sp:"近戰濺射",fh:"滿血獵手",fpen:"火焰穿透",wpen:"寒冰穿透",epen:"大地穿透",apen:"風雷穿透",sdm:"異常增傷",bdr:"頭目減傷",und:"不死獵殺",dem:"惡魔獵殺",dra:"屠龍",hsk:"破硬皮",opn:"先制增傷",exe:"處決增傷",pdr:"物理減傷",mdr:"魔法減傷",ldr:"瀕死減傷",adr:"異常減傷",udr:"不死減傷",ddr:"惡魔減傷",blk:"堅守格擋",mgd:"魔力護體",rcv:"傷勢回流",sav:"致命守護",bar:"傷勢壁壘",rip:"反擊意志",ber:"浴血增傷",fmp:"滿魔增傷",shp:"護盾猛攻",ksh:"擊殺護盾",krc:"擊殺回春",kfu:"擊殺戰意",frz:"霜縛追擊",brn:"焚燒追擊",psn:"劇毒追擊",bld:"流血追擊",ctl:"控場追擊",deb:"破綻追擊",fbr:"烈焰催化",wfr:"霜潮共鳴",eps:"腐土共生",wbl:"風刃放血",fsi:"熾焰刻印",wsi:"寒潮刻印",esi:"腐毒刻印",asi:"裂風刻印",hy:"九頭蛇傷害",hd:"九頭蛇持續時間",st:"靜電立場效果",os:"冰封球冰片數",cb:"連鎖雷光彈跳數",mcx:"隕星數量",gd:"燃燒地面持續時間",scd:"延伸技能冷卻縮短",ww:"炫風斬傷害",wd:"炫風斬持續時間",wr:"怒氣取得量",wc:"炫風斬冷卻縮短",ld:"躍擊傷害",ls:"躍擊暈眩時間",lc:"躍擊冷卻縮短",lr:"躍擊怒氣消耗降低",bh:"祝福之鎚傷害",bn:"祝福之鎚數量",bt:"祝福之鎚持續時間",bc:"祝福之鎚冷卻縮短",shd:"暗影分身傷害",shn:"暗影分身數量",sht:"暗影分身持續時間",shc:"暗影分身冷卻縮短",vwd:"范德震地傷害",vwn:"范德震地目標數量",vws:"范德震地暈眩時間",vwc:"范德震地冷卻縮短",fdd:"冰龍追擊傷害",fdn:"冰龍追擊目標數量",fdf:"冰龍追擊冰凍機率",fdc:"冰龍追擊冷卻縮短",tjd:"雷霆標槍連鎖傷害",tjn:"雷霆標槍彈跳次數",tjs:"雷霆標槍衰減降低",tjc:"雷霆標槍冷卻縮短",med:"心靈共振傷害",men:"心靈共振目標數量",mes:"心靈共振衰減降低",mec:"心靈共振冷卻縮短",rbd:"裂界衝擊傷害",rbn:"裂界衝擊目標數量",rbf:"裂界衝擊暈眩機率",rbc:"裂界衝擊冷卻縮短",ard:"多重箭雨傷害",arn:"多重箭雨箭矢數量",arc:"多重箭雨暴擊機率",acd:"多重箭雨冷卻縮短",csd:"充能一擊傷害",csn:"充能一擊電束數量",csp:"充能一擊風抗穿透",csc:"充能一擊冷卻縮短",mzd:"馬賽克終結傷害",mzn:"馬賽克終結目標數量",mzt:"馬賽克蓄能保存時間",mzc:"馬賽克終結冷卻縮短",trd:"雷光哨衛傷害",trn:"雷光哨衛電束數量",trt:"雷光哨衛持續時間",trc:"雷光哨衛冷卻縮短"};
const D2R_AFFIX_RANGES = {md:[[7,10],[5,7],[3,5],[2,3],[1,2]],rd:[[7,10],[5,7],[3,5],[2,3],[1,2]],mg:[[6,8],[4,6],[3,4],[2,3],[1,2]],mh:[[11,15],[8,10],[5,7],[3,4],[1,2]],rh:[[11,15],[8,10],[5,7],[3,4],[1,2]],gh:[[9,12],[6,8],[4,6],[2,4],[1,2]],str:[[4,5],[3,4],[2,3],[1,2],[1,1]],dex:[[4,5],[3,4],[2,3],[1,2],[1,1]],con:[[4,5],[3,4],[2,3],[1,2],[1,1]],int:[[4,5],[3,4],[2,3],[1,2],[1,1]],wis:[[4,5],[3,4],[2,3],[1,2],[1,1]],cha:[[4,5],[3,4],[2,3],[1,2],[1,1]],hp:[[111,160],[71,110],[41,70],[21,40],[10,20]],mp:[[56,80],[36,55],[21,35],[11,20],[5,10]],rf:[[17,22],[12,16],[8,11],[5,7],[2,4]],rw:[[17,22],[12,16],[8,11],[5,7],[2,4]],re:[[17,22],[12,16],[8,11],[5,7],[2,4]],ra:[[17,22],[12,16],[8,11],[5,7],[2,4]],rn:[[14,18],[10,13],[7,9],[4,6],[2,3]],hpr:[[12,16],[8,11],[5,7],[3,4],[1,2]],mpr:[[7,10],[5,7],[3,4],[2,3],[1,1]],wt:[[26,35],[20,25],[14,19],[8,13],[4,7]],mf:[[15,20],[11,14],[8,10],[5,7],[2,4]],as:[[9,10],[7,8],[5,6],[3,4],[1,2]],ff:[[25,32],[19,24],[14,18],[9,13],[5,8]],fw:[[25,32],[19,24],[14,18],[9,13],[5,8]],fa:[[25,32],[19,24],[14,18],[9,13],[5,8]],fe:[[25,32],[19,24],[14,18],[9,13],[5,8]],ph:[[16,20],[12,15],[8,11],[5,7],[2,4]],pm:[[8,10],[6,8],[4,6],[2,4],[1,2]],ac:[[7,8],[5,6],[3,4],[2,2],[1,1]],mr:[[17,20],[13,16],[9,12],[5,8],[2,4]],er:[[7,8],[5,6],[3,4],[2,2],[1,1]],dr:[[7,8],[5,6],[3,4],[2,2],[1,1]],mc:[[5,5],[4,4],[3,3],[2,2],[1,1]],rc:[[5,5],[4,4],[3,3],[2,2],[1,1]],gc:[[5,5],[4,4],[3,3],[2,2],[1,1]],mcd:[[26,30],[20,25],[14,19],[8,13],[5,7]],rcd:[[26,30],[20,25],[14,19],[8,13],[5,7]],gcd:[[26,30],[20,25],[14,19],[8,13],[5,7]],hpp:[[9,10],[7,8],[5,6],[3,4],[1,2]],mpp:[[9,10],[7,8],[5,6],[3,4],[1,2]],pot:[[17,20],[13,16],[9,12],[5,8],[2,4]],abr:[[17,20],[13,16],[9,12],[5,8],[2,4]],gf:[[9,10],[7,8],[5,6],[3,4],[1,2]],xf:[[5,5],[4,4],[3,3],[2,2],[1,1]],nd:[[9,10],[7,8],[5,6],[3,4],[1,2]],bd:[[6,6],[5,5],[4,4],[3,3],[2,2]],kh:[[16,20],[11,15],[7,10],[4,6],[2,3]],km:[[5,5],[4,4],[3,3],[2,2],[1,1]],kx:[[6,6],[5,5],[4,4],[3,3],[2,2]],ts:[[6,6],[5,5],[4,4],[3,3],[2,2]],pi:[[50,50],[44,44],[38,38],[31,31],[25,25]],ks:[[10,10],[8,8],[6,6],[4,4],[2,2]],sp:[[30,30],[25,25],[20,20],[15,15],[10,10]],fh:[[30,30],[25,25],[20,20],[15,15],[10,10]],fpen:[[10,12],[8,9],[6,7],[4,5],[2,3]],wpen:[[10,12],[8,9],[6,7],[4,5],[2,3]],epen:[[10,12],[8,9],[6,7],[4,5],[2,3]],apen:[[10,12],[8,9],[6,7],[4,5],[2,3]],sdm:[[13,15],[10,12],[7,9],[5,6],[3,4]],bdr:[[7,8],[5,6],[4,4],[3,3],[2,2]],und:[[12,14],[10,11],[7,9],[5,6],[3,4]],dem:[[12,14],[10,11],[7,9],[5,6],[3,4]],dra:[[12,14],[10,11],[7,9],[5,6],[3,4]],hsk:[[10,12],[8,9],[6,7],[4,5],[2,3]],opn:[[10,12],[8,9],[6,7],[4,5],[2,3]],exe:[[13,15],[10,12],[7,9],[5,6],[3,4]],pdr:[[6,7],[5,5],[4,4],[3,3],[2,2]],mdr:[[6,7],[5,5],[4,4],[3,3],[2,2]],ldr:[[7,8],[5,6],[4,4],[3,3],[2,2]],adr:[[7,8],[5,6],[4,4],[3,3],[2,2]],udr:[[7,8],[5,6],[4,4],[3,3],[2,2]],ddr:[[7,8],[5,6],[4,4],[3,3],[2,2]],blk:[[6,7],[5,5],[4,4],[3,3],[2,2]],mgd:[[9,10],[7,8],[5,6],[4,4],[3,3]],rcv:[[4,5],[3,4],[3,3],[2,2],[1,1]],sav:[[8,10],[6,7],[4,5],[3,3],[2,2]],bar:[[22,25],[18,21],[14,17],[10,13],[6,9]],rip:[[12,15],[9,11],[7,8],[5,6],[3,4]],ber:[[12,15],[10,11],[7,9],[5,6],[3,4]],fmp:[[12,15],[10,11],[7,9],[5,6],[3,4]],shp:[[10,12],[8,9],[6,7],[4,5],[2,3]],ksh:[[4,5],[3,4],[3,3],[2,2],[1,1]],krc:[[2,2],[2,2],[1,1],[1,1],[1,1]],kfu:[[10,12],[8,9],[6,7],[4,5],[2,3]],frz:[[12,15],[10,11],[7,9],[5,6],[3,4]],brn:[[12,15],[10,11],[7,9],[5,6],[3,4]],psn:[[12,15],[10,11],[7,9],[5,6],[3,4]],bld:[[12,15],[10,11],[7,9],[5,6],[3,4]],ctl:[[10,12],[8,9],[6,7],[4,5],[2,3]],deb:[[10,12],[8,9],[6,7],[4,5],[2,3]],fbr:[[10,12],[8,9],[6,7],[4,5],[2,3]],wfr:[[10,12],[8,9],[6,7],[4,5],[2,3]],eps:[[10,12],[8,9],[6,7],[4,5],[2,3]],wbl:[[10,12],[8,9],[6,7],[4,5],[2,3]],fsi:[[7,9],[6,7],[4,5],[3,4],[2,3]],wsi:[[4,5],[3,4],[2,3],[2,2],[1,1]],esi:[[7,9],[6,7],[4,5],[3,4],[2,3]],asi:[[7,9],[6,7],[4,5],[3,4],[2,3]],hy:[[26,30],[21,25],[16,20],[11,15],[6,10]],hd:[[26,30],[21,25],[16,20],[11,15],[6,10]],st:[[26,30],[21,25],[16,20],[11,15],[6,10]],os:[[3,3],[2,2],[2,2],[1,1],[1,1]],cb:[[3,3],[2,2],[2,2],[1,1],[1,1]],mcx:[[3,3],[2,2],[2,2],[1,1],[1,1]],gd:[[26,30],[21,25],[16,20],[11,15],[6,10]],scd:[[9,10],[7,8],[5,6],[3,4],[1,2]],ww:[[26,30],[21,25],[16,20],[11,15],[6,10]],wd:[[26,30],[21,25],[16,20],[11,15],[6,10]],wr:[[26,30],[21,25],[16,20],[11,15],[6,10]],wc:[[9,10],[7,8],[5,6],[3,4],[1,2]],ld:[[26,30],[21,25],[16,20],[11,15],[6,10]],ls:[[26,30],[21,25],[16,20],[11,15],[6,10]],lc:[[9,10],[7,8],[5,6],[3,4],[1,2]],lr:[[9,10],[7,8],[5,6],[3,4],[1,2]],bh:[[26,30],[21,25],[16,20],[11,15],[6,10]],bn:[[2,2],[1,1],[1,1],[1,1],[1,1]],bt:[[26,30],[21,25],[16,20],[11,15],[6,10]],bc:[[9,10],[7,8],[5,6],[3,4],[1,2]],shd:[[26,30],[21,25],[16,20],[11,15],[6,10]],shn:[[2,2],[1,1],[1,1],[1,1],[1,1]],sht:[[26,30],[21,25],[16,20],[11,15],[6,10]],shc:[[9,10],[7,8],[5,6],[3,4],[1,2]],vwd:[[26,30],[21,25],[16,20],[11,15],[6,10]],vwn:[[2,2],[1,1],[1,1],[1,1],[1,1]],vws:[[26,30],[21,25],[16,20],[11,15],[6,10]],vwc:[[9,10],[7,8],[5,6],[3,4],[1,2]],fdd:[[26,30],[21,25],[16,20],[11,15],[6,10]],fdn:[[2,2],[1,1],[1,1],[1,1],[1,1]],fdf:[[11,12],[9,10],[7,8],[5,6],[2,4]],fdc:[[9,10],[7,8],[5,6],[3,4],[1,2]],tjd:[[26,30],[21,25],[16,20],[11,15],[6,10]],tjn:[[2,2],[1,1],[1,1],[1,1],[1,1]],tjs:[[11,12],[9,10],[7,8],[5,6],[2,4]],tjc:[[9,10],[7,8],[5,6],[3,4],[1,2]],med:[[26,30],[21,25],[16,20],[11,15],[6,10]],men:[[2,2],[1,1],[1,1],[1,1],[1,1]],mes:[[11,12],[9,10],[7,8],[5,6],[2,4]],mec:[[9,10],[7,8],[5,6],[3,4],[1,2]],rbd:[[26,30],[21,25],[16,20],[11,15],[6,10]],rbn:[[2,2],[1,1],[1,1],[1,1],[1,1]],rbf:[[11,12],[9,10],[7,8],[5,6],[2,4]],rbc:[[9,10],[7,8],[5,6],[3,4],[1,2]],ard:[[26,30],[21,25],[16,20],[11,15],[6,10]],arn:[[4,4],[3,3],[2,2],[1,1],[1,1]],arc:[[11,12],[9,10],[7,8],[5,6],[2,4]],acd:[[9,10],[7,8],[5,6],[3,4],[1,2]],csd:[[26,30],[21,25],[16,20],[11,15],[6,10]],csn:[[2,2],[1,1],[1,1],[1,1],[1,1]],csp:[[11,12],[9,10],[7,8],[5,6],[2,4]],csc:[[9,10],[7,8],[5,6],[3,4],[1,2]],mzd:[[26,30],[21,25],[16,20],[11,15],[6,10]],mzn:[[2,2],[1,1],[1,1],[1,1],[1,1]],mzt:[[26,30],[21,25],[16,20],[11,15],[6,10]],mzc:[[9,10],[7,8],[5,6],[3,4],[1,2]],trd:[[26,30],[21,25],[16,20],[11,15],[6,10]],trn:[[2,2],[1,1],[1,1],[1,1],[1,1]],trt:[[26,30],[21,25],[16,20],[11,15],[6,10]],trc:[[9,10],[7,8],[5,6],[3,4],[1,2]]};
const D2R_QUALITY = {magic:{n:"魔法",c:"text-blue-300",min:1,max:2,t1max:1},rare:{n:"稀有",c:"text-yellow-300",min:2,max:3,t1max:1},excellent:{n:"卓越",c:"text-orange-300",min:3,max:4,t1max:1},epic:{n:"史詩",c:"text-purple-300",min:4,max:5,t1max:1},legend:{n:"傳說",c:"text-red-400",min:5,max:6,t1max:2},mythic:{n:"神話",c:"text-cyan-300",min:6,max:7,t1max:2},immortal:{n:"不朽",c:"text-green-300",min:7,max:8,t1max:3},primal:{n:"太古",c:"d2q-primal",min:9,max:10,t1max:4}};
const D2R_QUALITY_KEYS = ["magic","rare","excellent","epic","legend","mythic","immortal","primal"];
function d2rQualityDef(q){ return D2R_QUALITY[q] || D2R_QUALITY.magic; }

function d2rAffixRows(item){if(!item||!Array.isArray(item.d2))return[];return item.d2.slice(0,10).filter(r=>Array.isArray(r)&&D2R_AFFIX_LABEL[r[0]]&&Number.isFinite(Number(r[1]))&&Number(r[1])>0).map(r=>[r[0],Math.floor(Number(r[1])),Math.max(1,Math.min(5,Math.floor(Number(r[2]))||5))])}
function d2rAffixText(row){let r=d2rAffixRows({d2:[row]})[0];if(!r)return"";if(r[0]==="as")return`攻擊速度 +${r[1]}%`;if(["ff","fw","fa","fe"].includes(r[0]))return`${D2R_AFFIX_LABEL[r[0]]}：命中 ${9-r[2]}% 追加 ${r[1]} 點傷害`;if(r[0]==="ph"||r[0]==="pm")return`${D2R_AFFIX_LABEL[r[0]]}：命中 ${9-r[2]}% 回復 ${r[1]}`;if(r[0]==="kx")return`擊殺爆炸：一般怪死亡時造成其最大 HP ${r[1]}% 傷害`;if(r[0]==="ts")return`受擊護盾：受傷 5% 獲得最大 HP ${r[1]}% 護盾`;if(r[0]==="pi")return`完美一擊：一般攻擊有機率額外造成 ${r[1]}% 傷害`;if(r[0]==="ks")return`擊殺加速：擊殺後攻擊速度 +${r[1]}%，持續 5 秒`;if(r[0]==="sp")return`近戰濺射：一般近戰攻擊波及兩名敵人，造成主傷害 ${r[1]}%`;if(r[0]==="fh")return`滿血獵手：HP 全滿時一般攻擊傷害 +${r[1]}%`;if(["fpen","wpen","epen","apen"].includes(r[0]))return`${D2R_AFFIX_LABEL[r[0]]} +${r[1]}%（對應屬性最終傷害提高）`;if(r[0]==="sdm")return`異常增傷：攻擊帶有異常狀態的敵人時傷害 +${r[1]}%`;if(r[0]==="bdr")return`頭目減傷：受到頭目傷害 -${r[1]}%`;if(r[0]==="und")return`不死獵殺：對不死族傷害 +${r[1]}%`;if(r[0]==="dem")return`惡魔獵殺：對惡魔族傷害 +${r[1]}%`;if(r[0]==="dra")return`屠龍：對龍族傷害 +${r[1]}%`;if(r[0]==="hsk")return`破硬皮：對硬皮敵人傷害 +${r[1]}%`;if(r[0]==="opn")return`先制增傷：目標 HP 90% 以上時傷害 +${r[1]}%`;if(r[0]==="exe")return`處決增傷：目標 HP 30% 以下時傷害 +${r[1]}%`;if(r[0]==="pdr")return`物理減傷：受到物理傷害 -${r[1]}%`;if(r[0]==="mdr")return`魔法減傷：受到魔法傷害 -${r[1]}%`;if(r[0]==="ldr")return`瀕死減傷：自身 HP 35% 以下時受到傷害 -${r[1]}%`;if(r[0]==="adr")return`異常減傷：自身帶有異常狀態時受到傷害 -${r[1]}%`;if(r[0]==="udr")return`不死減傷：受到不死族敵人傷害 -${r[1]}%`;if(r[0]==="ddr")return`惡魔減傷：受到惡魔族敵人傷害 -${r[1]}%`;if(r[0]==="blk")return`堅守格擋：受傷時 ${r[1]}% 機率擋下 50% 傷害`;if(r[0]==="mgd")return`魔力護體：以 MP 吸收所受傷害的 ${r[1]}%`;if(r[0]==="rcv")return`傷勢回流：受傷後恢復實際傷害 ${r[1]}% 的 HP`;if(r[0]==="sav")return`致命守護：致命傷時保留 1 HP 並獲得最大 HP ${r[1]}% 護盾（60 秒冷卻）`;if(r[0]==="bar")return`傷勢壁壘：受傷後獲得該次傷害 ${r[1]}% 護盾（5 秒冷卻，最多最大 HP 15%）`;if(r[0]==="rip")return`反擊意志：受傷後傷害 +${r[1]}%，持續 5 秒`;if(r[0]==="ber")return`浴血增傷：自身 HP 35% 以下時傷害 +${r[1]}%`;if(r[0]==="fmp")return`滿魔增傷：自身 MP 90% 以上時傷害 +${r[1]}%`;if(r[0]==="shp")return`護盾猛攻：擁有八色詞綴護盾時傷害 +${r[1]}%`;if(r[0]==="ksh")return`擊殺護盾：全隊擊殺後獲得最大 HP ${r[1]}% 護盾`;if(r[0]==="krc")return`擊殺回春：全隊擊殺後恢復最大 HP ${r[1]}%`;if(r[0]==="kfu")return`擊殺戰意：全隊擊殺後傷害 +${r[1]}%，持續 5 秒`;if(r[0]==="frz")return`霜縛追擊：對冰凍敵人傷害 +${r[1]}%`;if(r[0]==="brn")return`焚燒追擊：對燃燒敵人傷害 +${r[1]}%`;if(r[0]==="psn")return`劇毒追擊：對中毒敵人傷害 +${r[1]}%`;if(r[0]==="bld")return`流血追擊：對流血敵人傷害 +${r[1]}%`;if(r[0]==="ctl")return`控場追擊：對暈眩、石化、麻痺、沉睡或束縛敵人傷害 +${r[1]}%`;if(r[0]==="deb")return`破綻追擊：對弱化、破甲、脆弱、減速等減益敵人傷害 +${r[1]}%`;if(r[0]==="fbr")return`烈焰催化：火屬性命中燃燒敵人時傷害 +${r[1]}%`;if(r[0]==="wfr")return`霜潮共鳴：水屬性命中冰凍敵人時傷害 +${r[1]}%`;if(r[0]==="eps")return`腐土共生：地屬性命中中毒敵人時傷害 +${r[1]}%`;if(r[0]==="wbl")return`風刃放血：風屬性命中流血敵人時傷害 +${r[1]}%`;if(r[0]==="fsi")return`裝備技能・熾焰刻印：火屬性傷害命中時 ${r[1]}% 機率附加灼燒 5 秒`;if(r[0]==="wsi")return`裝備技能・寒潮刻印：水屬性傷害命中時 ${r[1]}% 機率冰凍 2 秒（頭目無效）`;if(r[0]==="esi")return`裝備技能・腐毒刻印：地屬性傷害命中時 ${r[1]}% 機率附加中毒 6 秒`;if(r[0]==="asi")return`裝備技能・裂風刻印：風屬性傷害命中時 ${r[1]}% 機率附加流血 8 秒`;if(r[0]==="hy")return`九頭蛇傷害 +${r[1]}%`;if(r[0]==="hd")return`九頭蛇持續時間 +${r[1]}%`;if(r[0]==="st")return`靜電立場削減效果 +${r[1]}%`;if(r[0]==="os")return`冰封球每次發射冰片 +${r[1]}`;if(r[0]==="cb")return`連鎖雷光彈跳次數 +${r[1]}`;if(r[0]==="mcx")return`隕星數量 +${r[1]}`;if(r[0]==="gd")return`燃燒地面持續時間 +${r[1]}%`;if(r[0]==="scd")return`延伸技能冷卻時間 -${r[1]}%`;if(r[0]==="ww")return`炫風斬傷害 +${r[1]}%`;if(r[0]==="wd")return`炫風斬持續時間 +${r[1]}%`;if(r[0]==="wr")return`一般攻擊怒氣取得 +${r[1]}%`;if(r[0]==="wc")return`炫風斬冷卻時間 -${r[1]}%`;if(r[0]==="ld")return`躍擊傷害 +${r[1]}%`;if(r[0]==="ls")return`躍擊暈眩時間 +${r[1]}%`;if(r[0]==="lc")return`躍擊冷卻時間 -${r[1]}%`;if(r[0]==="lr")return`躍擊怒氣消耗 -${r[1]}%`;if(r[0]==="bh")return`祝福之鎚傷害 +${r[1]}%`;if(r[0]==="bn")return`祝福之鎚數量 +${r[1]}`;if(r[0]==="bt")return`祝福之鎚持續時間 +${r[1]}%`;if(r[0]==="bc")return`祝福之鎚冷卻時間 -${r[1]}%`;if(r[0]==="shd")return`暗影分身傷害 +${r[1]}%`;if(r[0]==="shn")return`暗影分身數量 +${r[1]}`;if(r[0]==="sht")return`暗影分身持續時間 +${r[1]}%`;if(r[0]==="shc")return`暗影分身冷卻時間 -${r[1]}%`;if(r[0]==="vwd")return`范德震地傷害 +${r[1]}%`;if(r[0]==="vwn")return`范德震地目標數量 +${r[1]}`;if(r[0]==="vws")return`范德震地暈眩時間 +${r[1]}%`;if(r[0]==="vwc")return`范德震地冷卻時間 -${r[1]}%`;if(r[0]==="fdd")return`冰龍追擊傷害 +${r[1]}%`;if(r[0]==="fdn")return`冰龍追擊目標數量 +${r[1]}`;if(r[0]==="fdf")return`冰龍追擊冰凍機率 +${r[1]}%`;if(r[0]==="fdc")return`冰龍追擊冷卻時間 -${r[1]}%`;if(r[0]==="tjd")return`雷霆標槍連鎖傷害 +${r[1]}%`;if(r[0]==="tjn")return`雷霆標槍彈跳次數 +${r[1]}`;if(r[0]==="tjs")return`雷霆標槍每次彈跳傷害衰減 -${r[1]}%`;if(r[0]==="tjc")return`雷霆標槍冷卻時間 -${r[1]}%`;if(r[0]==="med")return`心靈共振傷害 +${r[1]}%`;if(r[0]==="men")return`心靈共振目標數量 +${r[1]}`;if(r[0]==="mes")return`心靈共振每次擴散傷害衰減 -${r[1]}%`;if(r[0]==="mec")return`心靈共振冷卻時間 -${r[1]}%`;if(r[0]==="rbd")return`裂界衝擊傷害 +${r[1]}%`;if(r[0]==="rbn")return`裂界衝擊目標數量 +${r[1]}`;if(r[0]==="rbf")return`裂界衝擊暈眩機率 +${r[1]}%`;if(r[0]==="rbc")return`裂界衝擊冷卻時間 -${r[1]}%`;if(r[0]==="ard")return`多重箭雨傷害 +${r[1]}%`;if(r[0]==="arn")return`多重箭雨箭矢數量 +${r[1]}`;if(r[0]==="arc")return`多重箭雨額外暴擊機率 +${r[1]}%`;if(r[0]==="acd")return`多重箭雨冷卻時間 -${r[1]}%`;if(r[0]==="csd")return`充能一擊傷害 +${r[1]}%`;if(r[0]==="csn")return`充能一擊電束數量 +${r[1]}`;if(r[0]==="csp")return`充能一擊風抗穿透 +${r[1]}%`;if(r[0]==="csc")return`充能一擊冷卻時間 -${r[1]}%`;if(r[0]==="mzd")return`馬賽克終結傷害 +${r[1]}%`;if(r[0]==="mzn")return`馬賽克終結目標數量 +${r[1]}`;if(r[0]==="mzt")return`馬賽克蓄能保存時間 +${r[1]}%`;if(r[0]==="mzc")return`馬賽克終結冷卻時間 -${r[1]}%`;if(r[0]==="trd")return`雷光哨衛傷害 +${r[1]}%`;if(r[0]==="trn")return`雷光哨衛電束數量 +${r[1]}`;if(r[0]==="trt")return`雷光哨衛持續時間 +${r[1]}%`;if(r[0]==="trc")return`雷光哨衛冷卻時間 -${r[1]}%`;if(r[0]==="ac")return`AC -${r[1]}`;if(["mc","rc","gc","mcd","rcd","gcd","hpp","mpp","pot","abr","gf","xf","nd","bd","fpen","wpen","epen","apen","sdm","bdr","und","dem","dra","hsk","opn","exe","pdr","mdr","ldr","adr","udr","ddr","blk","mgd","rcv","sav","bar","rip","ber","fmp","shp","ksh","krc","kfu","frz","brn","psn","bld","ctl","deb","fbr","wfr","eps","wbl","fsi","wsi","esi","asi"].includes(r[0]))return`${D2R_AFFIX_LABEL[r[0]]} +${r[1]}%`;return`${D2R_AFFIX_LABEL[r[0]]} +${r[1]}`}
const D2R_NAME_PREFIX={md:"殘暴的",rd:"鷹眼的",mg:"秘法的",mh:"精準的",rh:"神射的",gh:"專注的",rf:"耐火的",rw:"抗寒的",re:"大地的",ra:"疾風的",rn:"守護的",mf:"幸運的",str:"強壯的",dex:"靈巧的",con:"堅韌的",int:"聰慧的",wis:"睿智的",cha:"魅惑的",hp:"健壯的",mp:"充能的",hpr:"再生的",mpr:"冥想的",wt:"輕盈的",as:"迅捷的",ff:"燃燒的",fw:"冰封的",fa:"大地震擊的",fe:"風暴的",ph:"汲取的",pm:"聚能的",ac:"堅甲的",mr:"抗魔的",er:"閃避的",dr:"守勢的",mc:"致命的",rc:"神準的",gc:"秘爆的",mcd:"殘酷的",rcd:"穿心的",gcd:"奧秘的",hpp:"巨量生命的",mpp:"巨量魔力的",pot:"療癒的",abr:"不屈的",gf:"富饒的",xf:"歷練的",nd:"狩獵的",bd:"弒王的",kh:"收割生命的",km:"收割魔力的",kx:"爆裂的",ts:"護壁的",pi:"完美的",ks:"追獵的",sp:"橫掃的",fh:"無傷的",fpen:"熔穿的",wpen:"破潮的",epen:"裂地的",apen:"破風的",sdm:"處刑的",bdr:"屹立的",und:"驅邪的",dem:"獵魔的",dra:"屠龍的",hsk:"粉碎的",opn:"先鋒的",exe:"終結的",pdr:"堅壁的",mdr:"秘護的",ldr:"背水的",adr:"忍苦的",udr:"驅靈的",ddr:"退魔的",blk:"格擋的",mgd:"魔護的",rcv:"回流的",sav:"不滅的",bar:"築壘的",rip:"復仇的",ber:"浴血的",fmp:"滿溢的",shp:"盾擊的",ksh:"護獵的",krc:"回春的",kfu:"連戰的",frz:"霜獵的",brn:"焚獵的",psn:"毒獵的",bld:"血獵的",ctl:"鎮壓的",deb:"破綻的",fbr:"催焰的",wfr:"霜潮的",eps:"腐土的",wbl:"風血的",fsi:"熾印的",wsi:"寒印的",esi:"毒印的",asi:"風印的",hy:"蛇焰的",hd:"長燃的",st:"靜電的",os:"碎冰的",cb:"雷鏈的",mcx:"星落的",gd:"焦土的",scd:"迅詠的",ww:"旋刃的",wd:"不息的",wr:"狂怒的",wc:"疾旋的",ld:"震地的",ls:"鎮壓的",lc:"飛躍的",lr:"輕躍的",bh:"聖鎚的",bn:"多重聖鎚的",bt:"長禱的",bc:"迅禱的",shd:"影襲的",shn:"影群的",sht:"長影的",shc:"迅影的",vwd:"裂地的",vwn:"廣震的",vws:"鎮魂的",vwc:"迅震的",fdd:"冰龍的",fdn:"群襲的",fdf:"霜縛的",fdc:"迅霜的",tjd:"雷霆的",tjn:"躍雷的",tjs:"不衰的",tjc:"迅雷的",med:"共鳴的",men:"群心的",mes:"不衰心念的",mec:"迅念的",rbd:"裂界的",rbn:"廣裂的",rbf:"震魂的",rbc:"迅裂的",ard:"箭雨的",arn:"萬箭的",arc:"穿心的",acd:"迅弦的",csd:"充能的",csn:"裂電的",csp:"破風的",csc:"迅電的",mzd:"萬象的",mzn:"廣域的",mzt:"凝息的",mzc:"迅終的",trd:"雷哨的",trn:"裂電的",trt:"長鳴的",trc:"迅哨的"};const D2R_NAME_SUFFIX={str:"之巨力",dex:"之敏捷",con:"之活力",int:"之智慧",wis:"之精神",cha:"之魅力",hp:"之生命",mp:"之魔力",hpr:"之再生",mpr:"之冥想",wt:"之承載",mf:"之財運",md:"之屠戮",rd:"之狙擊",mg:"之奧術",mh:"之準確",rh:"之洞察",gh:"之專注",rf:"之烈焰防護",rw:"之寒霜防護",re:"之大地防護",ra:"之風暴防護",rn:"之守護",as:"之迅捷",ff:"之烈焰",fw:"之寒霜",fa:"之震地",fe:"之雷鳴",ph:"之生命汲取",pm:"之魔力汲取",ac:"之護甲",mr:"之抗魔",er:"之閃避",dr:"之減傷",mc:"之致命",rc:"之神射",gc:"之魔爆",mcd:"之殘酷",rcd:"之穿心",gcd:"之奧秘",hpp:"之巨量生命",mpp:"之巨量魔力",pot:"之療癒",abr:"之不屈",gf:"之財富",xf:"之歷練",nd:"之獵殺",bd:"之弒王",kh:"之生命收割",km:"之魔力收割",kx:"之爆裂",ts:"之護壁",pi:"之完美",ks:"之追獵",sp:"之橫掃",fh:"之滿血狩獵",fpen:"之熔穿",wpen:"之破潮",epen:"之裂地",apen:"之破風",sdm:"之處刑",bdr:"之屹立",und:"之淨化",dem:"之誅魔",dra:"之龍殤",hsk:"之破壁",opn:"之先制",exe:"之斷命",pdr:"之鐵壁",mdr:"之法障",ldr:"之絕境",adr:"之抗逆",udr:"之鎮魂",ddr:"之退魔",blk:"之格擋",mgd:"之魔護",rcv:"之回流",sav:"之不滅",bar:"之壁壘",rip:"之反擊",ber:"之浴血",fmp:"之滿溢",shp:"之盾擊",ksh:"之護獵",krc:"之回春",kfu:"之連戰",frz:"之霜獵",brn:"之焚獵",psn:"之毒獵",bld:"之血獵",ctl:"之鎮壓",deb:"之破綻",fbr:"之催焰",wfr:"之霜潮",eps:"之腐土",wbl:"之風血",fsi:"之熾焰刻印",wsi:"之寒潮刻印",esi:"之腐毒刻印",asi:"之裂風刻印",hy:"之九頭蛇",hd:"之蛇群長駐",st:"之靜電",os:"之冰片",cb:"之雷鏈",mcx:"之星雨",gd:"之焦土",scd:"之迅詠",ww:"之炫風",wd:"之不息旋舞",wr:"之狂怒",wc:"之疾旋",ld:"之震地",ls:"之鎮壓",lc:"之飛躍",lr:"之輕躍",bh:"之祝福之鎚",bn:"之鎚陣",bt:"之長禱",bc:"之迅禱",shd:"之影襲",shn:"之影群",sht:"之長影",shc:"之迅影",vwd:"之裂地",vwn:"之廣震",vws:"之鎮魂",vwc:"之迅震",fdd:"之冰龍",fdn:"之群襲",fdf:"之霜縛",fdc:"之迅霜",tjd:"之雷霆標槍",tjn:"之躍雷",tjs:"之不衰電流",tjc:"之迅雷",med:"之心靈共振",men:"之群心",mes:"之不衰心念",mec:"之迅念",rbd:"之裂界衝擊",rbn:"之廣裂",rbf:"之震魂",rbc:"之迅裂",ard:"之箭雨",arn:"之萬箭",arc:"之穿心",acd:"之迅弦",csd:"之充能一擊",csn:"之裂電",csp:"之破風",csc:"之迅電",mzd:"之馬賽克",mzn:"之廣域終結",mzt:"之凝息",mzc:"之迅終",trd:"之雷光哨衛",trn:"之多重電束",trt:"之長鳴",trc:"之迅哨"};const D2R_PREFIX_PREFERRED=new Set(["as","ff","fw","fa","fe","ph","pm","md","rd","mg","mh","rh","gh","rf","rw","re","ra","rn","mf","fpen","wpen","epen","apen","sdm","und","dem","dra","hsk","opn","exe","ber","fmp","shp","kfu","frz","brn","psn","bld","ctl","deb","fbr","wfr","eps","wbl","fsi","wsi","esi","asi"]);const D2R_SUFFIX_PREFERRED=new Set(["str","dex","con","int","wis","cha","hp","mp","hpr","mpr","wt","bdr","pdr","mdr","ldr","adr","udr","ddr","blk","mgd","rcv","sav","bar","rip","ksh","krc"]);
function d2rNameAffixes(item){let rows=d2rAffixRows(item).map((r,i)=>({r:r,i:i})).sort((a,b)=>a.r[2]-b.r[2]||b.r[1]-a.r[1]||a.i-b.i);if(!rows.length)return{prefix:"",suffix:""};let pre=rows.find(x=>D2R_PREFIX_PREFERRED.has(x.r[0]))||rows[0];if(rows.length<=2)return{prefix:D2R_NAME_PREFIX[pre.r[0]]||"",suffix:""};let suf=rows.find(x=>x!==pre&&D2R_SUFFIX_PREFERRED.has(x.r[0]))||rows.find(x=>x!==pre);return{prefix:D2R_NAME_PREFIX[pre.r[0]]||"",suffix:suf?D2R_NAME_SUFFIX[suf.r[0]]||"":""}}

function gaEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

const EQ_SLOT_LABEL = Object.fromEntries(EQ_SLOTS.filter(s=>!s.spacer).map(s=>[s.id, s.label]));

let _gaSlot = '';
let _gaQuality = 'magic';
let _gaRows = [];
let _gaPendingItem = ''; // 空部位時選擇的待裝備物品 ID

// 物品選擇器篩選器：只依部位類型篩選，不排除特殊物品
// （遊戲中鐵匠實際上無法對不朽/太古附魔，但本編輯器不設此限）
const _BASE_EXCL = ([id,d]) => true; // 無額外排除條件
const _AFFIX_SLOT_FILTER = {
  wpn:     ([id,d]) => d.type==='wpn' && _BASE_EXCL([id,d]),
  offwpn:  ([id,d]) => d.type==='wpn' && _BASE_EXCL([id,d]),
  helm:    ([id,d]) => d.slot==='helm'    && _BASE_EXCL([id,d]),
  armor:   ([id,d]) => d.slot==='armor'   && _BASE_EXCL([id,d]),
  shield:  ([id,d]) => d.slot==='shield'  && _BASE_EXCL([id,d]),
  cloak:   ([id,d]) => d.slot==='cloak'   && _BASE_EXCL([id,d]),
  tshirt:  ([id,d]) => d.slot==='tshirt'  && _BASE_EXCL([id,d]),
  gloves:  ([id,d]) => d.slot==='gloves'  && _BASE_EXCL([id,d]),
  boots:   ([id,d]) => d.slot==='boots'   && _BASE_EXCL([id,d]),
  belt:    ([id,d]) => d.slot==='belt'    && _BASE_EXCL([id,d]),
  ring1:   ([id,d]) => d.slot==='ring'    && _BASE_EXCL([id,d]),
  ring2:   ([id,d]) => d.slot==='ring'    && _BASE_EXCL([id,d]),
  amulet:  ([id,d]) => d.slot==='amulet'  && _BASE_EXCL([id,d]),
  earring: ([id,d]) => d.slot==='earring' && _BASE_EXCL([id,d]),
};

// 部位確實沒有裝備（id 為空）
function growthAffixIsEmpty(slotKey){
  if(!G.p.eq) return true;
  const it = G.p.eq[slotKey];
  return !it || !it.id;
}

// 部位有裝備但不可附魔（遺物、Boss 裝備、席琳遺骸、魔法娃娃、奇古獸等）
// 在這個編輯器裡，所有已裝備的物品都可以附魔
// 遊戲中原本僅不朽/太古品質無法在鐵匠改造，但本編輯器不設此限
function growthAffixIsNonAffixable(slotKey){
  return false;
}

function growthAffixEligibleSlots(){
  return Object.keys(_AFFIX_SLOT_FILTER);
}

function renderGrowthAffixPanel(){
  const sel = document.getElementById('growthAffixSlotSelect');
  if(!sel) return;
  const prev = sel.value || _gaSlot;
  const slots = growthAffixEligibleSlots();
  sel.innerHTML = slots.map(k=>{
    const label = EQ_SLOT_LABEL[k] || k;
    if(growthAffixIsEmpty(k))
      return `<option value="${k}">${gaEsc(label)}・（無裝備）</option>`;
    if(growthAffixIsNonAffixable(k))
      return `<option value="${k}" disabled style="color:var(--text3)">${gaEsc(label)}・${gaEsc(getItemName(G.p.eq[k].id))}（不可附魔）</option>`;
    return `<option value="${k}">${gaEsc(label)}・${gaEsc(getItemName(G.p.eq[k].id))}</option>`;
  }).join('');
  // 優先還原上一個選取；若它是 disabled（不可附魔）則跳到第一個可選的
  const validPrev = prev && slots.includes(prev) && !growthAffixIsNonAffixable(prev);
  sel.value = validPrev ? prev : (slots.find(k=>!growthAffixIsNonAffixable(k)) || slots[0] || '');
  growthAffixSlotChange();
}

// 延遲注入「選擇裝備」下拉列（緊接在部位選單上方）
function _gaEnsureItemPicker(){
  if(document.getElementById('growthAffixItemPickerRow')) return;
  const qSel = document.getElementById('growthAffixQualitySelect');
  if(!qSel) return;
  const qRow = qSel.closest('.form-row');
  if(!qRow) return;
  const row = document.createElement('div');
  row.className = 'form-row';
  row.id = 'growthAffixItemPickerRow';
  row.style.display = 'none';
  row.innerHTML =
    `<span class="form-label">選擇裝備</span>` +
    `<select id="growthAffixItemPicker" style="min-width:260px" onchange="growthAffixItemPickerChange()">` +
      `<option value="">— 請選擇要附魔的裝備 —</option>` +
    `</select>` +
    `<span id="growthAffixPickerNote" style="color:var(--text3);font-size:12px;margin-left:6px"></span>`;
  qRow.parentNode.insertBefore(row, qRow);
}

function _gaPopulateItemPicker(slotKey){
  const pick = document.getElementById('growthAffixItemPicker');
  if(!pick || !_AFFIX_SLOT_FILTER[slotKey]) return;
  const items = Object.entries(ITEM_DB).filter(_AFFIX_SLOT_FILTER[slotKey]);
  pick.innerHTML =
    `<option value="">— 請選擇要附魔的裝備 —</option>` +
    items.map(([id,d])=>`<option value="${id}">${gaEsc(d.n)}</option>`).join('');
  pick.value = '';
  const note = document.getElementById('growthAffixPickerNote');
  if(note) note.textContent = '';
  _gaPendingItem = '';
}

function growthAffixItemPickerChange(){
  const pick = document.getElementById('growthAffixItemPicker');
  _gaPendingItem = pick ? pick.value : '';
  const note = document.getElementById('growthAffixPickerNote');
  if(note) note.textContent = _gaPendingItem ? `已選：${getItemName(_gaPendingItem)}` : '';
  growthAffixRenderPreview();
}

function growthAffixSlotChange(){
  const sel = document.getElementById('growthAffixSlotSelect');
  _gaSlot = sel ? sel.value : '';
  _gaPendingItem = '';

  const empty    = growthAffixIsEmpty(_gaSlot);
  const nonAffix = !empty && growthAffixIsNonAffixable(_gaSlot);

  // 顯示 / 隱藏物品選擇器（只有真正空部位才顯示）
  _gaEnsureItemPicker();
  const pickerRow = document.getElementById('growthAffixItemPickerRow');
  if(pickerRow){
    if(empty && _gaSlot){ pickerRow.style.display = ''; _gaPopulateItemPicker(_gaSlot); }
    else                 { pickerRow.style.display = 'none'; }
  }

  // 有裝備且可附魔才載入詞綴
  const it = (!empty && !nonAffix && _gaSlot) ? G.p.eq[_gaSlot] : null;
  _gaQuality = (it && D2R_QUALITY[it.d2q]) ? it.d2q : 'magic';
  _gaRows = it && Array.isArray(it.d2)
    ? it.d2.filter(r=>Array.isArray(r) && D2R_AFFIX_LABEL[r[0]])
           .map(r=>[r[0], Math.max(0,Math.floor(Number(r[1])||0)), Math.max(1,Math.min(5,Math.floor(Number(r[2]))||5))])
    : [];
  const qSel = document.getElementById('growthAffixQualitySelect');
  if(qSel){
    qSel.innerHTML = D2R_QUALITY_KEYS.map(k=>`<option value="${k}">${gaEsc(D2R_QUALITY[k].n)}</option>`).join('');
    qSel.value = _gaQuality;
  }
  growthAffixRenderRows();
  growthAffixRenderPreview();
}

function growthAffixQualityChange(){
  const qSel = document.getElementById('growthAffixQualitySelect');
  _gaQuality = qSel ? qSel.value : 'magic';
  growthAffixRenderPreview();
}

function growthAffixCodeOptions(selected){
  return Object.keys(D2R_AFFIX_LABEL).map(code=>`<option value="${code}" ${code===selected?'selected':''}>${gaEsc(D2R_AFFIX_LABEL[code])}（${code}）</option>`).join('');
}

function growthAffixRenderRows(){
  const wrap = document.getElementById('growthAffixRows');
  if(!wrap) return;
  if(!_gaSlot){
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = _gaRows.map((row, idx)=>{
    const code = row[0], value = row[1], tier = row[2];
    const range = (D2R_AFFIX_RANGES[code] && D2R_AFFIX_RANGES[code][tier-1]) || [0,0];
    let tierOpts = '';
    for(let t=1;t<=5;t++) tierOpts += `<option value="${t}" ${t===tier?'selected':''}>${t} 階${t===1?'（最高）':t===5?'（最低）':''}</option>`;
    return `<div class="form-row" style="background:var(--bg2);padding:8px 10px;border-radius:6px;margin:0">
      <select style="min-width:180px" onchange="growthAffixRowSetCode(${idx},this.value)">${growthAffixCodeOptions(code)}</select>
      <select style="width:70px" onchange="growthAffixRowSetTier(${idx},this.value)">${tierOpts}</select>
      <input type="number" value="${value}" style="width:70px" onchange="growthAffixRowSetValue(${idx},this.value)">
      <span style="color:var(--text3);font-size:12px">範圍 ${range[0]}~${range[1]}</span>
      <span style="flex:1;color:var(--accent2);font-size:12px">${gaEsc(d2rAffixText(row))}</span>
      <button class="btn btn-danger btn-sm" onclick="growthAffixRemoveRow(${idx})">移除</button>
    </div>`;
  }).join('') || '<p style="color:var(--text3);font-size:12px">目前沒有詞綴，點下方「新增一條詞綴」開始。</p>';
}

function growthAffixRowSetCode(idx, code){
  if(!_gaRows[idx]) return;
  _gaRows[idx][0] = code;
  const range = (D2R_AFFIX_RANGES[code] && D2R_AFFIX_RANGES[code][_gaRows[idx][2]-1]) || [1,1];
  _gaRows[idx][1] = range[0];
  growthAffixRenderRows();
  growthAffixRenderPreview();
}

function growthAffixRowSetTier(idx, tier){
  if(!_gaRows[idx]) return;
  tier = Math.max(1, Math.min(5, parseInt(tier,10)||1));
  _gaRows[idx][2] = tier;
  const range = (D2R_AFFIX_RANGES[_gaRows[idx][0]] && D2R_AFFIX_RANGES[_gaRows[idx][0]][tier-1]) || [1,1];
  _gaRows[idx][1] = Math.max(range[0], Math.min(range[1], _gaRows[idx][1]));
  growthAffixRenderRows();
  growthAffixRenderPreview();
}

function growthAffixRowSetValue(idx, value){
  if(!_gaRows[idx]) return;
  _gaRows[idx][1] = Math.max(0, Math.floor(Number(value)||0));
  growthAffixRenderRows();
  growthAffixRenderPreview();
}

function growthAffixRemoveRow(idx){
  _gaRows.splice(idx,1);
  growthAffixRenderRows();
  growthAffixRenderPreview();
}

function growthAffixAddRow(){
  if(!_gaSlot){ toast('請先選擇要編輯的裝備', 'err'); return; }
  if(growthAffixIsEmpty(_gaSlot) && !_gaPendingItem){
    toast('請先在「選擇裝備」下拉選單選擇要附魔的裝備', 'err'); return;
  }
  const qdef = D2R_QUALITY[_gaQuality] || D2R_QUALITY.magic;
  if(_gaRows.length >= qdef.max){
    toast(`「${qdef.n}」品質最多只能有 ${qdef.max} 條詞綴`, 'err');
    return;
  }
  const usedCodes = new Set(_gaRows.map(r=>r[0]));
  const code = Object.keys(D2R_AFFIX_LABEL).find(c=>!usedCodes.has(c)) || Object.keys(D2R_AFFIX_LABEL)[0];
  const range = (D2R_AFFIX_RANGES[code] && D2R_AFFIX_RANGES[code][2]) || [1,1];
  _gaRows.push([code, range[0], 3]);
  growthAffixRenderRows();
  growthAffixRenderPreview();
}

function growthAffixRenderPreview(){
  const box = document.getElementById('growthAffixPreview');
  if(!box) return;
  if(!_gaSlot){ box.innerHTML = '<span style="color:var(--text3)">尚未選擇裝備。</span>'; return; }
  const empty = growthAffixIsEmpty(_gaSlot);
  const baseId = empty ? _gaPendingItem : (G.p.eq[_gaSlot] && G.p.eq[_gaSlot].id);
  const baseName = baseId ? getItemName(baseId) : (empty ? '（請先選擇裝備）' : '');
  const qdef = D2R_QUALITY[_gaQuality] || D2R_QUALITY.magic;
  const rows = _gaRows.filter(r=>D2R_AFFIX_LABEL[r[0]] && r[1] > 0);
  const lines = rows.map(r=>'・' + gaEsc(d2rAffixText(r))).join('<br>') || '<span style="color:var(--text3)">尚未設定任何詞綴</span>';
  const names = rows.length ? d2rNameAffixes({ d2: rows }) : { prefix:'', suffix:'' };
  const fullName = `${gaEsc(names.prefix||'')}${gaEsc(baseName)}${gaEsc(names.suffix||'')}`;
  box.innerHTML = `<b style="color:var(--accent2)">預覽全名：</b>${fullName}<br>
    <b style="color:var(--accent2)">品質：</b>${gaEsc(qdef.n)}（最多 ${qdef.max} 條詞綴，其中最多 ${qdef.t1max} 條可為 1 階）<br>
    <b style="color:var(--accent2)">能力：</b><br>${lines}`;
}

function growthAffixApply(){
  if(!_gaSlot){ toast('請先選擇要編輯的裝備', 'err'); return; }
  const rows = _gaRows.filter(r=>D2R_AFFIX_LABEL[r[0]] && r[1] > 0);
  const empty = growthAffixIsEmpty(_gaSlot);

  if(empty){
    // 空部位：需先選擇物品，確認後裝備並寫入詞綴
    if(!_gaPendingItem){ toast('請先在「選擇裝備」下拉選單選擇要附魔的裝備', 'err'); return; }
    if(!rows.length){ toast('請至少設定一條詞綴', 'err'); return; }
    const slotLabel = EQ_SLOT_LABEL[_gaSlot] || _gaSlot;
    const itemName  = getItemName(_gaPendingItem);
    if(!confirm(`確定要將「${itemName}」附魔後裝備到「${slotLabel}」嗎？`)) return;
    if(!G.p.eq) G.p.eq = {};
    G.p.eq[_gaSlot] = {
      id: _gaPendingItem,
      uid: typeof genUID==='function' ? genUID() : Math.random().toString(36).slice(2,11),
      cnt:1, en:0, bless:false, lock:false, junk:false,
      attr:false, anc:false, seteff:false,
      d2:  rows.map(r=>[r[0], Math.floor(r[1]), Math.max(1,Math.min(5,Math.floor(r[2])))]),
      d2q: _gaQuality,
    };
    toast(`已將「${itemName}」附魔並裝備到「${slotLabel}」`, 'ok');
  } else {
    // 已有裝備：直接覆寫詞綴
    const it = G.p.eq[_gaSlot];
    if(!rows.length){ toast('請至少設定一條詞綴，或使用「清除詞綴」', 'err'); return; }
    it.d2  = rows.map(r=>[r[0], Math.floor(r[1]), Math.max(1,Math.min(5,Math.floor(r[2])))]);
    it.d2q = _gaQuality;
    toast(`已套用詞綴到「${getItemName(it.id)}」`, 'ok');
  }

  renderGrowthAffixPanel();
  const eqPanel = document.getElementById('panel-eq');
  if(eqPanel && eqPanel.classList.contains('active') && typeof renderEqPanel === 'function') renderEqPanel();
}

function growthAffixClear(){
  if(!_gaSlot) return;
  if(growthAffixIsEmpty(_gaSlot)){ _gaRows = []; growthAffixRenderRows(); growthAffixRenderPreview(); return; }
  const it = G.p.eq[_gaSlot];
  if(!it) return;
  if(!confirm('確定要清除這件裝備的所有詞綴嗎？')) return;
  delete it.d2;
  delete it.d2q;
  _gaRows = [];
  toast('已清除該裝備的詞綴', 'ok');
  growthAffixRenderRows();
  growthAffixRenderPreview();
  const eqPanel = document.getElementById('panel-eq');
  if(eqPanel && eqPanel.classList.contains('active') && typeof renderEqPanel === 'function') renderEqPanel();
}
