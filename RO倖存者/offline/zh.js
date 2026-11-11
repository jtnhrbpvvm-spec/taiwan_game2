/* RO 倖存者離線版：補上遊戲沒翻的中文（裝備、卡片、怪物名稱）
   遊戲 2026-11-09 起內建繁體中文，但裝備、卡片、怪物名稱還是英文：
   - 裝備、卡片名稱來自 assets/manifest.json → 攔下這個檔案，把 name 換成「看語言決定」的 getter
   - 怪物名稱在 soul_linker 的怪物表 → 遊戲載入後用資料形狀找到，同樣換成 getter
   - 官方中文漏翻的技能名（Ruwach、Angelus…）→ 技能表同樣接手
   - 裝備字尾「太刀 of Strength」→「力量之太刀」（rs_offline.py 修補遊戲的組名函式，呼叫這裡的 full）
   - 圖書館員百科裡寫死的英文（Nv、Tier、1st job…）→ 只在百科視窗裡換字
   只有遊戲語言是繁體中文時才顯示中文，切成英文／西文就是原文。
   因為是在資料層換，遊戲內的圖書館員百科搜尋、GM 面板的搜尋都能直接打中文。
   原文放在不會被列舉的 nameEN，GM 面板搜尋英文也找得到。

   這個檔案由 rs_offline.py 在 index.html 的 <head> 最前面載入（比遊戲程式早執行）。
   下面 NAMES 那一行由 tools\pack_offline.py 從 tools\zh\names.txt 產生，不要手動改。 */
/*NAMES*/const NAMES = {"1st job":"一轉","A Drum on the Battlefield":"戰鼓響徹","A Poem of Bragi":"布萊奇之詩","A Whistle":"口哨","Acid Terror":"強酸攻擊","Acolyte":"服事","Adjustment":"調整","Adrenaline Rush":"速度激發","Advanced Book":"進階書","Adventurer's Suit":"冒險家套裝","Alchemist":"鍊金術師","Alchemy":"鍊金術","Angel Wings":"天使之翼","Angel's Reincarnation":"天使轉生","Angelic Guard":"天使守護","Angelic Protection":"天使保護","Angeling":"天使波利","Angelring Card":"天使波利卡片","Angelring Egg":"天使波利蛋","Angelus":"天使之護","Ankle Snare":"定位陷阱","Apple of Archer":"弓箭手的蘋果","Apple of Idun":"伊登的蘋果","Aqua Benedicta":"天使之淚","Arc Wand":"弧形魔杖","Arcane Shot":"奧術射擊","Archer":"弓箭手","Archer Skeleton":"骷髏弓箭手","Archer Skeleton Card":"骷髏弓箭手卡片","Arrow Crafting":"製作箭矢","Arrow Rain":"驟雨箭","Arrow Repel":"衝鋒箭","Arrow Shower":"箭雨","Arrow Vulcan":"箭之火山","Assassin":"刺客","Assassin Cross of Sunset":"夕陽的刺客","Asura":"阿修羅","Asura Strike":"阿修羅霸凰拳","Auto Berserk":"自動狂暴","Auto Guard":"自動防禦","Awakening Potion":"覺醒藥水","Axe":"斧頭","Axe Boomerang":"迴旋斧","Axe Tornado":"斧頭龍捲","Baby Desert Wolf":"沙漠幼狼","Baby Desert Wolf Card":"沙漠幼狼卡片","Baby Desert Wolf Egg":"沙漠幼狼蛋","Back Stab":"背刺","Backpack":"背包","Ballista":"巨弩","Bandana":"頭巾","Banishing Buster":"驅逐霰彈","Baphomet":"巴風特","Baphomet Card":"巴風特卡片","Bard":"吟遊詩人","Bark Shorts":"樹皮短褲","Bash":"狂擊","Battle Axe":"戰斧","Beast Bane":"野獸剋星","Beast Strafing":"野獸射擊","Belt":"腰帶","Berserk":"狂暴","Berserk Potion":"狂暴藥水","Big Ribbon":"大蝴蝶結","Bigfoot":"大腳熊","Bigfoot Card":"大腳熊卡片","Binoculars":"望遠鏡","Biotechnology":"生物科技","Biting Tarou":"啃咬塔羅鼠","Blacksmith":"鐵匠","Blade":"大刀","Blade Stop":"真劍白刃取","Blank Scroll":"空白卷軸","Blast Mine":"爆破地雷","Blaze Shuriken":"火焰手裡劍","Blessing":"天使之賜福","Blessing of Water":"水之祝福","Blitz Beat":"獵鷹攻擊","Bloody Roar":"血之咆哮","Blue Gemstone":"藍色魔力礦石","Blue Potion":"藍色藥水","Boa":"蟒蛇","Body Relocation":"殘影","Bone Helm":"骨盔","Bongun":"邦艮","Bongun Card":"邦艮卡片","Bongun Egg":"邦艮蛋","Bongun Hat":"邦艮帽","Book":"書","Book of Apocalypse":"啟示錄之書","Book of Billows":"巨浪之書","Book of Blazing Sun":"烈日之書","Boots":"長靴","Bow":"弓","Bow Thimble":"弓箭手的頂針","Bowling Bash":"連鎖打擊","Branch":"樹枝","Brandish Spear":"怒刺","Brisingamen":"布理辛格曼","Brooch":"胸針","Bruno":"布魯諾","Buckler":"小圓盾","Bull's Eye":"牛眼","Bunny Band":"兔耳髮箍","Burrowing Tarou":"鑽地塔羅鼠","Butterfly Mask":"蝴蝶面具","Call Homunculus":"召喚生命體","Call Spirits":"氣功","Caltrops":"撒菱","Cap":"帽子","Cape of Ancient Lord":"古代君主披風","Cart Revolution":"手推車攻擊","Cart Rush":"手推車衝鋒","Cart Termination":"手推車終結","Cat O Nine Tails Egg":"九尾貓蛋","Cat O' Nine Tails":"九尾貓","Cat O' Nine Tails Card":"九尾貓卡片","Cavalier Mastery":"騎乘精通","Celebrant's Mitten":"祭司手套","Celia":"西莉亞","Chain":"鏈錘","Chain Action":"連鎖動作","Chain Combo":"連打掌","Chain Lightning":"連鎖閃電","Chain Mail":"鎖子甲","Charge Attack":"衝鋒攻擊","Chemeti Whip":"化學鞭","Chemical Protection":"化學保護","Chonchon":"叮噹蒼蠅","Chonchon Card":"叮噹蒼蠅卡片","Cicada Skin Shed":"空蟬之術","Claw":"爪","Claymore":"雙手大劍","Claymore Trap":"爆炸陷阱","Clearcast":"清晰詠唱","Clip":"夾子","Cloaking":"偽裝","Clown Nose":"小丑鼻","Club":"棍棒","Coat":"外套","Cold Bolt":"冰箭術","Combat Knife":"戰鬥小刀","Combo Finish":"猛龍誇強","Comfort":"安慰","Composite Bow":"複合弓","Concentration Potion":"集中藥水","Condor":"禿鷹","Condor Card":"禿鷹卡片","Cooked Nine Tail's Tails":"燉九尾狐尾","Cordial":"親密","Cornutus":"海螺","Cornutus Card":"海螺卡片","Corsair":"海盜帽","Cotton Shirt":"棉襯衫","Counter Attack":"反擊","Counter Kick":"反擊踢","Cramp":"巨鼠","Cramp Card":"巨鼠卡片","Crazy Uproar":"大聲吶喊","Creamy":"粉蝶","Creamy Card":"粉蝶卡片","Crescent Scythe":"新月鐮刀","Critical Ring":"爆擊戒指","Cross Bow":"十字弓","Crown":"王冠","Crusader":"十字軍","Cultivation":"栽培","Cute Ribbon":"可愛蝴蝶結","Cutlus":"彎刀","Cyclone":"旋風","Dagger":"短劍","Dagger Throwing Practice":"飛刀練習","Damascus":"大馬士革刀","Dancer":"舞孃","Dancing Lesson":"舞蹈練習","Decrease AGI":"緩速術","Deep Freeze":"深度冰凍","Defender":"守護者","Deluge":"洪水","Demon Bane":"惡魔剋星","Demonstration":"投擲火瓶","Demoralizing Shout":"威嚇吶喊","Desperado":"亡命之徒","Destroyer":"毀滅者","Detecting":"偵測","Deviace":"迪維斯","Deviace Card":"迪維斯卡片","Devil":"惡魔","Deviling":"惡魔波利","Devilring Card":"惡魔波利卡片","Deviruchi Hat":"小惡魔帽","Devotion":"犧牲","Dimension Door":"次元之門","Dirk":"匕首","Discount":"打折","Dissonance":"不協和音","Diver Goggles":"潛水護目鏡","Divest Weapon":"卸除武器","Divine Protection":"天使之護","Dodge":"閃避","Dokebi":"獨角鬼","Dokkaebi Card":"獨角鬼卡片","Dokkaebi Egg":"獨角鬼蛋","Doom Slayer":"末日殺手","Double Attack":"二連擊","Double Casting":"雙重詠唱","Double Strafe":"二連矢","Dragon Breath Cocktail":"龍之吐息雞尾酒","Dragon Fly":"龍蜻蜓","Dragon Killer":"屠龍刀","Dragon Tail":"龍尾蜻蜓","Dragon Tail Card":"龍尾蜻蜓卡片","Dragonfly Card":"龍蜻蜓卡片","Dragonology":"龍族學","Drainliar":"吸血蝙蝠","Drainliar Card":"吸血蝙蝠卡片","Drake":"德瑞克","Drake Card":"德瑞克卡片","Drops":"土波利","Drops Card":"土波利卡片","Drops Egg":"土波利蛋","Duple Light":"雙重光芒","Dust":"灰塵","Eagle Wing":"鷹之翼","Earring":"耳環","Earth Spike":"大地之刺","Eclipse":"蝕月兔","Eclipse Card":"蝕月兔卡片","Eddga":"虎王","Eddga Card":"虎王卡片","Elder Willow":"老樹精","Elder Willow Card":"老樹精卡片","Electric Guitar":"電吉他","Electrical Mayhem":"電流混亂","Elunium":"鋁","Elven Ears":"精靈耳","Emveretarcon":"艾維恩","Enchant Deadly Poison":"塗抹劇毒","Enchant Poison":"塗毒","Encore":"安可","Endless Tower":"無盡之塔","Endure":"霸體","Energy Coat":"能量外套","Enlarge Weight Limit":"負重量增加","Enriched Elunium":"濃縮鋁","Enriched Oridecon":"濃縮神之金屬","Envenom":"毒擊","Esma":"艾斯麻","Estin":"艾斯提","Estun":"艾斯敦","Eternal Chaos":"永恆的混沌","Evil Wings":"惡魔之翼","Eye Patch":"眼罩","Eye of Dullahan":"杜拉漢之眼","Fabre":"綠棉蟲","Fabre Card":"綠棉蟲卡片","Faith":"信仰","Falchion":"彎刃劍","Falcon Assault":"獵鷹突擊","Falconry Mastery":"馴鷹術","Fallen Angel":"墮天使","Falling Star":"流星落","Familiar":"蝙蝠","Familiar Card":"蝙蝠卡片","Familiar Egg":"蝙蝠蛋","Fan of Knives":"飛刀扇","Fancy Flower":"漂亮的花","Fatal Blow":"致命一擊","Feeling":"感覺","Female Thiefbug Card":"母盜蟲卡片","Final Strike":"最終一擊","Finger":"指","Finger Offensive":"指彈","Fire Ball":"火球術","Fire Bolt":"火箭術","Fire Brand":"火焰之刃","Fire Dance":"火之舞","Fire Elemental Converter":"火屬性轉換器","Fire Pillar":"火柱術","Fire Wall":"火牆術","Firestorm":"火焰風暴","Flail":"連枷","Flaming Petals":"火焰花瓣","Fling":"投擲","Flower Ring":"花環","Formal Suit":"正式禮服","Fortune's Kiss":"幸運之吻","Freezing Trap":"冰凍陷阱","Frost Diver":"冰凍術","Frost Joke":"冷笑話","Frost Nova":"霜凍之環","Full Buster":"全力爆擊","Full Chemical Protection":"完全化學保護","Full Moon Kick":"滿月踢","Full Plate":"全身鎧甲","Full Strip":"全面卸除","Fury":"爆氣","Gangster":"流氓","Gangster Paradise":"流氓天堂","Garrett":"蓋瑞特","Garrison":"守備兵","Gate Keeper":"守門人","Gate of Hell":"地獄之門","Gatling Fever":"格林狂熱","Ghost Bandana":"幽靈頭巾","Ghostring":"幽靈波利","Ghostring Card":"幽靈波利卡片","Girl's Diary":"少女的日記","Gladius":"羅馬短劍","Glasses":"眼鏡","Gleipnir":"格萊普尼爾","Gloria":"榮光頌","Glove":"手套","Goblin":"哥布林","Goblin Card":"哥布林卡片","Goblin Mask":"哥布林面具","Goddess of Blessing":"祝福女神","Goibne's Greaves":"高布紐的護脛","Gold Ring":"金戒指","Golden Bell":"黃金鈴鐺","Golden Gear":"黃金齒輪","Golden Mace":"黃金錘","Golden Thief Bug":"黃金蟲","Golden Thiefbug Card":"黃金蟲卡片","Gospel":"福音","Graffiti":"塗鴉","Grand Cross":"聖十字審判","Grand Peco":"大嘴鳥騎乘","Grave Keeper's Sword":"守墓者之劍","Great Bow":"巨弓","Greatest General":"天下大將軍","Greatest General Card":"天下大將軍卡片","Greaves":"護脛","Greed":"貪婪","Green Feeler":"綠色觸角","Green Jewel Bag":"綠寶石袋","Green Lace":"綠色蕾絲","Green Potion":"綠色藥水","Grimtooth":"無影之牙","Ground Drift":"地雷彈","Guard":"防禦","Guisarme":"鉤鐮槍","Gungnir":"昆古尼爾","Gunslinger":"神槍手","Haedong Gum":"海東劍","Hairband":"髮箍","Halo":"光環","Hammer":"鐵鎚","Hammer Fall":"大地震擊","Hammer of God":"神之錘","Harp":"豎琴","Haru":"哈魯","Hat":"帽子","Heal":"治癒術","Heat Barrel":"熱能槍管","Heaven's Drive":"崩裂術","Heel Drop":"下劈踢","Hiding":"隱匿","High Orc":"高等獸人","Hilt Binding":"劍柄纏繩","Hindsight":"自動施法","Holy Cross":"神聖十字","Holy Guard":"神聖守護","Holy Light":"聖光術","Hood":"兜帽","Hornet":"大黃蜂","Hornet Card":"大黃蜂卡片","Horong":"火鬼","Horong Card":"火鬼卡片","Horseshoe":"馬蹄鐵","Hunter":"獵人","Hunter Bow":"獵人之弓","Hurricane Fury":"颶風之怒","Huuma Blaze Shuriken":"風魔火焰手裡劍","Huuma Giant Wheel Shuriken":"風魔巨輪手裡劍","Hwergelmir's Tonic":"赫瓦格密爾的補藥","Hydra":"海葵","Hydra Card":"海葵卡片","Hyegun":"惠君","Hyegun Egg":"惠君蛋","Ice Falchion":"冰之彎刃劍","Improve Concentration":"心神凝聚","Improve Dodge":"迴避率增加","Increase AGI":"加速術","Increase AGI+":"加速術+","Increase HP Recovery":"HP 回復力提升","Increase SP Recovery":"SP 回復力提升","Infiltrator":"滲透者","Intimidate":"恫嚇","Investigate":"發勁","Invulnerable Siegfried":"不死身齊格飛","Iron Hand":"鐵手","Jacket":"夾克","Jamadhar":"賈瑪達拳刃","Javelin":"標槍","Jitte":"十手","Job":"職業","Jupitel Thunder":"雷鳴術","Jur":"尤爾拳刃","Kaahi":"凱阿希","Kaiser Knuckle":"凱薩拳套","Kaizel":"凱易哲","Katana":"太刀","Katar":"拳刃","Katar Mastery":"拳刃精通","Katar of Cold Icicle":"冰柱拳刃","Katar of Raging Blaze":"烈焰拳刃","Kaupe":"凱誣僕","Ki Translation":"氣之轉移","Kihop":"氣合","King Dramoh":"朵拉莫王","King Dramoh Card":"朵拉莫王卡片","Kitty Band":"貓耳髮箍","Knife":"小刀","Knight":"騎士","Knowledge":"知識","Knowledge of the Stars":"星之知識","Knuckle Dusters":"指虎","Kobold":"犬妖","Kobold Card":"犬妖卡片","Kraken":"克拉肯","Kraken Card":"克拉肯卡片","Kraken Leg":"克拉肯觸手","Krasnaya":"克拉斯納亞","Krieg":"克里格","Kukre":"庫克雷","Kukre Card":"庫克雷卡片","Lain":"蕾恩","Lava":"熔岩","Level 10 Blessing Scroll":"10 級天使之賜福卷軸","Level 10 Increase Agility Scroll":"10 級加速術卷軸","Level 10 Wind Walk Scroll":"10 級風之步卷軸","Level 3 Earth Spike Scroll":"3 級大地之刺卷軸","Level 5 Adrenaline Rush Scroll":"5 級速度激發卷軸","Lex Divina":"神之法典","Lightning Bolt":"雷擊術","Lightning Strike":"雷擊","Loki's Nail":"洛奇之釘","Loki's Veil":"洛奇的悲鳴","Loki's Whispers":"洛奇的低語","Long Mace":"長錘","Lord Kaho's Horn":"卡侯領主之角","Lord of Vermilion":"怒雷強擊","Lullaby":"搖籃曲","Lunatic":"瘋兔","Lunatic Card":"瘋兔卡片","Lunatic Egg":"瘋兔蛋","Lute":"魯特琴","Lyra":"萊拉","Mace":"鈍器","Mace Mastery":"鈍器精通","Madness Canceller":"瘋狂消除者","Mage":"魔法師","Magical Bullet":"魔法子彈","Magnum Break":"怒爆","Main Gauche":"左手短劍","Majestic Goat":"山羊頭盔","Mammonite":"金錢攻擊","Mana Recharge":"魔力充填","Mandragora":"曼陀羅花","Mandragora Card":"曼陀羅花卡片","Manteau":"披風","Manteau of Survival":"生存披風","Mantle":"斗篷","Marina":"水母","Marina Card":"水母卡片","Marine Sphere":"海洋炸彈","Marine Sphere Card":"海洋炸彈卡片","Marse":"章魚","Marse Card":"章魚卡片","Mass Spiral":"大型螺旋","Mastela Fruit":"瑪斯特拉果實","Mastering":"波利王","Mastering Card":"波利王卡片","Mastering Egg":"波利王蛋","Maximize Power":"最大威力","Mega Resist Potion":"超級抗性藥水","Megingjord":"雷神腰帶","Mei":"小梅","Meltdown":"熔毀","Merchant":"商人","Merman":"魚人","Merman Card":"魚人卡片","Meteor Assault":"流星突擊","Meteor Storm":"隕石術","Mighty Staff":"強力法杖","Mild Wind":"溫和之風","Mini Glasses":"迷你眼鏡","Mink Coat":"貂皮大衣","Miracle Tonic":"奇蹟補藥","Mirror Shield":"鏡盾","Mjolnir":"雷神之鎚","Monk":"武僧","Monk Hat":"和尚帽","Moonlight Flower":"月夜貓","Moonlight Flower Card":"月夜貓卡片","Moonlight Flower Egg":"月夜貓蛋","Moonlight Sword":"月光劍","Morning Star":"晨星","Moving HP Recovery":"移動中回復 HP","Mr. Kim A Rich Man":"金富翁先生","Mr. Scream":"尖叫先生","Muffler":"圍巾","Munak":"慕納克","Munak Card":"慕納克卡片","Munak Egg":"慕納克蛋","Munak Hat":"慕納克帽","Mural":"壁畫","Musical Lesson":"音樂練習","Mysteltainn":"米斯特汀","Nadia":"娜迪亞","Napalm Beat":"心靈爆破","Napalm Vulcan":"心靈火山","Necklace":"項鍊","Neutral":"普通","New Moon Kick":"新月踢","Nine Tail":"九尾狐","Nine Tail Card":"九尾狐卡片","Nine Tails Egg":"九尾狐蛋","Ninja":"忍者","Ninja Suit":"忍者裝","Nurse Cap":"護士帽","Obeaune":"歐比恩","Obeaune Card":"歐比恩卡片","Odin's Blessing":"奧丁的祝福","Orange Potion":"橙色藥水","Orc Archer Bow":"獸人弓箭手之弓","Orc Helm":"獸人頭盔","Orc Hero":"獸人英雄","Orc Hero Card":"獸人英雄卡片","Orc Lady":"獸人女士","Orc Skeleton":"獸人骷髏","Orc Skeleton Card":"獸人骷髏卡片","Orc Warrior":"獸人戰士","Orc Warrior Card":"獸人戰士卡片","Orcish Axe":"獸人斧","Orcish Sword":"獸人劍","Ore Discovery":"礦石發現","Oridecon":"神之金屬","Osiris":"歐西里斯","Osiris Card":"歐西里斯卡片","Over Thrust":"超越極限","Overcharge":"超載","Owl's Eye":"梟之眼","Panacea":"萬能藥","Peaceful Break":"和平休息","Peco Peco":"大嘴鳥","Peco Peco Egg":"大嘴鳥蛋","Pecopeco Egg Card":"大嘴鳥蛋卡片","Penomena":"佩諾梅娜","Penomena Card":"佩諾梅娜卡片","Pet Soul Ring":"寵物靈魂戒指","Ph.D Hat":"博士帽","Phantasmic Arrow":"幻影箭","Pharmacy":"製藥","Phen":"芬魚","Phen Card":"芬魚卡片","Phracon":"法拉康","Picky":"皮丘","Picky Card":"皮丘卡片","Picky Egg":"皮丘蛋","Pierce":"長矛刺擊","Pike":"長槍","Pipe":"煙斗","Pirate Bandana":"海盜頭巾","Pirate Skel Card":"海盜骷髏卡片","Pirate Skeleton":"海盜骷髏","Plagiarism":"剽竊","Plague Tarou":"瘟疫塔羅鼠","Plankton":"浮游生物","Plankton Card":"浮游生物卡片","Platinum Alter":"白金祭壇","Please Don't Forget Me":"請不要忘記我","PoPoring Card":"波波利卡片","Poison Bomb":"毒瓶炸彈","Poison React":"毒素反應","Poison Spore":"毒菇","Poison Spore Card":"毒菇卡片","Poison Spore Egg":"毒菇蛋","Poo Poo Hat":"便便帽","Poporing":"波波利","Poporing Egg":"波波利蛋","Poring":"波利","Poring Card":"波利卡片","Poring Egg":"波利蛋","Poring Hat":"波利帽","Potion Pitcher":"投擲藥水","Preserve":"保存","Priest":"祭司","Prontera":"普隆德拉","Prontera Patrol Badge":"普隆德拉巡邏隊徽章","Providence":"天命","Provoke":"挑釁","Punisher":"懲罰者","Pupa":"蟲蛹","Pupa Card":"蟲蛹卡片","Puppy Love":"小狗之愛","Pushcart":"手推車","Raid":"突襲","Rapid Shower":"快速連射","Rapier":"細劍","Red Collar Bell":"紅色項圈鈴","Red Potion":"紅色藥水","Red Scarf":"紅圍巾","Red Slim Potion":"紅色濃縮藥水","Reflect Shield":"反射之盾","Reject Sword":"拒絕之劍","Retribution":"報應","Ribbon":"蝴蝶結","Riding":"騎乘","Ring":"戒指","Ring Pommel Saber":"環柄軍刀","Ring of Death":"死亡戒指","Ring of Flame Lord":"火焰領主戒指","Ring of Resonance":"共鳴戒指","Robin":"羅賓","Rocker":"搖滾蝗蟲","Rocker Card":"搖滾蝗蟲卡片","Rocker Egg":"搖滾蝗蟲蛋","Rocker Glasses":"搖滾眼鏡","Rod":"法杖","Roda Frog":"洛達蛙","Roda Frog Card":"洛達蛙卡片","Rogue":"流氓","Rogue's Treasure":"流氓的寶物","Romantic Gent":"浪漫紳士帽","Rope":"繩索","Rosary":"玫瑰念珠","Roundhouse":"迴旋踢","Royal Jelly":"蜂王漿","Rush Quake":"震地","Ruwach":"光獵","Saber":"軍刀","Safety Ring":"安全戒指","Safety Wall":"安全防護","Sage":"賢者","Sakkat":"斗笠","Sanctuary":"聖域","Sand Attack":"灑沙","Sandals":"涼鞋","Sandman":"睡眠陷阱","Savage Babe":"小野豬","Savage Bebe Card":"小野豬卡片","Savage Bebe Egg":"小野豬蛋","Scapulare":"聖肩衣","Selene":"瑟琳","Service for You":"為您服務","Shadowstep":"暗影步","Sharp Shooting":"銳利射擊","Shield Bash":"盾擊","Shield Boomerang":"迴旋盾","Shield Charge":"盾牌衝鋒","Shield Mastery":"盾牌精通","Shoes":"鞋子","Sight":"現形術","Sightrasher":"烈焰之眼","Signum Crucis":"天使之光","Silk Ribbon":"絲質蝴蝶結","Silk Robe":"絲綢長袍","Silver Ring":"銀戒指","Silver Robe":"銀色長袍","Single Action":"單手射擊","Sir Aldric":"奧德里克爵士","Six Shooter":"六連發左輪","Skeleton":"骷髏","Skeleton Card":"骷髏卡片","Skeleton General":"骷髏將軍","Skeleton General Card":"骷髏將軍卡片","Skeleton Manteau":"骷髏披風","Skin Tempering":"皮膚淬鍊","Skull Ring":"骷髏戒指","Slayer":"屠殺者","Sleipnir":"斯雷普尼爾","Slug Shot":"獨頭彈","Smokie":"狸貓","Smokie Card":"狸貓卡片","Smokie Egg":"狸貓蛋","Snake Card":"蟒蛇卡片","Snake Eye":"蛇眼","Snatcher":"搶奪","Sniping Suit":"狙擊服","Sohee":"蘇熙","Sohee Card":"蘇熙卡片","Sohee Egg":"蘇熙蛋","Solar Burst":"太陽爆發","Soldier Skeleton":"骷髏士兵","Soldier Skeleton Card":"骷髏士兵卡片","Sonic Acceleration":"音速加速","Sonic Blow":"音速投擲","Soul":"靈魂","Soul Burn":"靈魂燃燒","Soul Destroyer":"破碎靈魂","Soul Drain":"靈魂吸取","Soul Link":"靈魂連結","Soul Linker":"悟靈士","Soul Strike":"聖靈召喚","Spear":"矛","Spear Boomerang":"迴旋矛","Spear Mastery":"長矛精通","Spear Quicken":"長矛加速","Spectral Spear":"幽靈之矛","Speed Potion":"速度藥水","Spell Breaker":"法術破壞","Spiral Pierce":"螺旋刺擊","Spirit of Hugin":"胡金之魂","Spirit of Munin":"穆寧之魂","Spirit of the Alchemist":"鍊金術師之魂","Spirit of the Assassin":"刺客之魂","Spirit of the Bard and Dancer":"吟遊詩人與舞孃之魂","Spirit of the Blacksmith":"鐵匠之魂","Spirit of the Crusader":"十字軍之魂","Spirit of the Hunter":"獵人之魂","Spirit of the Knight":"騎士之魂","Spirit of the Monk":"武僧之魂","Spirit of the Priest":"祭司之魂","Spirit of the Sage":"賢者之魂","Spirit of the Soul Linker":"悟靈士之魂","Spirit of the Star":"拳聖之魂","Spirit of the Wizard":"巫師之魂","Spore":"菇菇","Spore Card":"菇菇卡片","Spore Egg":"菇菇蛋","Spread Attack":"散射","Sprint":"疾跑","Staff":"法杖","Staff of Bordeaux":"波爾多法杖","Star Gladiator":"拳聖","Steal":"偷竊","Steal Coin":"偷錢","Steamed Desert Scorpions":"清蒸沙漠蠍","Steamed Tongue":"清蒸舌頭","Steel Body":"金剛不壞","Stew of Immortality":"不死燉湯","Stiletto":"錐刀","Stone Buckler":"石製小圓盾","Stone Curse":"石化術","Stop Post":"禁止標誌","Storm Gust":"暴風雪","Strip Armor":"卸除鎧甲","Strouf":"史特勞夫","Strouf Card":"史特勞夫卡片","Studded Knuckles":"釘刺拳套","Summon Flora":"植物栽培","Sunglasses":"太陽眼鏡","Sweet Gent":"甜蜜紳士帽","Sword":"劍","Sword Dance":"劍舞","Sword Fish":"劍魚","Sword Mace":"劍錘","Sword Mastery":"劍術精通","Swordfish Card":"劍魚卡片","Swordsman":"劍士","Taekwon":"跆拳少年","Taekwon Mission":"跆拳任務","Tail Whip":"尾鞭","Tarou":"塔羅鼠","Tarou Card":"塔羅鼠卡片","Thief":"盜賊","Thief Bug":"盜蟲","Thief Bug Card":"盜蟲卡片","Thief Bug Egg":"盜蟲卵","Thief Bug Female":"母盜蟲","Thief Clothes":"盜賊服","Thiefbug Egg Card":"盜蟲卵卡片","Thorny Buckler":"荊棘小圓盾","Throw Huuma Shuriken":"投擲風魔手裡劍","Throw Kunai":"投擲苦無","Throw Shuriken":"投擲手裡劍","Throw Stone":"丟石頭","Thunderstorm":"雷爆術","Tiara":"頭冠","Tidal Shoes":"潮汐之鞋","Tights":"緊身衣","Tiny Egg Shell":"小蛋殼","Toad":"蟾蜍","Toad Card":"蟾蜍卡片","Tornado Kick":"旋風踢","Tracking":"追蹤射擊","Transparent Head Protector":"透明頭部護具","Trap Research":"陷阱研究","Trident":"三叉戟","Triple Action":"三連射","Triple Attack":"三段掌","Tristan III":"特里斯坦三世","True Sight":"真實視野","Tunnel Drive":"地下潛行","Twilight Alchemy":"黃昏鍊金術","Two-Hand Mastery":"雙手劍精通","Two-Hand Quicken":"雙手劍加速","Undead Elemental Scroll":"不死屬性卷軸","Unicorn Horn":"獨角獸之角","Union of the Sun, Moon and Stars":"日月星辰融合","Vadon":"瓦頓蟹","Vadon Card":"瓦頓蟹卡片","Vagabond Wolf":"流浪狼","Valkyrie Armor":"女武神鎧甲","Valkyrie Shield":"女武神之盾","Vanilmirth":"凡米爾斯","Vending":"露天商店","Venom Dust":"毒沙","Venom Knife":"毒刃","Venom Splasher":"毒爆","Vex":"維克斯","Vidar's Boots":"維達之靴","Violin":"小提琴","Vocal":"吟唱蝗蟲","Vocal Card":"吟唱蝗蟲卡片","Volcano":"火山","Vulture's Eye":"鷹眼","Waghnak":"虎爪","Wand":"魔杖","Wandering Wolf Card":"流浪狼卡片","Warm Wind":"溫暖之風","Warmth of the Sun":"太陽的溫暖","Weapon Perfection":"武器完美化","Weapon Repair":"武器修理","Weapon Research":"武器研究","Welding Mask":"焊接面罩","Western Grace":"西部之恩","Whisper":"幽影","Whisper Card":"幽影卡片","Whisper Egg":"幽影蛋","White Potion":"白色藥水","White Slim Potion":"白色濃縮藥水","Wig":"假髮","Willow":"樹精","Willow Card":"樹精卡片","Willow Egg":"樹精蛋","Wind Walk":"風之步","Wink of Charm":"魅力之眼","Wire Whip":"鋼絲鞭","Witch's Tonic":"魔女的補藥","Wizard":"巫師","Wizard Hat":"巫師帽","Wolf":"狼","Wolf Card":"狼卡片","Wooden Mail":"木甲","Wormtail":"蠕蟲尾","Wormtail Card":"蠕蟲尾卡片","Yao Jun Card":"惠君卡片","Yellow Gemstone":"黃色魔力礦石","Yellow Potion":"黃色藥水","Yellow Slim Potion":"黃色濃縮藥水","Yggdrasil Berry":"世界樹果實","Zeny Rain":"金錢雨","Zombie":"殭屍","Zombie Card":"殭屍卡片"};/*END*/
(() => {
  const W = window;
  if (W.__rsZh) return;
  const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const SETKEY = 'ro-survivors:settings';

  /* 目前語言：遊戲設定物件找到之後直接讀它，之前先看存檔的設定（跟遊戲預設值同一套規則） */
  let settings = null;
  function startLang() {
    try {
      const s = JSON.parse(localStorage.getItem(SETKEY) || '{}');
      if (s.lang) return s.lang;
    } catch (e) { /* 沒有設定 */ }
    const n = (navigator.language || '').toLowerCase();
    return n.startsWith('es') ? 'es' : n.startsWith('zh') ? 'zh-TW' : 'en';
  }
  const lang0 = startLang();
  const isZh = () => (settings ? settings.lang : lang0) === 'zh-TW';

  const zhOf = en => (typeof en === 'string' && hasOwn(NAMES, en)) ? NAMES[en] : null;

  /* 把物件的 name 換成 getter：中文模式回中文、其他語言回原文；原文另外放 nameEN */
  function wrapName(o) {
    if (!o || typeof o !== 'object') return;
    const d = Object.getOwnPropertyDescriptor(o, 'name');
    if (!d || !('value' in d) || typeof d.value !== 'string') return;   /* 已經換過或不是字串 */
    const en = d.value, zh = zhOf(en);
    if (!zh) return;
    Object.defineProperty(o, 'nameEN', { value: en, enumerable: false, configurable: true });
    Object.defineProperty(o, 'name', {
      get: () => (isZh() ? zh : en),
      set: v => { Object.defineProperty(o, 'name', { value: v, writable: true, enumerable: true, configurable: true }); },
      enumerable: true, configurable: true,
    });
  }

  /* ---------- 裝備、卡片名稱：assets/manifest.json ---------- */
  function fixManifest(m) {
    try {
      for (const sec of ['items', 'cards']) {
        const t = m && m[sec];
        if (t && typeof t === 'object') for (const k in t) wrapName(t[k]);
      }
    } catch (e) { console.warn('[離線中文] manifest', e); }
    return m;
  }
  const origFetch = W.fetch;
  W.fetch = function (input) {
    const p = origFetch.apply(this, arguments);
    let url = '';
    try { url = typeof input === 'string' ? input : (input && input.url) || String(input); } catch (e) { /* 不是網址 */ }
    if (!/(^|\/)assets\/manifest\.json(\?|#|$)/.test(url)) return p;
    return p.then(r => {
      if (!r || !r.ok) return r;
      const json = r.json.bind(r);
      r.json = () => json().then(m => { fixManifest(m); status.manifest = true; return m; });
      return r;
    });
  };

  /* ---------- 怪物名稱、遊戲設定：等遊戲的 soul_linker 載入後用資料形狀找 ---------- */
  const status = { manifest: false, monsters: 0, skills: 0, settings: false, wiki: false };
  async function hookCore() {
    let core = null;
    for (let i = 0; i < 240 && !core; i++) {
      core = performance.getEntriesByType('resource').map(e => e.name)
        .concat([...document.querySelectorAll('link[rel=modulepreload]')].map(e => e.href))
        .find(n => /\/build\/soul_linker-[\w-]+\.js$/.test(n));
      if (!core) await new Promise(r => setTimeout(r, 250));
    }
    if (!core) { console.warn('[離線中文] 找不到 soul_linker，怪物名稱維持英文'); return; }
    const V = Object.values(await import(core));
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    const find = pred => V.find(v => { try { return pred(v); } catch (e) { return false; } });
    settings = find(v => isObj(v) && 'lang' in v && 'master' in v) || null;
    status.settings = !!settings;
    const monsters = find(v => isObj(v) && v.poring && v.poring.hp && v.poring.level);
    if (monsters) for (const k in monsters) { wrapName(monsters[k]); if (hasOwn(monsters[k] || {}, 'nameEN')) status.monsters++; }
    else console.warn('[離線中文] 找不到怪物表，怪物名稱維持英文');
    /* 技能：遊戲已經用翻譯函式包過 name，只補「官方中文還是英文」的那幾個（Ruwach、Angelus…） */
    const skills = find(v => isObj(v) && v.bash && v.bash.maxLevel && v.bash.kind);
    if (skills && settings) for (const k in skills) if (wrapUntranslated(skills[k])) status.skills++;
    /* 切換語言時遊戲會重畫畫面；名稱是 getter，重畫後自然換成新語言 */
  }
  /* name 已經是遊戲的 getter：暫時切到中文讀官方譯名，還是純英文、而且我們有譯名才接手 */
  function wrapUntranslated(o) {
    const d = o && Object.getOwnPropertyDescriptor(o, 'name');
    if (!d || typeof d.get !== 'function' || hasOwn(o, 'nameEN')) return false;
    const was = settings.lang;
    let official;
    try { settings.lang = 'zh-TW'; official = d.get.call(o); } catch (e) { return false; } finally { settings.lang = was; }
    if (typeof official !== 'string' || !/^[A-Za-z][A-Za-z' -]*$/.test(official)) return false;
    const zh = zhOf(official);
    if (!zh) return false;
    Object.defineProperty(o, 'nameEN', { value: official, enumerable: false, configurable: true });
    Object.defineProperty(o, 'name', { get: () => (isZh() ? zh : d.get.call(o)), enumerable: d.enumerable, configurable: true });
    return true;
  }

  /* ---------- 圖書館員百科裡寫死、官方沒翻的英文 ----------
     只在百科視窗（#wiki）裡、中文模式時，換掉整段文字完全相同或整個單字相符的部分 */
  const WIKI_EXACT = {
    'Skill 1st': '一轉技能', 'Skill 2nd': '二轉技能', 'Stage': '關卡', 'Endgame': '終局挑戰',
    'Endless Tower': '無盡之塔', 'GEARSCORE': '裝備分數', 'Gearscore': '裝備分數', 'DEITY': '神祇', 'Deity': '神祇', 'Neutral': '普通', 'Cordial': '親密',
  };
  const WIKI_WORDS = [
    [/\b1st job\b/g, '一轉'], [/\b2nd job\b/g, '二轉'], [/\bNv (?=\d)/g, 'Lv '], [/\bTier (?=\d)/g, '等階 '],
    [/(\d) min\b/g, '$1 分鐘'], [/\bNeed \/ Greed\b/g, '需要／貪婪'], [/\bBlood Savage\b/g, '血腥狂暴'],
    [/\bPhracon\b/g, '法拉康'], [/\bEmveretarcon\b/g, '艾維恩'],
  ];
  function wikiText(s) {
    const t = s.trim();
    if (hasOwn(WIKI_EXACT, t)) return s.replace(t, WIKI_EXACT[t]);
    let r = s;
    for (const [re, to] of WIKI_WORDS) r = r.replace(re, to);
    return r;
  }
  function fixWiki(root) {
    if (!isZh() || !root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const v = n.nodeValue;
      if (!/[A-Za-z]/.test(v)) continue;
      const r = wikiText(v);
      if (r !== v) n.nodeValue = r;
    }
  }
  function watchWiki() {
    const wiki = document.getElementById('wiki');
    if (!wiki) return false;
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      setTimeout(() => { queued = false; fixWiki(wiki); }, 0);
    }).observe(wiki, { childList: true, subtree: true, characterData: true });
    status.wiki = true;
    return true;
  }
  if (!watchWiki()) document.addEventListener('DOMContentLoaded', watchWiki);
  W.addEventListener('load', () => { hookCore().catch(e => console.warn('[離線中文]', e)); });
  /* 裝備全名：「太刀 of Strength」→「力量之太刀」（遊戲官方中文說明也寫「力量之刀」）
     rs_offline.py 修補遊戲的組名函式來呼叫這裡；不認得的字尾維持原本順序 */
  const SUFFIX = { 'of Strength': '力量', 'of Agility': '敏捷', 'of Vitality': '體力',
    'of Intelligence': '智力', 'of Dexterity': '靈巧', 'of Luck': '幸運' };
  function full(name, suffix) {
    if (isZh() && hasOwn(SUFFIX, suffix)) return SUFFIX[suffix] + '之' + name;
    return name + ' ' + suffix;
  }

  W.__rsZh = { names: NAMES, name: en => zhOf(en) || en, full, isZh, status };
})();
