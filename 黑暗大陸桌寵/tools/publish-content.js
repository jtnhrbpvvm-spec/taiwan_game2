// 發布「內容」（小檔案更新，做法照放置希望桌寵 desktop_pet 的 scripts/publish-content.js）：
// 把目前的程式檔連同清單放到 taiwan_game2 的「黑暗大陸桌寵/content/」，之後由使用者自己 commit／push。
// 已安裝的桌寵會讀清單、只下載這些小檔案來更新，不用重新下載安裝檔。不需要打包，幾秒就做完。
//
//   content/manifest.json    { version, shell, files: [{ path, sha256, size }] }
//   content/<版本>/…          清單裡的每個檔案
//   content/.gitattributes   叫 git 不要動這些檔案的換行，不然推上去的內容跟清單的雜湊值會對不起來
//
// 只留最新一版的資料夾，舊的刪掉。
//
// 用法：node tools/publish-content.js [目的資料夾]（npm run release 打包完會自動跑；只改內容時 npm run release:content）
//   版本號取 package.json 的 version，發布前要先把它加大，不然玩家那邊會認為沒有新版。
//   改到外殼（boot.js、shell/、update-source.json）或 package.json 的套件時，要把 boot.js 的 SHELL_API 加 1、跑完整的 npm run release。
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TARGET = path.join(process.argv[2] || ROOT, "content");
const pkg = require("../package.json");

// 外殼的檔案：跟著安裝檔走，不屬於內容
const SHELL_FILES = ["boot.js", "shell/**", "update-source.json"];
const TEXT = /\.(js|json|html|css|md|txt|svg)$/i;

// 內容需要的外殼號碼，直接讀 boot.js 裡的 SHELL_API（內容跟外殼是同一份原始碼一起開發的）
const shellApi = Number(fs.readFileSync(path.join(ROOT, "boot.js"), "utf8").match(/const SHELL_API = (\d+);/)?.[1]);
if (!Number.isInteger(shellApi)) {
  console.error("讀不到 boot.js 裡的 SHELL_API");
  process.exit(1);
}

/** 內容＝package.json 的 build.files 扣掉外殼的檔案。這樣安裝檔裡包的跟小檔案更新送的永遠是同一批。 */
function contentFiles() {
  const out = [];
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else out.push(child);
    }
  };
  for (const pattern of pkg.build.files) {
    if (SHELL_FILES.includes(pattern)) continue;
    if (pattern.endsWith("/**")) walk(pattern.slice(0, -3));
    else if (pattern.includes("*")) {
      // 最上層的萬用字元（例如 *-preload.js）
      const re = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
      out.push(...fs.readdirSync(ROOT).filter((name) => re.test(name) && fs.statSync(path.join(ROOT, name)).isFile()));
    } else out.push(pattern);
  }
  return [...new Set(out)].sort();
}

const versionDir = path.join(TARGET, pkg.version);
fs.rmSync(versionDir, { recursive: true, force: true });

const files = contentFiles().map((rel) => {
  let bytes = fs.readFileSync(path.join(ROOT, rel));
  // 文字檔一律存成 LF 換行，跟 git 存的一致
  if (TEXT.test(rel)) bytes = Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
  const target = path.join(versionDir, ...rel.split("/"));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes);
  return { path: rel, sha256: crypto.createHash("sha256").update(bytes).digest("hex"), size: bytes.length };
});

fs.writeFileSync(path.join(TARGET, "manifest.json"), JSON.stringify({ version: pkg.version, shell: shellApi, files }, null, 2) + "\n");
fs.writeFileSync(path.join(TARGET, ".gitattributes"), "* -text\n");

for (const name of fs.readdirSync(TARGET)) {
  if (/^\d+(\.\d+)*$/.test(name) && name !== pkg.version) {
    fs.rmSync(path.join(TARGET, name), { recursive: true, force: true });
    console.log(`刪掉舊版內容 ${name}`);
  }
}

const total = files.reduce((sum, f) => sum + f.size, 0);
console.log(`內容 ${pkg.version}（需要外殼 ${shellApi}）：${files.length} 個檔案、共 ${(total / 1024).toFixed(0)} KB，已經放到 ${TARGET}`);
console.log("commit 並 push 之後，已安裝的桌寵就會自己更新。");
