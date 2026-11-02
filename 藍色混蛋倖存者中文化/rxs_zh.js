// ⚠ 你現在看到的是書籤的原始碼，不能直接用。請到同資料夾的「安裝書籤.html」照步驟安裝書籤。
// Rockman X Survivors 繁體中文化：按書籤後遊戲會重新載入一次，載入時把字串表和字型換成中文版（存檔只改語言設定）。
const RXSZH_VERSION = 'V1';
const FONT_URL = new URL('rxs_font.ttf?v=' + RXSZH_VERSION, import.meta.url);
const GAME_URL = 'https://gaho727.github.io/rockmanx-survivors/';

// 韓文 → 繁中。遊戲裡的「韓文模式」就是這份中文，「English」維持英文。
const ZH = {
  "\n<color=#ffd866>노말을 1회 클리어하면 해금됩니다.</color>": "\n<color=#ffd866>通關普通難度 1 次後解鎖。</color>",
  "\n다운로드할 수 있습니다.": "\n可以下載了。",
  "\n보유 메탈  {0:#,0}": "\n持有金屬  {0:#,0}",
  "\n선택하면 영구 해금되어 다음 판부터 레벨업 카드에 등장합니다.": "\n選擇後永久解鎖，下一局起會出現在升級卡片中。",
  "  <color=#7fd8ff>(남은 선택 {0})</color>": "  <color=#7fd8ff>（剩餘選擇 {0}）</color>",
  "  F11 테스트 패널  F12 몬스터 소환\nDelete 현재 보스 즉시 처치  Home 블레이드 아머 + 풀차지": "  F11 測試面板  F12 召喚怪物\nDelete 立刻擊倒目前頭目  Home 刃之裝甲 + 滿蓄力",
  " (세이브에 저장하지 않음)": "（不寫入存檔）",
  " (얼티밋 키트 조건, 세이브에 저장하지 않음)": "（究極套件條件，不寫入存檔）",
  " · 카드 {0}": " · 卡片 {0}",
  " · 클리어 {0}": " · 通關 {0}",
  " 격파": " 擊破",
  " 격파!\n이번 판을 강화할 보상 하나를 선택하십시오.": " 擊破！\n請選擇一項強化本局的獎勵。",
  " 보상 1회": " 獎勵 1 次",
  " 완성": " 完成",
  " 테스트 / 저장 제외\n": " 測試／不存檔\n",
  " 파츠": " 零件",
  " 한계돌파\n": " 極限突破\n",
  "(곡 없음)": "（沒有曲目）",
  "(비어 있음)": "（空）",
  ", 10분 보스 ": "，10 分鐘頭目 ",
  ". 기록·메탈·영구 해금 저장 제외.": "。紀錄、金屬、永久解鎖皆不存檔。",
  "1. 파란 웨이브 탄": "1. 藍色波動彈",
  "10·15분 보스: ": "10、15 分鐘頭目：",
  "10분 보스 처치 또는\n노말 {0}/{1}회 쓰러지면 해금": "擊倒 10 分鐘頭目，或\n在普通難度倒下 {0}/{1} 次後解鎖",
  "16:9 대표 해상도입니다. 창모드에서만 변경할 수 있습니다.": "16:9 常用解析度。只有視窗模式可以變更。",
  "1마리 소환": "召喚 1 隻",
  "1명 / {0:0}초": "1 隻／{0:0} 秒",
  "1명 → 2명": "1 個 → 2 個",
  "1발": "1 發",
  "2. 바이러스 배리어 / 소환": "2. 病毒屏障／召喚",
  "2연발로 시작": "從 2 連發開始",
  "3 → 5방향": "3 → 5 方向",
  "3. 반달 교대탄": "3. 半月交替彈",
  "3연발로 시작": "從 3 連發開始",
  "4. 잔상 돌진": "4. 殘影突進",
  "4종을 모두 모으면 블레이드 아머 완성: 받는 피해 절반, 마하 대시 사용. 원거리 풀차지를 유지하고, 근거리에서는 강한 언월륜으로 벤다.": "集滿 4 種完成刃之裝甲：受到傷害減半，可用馬赫衝刺。保留遠距離滿蓄力，近距離則以強力偃月輪斬擊。",
  "4종을 모두 모으면 팔콘 아머 완성: 받는 피해 절반, 비행 돌격 사용. 풀 차지샷은 모든 적을 꿰뚫는 탄이 된다.": "集滿 4 種完成獵鷹裝甲：受到傷害減半，可用飛行突擊。滿蓄力射擊變成貫穿所有敵人的子彈。",
  "4종을 모두 모으면 포스 아머 완성: 받는 피해 절반, 노바 스트라이크 사용. 풀 차지샷은 플라즈마 샷이 된다.": "集滿 4 種完成原力裝甲：受到傷害減半，可用新星衝擊。滿蓄力射擊變成電漿彈。",
  "5 → 8방향": "5 → 8 方向",
  "5. 구역 소환": "5. 區域召喚",
  "5개 + 좌우 / 각 3명": "5 顆 + 左右／各 3 隻",
  "5마리 소환": "召喚 5 隻",
  "8개까지 모을 수 있다. 하나당 최대 체력 +5.": "最多可收集 8 個。每個最大體力 +5。",
  "<b><color=#ffd866>목표</color></b>\n30분 동안 살아남으세요. 적을 쓰러뜨리면 나오는 <color=#7fd8ff>에너지 결정</color>을 모아 레벨업하고,\n강화 카드를 골라 엑스를 강하게 만드세요. 가끔 나오는 <color=#ff9a8a>라이프 에너지</color>는 체력을 회복합니다.\n\n<b><color=#ffd866>조작</color></b>\n이동            WASD · 방향키   (패드 왼쪽 스틱)\n대시            Space · Shift · J   (패드 A)\n공격            자동 발사 — 환경설정에서 자동 조준 / 마우스 조준 선택\n레벨업 선택   1 · 2 · 3,  ←→ + Enter,  클릭\n일시정지      Esc   (패드 Start)          음소거   M\n시너지 안내   Tab   (패드 왼쪽 스틱 누르기) — 켜기 / 끄기": "<b><color=#ffd866>目標</color></b>\n存活 30 分鐘。收集敵人掉落的<color=#7fd8ff>能量結晶</color>來升級，\n選擇強化卡片讓艾克斯變強。偶爾出現的<color=#ff9a8a>生命能量</color>可以回復體力。\n\n<b><color=#ffd866>操作</color></b>\n移動　　　WASD · 方向鍵  （手把左搖桿）\n衝刺　　　Space · Shift · J  （手把 A）\n攻擊　　　自動發射 — 可在設定選擇自動瞄準／滑鼠瞄準\n升級選擇　1 · 2 · 3、←→ + Enter、點擊\n暫停　　　Esc  （手把 Start）　　靜音　M\n協同提示　Tab  （按下手把左搖桿）— 開啟／關閉",
  "<b>전부 초기화</b>": "<b>全部重置</b>",
  "<color=#ff8866>급증: {0} ({1})</color>\n": "<color=#ff8866>激增：{0}（{1}）</color>\n",
  "Esc  계속하기\nR  처음부터 다시\nQ  타이틀로\n\n이동 WASD·방향키   대시 Space·Shift   음소거 M   시너지 안내 Tab": "Esc  繼續\nR  重新開始\nQ  回標題\n\n移動 WASD·方向鍵   衝刺 Space·Shift   靜音 M   協同提示 Tab",
  "F1 상태  F2 레벨업  F3 +1분\nF4 시그마헤드  F5 후쿠로울  F6 네크로배트\nF7 얀마크  F8 최종 시그마  F9 무기 해금 초기화\nF10 무적 ": "F1 狀態  F2 升級  F3 +1 分\nF4 西格瑪頭部  F5 暴風梟  F6 尼克羅蝙蝠\nF7 揚馬克  F8 最終西格瑪  F9 重置武器解鎖\nF10 無敵 ",
  "WASD / 방향키": "WASD／方向鍵",
  "WebGL은 브라우저가 창 크기와 전체화면을 관리합니다.": "網頁版的視窗大小與全螢幕由瀏覽器管理。",
  "X5 시그마": "X5 西格瑪",
  "X6 스테이지": "X6 關卡",
  "XP {0}/{1}  분당 처치 {2:0}\n": "XP {0}/{1}  每分鐘擊倒 {2:0}\n",
  "{0:0.0}초 → {1:0.0}초": "{0:0.0} 秒 → {1:0.0} 秒",
  "{0:0} / 2발": "{0:0}／2 發",
  "{0:0} / 3방향": "{0:0}／3 方向",
  "{0:0} / {1}초 · {2:0}초": "{0:0}／{1} 秒 · {2:0} 秒",
  "{0:0} / {1}초 · {2}초": "{0:0}／{1} 秒 · {2} 秒",
  "{0:0} / 느림": "{0:0}／緩慢",
  "{0:0} / 전방 {1:0}°": "{0:0}／前方 {1:0}°",
  "{0:0} / 최대 {1}명": "{0:0}／最多 {1} 隻",
  "{0:0} · 관통 무제한": "{0:0} · 無限貫穿",
  "{0:0} × {1}발": "{0:0} × {1} 發",
  "{0:0} × {1}줄": "{0:0} × {1} 道",
  "{0:0} × {1}회": "{0:0} × {1} 次",
  "{0:0}초": "{0:0} 秒",
  "{0:0}초 → {1:0}초": "{0:0} 秒 → {1:0} 秒",
  "{0}명 → {1}명": "{0} 隻 → {1} 隻",
  "{0}발 → {1}발": "{0} 發 → {1} 發",
  "{0}분 보스": "{0} 分鐘頭目",
  "{0}연발": "{0} 連發",
  "{0}초": "{0} 秒",
  "· 특수 무기 6개까지 (보스 보상으로 얻는 보스 무기는 추가)\n· 한계돌파 판당 1회\n· 레벨업 필요 경험치 증가\n· 적 체력 증가\n· 받는 피해 증가\n· 보스 체력 증가": "· 特殊武器最多 6 個（頭目武器另計）\n· 每局極限突破 1 次\n· 升級所需經驗值增加\n· 敵人體力增加\n· 受到傷害增加\n· 頭目體力增加",
  "· 특수 무기 개수 제한 없음\n· 한계돌파 횟수 제한 없음\n· 기본 적 체력 · 기본 필요 경험치\n· 처음 플레이하기 좋은 난이도": "· 特殊武器數量無限制\n· 極限突破次數無限制\n· 基本敵人體力 · 基本所需經驗值\n· 適合第一次遊玩的難度",
  "← → / D패드 선택     ENTER / A 결정     1–{0} 바로 선택": "← →／十字鍵 選擇     ENTER／A 確定     1–{0} 直接選擇",
  "←→ · 클릭으로 메인 화면 곡을 바꿉니다.": "用 ←→ 或點擊更換主畫面曲目。",
  "←→ · 클릭으로 언어를 바꿉니다.  /  Change the language with ←→ or click.": "用 ←→ 或點擊切換語言。 / Change the language with ←→ or click.",
  "←→ · 클릭으로 켜고 끕니다.": "用 ←→ 或點擊開關。",
  "←→ 로 10%씩 조절합니다.": "用 ←→ 每次調整 10%。",
  "←→ 로 10%씩 조절합니다. 바꿀 때 소리로 확인할 수 있습니다.": "用 ←→ 每次調整 10%。調整時會播放聲音確認。",
  "←→로 10%씩 조절합니다. 0% 숨김 / 100% 원래 표시. 공격 성능은 유지됩니다.": "用 ←→ 每次調整 10%。0% 隱藏／100% 原樣顯示。攻擊性能不變。",
  "←→로 바꾸면 오른쪽 미리 보기에 바로 보입니다.": "用 ←→ 更改後，會立刻顯示在右側預覽。",
  "↑↓ 선택    Enter 결정": "↑↓ 選擇    Enter 確定",
  "↑↓ 선택    Enter 결정    Esc 계속하기\n이동 WASD·방향키   대시 Space·Shift   음소거 M   시너지 안내 Tab": "↑↓ 選擇    Enter 確定    Esc 繼續\n移動 WASD·方向鍵   衝刺 Space·Shift   靜音 M   協同提示 Tab",
  "→  다음  <color=#9fe3ff>": "→  下一級  <color=#9fe3ff>",
  "→  다음  <color=#ffd866>최대 단계</color>": "→  下一級  <color=#ffd866>最高等級</color>",
  "◀ 이전 종류": "◀ 上一種",
  "가만히 있어도 체력이 조금씩 찬다.": "站著不動也會慢慢回復體力。",
  "강화 시너지": "強化協同",
  "강화할 항목을 선택하십시오": "請選擇要強化的項目",
  "거대 앵커": "巨型船錨",
  "거대 앵커가 1.75배 커지고,\n보스에게 2배 피해를 줍니다.": "巨型船錨變大 1.75 倍，\n對頭目造成 2 倍傷害。",
  "거미줄에 맞은 적이 잠시 움직이지 못합니다.\n보스는 잠깐 경직됩니다.": "被蛛網擊中的敵人短暫無法移動。\n頭目會短暫僵直。",
  "거미줄이 0.7초 더 오래 머문다.": "蛛網停留時間延長 0.7 秒。",
  "걷는 속도가 빨라진다.": "走路速度變快。",
  "게임": "遊戲",
  "게임 BGM": "遊戲 BGM",
  "게임 목표": "遊戲目標",
  "게임 시작": "開始遊戲",
  "게임을 시작하면 나올 곡입니다. 바꾸면 미리 들려줍니다.  '무작위' = 목록에서 하나씩": "開始遊戲時播放的曲目。更改時會試聽。 「隨機」＝從清單中挑選",
  "결정": "確定",
  "경험치 +{0}%": "經驗值 +{0}%",
  "경험치 결정을 끌어오는 거리가 늘어난다.": "吸取經驗結晶的距離增加。",
  "경험치 다발": "經驗包",
  "경험치 전부 흡수": "吸取全部經驗值",
  "경험치 획득": "經驗值獲取",
  "계속하기": "繼續",
  "고정": "固定",
  "고정 상태에서도 애니메이션 재생\nF12: 선택한 몬스터 1마리 소환": "固定狀態也播放動畫\nF12：召喚 1 隻選定的怪物",
  "고정 주기": "固定週期",
  "곡은 하이어라키 GameRoot > Music 의 타이틀 BGM 목록에 추가할 수 있습니다.": "曲目可在 Hierarchy 的 GameRoot > Music 標題 BGM 清單中新增。",
  "공격": "攻擊",
  "공격 x{0:0.00}  연사 x{1:0.00}  이속 x{2:0.00}  버스터 {3}단계\n": "攻擊 x{0:0.00}  射速 x{1:0.00}  移速 x{2:0.00}  破壞砲 {3} 階\n",
  "공격 · 연사 · 이동 +10%": "攻擊 · 射速 · 移動 +10%",
  "공격 · 연사 · 이동 +{0:0}%": "攻擊 · 射速 · 移動 +{0:0}%",
  "공격 방식": "攻擊方式",
  "공격 속도 +{0}%": "攻擊速度 +{0}%",
  "공격 속도 강화": "攻擊速度強化",
  "공격력": "攻擊力",
  "공격력 +{0}%": "攻擊力 +{0}%",
  "공격력 강화": "攻擊力強化",
  "공격은 자동으로 발사됩니다.\n조준 방식은 환경설정에서 변경할 수 있습니다.": "攻擊會自動發射。\n瞄準方式可在設定中變更。",
  "공세!": "攻勢！",
  "공전 잠자리가 초록 탄을 발사한다.": "環繞的蜻蜓會發射綠色子彈。",
  "관통": "貫穿",
  "구매": "購買",
  "구체 + 회오리": "球體 + 旋風",
  "구체 수": "球體數",
  "기가 게이지": "GIGA 計量表",
  "기가어택": "GIGA 攻擊",
  "기록·해금·연구소 강화·메탈을 처음 상태로 되돌립니다. 누르면 한 번 더 묻습니다.": "將紀錄、解鎖、研究所強化、金屬恢復初始狀態。按下後會再確認一次。",
  "기본 초승달 샷을 2배 빠르게 발사합니다.": "以 2 倍速度發射基本新月彈。",
  "꺼짐": "關閉",
  "꼬마 봇": "小機器人",
  "꼬마 봇 (강화)": "小機器人（強化）",
  "꼬마 봇 떼 출현!": "小機器人群出現！",
  "끄면 공격·피격·보스 처치 때 화면이 흔들리지 않습니다.": "關閉後，攻擊、受擊、擊倒頭目時畫面不會晃動。",
  "낙뢰": "落雷",
  "난이도 ": "難度 ",
  "난이도 선택": "選擇難度",
  "네크로배트": "尼克羅蝙蝠",
  "네크로배트의 박쥐": "尼克羅蝙蝠的蝙蝠",
  "년": "年",
  "노랑": "黃色",
  "노말": "普通",
  "노바 스트라이크": "新星衝擊",
  "누적": "累計",
  "눌러서 부하 테스트(무적 + 적 계속 생성)": "按下進行負載測試（無敵 + 持續生成敵人）",
  "느린 유도탄을 쏜다. 꺾어 가며 적을 쫓지만 아직은 힘이 약하다.": "發射緩慢的追蹤彈。會轉彎追擊敵人，但威力還很弱。",
  "다리 부품의 출력을 높여 이동 속도가 빨라진다.": "提高腿部零件的輸出，移動速度變快。",
  "다시 시작": "重新開始",
  "다음 종류 ▶": "下一種 ▶",
  "다크 네크로배트": "暗黑尼克羅蝙蝠",
  "다크 홀드": "暗黑定身",
  "다트 비행기": "飛鏢機",
  "다트 비행기 (강화)": "飛鏢機（強化）",
  "다트 비행기 (초강화)": "飛鏢機（超強化）",
  "다트 편대 습격!": "飛鏢編隊來襲！",
  "단기": "單體",
  "닻을 던져 떨어뜨리며 경로의 적을 꿰뚫는다.": "丟出船錨落下，貫穿路徑上的敵人。",
  "닻이 꿰뚫을 수 있는 적이 1명 늘어난다.": "船錨可貫穿的敵人增加 1 隻。",
  "대시": "衝刺",
  "대시 추진 장치를 개량해 대시를 더 자주 쓸 수 있다.": "改良衝刺推進器，可以更頻繁地衝刺。",
  "대시 쿨타임": "衝刺冷卻",
  "대시 쿨타임 -{0}%": "衝刺冷卻 -{0}%",
  "대시 회로": "衝刺迴路",
  "대시를 더 자주 쓸 수 있다.": "可以更頻繁地衝刺。",
  "더블 사이클론": "雙重旋風",
  "도움말": "說明",
  "돌아가기": "返回",
  "뒤쪽까지 더해져 8방향으로 쏜다.": "加上後方，朝 8 個方向發射。",
  "드릴 메카": "鑽頭機械",
  "등장 연출 중": "登場演出中",
  "라이트 박사 연구소": "萊特博士研究所",
  "라이트닝 웹": "閃電網",
  "라이프 업": "生命提升",
  "라이프 에너지": "生命能量",
  "라이프 에너지를 얻어 체력을 회복한다.": "取得生命能量以回復體力。",
  "랜덤 패턴 재개": "恢復隨機模式",
  "랜덤 패턴 진행": "進行隨機模式",
  "레벨": "等級",
  "레벨 {0} 달성. 새로운 힘을 얻을 수 있습니다.\n강화할 항목을 선택하십시오.": "達到等級 {0}。可以獲得新的力量。\n請選擇要強化的項目。",
  "레벨업 선택": "升級選擇",
  "레벨업 카드로\n무기와 능력을 강화하세요.": "用升級卡片\n強化武器和能力。",
  "레이저": "雷射",
  "레이저 4줄을 사방으로 쏘며 회전시킵니다.": "朝四方發射 4 道雷射並旋轉。",
  "록맨X7": "洛克人X7",
  "마그마 블레이드": "岩漿刃",
  "마우스 조준": "滑鼠瞄準",
  "마우스 조준: 마우스 커서 방향으로 계속 발사합니다. 화면에 조준점이 표시됩니다.": "滑鼠瞄準：持續朝滑鼠游標方向發射。畫面上會顯示準星。",
  "마우스를 올려 직접 확인 · 클릭하면 찾기 고리": "移上滑鼠直接確認 · 點擊顯示定位圈",
  "마하 대시": "馬赫衝刺",
  "메인 화면 BGM": "主畫面 BGM",
  "메인 화면 · 게임 BGM을 고릅니다.": "選擇主畫面與遊戲的 BGM。",
  "메인 화면에서 나오는 곡입니다. 타이틀로 돌아가면 적용됩니다.": "主畫面播放的曲目。回到標題後套用。",
  "메탈": "金屬",
  "메탈 ": "金屬 ",
  "메탈 앵커": "金屬船錨",
  "메탈 획득": "獲得金屬",
  "메탈은 판이 끝날 때 생존 시간 · 처치 수 · 레벨에 따라 받습니다(30분 생존 시 보너스).": "金屬在每局結束時依生存時間、擊倒數、等級發放（存活 30 分鐘有加成）。",
  "메탈을 획득한다. 판이 끝나면 연구소에서 쓸 수 있다.": "獲得金屬。一局結束後可在研究所使用。",
  "멧톨": "安全帽",
  "멧톨 (강화)": "安全帽（強化）",
  "모든 공격 속도": "全攻擊速度",
  "모든 공격 피해": "全攻擊傷害",
  "모든 시너지의 공격·연사·이동 효과가 각각 10% 더 오릅니다.\n이후 완성하는 시너지에도 적용됩니다.": "所有協同的攻擊、射速、移動效果各再提升 10%。\n之後完成的協同也適用。",
  "모든 진행 상황(기록·클리어), 해금된 요소(하드·연구소·보스 무기·아머),\n연구소 강화와 보유 메탈이 모두 초기화됩니다.\n환경설정은 유지됩니다.\n\n정말 초기화하시겠습니까?": "所有進度（紀錄、通關）、已解鎖內容（困難、研究所、頭目武器、裝甲）、\n研究所強化與持有金屬都會重置。\n設定會保留。\n\n確定要重置嗎？",
  "모은 파츠": "收集的零件",
  "몬스터 이동: ": "怪物移動：",
  "무기 {0}종 Lv5, 연구소 MAX, 한계돌파 {1}종, ": "武器 {0} 種 Lv5，研究所 MAX，極限突破 {1} 種，",
  "무기 불투명도": "武器不透明度",
  "무작위": "隨機",
  "물고기 떼 출현!": "魚群出現！",
  "바꾸면 지금 게임의 곡이 바로 바뀝니다.  '무작위' = 목록에서 하나씩": "更改後目前遊戲曲目會立刻換掉。 「隨機」＝從清單中挑選",
  "바디": "身體",
  "바로 선택": "直接選擇",
  "반경 {0:0}px · {1:0.#}초": "半徑 {0:0}px · {1:0.#} 秒",
  "받는 피해 -{0}%": "受到傷害 -{0}%",
  "받은 피해 {0:0}  기가 {1:0}%\n": "受到傷害 {0:0}  GIGA {1:0}%\n",
  "발동 주기": "發動週期",
  "발사 간격": "發射間隔",
  "방어 2배 · ": "防禦 2 倍 · ",
  "방어 {0} + 공격 3": "防禦 {0} + 攻擊 3",
  "방어 잠자리는 전체 1회 차단 후 함께 재생된다(3초 고정).": "防禦蜻蜓共同阻擋 1 次後一起重生（固定 3 秒）。",
  "방어력": "防禦力",
  "방향": "方向",
  "방향키 선택": "方向鍵選擇",
  "방향키 선택    Enter 구매    Esc 돌아가기": "方向鍵選擇    Enter 購買    Esc 返回",
  "배경음 크기": "背景音量",
  "배리어": "屏障",
  "배트 떼 출현!": "蝙蝠群出現！",
  "배트 메카": "蝙蝠機械",
  "배트 메카 (강화)": "蝙蝠機械（強化）",
  "배트 메카 (초강화)": "蝙蝠機械（超強化）",
  "버스터 1발": "破壞砲 1 發",
  "버스터 2연발": "破壞砲 2 連發",
  "버스터 3연발": "破壞砲 3 連發",
  "버스터 성장": "破壞砲成長",
  "버스터 성장 단계를 높인 상태로 시작한다(그만큼 버스터 성장 카드 단계도 올라가 있음).": "以較高的破壞砲成長階段開始（破壞砲成長卡片階段也會同步提高）。",
  "버스터 연사 간격과 모든 특수 무기의 발동 주기가 짧아진다. 차지 시간도 함께 줄어든다.": "破壞砲連射間隔與所有特殊武器的發動週期縮短。蓄力時間也一併減少。",
  "버스터 연사 간격과 특수 무기 발동 주기가 짧아진다.": "破壞砲連射間隔與特殊武器發動週期縮短。",
  "버스터·특수 무기·기가어택의 피해가 늘어난다.": "破壞砲、特殊武器、GIGA 攻擊的傷害增加。",
  "버스터가 세미 차지샷으로 바뀐다. 적 {0}명까지 관통한다.": "破壞砲變成半蓄力射擊。最多貫穿 {0} 隻敵人。",
  "버스터가 풀 차지샷으로 바뀐다. 적 {0}명까지 꿰뚫는 강력한 일격.": "破壞砲變成滿蓄力射擊。可貫穿 {0} 隻敵人的強力一擊。",
  "버스터를 2연발로 쏜다.": "破壞砲變成 2 連發。",
  "버스터를 3연발로 쏜다.": "破壞砲變成 3 連發。",
  "버스터와 모든 특수 무기의 피해가 늘어난다(기가어택 포함).": "破壞砲和所有特殊武器的傷害增加（含 GIGA 攻擊）。",
  "벌 떼 습격!": "蜂群來襲！",
  "벌 메카": "蜜蜂機械",
  "벌 메카 (강화)": "蜜蜂機械（強化）",
  "벌 메카 (초강화)": "蜜蜂機械（超強化）",
  "범위 · 유지": "範圍 · 持續",
  "베기 범위": "斬擊範圍",
  "보상을 선택하세요": "請選擇獎勵",
  "보스 격파 · 보상 선택": "頭目擊破 · 選擇獎勵",
  "보유": "持有",
  "보유 메탈": "持有金屬",
  "보유 무기 Lv.{0} → Lv.{1}": "持有武器 Lv.{0} → Lv.{1}",
  "보통": "普通",
  "부채꼴 칼날": "扇形刀刃",
  "부하 테스트 중 · 무적 · 눌러서 끄기": "負載測試中 · 無敵 · 按下關閉",
  "분": "分",
  "분신": "分身",
  "분신 / 유지": "分身／持續",
  "분신이 1초 더 오래 머문다.": "分身多停留 1 秒。",
  "분신이 더 자주 나타난다.": "分身更頻繁出現。",
  "분신이 엑스의 다른 최종 진화 무기\n하나를 함께 사용합니다.": "分身會一併使用艾克斯另一個\n最終進化武器。",
  "브라우저에서 관리": "由瀏覽器管理",
  "블레이드 아머": "刃之裝甲",
  "비공식 팬 게임 · 비영리": "非官方粉絲遊戲 · 非營利",
  "비행 돌격": "飛行突擊",
  "사용 메탈 전액 환불": "全額退還已用金屬",
  "사운드": "音效",
  "새 버전 ": "新版本 ",
  "새 버전 다운로드": "下載新版本",
  "새 보스 무기를 획득합니다.": "獲得新的頭目武器。",
  "새 진행 방식에 맞춰\n기존 진행 데이터를 초기화했습니다.\n환경설정은 유지되며,\n이전 저장 파일은 백업했습니다.": "為配合新的進度方式，\n已重置原有進度資料。\n設定會保留，\n舊存檔已備份。",
  "새로고침": "重抽",
  "새로고침 +1": "重抽 +1",
  "새로고침 +{0}회": "重抽 +{0} 次",
  "생존 {0}      레벨 {1}": "生存 {0}      等級 {1}",
  "생존 {0} · 처치 {1} · 레벨 {2}": "生存 {0} · 擊倒 {1} · 等級 {2}",
  "생존 시간": "生存時間",
  "서브 탱크": "副能量槽",
  "선택": "選擇",
  "선택한 패턴 반복 중": "重複所選模式中",
  "설치 / 주기 피해": "設置／週期傷害",
  "성장 가능한 보상이 없어 1레벨 분량의 경험치를 획득합니다.": "沒有可成長的獎勵，改為獲得 1 級份量的經驗值。",
  "세미 차지": "半蓄力",
  "소울 바디": "靈魂分身",
  "소환 몬스터 피해 차단: ": "召喚怪物傷害阻擋：",
  "소환 후 패턴을 선택하세요": "召喚後請選擇模式",
  "수직 레이저": "垂直雷射",
  "수직 레이저 다발이 더 자주 발동하고,\n가운데·왼쪽·오른쪽을 번갈아 노립니다.": "垂直雷射束更頻繁發動，\n交替瞄準中間、左側、右側。",
  "스네이크": "蛇",
  "스톰 후쿠로울": "暴風梟",
  "스트리머 모드": "實況主模式",
  "스트리밍·영상에 사용할 수 없는 음원은 무작위에 포함하지 않습니다.": "不能用於實況、影片的音樂不會列入隨機。",
  "스파이키": "刺刺球",
  "스파이키 (강화)": "刺刺球（強化）",
  "스파이키 (초강화)": "刺刺球（超強化）",
  "시": "時",
  "시그마": "西格瑪",
  "시그마 바이러스": "西格瑪病毒",
  "시그마 전투": "西格瑪戰",
  "시그마 헤드": "西格瑪頭部",
  "시너지 안내": "協同提示",
  "시너지 증폭": "協同增幅",
  "시너지 증폭 {0}회. 무적 OFF / 영구 진행 저장 제외.": "協同增幅 {0} 次。無敵 OFF／不寫入永久進度。",
  "시너지 합산": "協同合計",
  "시작 버스터": "起始破壞砲",
  "아머 {0} {1}/4{2}\n": "裝甲 {0} {1}/4{2}\n",
  "아머 완성 후 기가어택 게이지가 빨리 찬다.": "裝甲完成後，GIGA 攻擊計量表累積更快。",
  "아주 크게": "特大",
  "암": "手臂",
  "애로우 레이": "箭矢光線",
  "얀마 옵션": "蜻蜓僚機",
  "얀마크": "揚馬克",
  "얀마크의 잠자리": "揚馬克的蜻蜓",
  "어뢰 물고기": "魚雷魚",
  "어뢰 물고기 (강화)": "魚雷魚（強化）",
  "언어 변경": "變更語言",
  "얻는 경험치가 늘어 레벨업이 빨라진다.": "獲得的經驗值增加，升級更快。",
  "얼티밋 아머": "究極裝甲",
  "얼티밋 아머 키트": "究極裝甲套件",
  "업그레이드 화면 새로고침 횟수가 늘어난다.": "升級畫面的重抽次數增加。",
  "없음": "無",
  "에너지 결정을 끌어당기는 범위가 넓어진다.": "吸取能量結晶的範圍變大。",
  "에너지 흡수 범위": "能量吸取範圍",
  "연구소": "研究所",
  "연달아 쏘는 초승달 탄이 1발 늘어난다.": "連續發射的新月彈增加 1 發。",
  "연쇄": "連鎖",
  "오징어 메카": "烏賊機械",
  "완성 효과": "完成效果",
  "월": "月",
  "웨이브 {0}  최소 {1}  스폰 {2:0.00}/초  {3}\n": "波次 {0}  最少 {1}  生成 {2:0.00}/秒  {3}\n",
  "위·아래 대각선으로 날아가며 커지는 초승달 칼날 2발을 쏜다.": "發射 2 發朝上下斜向飛行並逐漸變大的新月刀刃。",
  "윌 레이저": "螢火雷射",
  "유도탄 속도": "追蹤彈速度",
  "유도탄의 공격력이 조금 오른다.": "追蹤彈的攻擊力略微提升。",
  "유도탄이 조금 빨라진다.": "追蹤彈略微變快。",
  "유지 시간": "持續時間",
  "음소거": "靜音",
  "의 한계돌파로\n새로운 성능을 이끌어냅니다.": "的極限突破\n將引出新的性能。",
  "이동": "移動",
  "이동 모듈": "移動模組",
  "이동 속도": "移動速度",
  "이동 속도 +{0}%": "移動速度 +{0}%",
  "일": "日",
  "일시정지": "暫停",
  "일정 시간마다 번쩍이는 분신이 나타나 엑스의 버스터를 옆에서 함께 쏜다.": "每隔一段時間出現閃耀的分身，在旁一起發射艾克斯的破壞砲。",
  "일정 시간마다 엑스 앞쪽을 화염 검으로 베어 가까운 적 최대 {0}명에게 피해를 준다.": "每隔一段時間以火焰劍斬擊艾克斯前方，對附近最多 {0} 隻敵人造成傷害。",
  "자동 발사": "自動發射",
  "자동 조준": "自動瞄準",
  "자동 조준: 가장 가까운 적을 자동으로 조준해 발사합니다.": "自動瞄準：自動瞄準最近的敵人並發射。",
  "자연 스폰: ": "自然生成：",
  "잠자리 수": "蜻蜓數",
  "재생 시간": "重生時間",
  "저장 데이터가 비어 있습니다.": "存檔資料是空的。",
  "적": "敵人",
  "적 {0} / 탄 {1} / 결정 {2}\n": "敵人 {0}／子彈 {1}／結晶 {2}\n",
  "적에게 맞으면 다른 적에게 꺾여 날아가는 빛의 화살을 쏜다.": "發射命中敵人後會彈向其他敵人的光之箭。",
  "적에게 받는 피해가 줄어든다(아머 완성 효과와 곱해진다).": "受到敵人的傷害減少（與裝甲完成效果相乘）。",
  "적을 밀어내는 구체가 1개 늘어나고 피해가 증가한다.": "擊退敵人的球體增加 1 顆，傷害提升。",
  "적을 쓰러뜨리고\n경험치를 모으세요.": "擊倒敵人\n收集經驗值。",
  "전기 가닥을 더 자주 쏜다.": "更頻繁發射電流束。",
  "전기 거미줄을 던져 펼치고, 잠시 머무는 동안 걸린 적에게 계속 피해를 준다.": "丟出展開的電網，短暫停留時持續傷害範圍內的敵人。",
  "전부 초기화": "全部重置",
  "전부 초기화(환불)": "全部重置（退還）",
  "전체창모드": "無邊框視窗",
  "전체화면": "全螢幕",
  "전체화면 / 전체창모드 / 창모드. 해상도는 창모드에서만 선택할 수 있습니다.": "全螢幕／無邊框視窗／視窗模式。只有視窗模式可選解析度。",
  "전투 테스트 (F11)": "戰鬥測試 (F11)",
  "점멸 완화": "減輕閃爍",
  "접근성": "輔助功能",
  "정면 대각선 2방향이 더해져 5방향으로 쏜다.": "增加前方斜向 2 個方向，朝 5 方向發射。",
  "정면과 위·아래, 3방향으로 일자 전기 가닥을 한꺼번에 쏜다.": "朝前方與上下共 3 方向同時發射直線電流束。",
  "정지 시간": "暫停時間",
  "제트 메카": "噴射機械",
  "제트 메카 (강화)": "噴射機械（強化）",
  "조작 안내": "操作說明",
  "조준점 미리 보기": "準星預覽",
  "조준점 색": "準星顏色",
  "조준점 크기": "準星大小",
  "진행 데이터를 초기화했습니다.\n환경설정은 유지되며,\n이전 저장 파일은 백업했습니다.": "已重置進度資料。\n設定會保留，\n舊存檔已備份。",
  "진행 초기화": "重置進度",
  "진화: 거대한 메탈 앵커가 차례로 화면을 대각선으로 가로질러 경로의 적을 들이받는다.": "進化：巨大的金屬船錨依序斜向穿越畫面，撞擊路徑上的敵人。",
  "진화: 기본 구체와 좌우 회오리로 적을 밀어낸다. 회오리마다 적 3명을 관통한다.": "進化：以基本球體和左右旋風擊退敵人。每道旋風貫穿 3 隻敵人。",
  "진화: 번쩍이는 큰 거미줄이 갈라져 넓게 깔린 뒤 사방으로 흩어진다.": "進化：閃耀的大蛛網裂開鋪滿大範圍，再向四方飛散。",
  "진화: 분신이 하나 더 나타나 둘이 함께 버스터를 쏜다.": "進化：再多出現一個分身，兩個一起發射破壞砲。",
  "진화: 엑스 주변에 수직 레이저 5줄이 한 다발로 나타나 화면 아래에서 위까지 꿰뚫는다.": "進化：艾克斯周圍出現一束 5 道垂直雷射，由畫面下方貫穿到上方。",
  "진화: 유도탄 대신 이동 방향으로 화면 끝까지 닿는 거대한 레이저를 3초간 쏜다. 모든 적을 관통.": "進化：改為朝移動方向發射達畫面邊緣的巨大雷射 3 秒。貫穿所有敵人。",
  "진화: 일정 시간마다 초승달 배리어가 엑스를 감싸 닿는 적을 계속 공격한다. 배리어가 공격을 한 번 막아 주고 깨진다.": "進化：每隔一段時間由新月屏障包覆艾克斯，持續攻擊碰到的敵人。屏障可擋一次攻擊後破裂。",
  "진화: 큰 칼날이 번쩍인 뒤 잔상을 끄는 빠른 칼날 9발이 부채꼴로 퍼진다.": "進化：大刀刃閃光後，9 發帶殘影的高速刀刃呈扇形擴散。",
  "진화: 화면 안의 무작위 적 3명을 노려 화면 위에서 번개 기둥이 떨어진다.": "進化：瞄準畫面內隨機 3 隻敵人，閃電柱從畫面上方落下。",
  "진화: 화염 파도가 화면 끝에서 끝까지 가로질러 경로의 모든 적을 태운다.": "進化：火焰波浪從畫面一端橫越到另一端，燒毀路徑上所有敵人。",
  "창모드": "視窗模式",
  "창모드 해상도": "視窗解析度",
  "처음부터 다시": "重新開始",
  "처치": "擊倒",
  "청록": "青綠",
  "체력 대량 회복": "大量回復體力",
  "체력 재생": "體力再生",
  "체력 회복": "體力回復",
  "초": "秒",
  "초기화": "重置",
  "초당 체력 +{0:0.0}": "每秒體力 +{0:0.0}",
  "초당 피해": "每秒傷害",
  "초록 구체 2개가 양옆으로 퍼진 뒤 위로 휘어 올라가며 적을 밀어낸다.": "2 顆綠色球體向兩側擴散後往上彎，擊退敵人。",
  "초승달 탄을 더 자주 쏜다.": "更頻繁發射新月彈。",
  "초승달 탄을 위·정면·아래 세 방향 중 하나로 무작위로 쏜다.": "朝上、前、下三方向之一隨機發射新月彈。",
  "최고 기록  {0}  ·  Lv {1}": "最佳紀錄  {0}  ·  Lv {1}",
  "최대 HP": "最大 HP",
  "최대 체력 +{0}": "最大體力 +{0}",
  "최대 체력이 늘어나고 체력 게이지가 길어진다. 늘어난 만큼 바로 회복한다.": "最大體力增加，體力條變長。增加的份量立刻回復。",
  "최저": "最低",
  "최종 공세!": "最終攻勢！",
  "최종 낙뢰가 3배 자주 떨어집니다.": "最終落雷的頻率提高 3 倍。",
  "최종 보스를 처치하면\n클리어합니다.": "擊倒最終頭目\n就通關了。",
  "최종 시그마": "最終西格瑪",
  "최종 시그마 소환": "召喚最終西格瑪",
  "최종 시그마 테스트": "最終西格瑪測試",
  "최종 시그마 테스트 (F11)\n": "最終西格瑪測試 (F11)\n",
  "최종 진화 완료. 영구 해금 기록을 획득합니다.": "最終進化完成。獲得永久解鎖紀錄。",
  "최종 칼날 부채꼴을 2번 연속 발사합니다.": "連續發射 2 次最終扇形刀刃。",
  "추적": "追蹤",
  "추적 사격 잠자리 3기를 추가한다. 공격용 잠자리는 탄을 막지 않는다.": "增加 3 隻追蹤射擊蜻蜓。攻擊用蜻蜓不會擋子彈。",
  "충전 속도 +{0}%": "充能速度 +{0}%",
  "취소": "取消",
  "칼날을 더 자주 쏜다.": "更頻繁發射刀刃。",
  "커맨더 얀마크": "蜻蜓指揮官揚馬克",
  "켜짐": "開啟",
  "쿨타임": "冷卻",
  "쿨타임 감소": "冷卻縮短",
  "크게": "大",
  "크레센트 샷": "新月射擊",
  "타이틀로": "回標題",
  "타이틀로 나가기": "回到標題",
  "타이틀로 돌아가면 이번 판의 진행 상황이 저장되지 않으며,\n이번 판에서 모은 메탈도 받을 수 없습니다.\n\n정말 타이틀로 돌아가시겠습니까?": "回到標題後，本局進度不會儲存，\n本局收集的金屬也無法獲得。\n\n確定要回到標題嗎？",
  "탄": "子彈",
  "탄환 수": "彈數",
  "테스트 소환 몬스터 정리": "清除測試召喚怪物",
  "트라이 썬더": "三重雷霆",
  "트윈 슬래셔": "雙刃斬",
  "파도 주기": "波浪週期",
  "팔콘 아머": "獵鷹裝甲",
  "포스 아머": "原力裝甲",
  "포위당했다!": "被包圍了！",
  "풀 강화 ": "完全強化 ",
  "풀 강화: {0} ({1:0}분)": "完全強化：{0}（{1:0} 分）",
  "풀 차지": "滿蓄力",
  "풋": "腳部",
  "프로펠러 메카": "螺旋槳機械",
  "프로펠러 메카 (강화)": "螺旋槳機械（強化）",
  "프로펠러 메카 (초강화)": "螺旋槳機械（超強化）",
  "플레이어 무적 (F10): ": "玩家無敵 (F10)：",
  "피격 표시: 켜짐은 약한 주황색, 꺼짐은 기존 흰색 섬광.": "受擊顯示：開啟為淡橘色，關閉為原本的白色閃光。",
  "피해 / 간격": "傷害／間隔",
  "피해 / 관통": "傷害／貫穿",
  "피해 / 발사": "傷害／發射",
  "피해 / 발사각": "傷害／發射角",
  "피해 / 방향": "傷害／方向",
  "피해 / 범위": "傷害／範圍",
  "피해 / 속도": "傷害／速度",
  "피해 / 연쇄": "傷害／連鎖",
  "필요 메탈": "所需金屬",
  "하드": "困難",
  "하드 (노말 클리어 후 해금)": "困難（通關普通後解鎖）",
  "하드 강화 패턴: ": "困難強化模式：",
  "하드 강화 패턴: OFF": "困難強化模式：OFF",
  "하트 탱크": "心能量槽",
  "한 번 더 누르면 환불": "再按一次即退還",
  "한 판에 한 번, 체력이 {0}% 아래로 떨어지면 자동으로 체력을 가득 채운다.": "每局一次，體力低於 {0}% 時自動回滿。",
  "한계돌파": "極限突破",
  "한국어": "繁體中文",
  "헤드": "頭部",
  "현재": "目前",
  "현재 HP": "目前 HP",
  "현재 보스 즉시 처치 (Delete)": "立刻擊倒目前頭目 (Delete)",
  "현재 아머를 얼티밋 아머로 교체합니다.\n플라즈마 잔류 2배 · 노바 스트라이크 5초 주기": "將目前裝甲換成究極裝甲。\n電漿殘留 2 倍 · 新星衝擊週期 5 秒",
  "화면": "畫面",
  "화면 내 일반 적만 정지시킨다. 레벨마다 정지 시간이 증가하며 발동 주기는 10초로 고정된다.": "只讓畫面內的一般敵人停止。每級增加停止時間，發動週期固定 10 秒。",
  "화면 내 일반 적을 정지시키고 해당 적에게 추가 피해를 준다. 보스와 적 투사체는 제외한다.": "讓畫面內的一般敵人停止，並對其造成額外傷害。頭目與敵方投射物除外。",
  "화면 모드": "畫面模式",
  "화면 흔들림": "畫面晃動",
  "화살을 더 자주 쏜다.": "更頻繁發射箭矢。",
  "화살이 꺾이는 횟수가 1회 늘어난다.": "箭矢彈射次數增加 1 次。",
  "화염 검을 더 자주 휘두른다.": "更頻繁揮動火焰劍。",
  "화염 검의 베기 범위가 넓어진다.": "火焰劍的斬擊範圍變大。",
  "화염 검의 베기 범위가 더 넓어진다.": "火焰劍的斬擊範圍再變大。",
  "화염 파도": "火焰波浪",
  "화염 파도를 3개 연달아 보냅니다.": "連續送出 3 道火焰波浪。",
  "환경설정": "設定",
  "회복": "回復",
  "효과음 크기": "音效音量",
  "후쿠로울": "暴風梟",
  "흡수 범위": "吸取範圍",
  "흡수 범위 +{0}%": "吸取範圍 +{0}%",
  "흰색": "白色",
  // 韓文版也顯示英文的標題字。其他大寫標題可能用點陣字（沒有中文字形），維持英文
  "PAUSE": "暫停",
  "PAUSE · ": "暫停 · ",
};

// BGM 曲名存在場景的 Music 物件裡，只能原地覆蓋，中文的位元組數不能比原文多。
// 其他場景 Text 不要動：遊戲會自己蓋上 ZH 的文字，動了舊版選單會藏不掉。
const ZH_SCENE = {
  "연구소": "研究所",
  "X5 시그마": "X5 西格瑪",
  "록맨2": "洛克2",
  "록맨3": "洛克3",
  "록맨X5": "洛克X5",
  "록맨X7": "洛克X7",
  "X6 얀마크": "X6 揚馬克",
  "X5 엑스VS제로": "X5 X VS 傑洛",
  "X6 히트닉스": "X6 烈焰鳳凰",
  "X6 미지니온": "X6 無限水蚤",
  "X6 인트로": "X6 開場",
};

// 網頁上遊戲外框的韓文
const ZH_PAGE = [
  ['lang="ko"', 'lang="zh-Hant"'],
  ['로딩 중… / Loading…', '<span id="rxszh-load-title">載入中…</span>'],
  ['화면을 눌러 시작', '點一下畫面開始'],
  ['가로로 돌려 주세요', '請把手機轉成橫向'],
  ['전체화면 / Fullscreen', '全螢幕'],
  ['게임 파일을 불러오지 못했습니다. / Could not load the game.', '無法載入遊戲檔案。'],
];

const PAGE_CSS = `<style id="rxszh-style">
  #loading { width:min(420px,84vw); padding:18px 20px 16px; background:#071b32f2; color:#c5eaff; border:2px solid #3383a8; outline:2px solid #050f20;
    box-shadow:0 0 0 4px #29bfff33, inset 0 0 18px #29bfff22; border-radius:3px; font:bold 16px "Microsoft JhengHei UI","Microsoft JhengHei","Noto Sans TC",system-ui,sans-serif; letter-spacing:.06em; }
  #loading::before { content:"ROCKMAN X SURVIVORS"; display:block; margin-bottom:6px; color:#ffd866; font-size:13px; letter-spacing:.14em; }
  #loading progress { appearance:none; -webkit-appearance:none; display:block; width:100%; height:16px; margin-top:12px; border:1px solid #29bfff; background:#050f20; }
  #loading progress::-webkit-progress-bar { background:#050f20; }
  #loading progress::-webkit-progress-value { background:repeating-linear-gradient(90deg,#7fd8ff 0 8px,#29bfff 8px 10px,#050f20 10px 12px); }
  #loading progress::-moz-progress-bar { background:repeating-linear-gradient(90deg,#7fd8ff 0 8px,#29bfff 8px 10px,#050f20 10px 12px); }
  #rxszh-note { margin-top:10px; color:#9fd3f0; font:normal 12px "Microsoft JhengHei UI","Microsoft JhengHei","Noto Sans TC",system-ui,sans-serif; letter-spacing:0; }
  #tap-start { font-family:"Microsoft JhengHei UI","Microsoft JhengHei","Noto Sans TC",system-ui,sans-serif; }
  #rxszh-toast { position:fixed; left:50%; top:max(14px,env(safe-area-inset-top)); transform:translateX(-50%); z-index:30; padding:7px 16px; pointer-events:none; white-space:nowrap;
    background:#071b32f2; color:#c5eaff; border:2px solid #3383a8; outline:2px solid #050f20; box-shadow:0 0 0 4px #29bfff33; border-radius:3px;
    font:bold 14px "Microsoft JhengHei UI","Microsoft JhengHei","Noto Sans TC",system-ui,sans-serif; transition:opacity .4s; }
  #rxszh-toast b { color:#ffd866; }
</style>`;

const enc = new TextEncoder();
const dec = new TextDecoder();

function setNote(text) {
  const n = document.getElementById('rxszh-note');
  if (n) n.textContent = text;
}

function toast(html, ms = 3500) {
  document.querySelectorAll('#rxszh-toast').forEach(e => e.remove());
  const t = document.createElement('div');
  t.id = 'rxszh-toast';
  t.innerHTML = html;
  if (!document.getElementById('rxszh-style')) document.head.insertAdjacentHTML('beforeend', PAGE_CSS);
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 500); }, ms);
}

// ---- LZ4 ----
function lz4(src, dst, dstPos) {
  let s = 0;
  let d = dstPos;
  const end = src.length;
  while (s < end) {
    const token = src[s++];
    let lit = token >> 4;
    if (lit === 15) { let b; do { b = src[s++]; lit += b; } while (b === 255); }
    if (lit > 0) { dst.set(src.subarray(s, s + lit), d); s += lit; d += lit; }
    if (s >= end) break;
    const off = src[s] | (src[s + 1] << 8);
    s += 2;
    let len = token & 15;
    if (len === 15) { let b; do { b = src[s++]; len += b; } while (b === 255); }
    len += 4;
    if (off >= len) { dst.copyWithin(d, d - off, d - off + len); d += len; }
    else { for (let i = 0; i < len; i++, d++) dst[d] = dst[d - off]; }
  }
  return d;
}

// ---- 字串表（global-metadata.dat v39：每段都是 offset,size,count；字串長度靠下一筆 offset 算）----
function patchMetadata(meta) {
  const v = new DataView(meta.buffer, meta.byteOffset, meta.byteLength);
  if (v.getUint32(0, true) !== 0xFAB11BAF || v.getInt32(4, true) !== 39) throw new Error('不支援的遊戲版本（metadata）');
  const litOff = v.getInt32(8, true), litCnt = v.getInt32(16, true);
  const dataOff = v.getInt32(20, true), dataSz = v.getInt32(24, true);
  const parts = [];
  const table = new Int32Array(litCnt);
  let pos = 0, replaced = 0;
  for (let i = 0; i < litCnt - 1; i++) {
    const a = v.getInt32(litOff + i * 4, true), b = v.getInt32(litOff + (i + 1) * 4, true);
    let bytes = meta.subarray(dataOff + a, dataOff + b);
    const key = dec.decode(bytes);
    const hit = sceneText.has(key) ? sceneText.get(key) : ZH[key];
    if (hit !== undefined) { bytes = enc.encode(hit); replaced++; }
    table[i] = pos;
    parts.push(bytes);
    pos += bytes.length;
  }
  table[litCnt - 1] = pos;
  // 新字串放在檔尾，表頭改指過去；其他段落的位置不動
  const out = new Uint8Array(meta.length + pos);
  out.set(meta);
  const ov = new DataView(out.buffer);
  for (let i = 0; i < litCnt; i++) ov.setInt32(litOff + i * 4, table[i], true);
  ov.setInt32(20, meta.length, true);
  ov.setInt32(24, pos, true);
  let w = meta.length;
  for (const p of parts) { out.set(p, w); w += p.length; }
  console.log('[RXSZH] 字串替換', replaced, '/', Object.keys(ZH).length, '原字串區', dataSz, '→', pos);
  return out;
}

// 場景字串長度不足的部分補零寬空白（字型裡有這個字），1～2 byte 的零頭補半形空白；
// 字串表裡的同名字串也用同一份，兩邊才會相等。
const BUTTON = 'Button_';
const sceneText = new Map();
function padTo(zh, have, want) {
  const gap = want - have;
  return zh + '​'.repeat(Math.floor(gap / 3)) + ' '.repeat(gap % 3);
}

// 確認這段資料真的是 TTF：表頭的資料表都有 ASCII 名字、位置在範圍內，而且有 cmap/head/name
function isSfnt(d, pos, len) {
  const n = (d[pos + 4] << 8) | d[pos + 5];
  if (n < 4 || n > 64 || 12 + n * 16 > len) return false;
  const seen = new Set();
  for (let t = 0; t < n; t++) {
    const e = pos + 12 + t * 16;
    let tag = '';
    for (let c = 0; c < 4; c++) {
      if (d[e + c] < 0x20 || d[e + c] > 0x7e) return false;
      tag += String.fromCharCode(d[e + c]);
    }
    const off = ((d[e + 8] << 24) | (d[e + 9] << 16) | (d[e + 10] << 8) | d[e + 11]) >>> 0;
    const sz = ((d[e + 12] << 24) | (d[e + 13] << 16) | (d[e + 14] << 8) | d[e + 15]) >>> 0;
    if (off + sz > len) return false;
    seen.add(tag);
  }
  return seen.has('cmap') && seen.has('head') && seen.has('name');
}

// ---- data.unity3d（UnityFS）：換字型、覆蓋場景字串；只有改到的區塊存成不壓縮 ----
function patchBundle(b, font) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let p = 0;
  const cstr = () => { const e = b.indexOf(0, p); const s = dec.decode(b.subarray(p, e)); p = e + 1; return s; };
  if (cstr() !== 'UnityFS') throw new Error('不支援的遊戲版本（bundle）');
  const version = v.getUint32(p); p += 4;
  cstr(); cstr();
  const sizePos = p; p += 8;
  const cbi = v.getUint32(p), ubi = v.getUint32(p + 4), flags = v.getUint32(p + 8);
  const flagsPos = p; p += 12;
  if (version >= 7) p = (p + 15) & ~15;
  if (flags & 0x80) throw new Error('不支援的遊戲版本（blocks info）');
  const infoComp = b.subarray(p, p + cbi);
  let info;
  if ((flags & 0x3f) === 0) info = infoComp;
  else { info = new Uint8Array(ubi); lz4(infoComp, info, 0); }
  let dataPos = p + cbi;
  if (flags & 0x200) dataPos = (dataPos + 15) & ~15;

  const iv = new DataView(info.buffer, info.byteOffset, info.byteLength);
  const blockCount = iv.getInt32(16);
  const blocks = [];
  let ip = 20, uTotal = 0, c = dataPos;
  for (let i = 0; i < blockCount; i++) {
    const u = iv.getUint32(ip), cs = iv.getUint32(ip + 4), f = iv.getUint16(ip + 8);
    blocks.push({ u, cs, f, uPos: uTotal, cPos: c, entry: ip });
    uTotal += u; c += cs; ip += 10;
  }

  const data = new Uint8Array(uTotal);
  for (const k of blocks) {
    const src = b.subarray(k.cPos, k.cPos + k.cs);
    const t = k.f & 0x3f;
    if (t === 0) data.set(src, k.uPos);
    else if (t === 2 || t === 3) { const e = lz4(src, data, k.uPos); if (e !== k.uPos + k.u) throw new Error('解壓失敗'); }
    else throw new Error('不支援的壓縮格式 ' + t);
  }

  const dirty = new Uint8Array(blockCount);
  const touch = (from, to) => {
    for (let i = 0; i < blockCount; i++) {
      const k = blocks[i];
      if (k.uPos < to && k.uPos + k.u > from) dirty[i] = 1;
    }
  };
  const dv = new DataView(data.buffer);

  // 字型：Font 的 m_FontData 是「長度 + TTF」。中文字型比原本小，塞進去後面補 0
  let fontPos = -1, fontLen = 0;
  for (let i = 0; i + 16 < data.length; i += 4) {
    if (data[i + 4] !== 0 || data[i + 5] !== 1 || data[i + 6] !== 0 || data[i + 7] !== 0) continue;
    const len = dv.getUint32(i, true);
    if (len < 200000 || i + 4 + len > data.length) continue;
    if (!isSfnt(data, i + 4, len)) continue;
    if (len > fontLen) { fontLen = len; fontPos = i + 4; }
  }
  if (fontPos < 0 || font.length > fontLen) throw new Error('找不到遊戲字型');
  data.fill(0, fontPos, fontPos + fontLen);
  data.set(font, fontPos);
  touch(fontPos, fontPos + fontLen);

  // 場景字串：長度 + UTF-8，4 byte 對齊
  const lens = new Uint8Array(6000);
  const pairs = new Map();
  for (const k of Object.keys(ZH_SCENE)) {
    const kb = enc.encode(k);
    lens[kb.length] = 1;
    pairs.set(k, kb.length);
  }
  // 物件名 Button_<韓文>：遊戲用 "Button_" + 字串 找舊按鈕，物件名和字串表要一起改、內容完全相同，否則舊按鈕會留在畫面上
  for (const k of Object.keys(ZH)) {
    if (!/[가-힣]/.test(k)) continue;
    const name = BUTTON + k;
    const n = enc.encode(name).length;
    if (n >= lens.length) continue;
    lens[n] = 1;
    pairs.set(name, n);
  }
  let scene = 0, tooLong = 0;
  const fontEnd = fontPos + fontLen;
  for (let i = 0; i + 8 < data.length; i += 4) {
    if (i === fontPos - 4) { i = (fontEnd + 3 & ~3) - 4; continue; }
    const l = data[i] | (data[i + 1] << 8) | (data[i + 2] << 16) | (data[i + 3] << 24);
    if (l <= 1 || l >= lens.length || !lens[l] || i + 4 + l > data.length) continue;
    const s = i + 4;
    const b0 = data[s];
    if (b0 >= 0x80 && (b0 < 0xc2 || b0 > 0xef)) continue;
    const k = dec.decode(data.subarray(s, s + l));
    if (!pairs.has(k)) continue;
    if (k.startsWith(BUTTON)) {
      const ko = k.slice(BUTTON.length);
      const zb = enc.encode(BUTTON + ZH[ko]);
      if (zb.length > l) { tooLong++; console.warn('[RXSZH] 物件名放不下', k); continue; }
      const padded = padTo(ZH[ko], zb.length, l);
      data.set(enc.encode(BUTTON + padded), s);
      sceneText.set(ko, padded);
      touch(s, s + l);
      scene++;
      continue;
    }
    // 同名的選單 Text 不能動，只改 Music 表裡的曲名：韓文後面緊接著一筆英文曲名
    const n = (s + l + 3) & ~3;
    const enLen = data[n] | (data[n + 1] << 8) | (data[n + 2] << 16) | (data[n + 3] << 24);
    if (enLen < 3 || enLen > 40 || data[n + 4] < 0x41 && data[n + 4] !== 0x20) continue;
    if (!/^[\x20-\x7e]+$/.test(dec.decode(data.subarray(n + 4, n + 4 + enLen)))) continue;
    const zh = ZH_SCENE[k];
    const zb = enc.encode(zh);
    if (zb.length > l) { tooLong++; console.warn('[RXSZH] 場景字串放不下', k); continue; }
    const padded = padTo(zh, zb.length, l);
    data.set(enc.encode(padded), s);
    sceneText.set(k, padded);
    touch(s, s + l);
    scene++;
  }
  console.log('[RXSZH] 場景字串', scene, '放不下', tooLong, '字型', font.length, '/', fontLen);

  // 重建：改到的區塊不壓縮，其他沿用原本壓縮資料；blocks info 也不壓縮
  const newInfo = info.slice();
  const niv = new DataView(newInfo.buffer);
  let total = 0;
  blocks.forEach((k, i) => {
    if (dirty[i]) { niv.setUint32(k.entry + 4, k.u); niv.setUint16(k.entry + 8, k.f & ~0x3f); total += k.u; }
    else total += k.cs;
  });
  const headEnd = version >= 7 ? (flagsPos + 12 + 15) & ~15 : flagsPos + 12;
  let bodyStart = headEnd + newInfo.length;
  if (flags & 0x200) bodyStart = (bodyStart + 15) & ~15;
  const out = new Uint8Array(bodyStart + total);
  out.set(b.subarray(0, flagsPos + 12));
  out.set(newInfo, headEnd);
  const ov = new DataView(out.buffer);
  ov.setBigUint64(sizePos, BigInt(out.length));
  ov.setUint32(flagsPos, newInfo.length);
  ov.setUint32(flagsPos + 4, newInfo.length);
  ov.setUint32(flagsPos + 8, flags & ~0x3f);
  let w = bodyStart;
  blocks.forEach((k, i) => {
    if (dirty[i]) { out.set(data.subarray(k.uPos, k.uPos + k.u), w); w += k.u; }
    else { out.set(b.subarray(k.cPos, k.cPos + k.cs), w); w += k.cs; }
  });
  console.log('[RXSZH] bundle', b.length, '→', out.length, '改動區塊', dirty.reduce((a, x) => a + x, 0), '/', blockCount);
  return out;
}

// ---- UnityWebData 容器 ----
function patchContainer(raw, font) {
  const v = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  if (dec.decode(raw.subarray(0, 15)) !== 'UnityWebData1.0') throw new Error('不支援的遊戲版本（container）');
  const headerSize = v.getUint32(16, true);
  const files = [];
  let p = 20;
  while (p < headerSize) {
    const off = v.getUint32(p, true), sz = v.getUint32(p + 4, true), nl = v.getUint32(p + 8, true);
    const nameBytes = raw.subarray(p + 12, p + 12 + nl);
    files.push({ nameBytes, name: dec.decode(nameBytes), data: raw.subarray(off, off + sz) });
    p += 12 + nl;
  }
  // 先處理 bundle：字串表要用它補好長度的版本
  for (const f of files) if (f.name === 'data.unity3d') f.data = patchBundle(f.data, font);
  for (const f of files) if (f.name.endsWith('global-metadata.dat')) f.data = patchMetadata(f.data);
  let pos = headerSize, total = headerSize;
  for (const f of files) total += f.data.length;
  const out = new Uint8Array(total);
  out.set(raw.subarray(0, 20));
  const ov = new DataView(out.buffer);
  p = 20;
  for (const f of files) {
    ov.setUint32(p, pos, true);
    ov.setUint32(p + 4, f.data.length, true);
    ov.setUint32(p + 8, f.nameBytes.length, true);
    out.set(f.nameBytes, p + 12);
    p += 12 + f.nameBytes.length;
    out.set(f.data, pos);
    pos += f.data.length;
  }
  return out;
}

async function gunzip(buf) {
  if (buf[0] !== 0x1f || buf[1] !== 0x8b) return buf;
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// 存檔裡記的語言改回「韓文模式」＝這份繁中
async function forceLanguage() {
  if (!window.indexedDB) return;
  let db;
  try {
    db = await new Promise((ok, no) => {
      const r = indexedDB.open('/idbfs');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => no(r.error);
      r.onupgradeneeded = () => { r.transaction.abort(); };
    });
  } catch (_) { return; }
  try {
    if (!db.objectStoreNames.contains('FILE_DATA')) return;
    const store = db.transaction('FILE_DATA', 'readwrite').objectStore('FILE_DATA');
    await new Promise((ok, no) => {
      const cur = store.openCursor();
      cur.onerror = () => no(cur.error);
      cur.onsuccess = () => {
        const c = cur.result;
        if (!c) return ok();
        if (typeof c.key === 'string' && /\/save\.json$/.test(c.key) && c.value && c.value.contents) {
          const text = dec.decode(c.value.contents);
          const fixed = text.replace(/"language"\s*:\s*"[^"]*"/, '"language": "ko"');
          if (fixed !== text) c.update(Object.assign({}, c.value, { contents: enc.encode(fixed) }));
        }
        c.continue();
      };
    });
  } finally { db.close(); }
}

function fakeKorean() {
  const def = (k, val) => Object.defineProperty(navigator, k, { get: () => val, configurable: true });
  def('language', 'ko-KR');
  def('languages', ['ko-KR', 'ko']);
}

function hookFetch(fontPromise) {
  const orig = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input.url;
    if (!/\.data(\.unityweb|\.gz|\.br)?(\?|$)/.test(url)) return orig(input, init);
    const res = await orig(input, init);
    const zipped = new Uint8Array(await res.arrayBuffer());
    setNote('下載完成，正在套用繁體中文…');
    await new Promise(r => setTimeout(r, 30));
    const font = await fontPromise;
    const raw = await gunzip(zipped);
    const out = patchContainer(raw, font);
    setNote('正在啟動遊戲…');
    return new Response(out, { status: 200, headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(out.length) } });
  };
}

async function buildPage() {
  const res = await fetch(location.href, { cache: 'no-cache' });
  let html = await res.text();
  for (const [a, b] of ZH_PAGE) html = html.split(a).join(b);
  // 本體 script 包一層，避免和目前頁面已宣告的 const 衝突；資料不走 Unity 快取，才會經過 fetch 替換
  html = html.replace(/<script>([\s\S]*?createUnityInstance[\s\S]*?)<\/script>/, (m, body) => {
    body = body.replace('showBanner:banner', "showBanner:banner,cacheControl:function(){return 'no-store'}");
    return '<script>(function(){' + body + '\n})();</script>';
  });
  html = html.replace('</head>', PAGE_CSS + '</head>');
  html = html.replace('<progress', '<div id="rxszh-note">繁體中文化 ' + RXSZH_VERSION + '：下載遊戲資料…</div><progress');
  if (!/cacheControl/.test(html)) throw new Error('不支援的遊戲版本（頁面）');
  return html;
}

async function stopCurrentGame() {
  // 頁面的 player 是全域 let；還在載入時先等它好，才能乾淨關掉
  const getPlayer = () => { try { return player; } catch (_) { return null; } };
  const deadline = Date.now() + 120000;
  if (!getPlayer() && document.getElementById('loading')) toast('繁體中文化：<b>遊戲載入完成後</b>會自動套用', 8000);
  while (!getPlayer() && document.getElementById('loading') && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 300));
  }
  try { suspendAudio(); } catch (_) {}
  const p = getPlayer();
  if (p && p.Quit) {
    await Promise.race([p.Quit().catch(() => {}), new Promise(r => setTimeout(r, 4000))]);
  }
}

async function main() {
  if (!document.getElementById('unity-canvas') || !/createUnityInstance/.test(document.documentElement.innerHTML + (window.createUnityInstance || ''))) {
    alert('請在 Rockman X Survivors 遊戲頁面按這個書籤：\n' + GAME_URL);
    return;
  }
  if (window.__RXSZH) { toast('繁體中文化 <b>' + RXSZH_VERSION + '</b> 已經套用'); return; }
  window.__RXSZH = RXSZH_VERSION;
  try {
    const fontPromise = fetch(FONT_URL).then(r => {
      if (!r.ok) throw new Error('字型下載失敗 ' + r.status);
      return r.arrayBuffer();
    }).then(a => new Uint8Array(a));
    const html = await buildPage();
    await fontPromise;
    await stopCurrentGame();
    await forceLanguage();
    fakeKorean();
    hookFetch(fontPromise);
    document.open();
    document.write(html);
    document.close();
    setTimeout(() => toast('繁體中文化 <b>' + RXSZH_VERSION + '</b>：載入完成後點一下畫面'), 200);
  } catch (e) {
    console.error(e);
    window.__RXSZH = null;
    alert('繁體中文化失敗：' + e.message + '\n遊戲可能更新了，請等中文化更新，或重新整理後再試一次。');
  }
}

main();
