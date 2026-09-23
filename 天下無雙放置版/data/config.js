/* 版本號 GAME_VERSION、存檔 key、舊版 key、等級上限、主迴圈間隔 TICK
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
const GAME_VERSION='v1.0.7';
const SAVE_KEY_BASE='txws_idle_v550';let SAVE_KEY=SAVE_KEY_BASE;let SAVE_SLOT=1;let GAME_ACTIVE=false;
const MAX_LEVEL_30=110;
const LEGACY_KEYS=['txws_idle_v530','txws_idle_v520','txws_idle_v510','txws_idle_v500','txws_shentong_single_v400','txws_shentong_single_v302','txws_xianlu_fusion_v1'];
const TICK=180;

